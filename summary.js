// Default summary parameters (constants are shared from label.js)
const DEFAULT_SUMMARY_PARAMETERS = {
	summary_days: 3,
	summary_count: 20,
	summary_time_minutes: 20,
	summary_emails: Session.getActiveUser().getEmail(),
	summary_prompt: "Create a brief, professional summary for listening while driving. Focus on key actionable items and important matters that need attention. Be concise and skip pleasantries. Organize by priority and urgency."
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
		for (const thread of threads) {
			const messages = thread.getMessages();
			const lastMessage = messages[messages.length - 1];

			emails.push({
				subject: lastMessage.getSubject(),
				body: lastMessage.getPlainBody(),
				date: lastMessage.getDate(),
				from: lastMessage.getFrom()
			});
		}

		return emails;
	} catch (error) {
		Logger.log("error getting emails from label " + labelName + ": " + error.toString());
		return [];
	}
}

function truncateToMaxWords_(text, maxWords) {
	if (!text || maxWords <= 0) return text;

	const words = text.split(/\s+/);
	if (words.length <= maxWords) return text;

	return words.slice(0, maxWords).join(' ') + '...';
}

function callOpenAISummarize_(emailsData, labelName, timeMinutes, prompt, model, apiKey, maxWords) {
	try {
		const emailTexts = emailsData.map(email =>
			`From: ${email.from}\nSubject: ${email.subject}\nDate: ${email.date.toDateString()}\nBody: ${truncateToMaxWords_(email.body, maxWords)}`
		).join('\n\n---\n\n');

		const fullPrompt = `${prompt}

Label: ${labelName}
Target duration: ${timeMinutes} minutes of listening time
Number of emails: ${emailsData.length}

Email content:
${emailTexts}

Provide a concise summary focusing on actionable items and urgent matters:`;

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
		Logger.log("error in openai summarization: " + error.toString());
		return "summary generation failed";
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
		const labelConfig = getLabelConfig_();
		const parameters = getParameters_();

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

		// overview section
		let overviewLines = [];
		const labelSummaries = [];

		for (const labelName of labelNames) {
			if (labelName === "Other") continue; // skip Other label

			const emails = getEmailsFromLabel_(labelName, parameters.summary_count, parameters.summary_days);
			totalEmails += emails.length;

			if (emails.length > 0) {
				const timeRange = formatTimeRange_(emails);
				overviewLines.push(`${labelName}: ${emails.length} emails (${timeRange})`);

				// generate summary for this label
				const summary = callOpenAISummarize_(
					emails,
					labelName,
					Math.floor(parameters.summary_time_minutes / labelNames.length),
					parameters.summary_prompt,
					parameters.model || "gpt-4o",
					parameters.apiKey,
					parameters.maxWords || 1000
				);

				labelSummaries.push({
					label: labelName,
					count: emails.length,
					summary: summary
				});
			}
		}

		// build email content
		summaryContent += `EMAIL SUMMARY - ${new Date().toDateString()}\n\n`;
		summaryContent += `OVERVIEW:\n`;
		summaryContent += `total emails: ${totalEmails}\n`;
		summaryContent += `time period: last ${parameters.summary_days} days\n`;
		summaryContent += `target listening time: ${parameters.summary_time_minutes} minutes\n\n`;

		if (overviewLines.length > 0) {
			summaryContent += overviewLines.join('\n') + '\n\n';
		}

		summaryContent += `DETAILED SUMMARIES:\n\n`;

		for (const labelSummary of labelSummaries) {
			summaryContent += `--- ${labelSummary.label.toUpperCase()} (${labelSummary.count} emails) ---\n`;
			summaryContent += labelSummary.summary + '\n\n';
		}

		if (totalEmails === 0) {
			summaryContent += "no new emails found in the specified time period.\n";
		}

		// send email
		const subject = `AI email summary - ${totalEmails} emails from last ${parameters.summary_days} days`;

		for (const emailAddress of emailAddresses) {
			if (emailAddress && emailAddress.includes('@')) {
				GmailApp.sendEmail(emailAddress, subject, summaryContent);
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
				newParams.push([key, actualValue.toString()]);
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