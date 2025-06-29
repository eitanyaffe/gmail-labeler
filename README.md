# gmail-labeler

Automatically classify and label your Gmail threads using OpenAI with configuration managed through Google Sheets.

## Overview

This Google Apps Script automatically analyzes your latest Gmail threads, assigns them to custom labels (e.g., "_A", "_B", "_C"), and labels them directly in Gmail. The labels and parameters are managed through Google Sheets, making it easy to customize without editing code.

## Features

- Uses OpenAI (GPT-4o) to semantically classify emails.
- Adds Gmail labels automatically.
- Sends a friendly summary email to yourself after each run.
- **Label configuration managed through Google Sheets** - no code editing needed!
- **Configurable parameters** (email count, AI model) through Google Sheets.
- Automatic Google Sheets creation with sample data.

---

## Requirements

- **Gmail account** (your normal Gmail).
- **OpenAI account** with an active billing setup (trial credits alone usually insufficient).
- Google Apps Script (part of your Google account).

## Setup

### 1. Create Google Apps Script project

- Go to: https://script.google.com/
- Click **New project**.
- Name it, for example: `Gmail Labeler`.

### 2. Paste the code

- Copy the entire code below into the script editor.
- Replace `API_KEY` with your OpenAI key (in **both places** in the code).
- Save the project.

### 3. Set up Google Sheets (Automatic)

- In the Apps Script editor, select the `setupSheets` function from the dropdown.
- Click **Run**.
- Grant permissions when prompted.
- This creates two spreadsheets:
  - **"Gmail Labeler Labels"** - Contains your label definitions
  - **"Gmail Labeler Parameters"** - Contains configuration parameters

### 4. Configure your labels (Optional)

Open the **"Gmail Labeler Labels"** spreadsheet and customize:
- Column A: Label name (e.g., "_A", "_B", "_C", "Other")
- Column B: Description for the AI to understand when to use this label

Default labels:
- `_A`: Emails involving AI or Evo2
- `_B`: Emails related to work, projects, or colleagues  
- `_C`: Mentioning Manuel
- `Other`: Any other email

### 5. Configure parameters (Optional)

Open the **"Gmail Labeler Parameters"** spreadsheet and adjust:
- `emailCount`: Number of emails to process each run (default: 10)
- `model`: OpenAI model to use (default: gpt-4o)

### 6. Get your OpenAI API key

- Sign up or log in: https://platform.openai.com/signup
- Add a payment method and ensure billing is enabled.
- Create an API key: https://platform.openai.com/api-keys
- Copy the key and replace `API_KEY` in your script.

### 7. Create Gmail labels

In Gmail, manually create labels that match your label names from the spreadsheet (e.g., "_A", "_B", "_C", "Other").

### 8. Test the setup

- In Apps Script, select `classifyAndLabelEmails` function.
- Click **Run** to test.
- Check logs under "Executions" for any errors.

### 9. Set up automatic trigger

- Click the clock icon ("Triggers") in Apps Script.
- Click "+ Add Trigger".
- Choose function: `classifyAndLabelEmails`.
- Event source: Time-driven.
- Type: Every 10 minutes (or any interval you like).
- Save.

## Google Sheets Structure

### Labels Sheet ("Gmail Labeler Labels")
```
| Label | Description                              |
|-------|------------------------------------------|
| _A    | Emails involving AI or Evo2             |
| _B    | Emails related to work, projects, or... |
| _C    | Mentioning Manuel                        |
| Other | Any other email                          |
```

### Parameters Sheet ("Gmail Labeler Parameters")  
```
| Parameter  | Value   |
|------------|---------|
| emailCount | 10      |
| model      | gpt-4o  |
```

## How it works

- Reads label definitions from Google Sheets
- Reads configuration parameters from Google Sheets
- Processes the specified number of recent inbox threads
- Classifies each email using OpenAI with your custom labels
- Labels threads in Gmail
- Falls back to default values if sheets are unavailable

## Manual Sheet Setup (Alternative)

If automatic setup doesn't work, you can create the sheets manually:

1. **Create "Gmail Labeler Labels" spreadsheet:**
   - Column A header: "Label"
   - Column B header: "Description" 
   - Add your label definitions in rows below

2. **Create "Gmail Labeler Parameters" spreadsheet:**
   - Column A header: "Parameter" 
   - Column B header: "Value"
   - Add parameters like `emailCount` and `model`

## Notes

- Customize labels easily by editing the Google Sheets - no code changes needed!
- Logs appear under "Executions" in Apps Script after each run.
- Your OpenAI account must have an active payment method and sufficient quota.
- If Google Sheets are unavailable, the script uses built-in defaults and continues working.
- The script does nothing if it encounters errors, ensuring it won't break your Gmail.
