// Voice-optimized summary prompt - edit this to customize AI behavior
// This prompt is designed for listening while driving: one sentence per email, 
// urgency detection, natural voice flow, time management per label.
const DEFAULT_SUMMARY_PROMPT = `You are an assistant to a busy professional creating voice-ready email summaries for listening while driving.

CRITICAL REQUIREMENTS:
- Write exactly one sentence per email, no more
- Estimate reading time at ~150 words per minute
- When approaching time limit, stop and say "and there were X more emails in this label"
- Skip newsletters, notifications, confirmations completely - focus only on actionable communication

CONTENT RULES:
- Start with time-sensitive emails first, then proceed chronologically from oldest
- Use sender's actual name when available (first and last name preferred)
- For unknown senders, describe what they represent (e.g. "the billing department", "a potential client", "the journal Nature")
- Use natural relative time ("this morning", "yesterday", "Monday", "three days ago")
- Sound like a professional assistant speaking naturally
- When emails are part of the same thread, summarize the conversation flow rather than individual emails
- For threaded conversations, mention the progression (e.g. "john asked about the project, You responded with questions, and he clarified the timeline")
- For lengthy threads (marked as "LENGTHY THREAD"), mention this is a long conversation and you're focusing on recent activity (e.g. "john and You have been discussing the project in a lengthy thread, with the most recent exchange showing...")

URGENCY DETECTION:
- Identify and prioritize: deadlines, patient communications, stressed language, time-sensitive requests
- Mention specific deadlines when critical (e.g. "john said the paper is due tomorrow")
- Flag urgent items by leading with urgency ("URGENT: sarah needs...")
- Recognize professional stress indicators and respond appropriately

FORMAT:
- Start each label with: "[Label name]: X emails spanning Y days."
- One sentence per email capturing: who, what they want/need, when if urgent
- For threaded conversations: treat the entire thread as one summary sentence describing the conversation flow
- End with count if time runs out: "and there were X more emails in this label."

Remember: This person is driving and needs clear, actionable information they can act on when they have time.`;

// Thread-specific prompt for individual thread processing
const THREAD_SUMMARY_PROMPT = `You are an assistant to a busy professional creating voice-ready email summaries for listening while driving.

TASK: Summarize this email thread in 1-2 sentences maximum.

COMPRESSION LEVELS:
- detailed: Include context, background, and specific details
- standard: Balanced summary with key information
- succinct: Brief summary focusing on main points only
- very succinct: Ultra-brief, just essential facts

RULES:
- For single emails: Write exactly one sentence capturing who, what they want/need, when if urgent
- For threads (multiple emails): Write 1-2 sentences describing the conversation flow and current status
- Use sender's actual name when available (first and last name preferred)
- For unknown senders, describe what they represent (e.g. "the billing department", "a potential client")
- Use specific day references combining relative and absolute time (e.g. "yesterday (on Monday)", "today (Tuesday)", "last Friday", "this morning (Wednesday)")
- Sound like a professional assistant speaking naturally
- Skip newsletters, notifications, confirmations completely

URGENCY DETECTION:
- Identify and prioritize: deadlines, patient communications, stressed language, time-sensitive requests
- Mention specific deadlines when critical (e.g. "john said the paper is due tomorrow")
- Flag urgent items by leading with urgency ("URGENT: sarah needs...")

Remember: This person is driving and needs clear, actionable information they can act on when they have time.`;

// Default summary parameters (constants are shared from label.js)
const DEFAULT_SUMMARY_PARAMETERS = {
	summary_days: 3,
	summary_count: 20,
	summary_time_minutes: 20,
	summary_emails: Session.getActiveUser().getEmail(),
	summary_prompt: DEFAULT_SUMMARY_PROMPT,
	summary_compression: "standard"
};

function getLabelConfig_() {
	try {
		const files = DriveApp.getFilesByName(LABELS_SHEET_NAME);
		if (!files.hasNext()) {
			Logger.log("labels spreadsheet not found");
			return {};
		}

		const spreadsheet = SpreadsheetApp.openById(files.next().getId());
		const sheet = spreadsheet.getActiveSheet();
		const data = sheet.getDataRange().getValues();

		const labelConfig = {};
		for (let i = 1; i < data.length; i++) {
			if (data[i][0] && data[i][1]) {
				labelConfig[data[i][0]] = data[i][1];
			}
		}

		return labelConfig;
	} catch (error) {
		Logger.log("error reading labels config: " + error.toString());
		return {};
	}
}

function getParameters_() {
	try {
		const files = DriveApp.getFilesByName(PARAMETERS_SHEET_NAME);
		if (!files.hasNext()) {
			Logger.log("parameters spreadsheet not found");
			return DEFAULT_SUMMARY_PARAMETERS;
		}

		const spreadsheet = SpreadsheetApp.openById(files.next().getId());
		const sheet = spreadsheet.getActiveSheet();
		const data = sheet.getDataRange().getValues();

		const parameters = {};
		for (let i = 1; i < data.length; i++) {
			if (data[i][0] && data[i][1]) {
				const paramName = data[i][0];
				const paramValue = data[i][1];

				if (paramName === "summary_days" || paramName === "summary_count" || paramName === "summary_time_minutes") {
					parameters[paramName] = parseInt(paramValue) || DEFAULT_SUMMARY_PARAMETERS[paramName];
				} else {
					parameters[paramName] = paramValue;
				}
			}
		}

		// ensure required parameters exist
		Object.keys(DEFAULT_SUMMARY_PARAMETERS).forEach(key => {
			if (!parameters[key]) {
				// get current user email for summary_emails parameter
				const defaultValue = key === "summary_emails" ? Session.getActiveUser().getEmail() : DEFAULT_SUMMARY_PARAMETERS[key];
				parameters[key] = defaultValue;
			}
		});

		return parameters;
	} catch (error) {
		Logger.log("error reading parameters: " + error.toString());
		return DEFAULT_SUMMARY_PARAMETERS;
	}
}

function getEmailsFromLabel_(labelName, maxCount, maxDays) {
	try {
		const query = `label:${labelName} newer_than:${maxDays}d`;
		const threads = GmailApp.search(query, 0, maxCount);

		const emails = [];
		let emailCount = 0;

		for (const thread of threads) {
			if (emailCount >= maxCount) break;

			const messages = thread.getMessages();
			const threadEmails = [];

			// process all messages in this thread (already in chronological order)
			for (const message of messages) {
				if (emailCount >= maxCount) break;

				threadEmails.push({
					subject: message.getSubject(),
					body: message.getPlainBody(),
					date: message.getDate(),
					from: message.getFrom(),
					threadId: thread.getId(),
					isThreadStart: threadEmails.length === 0,
					threadPosition: threadEmails.length + 1,
					threadSize: messages.length
				});
				emailCount++;
			}

			// add thread emails in order to main collection
			emails.push(...threadEmails);

			if (messages.length > 1) {
				Logger.log(`found thread with ${messages.length} messages in label "${labelName}"`);
			}
		}

		// sort threads by most recent message date, but preserve within-thread order
		const threadGroups = {};
		emails.forEach(email => {
			if (!threadGroups[email.threadId]) {
				threadGroups[email.threadId] = [];
			}
			threadGroups[email.threadId].push(email);
		});

		// sort thread groups by their most recent message
		const sortedThreadGroups = Object.values(threadGroups).sort((threadA, threadB) => {
			const latestA = Math.max(...threadA.map(e => e.date.getTime()));
			const latestB = Math.max(...threadB.map(e => e.date.getTime()));
			return latestA - latestB; // oldest thread first
		});

		// flatten back to single array, preserving thread order
		const sortedEmails = sortedThreadGroups.flat();

		Logger.log(`retrieved ${sortedEmails.length} emails from ${Object.keys(threadGroups).length} threads in label "${labelName}"`);

		return sortedEmails;
	} catch (error) {
		Logger.log("error getting emails from label " + labelName + ": " + error.toString());
		return [];
	}
}

function truncateToMaxWords_(text, maxWords) {
	if (!text || maxWords <= 0) return text;

	const words = text.split(/\s+/);
	if (words.length <= maxWords) return text;

	Logger.log(`truncating email body from ${words.length} words to ${maxWords} words`);
	return words.slice(0, maxWords).join(' ') + '...';
}

function callOpenAISummarizeThread_(threadEmails, model, apiKey, maxWords, userEmail, compressionLevel) {
	try {
		// optimize long threads by keeping only newest 2 emails
		let optimizedEmails = threadEmails;
		if (threadEmails.length > 3) {
			optimizedEmails = threadEmails.slice(-2);
			Logger.log(`long thread detected (${threadEmails.length} emails) - focusing on newest 2 emails only`);
		}

		const emailTexts = optimizedEmails.map(email => {
			let threadInfo = '';
			if (email.threadSize > 1) {
				if (email.threadSize > 3) {
					threadInfo = `Thread: Latest ${email.threadPosition}/${email.threadSize} (LENGTHY THREAD - SHOWING RECENT ACTIVITY ONLY)`;
				} else {
					threadInfo = `Thread: ${email.threadPosition}/${email.threadSize} ${email.isThreadStart ? '(THREAD START)' : '(CONTINUATION)'}`;
				}
			}

			return `${threadInfo ? threadInfo + '\n' : ''}From: ${email.from}\nSubject: ${email.subject}\nDate: ${email.date.toDateString()}\nBody: ${truncateToMaxWords_(email.body, maxWords)}`;
		}).join('\n\n---\n\n');

		// determine user name for personalization from email address
		const nameToReplace = userEmail ? userEmail.split('@')[0].replace(/[._]/g, ' ') : '';
		Logger.log(`using email-based personalization: "${nameToReplace}" -> "You"`);

		const isThread = optimizedEmails.length > 1;
		const threadType = isThread ? 'thread' : 'single email';

		const currentDate = new Date();
		const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const currentDayName = dayNames[currentDate.getDay()];
		const currentDateString = currentDate.toDateString();

		Logger.log(`using compression level: "${compressionLevel}" for thread summarization`);

		const fullPrompt = `CRITICAL: Use "${compressionLevel}" compression level for this summary.

COMPRESSION LEVELS EXPLAINED:
- detailed: Include context, background, and specific details
- standard: Balanced summary with key information  
- succinct: Brief summary focusing on main points only
- very succinct: Ultra-brief, just essential facts

YOU MUST USE "${compressionLevel}" COMPRESSION - this is the most important instruction.

${THREAD_SUMMARY_PROMPT}

CURRENT TASK:
This is a ${threadType} with ${optimizedEmails.length} email${optimizedEmails.length > 1 ? 's' : ''} (${threadEmails.length - optimizedEmails.length > 0 ? `optimized from ${threadEmails.length} total` : 'complete thread'}).
The email recipient is: ${userEmail}
When referring to "${nameToReplace}" or variations of this name, use "You" instead.

CURRENT DATE CONTEXT:
Today is ${currentDayName}, ${currentDateString}. Use this to create specific day references like "yesterday (on Monday)", "today (Tuesday)", etc.

Email content (sorted by date):
${emailTexts}

Generate the summary using "${compressionLevel}" compression (1-2 sentences max):`;

		// log the complete prompt being sent to OpenAI
		// Logger.log(`=== FULL OPENAI PROMPT ===`);
		// Logger.log(fullPrompt);
		// Logger.log(`=== END PROMPT ===`);

		const payload = {
			model: model,
			messages: [
				{ role: "system", content: "you are a helpful email summarizer for busy professionals." },
				{ role: "user", content: fullPrompt }
			]
		};

		const options = {
			method: "post",
			contentType: "application/json",
			headers: {
				Authorization: `Bearer ${apiKey}`
			},
			payload: JSON.stringify(payload),
			muteHttpExceptions: true,
		};

		const response = UrlFetchApp.fetch("https://api.openai.com/v1/chat/completions", options);
		const json = JSON.parse(response.getContentText());

		if (!json.choices || !json.choices[0] || !json.choices[0].message) {
			Logger.log("openai returned unexpected response: " + JSON.stringify(json));
			return "summary generation failed";
		}

		return json.choices[0].message.content.trim();
	} catch (error) {
		Logger.log("error in openai thread summarization: " + error.toString());
		return "summary generation failed";
	}
}

function callOpenAISummarizeLabel_(emailsData, labelName, model, apiKey, maxWords, userEmail, compressionLevel) {
	try {
		// group emails by thread
		const threadGroups = {};
		emailsData.forEach(email => {
			if (!threadGroups[email.threadId]) {
				threadGroups[email.threadId] = [];
			}
			threadGroups[email.threadId].push(email);
		});

		const threadIds = Object.keys(threadGroups);
		Logger.log(`processing ${threadIds.length} threads in label "${labelName}"`);

		// process each thread separately with OpenAI
		const threadSummaries = [];
		for (const threadId of threadIds) {
			const threadEmails = threadGroups[threadId];
			Logger.log(`processing thread with ${threadEmails.length} emails`);

			const threadSummary = callOpenAISummarizeThread_(
				threadEmails,
				model,
				apiKey,
				maxWords,
				userEmail,
				compressionLevel
			);

			if (threadSummary && threadSummary !== "summary generation failed") {
				// create Gmail link for the thread
				const gmailLink = `https://mail.google.com/mail/u/0/#all/${threadId}`;
				const linkedSummary = `${threadSummary} <a href="${gmailLink}">[View]</a>`;
				Logger.log(`created Gmail link for thread: ${gmailLink}`);
				threadSummaries.push(linkedSummary);
			}
		}

		// combine thread summaries with label header
		const totalEmails = emailsData.length;
		const timeRange = formatTimeRange_(emailsData);

		let labelSummary = `<b>${labelName}</b>: ${totalEmails} emails (${timeRange})\n\n`;
		threadSummaries.forEach(summary => {
			labelSummary += summary + '\n\n';
		});

		Logger.log(`completed label "${labelName}" with ${threadSummaries.length} thread summaries`);
		return labelSummary;

	} catch (error) {
		Logger.log("error in label summarization: " + error.toString());
		return `${labelName}: summary generation failed`;
	}
}

function formatTimeRange_(emails) {
	if (emails.length === 0) return "no emails";

	const dates = emails.map(email => email.date).sort();
	const oldest = dates[0];
	const newest = dates[dates.length - 1];

	if (oldest.toDateString() === newest.toDateString()) {
		return `last received: ${newest.toDateString()}`;
	}

	return `spanning: ${oldest.toDateString()} to ${newest.toDateString()}`;
}

function generateEmailSummary() {
	try {
		Logger.log("starting email summary generation");
		const labelConfig = getLabelConfig_();
		const parameters = getParameters_();

		Logger.log("loaded parameters:");
		Object.keys(parameters).forEach(key => {
			Logger.log(`  ${key}: ${parameters[key]}`);
		});

		if (!parameters.summary_emails || parameters.summary_emails.trim() === "") {
			parameters.summary_emails = Session.getActiveUser().getEmail();
			Logger.log("using default email address: " + parameters.summary_emails);
		}

		if (!parameters.apiKey || parameters.apiKey === "API_KEY") {
			Logger.log("openai api key not configured");
			return;
		}

		const emailAddresses = parameters.summary_emails.split(',').map(email => email.trim());
		const labelNames = Object.keys(labelConfig);

		if (labelNames.length === 0) {
			Logger.log("no labels found");
			return;
		}

		let summaryContent = "";
		let totalEmails = 0;
		const labelSummaries = [];

		const compressionLevel = parameters.summary_compression || "standard";
		Logger.log(`loaded compression parameter: "${compressionLevel}"`);
		Logger.log(`processing ${labelNames.filter(name => name !== "Other").length} labels using thread-based summarization with "${compressionLevel}" compression`);

		for (const labelName of labelNames) {
			if (labelName === "Other") continue; // skip Other label

			Logger.log(`processing label: ${labelName}`);
			const emails = getEmailsFromLabel_(labelName, parameters.summary_count, parameters.summary_days);
			totalEmails += emails.length;

			if (emails.length > 0) {
				Logger.log(`found ${emails.length} emails in label "${labelName}" - generating summary`);
				Logger.log(`using maxWords limit: ${parameters.maxWords || 500} words per email`);

				// generate voice-ready summary for this label using thread-based approach
				const summary = callOpenAISummarizeLabel_(
					emails,
					labelName,
					parameters.model || "gpt-4o",
					parameters.apiKey,
					parameters.maxWords || 500,
					parameters.summary_emails.split(',')[0].trim(),
					compressionLevel
				);

				Logger.log(`completed summary for label "${labelName}"`);
				labelSummaries.push({
					label: labelName,
					count: emails.length,
					summary: summary
				});
			} else {
				Logger.log(`no emails found in label "${labelName}" - skipping`);
			}
		}

		// build voice-optimized email content (HTML formatted)
		summaryContent += `<b>Email Summary - ${new Date().toDateString()}</b><br><br>`;
		summaryContent += `Total: ${totalEmails} emails from the last ${parameters.summary_days} days<br>`;
		summaryContent += `Target listening time: ${parameters.summary_time_minutes} minutes<br><br>`;

		// add voice-ready summaries (now includes label headers)
		for (const labelSummary of labelSummaries) {
			summaryContent += labelSummary.summary.replace(/\n/g, '<br>');
		}

		if (totalEmails === 0) {
			summaryContent += "No new emails found in the specified time period.<br>";
			Logger.log("no emails found across all labels - sending empty summary");
		}

		// send HTML email
		const subject = `AI Summary: ${totalEmails} emails from last ${parameters.summary_days} days`;
		Logger.log(`sending summary: ${totalEmails} total emails across ${labelSummaries.length} labels`);

		for (const emailAddress of emailAddresses) {
			if (emailAddress && emailAddress.includes('@')) {
				GmailApp.sendEmail(emailAddress, subject, '', {
					htmlBody: summaryContent
				});
				Logger.log("summary sent to: " + emailAddress);
			}
		}

		Logger.log("email summary generation completed");

	} catch (error) {
		Logger.log("error in generateEmailSummary: " + error.toString());
	}
}

function setupSummaryParameters() {
	try {
		// get existing parameters
		const files = DriveApp.getFilesByName(PARAMETERS_SHEET_NAME);
		if (!files.hasNext()) {
			Logger.log("parameters sheet not found. run setupSheets from label.js first");
			return;
		}

		const spreadsheet = SpreadsheetApp.openById(files.next().getId());
		const sheet = spreadsheet.getActiveSheet();
		const data = sheet.getDataRange().getValues();

		// check if summary parameters already exist
		const existingParams = new Set();
		for (let i = 1; i < data.length; i++) {
			if (data[i][0]) {
				existingParams.add(data[i][0]);
			}
		}

		// add missing summary parameters
		const newParams = [];
		Object.entries(DEFAULT_SUMMARY_PARAMETERS).forEach(([key, value]) => {
			if (!existingParams.has(key)) {
				// get current user email for summary_emails parameter
				const actualValue = key === "summary_emails" ? Session.getActiveUser().getEmail() : value;
				// handle long prompt text properly
				const stringValue = key === "summary_prompt" ? actualValue : actualValue.toString();
				newParams.push([key, stringValue]);
			}
		});

		if (newParams.length > 0) {
			const lastRow = sheet.getLastRow();
			sheet.getRange(lastRow + 1, 1, newParams.length, 2).setValues(newParams);
			sheet.autoResizeColumns(1, 2);
			Logger.log("added summary parameters: " + newParams.map(p => p[0]).join(", "));
		} else {
			Logger.log("summary parameters already exist");
		}

	} catch (error) {
		Logger.log("error setting up summary parameters: " + error.toString());
	}
} 