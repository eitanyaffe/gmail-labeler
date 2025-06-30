# Gmail Auto-Organizer

Automatically organizes Gmail emails into labels using AI classification.

Useful for professionals, healthcare workers, freelancers, or anyone receiving 50+ emails daily who needs automatic email sorting. Saves time by eliminating manual email organization.

## Features

- **Email Organization**: Automatically classifies and labels emails based on configurable categories
- **Optional Daily Summaries**: Generates AI summaries of recent emails

## Requirements

- Gmail account
- OpenAI API key ($3-15/month depending on usage)
- 20 minutes setup time

## Setup

### 1. Create Google Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click "New project"
3. Delete existing code
4. Paste code from `label.js`
5. Save project

**Optional: For email summaries**
- Add new file named `summary`, paste code from `summary.js`

### 2. Initialize Configuration

1. Select `setupSheets` function
2. Click "Run"
3. Grant permissions when prompted

This creates two Google Sheets:
- "Gmail Labeler Labels" - email categories
- "Gmail Labeler Parameters" - configuration settings

### 3. Configure Categories

1. Open [sheets.google.com](https://sheets.google.com)
2. Find "Gmail Labeler Labels" sheet
3. Edit categories:
   - Column A: Label name (e.g., "Clients")
   - Column B: Description (e.g., "Customer communications")

### 4. Add OpenAI API Key

1. Get API key from [platform.openai.com](https://platform.openai.com)
2. Open "Gmail Labeler Parameters" sheet
3. Replace "API_KEY" with your actual key

### 5. Set Up Triggers

In Google Apps Script, click clock icon ("Triggers"):

**Email Organization:**
- Function: `classifyAndLabelEmails`
- Event source: Time-driven
- Type: Minutes timer
- Every: 1 hour

**Optional - Daily Summaries:**
- Function: `generateEmailSummary` 
- Event source: Time-driven
- Type: Day timer
- Time: 6am-7am

### 6. Test

Run `classifyAndLabelEmails` function to test email organization.

**Optional: Test summaries**
- Run `generateEmailSummary` to test summary emails

## Configuration Parameters

Edit in "Gmail Labeler Parameters" sheet:

**Main Parameters:**
- `emailCount`: Emails processed per run (default: 10)
- `maxWords`: Max words sent to AI per email (default: 1000)
- `model`: OpenAI model (default: gpt-4o)

**Optional Summary Parameters:**
- `summary_emails`: Email addresses for summaries (default: your email)
- `summary_days`: Days back to include (default: 3)
- `summary_count`: Max emails per label (default: 20)
- `summary_time_minutes`: Target listening duration (default: 20)
- `summary_prompt`: AI instructions for summaries

## Cost

- Email organization: ~$0.001 per email ($3-10/month typical)
- Optional summaries: ~$0.01-0.05 per summary (~$1-5/month additional)

## Troubleshooting

**No emails organized:**
- Check OpenAI API key is valid and has billing enabled
- Verify permissions granted to script

**Script errors:**
- Check "Executions" tab in Google Apps Script for detailed logs

**Summary issues (if using summaries):**
- Check `summary_emails` parameter is set
- Verify you have emails in configured labels

## How It Works

1. Reads configuration from Google Sheets
2. Fetches recent emails from Gmail  
3. Sends email content to OpenAI for classification
4. Applies labels to emails
5. Marks processed emails to avoid reprocessing
6. Optionally generates and sends summary emails
