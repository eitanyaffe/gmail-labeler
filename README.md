# Gmail Auto-Organizer

Never waste time sorting through your overflowing inbox again. This tool automatically reads your emails and organizes them into folders (called "labels" in Gmail) based on their content - just like having a smart assistant who never sleeps.

## What This Does For You

**Problem**: You receive hundreds of emails daily - from clients, vendors, colleagues, personal contacts, and more. Finding important emails in this chaos wastes precious time that could be spent on what matters most.

**Solution**: This tool uses artificial intelligence to read each email and automatically sort it into categories you define. For example:
- Client communications → "Clients" label
- Vendor invoices → "Invoices" label  
- Administrative emails → "Admin" label
- Personal emails → "Personal" label
- Everything else → Stays unlabeled

**Result**: Open Gmail and see your emails already organized. Find what you need instantly. Spend more time on your core work, less time hunting through emails.

## Who This Helps Most

This tool is perfect for anyone who receives 50+ emails per day and struggles with email organization. It's particularly valuable for:
- **Healthcare professionals** managing patient communications, lab results, and administrative emails
- **Business professionals** juggling client communications, vendor emails, and internal messages  
- **Freelancers and consultants** tracking prospects, active projects, and invoicing
- **Anyone** overwhelmed by their inbox who wants to find emails faster

## What You'll Need

- Your Gmail account (the one you already use)
- An OpenAI account (costs about $3-10/month depending on email volume)
- 30 minutes for initial setup

## How It Works

1. **You define categories**: Create a simple list of email types you want (e.g., "Patients", "Lab Results", "Insurance", "Personal")
2. **The AI learns your system**: It reads your email categories and understands what belongs where
3. **Automatic sorting**: Every 10 minutes (or however often you choose), it reads new emails and files them appropriately
4. **You see organized email**: Open Gmail to find everything already sorted into the right folders

## Setup Instructions

### Step 1: Set Up the Email Organizer

1. Go to [script.google.com](https://script.google.com) and sign in with your Gmail account
2. Click "New project" and give it a name like "Email Organizer"
3. Delete any existing code and paste in the code from `label.js` (found in this project)
4. Click the save icon and name your project

### Step 2: Create Your Email Categories

1. In the script editor, find the dropdown that says "Select function"
2. Choose "setupSheets" from the dropdown
3. Click "Run" (you'll need to give permissions the first time)
4. This creates two Google Sheets for you to customize

### Step 3: Customize Your Categories

1. Open Google Sheets and look for a sheet called "Gmail Labeler Labels"
2. You'll see sample categories like "dogs", "cats", "god" - replace these with your own:
   - **Column A**: Category name (e.g., "Patients", "Lab Results", "Insurance")
   - **Column B**: Description to help the AI understand (e.g., "Emails from or about patients", "Laboratory test results and reports")

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
- Other: Everything else

### Step 4: Get Your AI Key

1. Go to [platform.openai.com](https://platform.openai.com) and create an account
2. Add a payment method (required - the free tier isn't sufficient)
3. Go to "API keys" and create a new key
4. Copy this key - you'll need it in the next step

### Step 5: Add Your AI Key

1. Open the "Gmail Labeler Parameters" Google Sheet
2. Find the row with "apiKey" and replace "API_KEY" with your actual key from OpenAI
3. Optionally adjust other settings:
   - **emailCount**: How many emails to process each time (default: 10)
   - **model**: The AI model to use (default: gpt-4o is recommended)

### Step 6: Test It

1. Back in the script editor, choose "classifyAndLabelEmails" from the dropdown
2. Click "Run" to test
3. Check your Gmail - you should see new labels created and some emails organized
4. If there are errors, check the "Executions" tab in the script editor

### Step 7: Make It Automatic

1. Click the clock icon ("Triggers") in the script editor
2. Click "Add Trigger"
3. Choose:
   - Function: `classifyAndLabelEmails`
   - Event source: Time-driven
   - Type: Minutes timer
   - Every: 10 minutes (or your preference)
4. Save

## Your New Workflow

1. **Emails arrive** throughout the day as usual
2. **Every 10 minutes** (or your chosen interval), the organizer runs automatically
3. **Open Gmail** to see emails already sorted into labeled folders
4. **Find emails instantly** by clicking on labels in Gmail's left sidebar
5. **Adjust categories** anytime by editing your Google Sheets

## Cost

- **OpenAI**: Approximately $3-10/month depending on email volume (most users fall in the $3-5 range)
- **Google Apps Script**: Free
- **Gmail**: Free (or whatever you already pay)

## Tips for Best Results

- **Be specific in descriptions**: Instead of "work emails", use specific descriptions like "emails from clients about project requirements" or "vendor invoices and purchase orders"
- **Start simple**: Begin with 4-5 categories, add more later if needed
- **Check regularly**: Look at the organized emails for the first week to see if categories need adjustment
- **Use "Other" category**: Don't try to categorize everything - let miscellaneous emails go to "Other"

## Troubleshooting

- **No emails being organized**: Check that your OpenAI API key is correct and has billing enabled
- **Wrong categories**: Edit the descriptions in your Labels sheet to be more specific
- **Too expensive**: Reduce the number of emails processed per run in your Parameters sheet
- **Missing emails**: The tool only processes recent emails; older emails remain untouched

---

## Implementation Details

This system uses Google Apps Script (JavaScript) to connect Gmail with OpenAI's GPT models. When triggered, it:

1. Reads configuration from two Google Sheets:
   - "Gmail Labeler Labels": Contains label names and descriptions
   - "Gmail Labeler Parameters": Contains settings like email count and AI model
2. Fetches recent emails from Gmail based on your settings (either last N emails or emails from last N days)
3. Sends email content to OpenAI's API for classification
4. Creates Gmail labels automatically if they don't exist  
5. Applies appropriate labels to emails
6. Marks processed emails with an "ai" label to avoid reprocessing
7. Handles errors gracefully to prevent breaking your Gmail

**Technical requirements:**
- Google Apps Script environment
- OpenAI API key with billing enabled
- Gmail API access (automatically granted through Apps Script)
- Google Sheets API access (automatically granted through Apps Script)

**Security notes:**
- Your emails are sent to OpenAI for processing
- API key is stored in Google Sheets (keep the Parameters sheet private)
- All processing happens in Google's cloud infrastructure
- No data is stored permanently by this script
