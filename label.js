// Configuration constants
const LABELS_SHEET_NAME = "Gmail Labeler Labels";
const PARAMETERS_SHEET_NAME = "Gmail Labeler Parameters";

// Default configurations (fallback if sheets don't exist)
const DEFAULT_LABEL_CONFIG = {
	"dogs": "Emails about dogs, pets, or dog-related topics",
	"cats": "Emails about cats, felines, or cat-related topics",
	"god": "Emails about religion, spirituality, or divine matters",
	"Other": "Any other email"
};

const DEFAULT_PARAMETERS = {
	emailCount: 10,
	model: "gpt-4o",
	apiKey: "API_KEY",
	resorting: "F",
	style: "days",
	dayCount: 1
};

function createLabelsSheet_() {
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
			["dogs", "Emails about dogs, pets, or dog-related topics"],
			["cats", "Emails about cats, felines, or cat-related topics"],
			["god", "Emails about religion, spirituality, or divine matters"],
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

function createParametersSheet_() {
	try {
		let existingApiKey = "API_KEY"; // Default value

		// Check if spreadsheet already exists and preserve API_KEY
		const files = DriveApp.getFilesByName(PARAMETERS_SHEET_NAME);
		if (files.hasNext()) {
			const existingFile = files.next();
			try {
				const existingSpreadsheet = SpreadsheetApp.openById(existingFile.getId());
				const existingSheet = existingSpreadsheet.getActiveSheet();
				const existingData = existingSheet.getDataRange().getValues();

				// Look for existing API_KEY value
				for (let i = 1; i < existingData.length; i++) {
					if (existingData[i][0] === "apiKey" && existingData[i][1]) {
						existingApiKey = existingData[i][1];
						Logger.log("Preserved existing API_KEY");
						break;
					}
				}
			} catch (readError) {
				Logger.log("Could not read existing parameters sheet: " + readError.toString());
			}

			DriveApp.getFileById(existingFile.getId()).setTrashed(true);
			Logger.log("Deleted existing parameters spreadsheet");
		}

		// Create new spreadsheet
		const spreadsheet = SpreadsheetApp.create(PARAMETERS_SHEET_NAME);
		const sheet = spreadsheet.getActiveSheet();

		// Set up headers
		sheet.getRange("A1").setValue("Parameter");
		sheet.getRange("B1").setValue("Value");

		// Add sample data with preserved API_KEY
		const sampleData = [
			["emailCount", "10"],
			["model", "gpt-4o"],
			["apiKey", existingApiKey],
			["resorting", "F"],
			["style", "days"],
			["dayCount", "1"]
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

function getLabelConfig_() {
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

function getParameters_() {
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
				if (paramName === "emailCount" || paramName === "dayCount") {
					parameters[paramName] = parseInt(paramValue) || DEFAULT_PARAMETERS[paramName];
				} else {
					parameters[paramName] = paramValue;
				}
			}
		}

		// Ensure required parameters exist
		if (!parameters.emailCount) parameters.emailCount = DEFAULT_PARAMETERS.emailCount;
		if (!parameters.model) parameters.model = DEFAULT_PARAMETERS.model;
		if (!parameters.apiKey) parameters.apiKey = DEFAULT_PARAMETERS.apiKey;
		if (!parameters.resorting) parameters.resorting = DEFAULT_PARAMETERS.resorting;
		if (!parameters.style) parameters.style = DEFAULT_PARAMETERS.style;
		if (!parameters.dayCount) parameters.dayCount = DEFAULT_PARAMETERS.dayCount;

		return parameters;
	} catch (error) {
		Logger.log("Error reading parameters: " + error.toString());
		return DEFAULT_PARAMETERS;
	}
}

function callOpenAIClassify_(subject, body, labelConfig, model, apiKey) {
	try {
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

function setupSheets() {
	Logger.log("Setting up Google Sheets...");
	createLabelsSheet_();
	createParametersSheet_();
	Logger.log("Sheets setup complete!");
}

function classifyAndLabelEmails() {
	try {
		// Get configuration from sheets
		const labelConfig = getLabelConfig_();
		const parameters = getParameters_();

		Logger.log("Using label config: " + JSON.stringify(labelConfig));
		Logger.log("Using parameters: " + JSON.stringify(parameters));

		let threads;
		if (parameters.style === "count") {
			threads = GmailApp.getInboxThreads(0, parameters.emailCount);
		} else {
			// Default to "days" style
			const query = `in:inbox newer_than:${parameters.dayCount}d`;
			threads = GmailApp.search(query);
		}

		for (const thread of threads) {
			const msgs = thread.getMessages();
			const lastMsg = msgs[msgs.length - 1];
			const subject = lastMsg.getSubject();
			const body = lastMsg.getPlainBody();

			const labels = thread.getLabels().map(l => l.getName());

			// Skip if already sorted and not resorting
			if (labels.includes("ai") && parameters.resorting !== "T") continue;

			// Remove existing labels if resorting
			if (parameters.resorting === "T") {
				const existingLabels = thread.getLabels();
				for (const existingLabel of existingLabels) {
					const labelName = existingLabel.getName();
					// Remove only labels we're handling (defined in labelConfig)
					if (labelConfig.hasOwnProperty(labelName)) {
						thread.removeLabel(existingLabel);
					}
				}
			}

			// add sorted label
			const processedLabel = GmailApp.getUserLabelByName("ai") || GmailApp.createLabel("ai");
			thread.addLabel(processedLabel);

			const label = callOpenAIClassify_(subject, body, labelConfig, parameters.model, parameters.apiKey);

			// skip if label is other
			if (label === "Other") continue;

			if (labelConfig.hasOwnProperty(label)) {
				Logger.log(`Subject: "${subject}" → Chosen Label: "${label}"`);
				const gmailLabel = GmailApp.getUserLabelByName(label) || GmailApp.createLabel(label);
				thread.addLabel(gmailLabel);
			} else {
				Logger.log(`Subject: "${subject}" → Unexpected label '${label}', skipping labeling`);
			}


		}
	} catch (error) {
		Logger.log("Error in classifyAndLabelEmails: " + error.toString());
		// Do nothing on error as requested
	}
}
