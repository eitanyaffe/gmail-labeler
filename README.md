# Gmail Auto-Organizer

Automatically organizes Gmail emails into labels using AI classification, with optional voice-ready daily summaries.

Useful for professionals, healthcare workers, freelancers, or anyone receiving 50+ emails daily who needs automatic email sorting and intelligent summaries for busy schedules.

## Features

- **Email Organization**: Automatically classifies and labels emails based on configurable categories
- **Voice-Ready Daily Summaries**: Generates intelligent email summaries optimized for listening while driving or commuting
  - Thread-aware conversation flow (understands email conversations)
  - Clickable links to open emails directly in Gmail
  - Adjustable compression levels (detailed to ultra-brief)
  
## Requirements

- Gmail account
- OpenAI API key ($3-15/month depending on usage)

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
- `maxWords`: Max words sent to AI per email (default: 500)
- `model`: OpenAI model (default: gpt-4o)

**Summary Parameters:**
- `summary_emails`: Email addresses for summaries (default: your email)
- `summary_days`: Days back to include (default: 3)
- `summary_count`: Max emails per label (default: 20)
- `summary_time_minutes`: Target listening duration (default: 20)
- `summary_compression`: Detail level - `detailed`/`standard`/`succinct`/`very succinct` (default: standard)
- `summary_prompt`: AI instructions for summaries

## Email Summaries

The summary feature generates voice-ready email summaries sent daily at 6am. Each summary includes clickable links to open emails directly in Gmail.

### Compression Levels

Control summary detail with the `summary_compression` parameter:

- **detailed**: Full context with background information  
  *"John Smith from Marketing sent a detailed project update on Tuesday regarding the Q3 campaign launch, mentioning that the creative assets are behind schedule and requesting a meeting to discuss revised timelines."*

- **standard**: Balanced summary with key information (default)  
  *"John Smith sent a project update on Tuesday about Q3 campaign delays and requested a meeting to discuss timelines."*

- **succinct**: Brief summary focusing on main points  
  *"John Smith: Q3 campaign delayed, wants meeting about timelines."*

- **very succinct**: Ultra-brief, just essential facts  
  *"John: project delayed, meeting needed."*

### Summary Format

Each email includes a `[View]` link to open the thread directly in Gmail:

```
Work: 5 emails (spanning: Monday to Wednesday)

John Smith sent project update on Tuesday about Q3 campaign delays. [View]

Sarah Johnson needs budget approval by Friday for new software licenses. [View]

Personal: 2 emails (last received: Wednesday)

Mom shared photos from weekend trip to Portland. [View]
```

### Advanced Configuration

- **Multiple Recipients**: Add comma-separated emails to `summary_emails`
- **Custom Timeframes**: Adjust `summary_days` (1-7 days recommended)
- **Volume Control**: Set `summary_count` per label to manage length
- **Voice Optimization**: `summary_time_minutes` sets target listening duration

## Cost

- Email organization: ~$0.001 per email ($3-10/month typical)
- Optional summaries: $0.01-0.05 per summary (~$1-5/month additional)

## Troubleshooting

**No emails organized:**
- Check OpenAI API key is valid and has billing enabled
- Verify permissions granted to script

**Script errors:**
- Check "Executions" tab in Google Apps Script for detailed logs

**Summary issues:**
- Check `summary_emails` parameter is set correctly
- Verify you have emails in configured labels from the past few days
- Ensure compression level is one of: `detailed`, `standard`, `succinct`, `very succinct`
- Check "Executions" tab for detailed summary generation logs

## How It Works

1. **Configuration retrieval**: Pulls label definitions and parameters from Google Sheets API
2. **Email ingestion**: Uses Gmail API to fetch unprocessed threads (excludes emails with 'ai' label)
3. **Content preprocessing**: Truncates email bodies to `maxWords` limit, extracts attachment names
4. **AI classification**: Sends structured prompts to OpenAI Chat Completions API with email content
5. **Label application**: Creates Gmail labels via API if missing, applies classifications automatically
6. **State tracking**: Marks processed emails with 'ai' label to prevent redundant API calls
7. **Optional summarization**: Groups emails by thread, processes each conversation separately with OpenAI, applies compression levels, generates clickable Gmail links, formats as HTML email with bold labels

Runs on Google Apps Script runtime with automatic retry handling and error logging. No local storage required.
