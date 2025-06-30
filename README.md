# Gmail Auto-Organizer + Email Summaries

Never waste time sorting through your overflowing inbox again. This tool automatically reads your emails, organizes them into folders, and sends you daily voice-ready summaries perfect for listening while driving.

## What This Does For You

**Problem**: You receive hundreds of emails daily - from clients, vendors, colleagues, personal contacts, and more. Finding important emails wastes precious time, and you never know what urgent matters might be buried in your inbox.

**Solution**: This tool uses artificial intelligence to:
1. **Auto-organize emails** into categories you define (Clients → "Clients" label, Invoices → "Invoices" label, etc.)
2. **Generate daily summaries** of important emails sent to your inbox every morning at 6am
3. **Create driving-friendly summaries** focused on actionable items that need your attention

**Result**: Open Gmail to see emails already organized AND get a concise email summary perfect for listening to while commuting. Spend more time on core work, less time hunting through emails.

## Who This Helps Most

Perfect for anyone receiving 50+ emails per day, especially:
- **Healthcare professionals** managing patient communications, lab results, and administrative emails
- **Business professionals** juggling client communications, vendor emails, and internal messages  
- **Freelancers and consultants** tracking prospects, active projects, and invoicing
- **Busy commuters** who want to stay on top of email during drive time
- **Anyone** overwhelmed by their inbox who wants organized emails AND daily summaries

## What You'll Need

- Your Gmail account (the one you already use)
- An OpenAI account (costs about $3-15/month depending on email volume)
- 45 minutes for initial setup

## Features

### 📧 **Automatic Email Organization**
- Define your own categories (Clients, Vendors, Personal, etc.)
- AI reads each email and sorts it automatically  
- Creates Gmail labels and applies them instantly
- Runs every hour to keep your inbox organized

### 📝 **Daily Email Summaries**  
- Receives a summary email every morning at 6am
- Brief, professional summaries perfect for listening while driving
- Focuses on actionable items and urgent matters
- Covers emails from the last 3 days across all your labels
- Skips pleasantries - gets straight to what needs your attention

## Complete Setup Guide

### Part 1: Initial Setup

#### Step 1: Create Your Google Apps Script Project

1. Go to [script.google.com](https://script.google.com) and sign in with your Gmail account
2. Click "New project" 
3. Give it a name like "Gmail Organizer"
4. Delete any existing code in the editor

#### Step 2: Add the Code Files

1. **Add the main organizer code:**
   - Copy all code from `label.js` (from this project)
   - Paste it into the script editor
   - Save the project (Ctrl+S or Cmd+S)

2. **Add the summary feature:**
   - Click the "+" next to "Files" to add a new file
   - Name it `summary`
   - Copy all code from `summary.js` (from this project)  
   - Paste it into the new file
   - Save the project

#### Step 3: Set Up Your Configuration Sheets

1. In the script editor, find the dropdown that says "Select function"
2. Choose `setupSheets` from the dropdown
3. Click "Run" 
4. **Grant permissions** when prompted (you'll see several authorization screens)
5. Wait for it to complete (check the "Executions" tab if needed)

This creates two Google Sheets that control everything:
- **"Gmail Labeler Labels"** - Your email categories
- **"Gmail Labeler Parameters"** - All settings and configuration

### Part 2: Configure Your Email Categories

#### Step 4: Open Your Labels Sheet

1. **Open Google Sheets** in a new tab: [sheets.google.com](https://sheets.google.com)
2. **Find your Labels sheet**: Look for "Gmail Labeler Labels" in your recent files
3. **Alternative method**: In Google Drive ([drive.google.com](https://drive.google.com)), search for "Gmail Labeler Labels"

#### Step 5: Customize Your Categories

Replace the sample data with your own categories:

- **Column A**: Category name (e.g., "Clients", "Lab Results", "Insurance")  
- **Column B**: Description to help the AI understand (e.g., "Customer communications and inquiries", "Laboratory test results and reports")

**Example categories by profession:**

**For Healthcare Professionals:**
- Patients: Communications from or about patients
- Lab Results: Laboratory tests, pathology reports, diagnostic results  
- Insurance: Insurance companies, claims, authorizations
- Colleagues: Messages from other healthcare professionals

**For Business Professionals:**
- Clients: Customer communications and inquiries
- Vendors: Supplier communications, invoices, orders
- Projects: Project-specific communications
- HR: Human resources, benefits, company announcements

**For Freelancers/Consultants:**
- Prospects: Potential client inquiries
- Active Projects: Current client work
- Invoicing: Payment-related communications
- Marketing: Newsletter, social media, content

**General categories that work for everyone:**
- Admin: Administrative notices, subscriptions, confirmations
- Personal: Non-work related emails
- Other: Everything else (keep this one)

### Part 3: Configure Settings & AI

#### Step 6: Get Your OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com) and create an account
2. **Add a payment method** (required - the free tier isn't sufficient)
3. Go to "API keys" and create a new key
4. **Copy this key** - you'll need it in the next step

#### Step 7: Configure Your Parameters

1. **Open Google Sheets**: [sheets.google.com](https://sheets.google.com)
2. **Find "Gmail Labeler Parameters"** in your recent files
3. **Update these key settings:**

   **Required Settings:**
   - **apiKey**: Replace "API_KEY" with your actual OpenAI key
   - **summary_emails**: Your email address is already filled in (you can add more, separated by commas)

   **Optional Settings to Customize:**
   - **emailCount**: How many emails to process each time (default: 10)
   - **maxWords**: Max words per email sent to AI (default: 1000) - controls costs
   - **summary_days**: How many days back to include in summaries (default: 3)
   - **summary_count**: Max emails per label in summaries (default: 20)
   - **summary_time_minutes**: Target listening duration (default: 20 minutes)
   - **summary_prompt**: Customize the AI instructions for summaries

### Part 4: Test Everything

#### Step 8: Test Email Organization

1. **Back in Google Apps Script**, select `classifyAndLabelEmails` from the function dropdown
2. **Click "Run"**
3. **Check Gmail** - you should see:
   - New labels created on the left sidebar
   - Some recent emails moved into those labels
   - An "ai" label marking processed emails

**What you'll see:** The first run takes a few minutes as it processes multiple emails. Future runs are much faster since they only process new emails.

#### Step 9: Test Email Summaries

1. **In Google Apps Script**, select `generateEmailSummary` from the function dropdown  
2. **Click "Run"**
3. **Check your email** - you should receive a summary email with:
   - Overview of email counts per label
   - Time ranges of recent emails
   - AI-generated summaries focused on actionable items

### Part 5: Make It Automatic

#### Step 10: Set Up Automatic Triggers

1. **In Google Apps Script**, click the **clock icon** ("Triggers") in the left sidebar
2. **Click "Add Trigger"** 

**For Email Organization:**
3. Choose:
   - **Function**: `classifyAndLabelEmails`
   - **Event source**: Time-driven  
   - **Type**: Minutes timer
   - **Every**: 1 hour (recommended)
4. **Save**

**For Daily Summaries:**
5. **Click "Add Trigger"** again
6. Choose:
   - **Function**: `generateEmailSummary`
   - **Event source**: Time-driven
   - **Type**: Day timer  
   - **Time of day**: 6am to 7am
7. **Save**

## Your New Daily Workflow

### **Throughout the Day:**
1. **Emails arrive** as usual
2. **Every hour**, the organizer automatically sorts new emails into labeled folders
3. **Open Gmail** to see emails already organized in the left sidebar

### **Every Morning at 6am:**
4. **Receive a summary email** with key highlights from the last 3 days
5. **Listen while driving/commuting** to stay on top of important matters
6. **Arrive at work** already knowing what needs your attention

### **As Needed:**
7. **Adjust categories** by editing your Google Sheets
8. **Fine-tune settings** in the Parameters sheet

## Cost Breakdown

### OpenAI API Costs:
- **Email Organization**: ~$0.001 per email
- **Daily Summaries**: ~$0.01-0.05 per summary (depending on email volume)

**Monthly totals:**
- **100 emails/day + daily summaries**: ~$5-8/month
- **300 emails/day + daily summaries**: ~$15-20/month  
- **500 emails/day + daily summaries**: ~$25-35/month

### Other Costs:
- **Google Apps Script**: Free
- **Gmail**: Free (or whatever you already pay)
- **Google Sheets**: Free

**Cost Control:** The `maxWords` parameter limits how much text is sent to OpenAI, keeping costs predictable even for very long emails.

## Advanced Configuration

### Google Sheets Access
- **Always access via**: [sheets.google.com](https://sheets.google.com) or [drive.google.com](https://drive.google.com)
- **Sheet names**: "Gmail Labeler Labels" and "Gmail Labeler Parameters"
- **Changes take effect**: Immediately on next script run

### Trigger Management
- **View all triggers**: In Google Apps Script, click the clock icon
- **Monitor execution**: Check the "Executions" tab to see run history and errors
- **Daily limit**: 90 minutes total runtime per day (rarely an issue)

### Summary Customization
Edit these parameters in your "Gmail Labeler Parameters" sheet:
- **summary_prompt**: Customize AI instructions 
- **summary_time_minutes**: Adjust target listening duration
- **summary_days**: Change how far back to look
- **summary_count**: Max emails per category

## Tips for Best Results

### Email Organization:
- **Be specific in descriptions**: "Customer support tickets" vs "work emails"
- **Start simple**: Begin with 4-5 categories, expand later
- **Use attachment context**: AI can see filenames like "invoice.pdf"
- **Check regularly**: Review organized emails for the first week

### Summary Optimization:
- **Perfect for commuting**: Summaries are designed for audio consumption
- **Actionable focus**: AI highlights what needs your attention
- **Time-controlled**: Adjust `summary_time_minutes` for your commute length
- **Multiple recipients**: Add team members to `summary_emails`

## Troubleshooting

### Email Organization Issues:
- **No emails being organized**: Check OpenAI API key has billing enabled
- **Wrong categories**: Make label descriptions more specific in the Labels sheet
- **Missing recent emails**: Check if "ai" label was applied (indicates processing)

### Summary Issues:
- **No summary emails**: Verify `summary_emails` is set in Parameters sheet
- **Empty summaries**: Check if you have emails in your defined labels
- **Too expensive**: Reduce `summary_count` or `maxWords` in Parameters sheet

### General Issues:
- **Script errors**: Check "Executions" tab in Google Apps Script
- **Permission issues**: Re-run authorization if Gmail access is denied
- **Daily limits**: Monitor total execution time in "Executions" tab

### Getting Help:
- **Check execution logs**: "Executions" tab shows detailed error messages
- **Test individual functions**: Run `classifyAndLabelEmails` or `generateEmailSummary` manually
- **Verify sheet access**: Ensure you can open both sheets at [sheets.google.com](https://sheets.google.com)

## Technical Details

### System Architecture:
- **Google Apps Script**: JavaScript runtime connecting Gmail + OpenAI + Sheets
- **Gmail API**: Reads emails, creates labels, sends summaries
- **OpenAI API**: Processes email content for classification and summarization  
- **Google Sheets API**: Stores configuration and parameters

### Processing Logic:
1. **Reads configuration** from Google Sheets
2. **Fetches recent emails** based on your settings
3. **Truncates email content** to `maxWords` limit for cost control
4. **Sends to OpenAI** for classification or summarization
5. **Applies labels** and **sends summaries** automatically
6. **Marks processed emails** to avoid reprocessing

### Security & Privacy:
- **Email content** is sent to OpenAI for processing
- **API keys** stored in private Google Sheets 
- **No permanent storage** - everything processes in real-time
- **Standard Google security** for all data handling

---

**Ready to get started?** Follow the setup guide above and transform your email workflow in under an hour!
