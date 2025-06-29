// Configuration constants
const LABELS_SHEET_NAME = "Gmail Labeler Labels";
const PARAMETERS_SHEET_NAME = "Gmail Labeler Parameters";

// Default configurations (fallback if sheets don't exist)
const DEFAULT_LABEL_CONFIG = {
	"_A": "Emails involving AI or Evo2",
	"_B": "Emails related to work, projects, or colleagues",
	"_C": "Mentioning Manuel",
	"Other": "Any other email"
};

const DEFAULT_PARAMETERS = {
	emailCount: 10,
	model: "gpt-4o"
};

function createLabelsSheet() {
	try {
		// Check if spreadsheet already exists
		const files = DriveApp.getFilesByName(LABELS_SHEET_NAME);
		if (files.hasNext()) {
			Logger.log("Labels spreadsheet already exists");
			return files.next().getId();
		}

		// Create new spreadsheet
		const spreadsheet = SpreadsheetApp.create(LABELS_SHEET_NAME);
		const sheet = spreadsheet.getActiveSheet();

		// Set up headers
		sheet.getRange("A1").setValue("Label");
		sheet.getRange("B1").setValue("Description");

		// Add sample data
		const sampleData = [
			["_A", "Emails involving AI or Evo2"],
			["_B", "Emails related to work, projects, or colleagues"],
			["_C", "Mentioning Manuel"],
			["Other", "Any other email"]
		];

		sheet.getRange(2, 1, sampleData.length, 2).setValues(sampleData);

		// Format headers
		sheet.getRange("A1:B1").setFontWeight("bold");
		sheet.autoResizeColumns(1, 2);

		Logger.log("Created labels spreadsheet with ID: " + spreadsheet.getId());
		return spreadsheet.getId();
	} catch (error) {
		Logger.log("Error creating labels sheet: " + error.toString());
		return null;
	}
}

function createParametersSheet() {
	try {
		// Check if spreadsheet already exists
		const files = DriveApp.getFilesByName(PARAMETERS_SHEET_NAME);
		if (files.hasNext()) {
			Logger.log("Parameters spreadsheet already exists");
			return files.next().getId();
		}

		// Create new spreadsheet
		const spreadsheet = SpreadsheetApp.create(PARAMETERS_SHEET_NAME);
		const sheet = spreadsheet.getActiveSheet();

		// Set up headers
		sheet.getRange("A1").setValue("Parameter");
		sheet.getRange("B1").setValue("Value");

		// Add sample data
		const sampleData = [
			["emailCount", "10"],
			["model", "gpt-4o"]
		];

		sheet.getRange(2, 1, sampleData.length, 2).setValues(sampleData);

		// Format headers
		sheet.getRange("A1:B1").setFontWeight("bold");
		sheet.autoResizeColumns(1, 2);

		Logger.log("Created parameters spreadsheet with ID: " + spreadsheet.getId());
		return spreadsheet.getId();
	} catch (error) {
		Logger.log("Error creating parameters sheet: " + error.toString());
		return null;
	}
}

function getLabelConfig() {
	try {
		const files = DriveApp.getFilesByName(LABELS_SHEET_NAME);
		if (!files.hasNext()) {
			Logger.log("Labels spreadsheet not found, using defaults");
			return DEFAULT_LABEL_CONFIG;
		}

		const spreadsheet = SpreadsheetApp.openById(files.next().getId());
		const sheet = spreadsheet.getActiveSheet();
		const data = sheet.getDataRange().getValues();

		// Skip header row
		const labelConfig = {};
		for (let i = 1; i < data.length; i++) {
			if (data[i][0] && data[i][1]) { // Both label and description must exist
				labelConfig[data[i][0]] = data[i][1];
			}
		}

		return Object.keys(labelConfig).length > 0 ? labelConfig : DEFAULT_LABEL_CONFIG;
	} catch (error) {
		Logger.log("Error reading labels config: " + error.toString());
		return DEFAULT_LABEL_CONFIG;
	}
}

function getParameters() {
	try {
		const files = DriveApp.getFilesByName(PARAMETERS_SHEET_NAME);
		if (!files.hasNext()) {
			Logger.log("Parameters spreadsheet not found, using defaults");
			return DEFAULT_PARAMETERS;
		}

		const spreadsheet = SpreadsheetApp.openById(files.next().getId());
		const sheet = spreadsheet.getActiveSheet();
		const data = sheet.getDataRange().getValues();

		// Skip header row
		const parameters = {};
		for (let i = 1; i < data.length; i++) {
			if (data[i][0] && data[i][1]) { // Both parameter and value must exist
				const paramName = data[i][0];
				const paramValue = data[i][1];

				// Convert numeric values
				if (paramName === "emailCount") {
					parameters[paramName] = parseInt(paramValue) || DEFAULT_PARAMETERS.emailCount;
				} else {
					parameters[paramName] = paramValue;
				}
			}
		}

		// Ensure required parameters exist
		if (!parameters.emailCount) parameters.emailCount = DEFAULT_PARAMETERS.emailCount;
		if (!parameters.model) parameters.model = DEFAULT_PARAMETERS.model;

		return parameters;
	} catch (error) {
		Logger.log("Error reading parameters: " + error.toString());
		return DEFAULT_PARAMETERS;
	}
}

function callOpenAIClassify(subject, body, labelConfig, model) {
	try {
		const apiKey = 'API_KEY';

		const labels = Object.keys(labelConfig).join(", ");
		const prompt = `Classify this email into one of these labels: ${labels}. Return only one word (the label).\n\nDefinitions:\n` +
			Object.entries(labelConfig).map(([label, desc]) => `${label}: ${desc}`).join("\n") +
			`\n\nSubject: ${subject}\n\nBody: ${body}\n\nLabel:`;

		const payload = {
			model: model,
			messages: [
				{ role: "system", content: "You are a helpful email classifier." },
				{ role: "user", content: prompt }
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
			Logger.log("OpenAI returned unexpected response: " + JSON.stringify(json));
			return "Other";
		}

		const label = json.choices[0].message.content.trim();
		return label;
	} catch (error) {
		Logger.log("Error in OpenAI classification: " + error.toString());
		return "Other";
	}
}

function generateSummaryEmail(rawList, model) {
	try {
		const apiKey = 'API_KEY';

		const prompt = `You are an assistant writing a short, friendly status email. Based on this list of labeled emails, write a concise summary email to myself. Be clear and keep it short. Here is the list:\n\n${rawList}\n\nSummary email:`;

		const payload = {
			model: model,
			messages: [
				{ role: "system", content: "You are a helpful email summarizer." },
				{ role: "user", content: prompt }
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
			Logger.log("OpenAI summary generation error: " + JSON.stringify(json));
			return "Summary could not be generated.";
		}

		return json.choices[0].message.content.trim();
	} catch (error) {
		Logger.log("Error generating summary: " + error.toString());
		return "Summary could not be generated.";
	}
}

function setupSheets() {
	Logger.log("Setting up Google Sheets...");
	createLabelsSheet();
	createParametersSheet();
	Logger.log("Sheets setup complete!");
}

function classifyAndLabelEmails() {
	try {
		// Get configuration from sheets
		const labelConfig = getLabelConfig();
		const parameters = getParameters();

		Logger.log("Using label config: " + JSON.stringify(labelConfig));
		Logger.log("Using parameters: " + JSON.stringify(parameters));

		const threads = GmailApp.getInboxThreads(0, parameters.emailCount);

		for (const thread of threads) {
			const msgs = thread.getMessages();
			const lastMsg = msgs[msgs.length - 1];
			const subject = lastMsg.getSubject();
			const body = lastMsg.getPlainBody();

			const labels = thread.getLabels().map(l => l.getName());
			if (labels.includes("sorted")) continue;

			const label = callOpenAIClassify(subject, body, labelConfig, parameters.model);

			let labelName = labelConfig.hasOwnProperty(label) ? label : "Other";

			if (!labelConfig.hasOwnProperty(label)) {
				Logger.log(`Unexpected label '${label}', using 'Other'`);
			}

			Logger.log(`Subject: "${subject}" → Chosen Label: "${labelName}"`);

			const gmailLabel = GmailApp.getUserLabelByName(labelName) || GmailApp.createLabel(labelName);
			thread.addLabel(gmailLabel);

			const processedLabel = GmailApp.getUserLabelByName("sorted") || GmailApp.createLabel("sorted");
			thread.addLabel(processedLabel);
		}
	} catch (error) {
		Logger.log("Error in classifyAndLabelEmails: " + error.toString());
		// Do nothing on error as requested
	}
}
