# Google Translate API Setup Guide

This guide helps you set up Google Cloud Translation API for the Scheme Assistant project.

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account (create one if needed)
3. Create a new project:
   - Click the project dropdown at the top
   - Click "NEW PROJECT"
   - Enter a name (e.g., "scheme-assistant")
   - Click "CREATE"

## Step 2: Enable the Cloud Translation API

1. In the Google Cloud Console, go to APIs & Services → Library
2. Search for "Cloud Translation API"
3. Click on it and then click "ENABLE"

## Step 3: Create API Credentials

### Option A: Using API Key (Simpler)

1. Go to APIs & Services → Credentials
2. Click "Create Credentials" → "API Key"
3. Copy the generated API key
4. Create or edit `.env` file in the project root:
   ```
   GOOGLE_TRANSLATE_API_KEY=your_api_key_here
   ```
5. Save and restart the backend server

### Option B: Using Service Account (More Secure)

1. Go to APIs & Services → Credentials
2. Click "Create Credentials" → "Service Account"
3. Enter a name and click "CREATE AND CONTINUE"
4. Click "CREATE KEY" → "JSON"
5. The `.json` file will download automatically
6. Move the `.json` file to your project directory (e.g., `backend/credentials.json`)
7. Create or edit `.env` file in the project root:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=backend/credentials.json
   ```
8. Save and restart the backend server

## Step 4: Install Dependencies

The translation feature requires the Google Cloud Translation library. Install it:

```bash
pip install -r backend/requirements.txt
```

This will install `google-cloud-translate` if not already installed.

## Step 5: Test the Setup

1. Start the backend:
   ```bash
   uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

3. In the chatbot, send a query and you should see a "Translate" button next to the "Listen" button
4. Click "Translate" to translate the response to Hindi

## Troubleshooting

**"GOOGLE_TRANSLATE_API_KEY environment variable not set"**
- Make sure you've created the `.env` file with the API key
- Restart the backend after adding the API key
- On Windows PowerShell: `$env:GOOGLE_TRANSLATE_API_KEY="your_key_here"`

**Translation endpoint returns 500 error**
- Check that the API key is valid and has Cloud Translation API enabled
- Verify the API key is set correctly in the `.env` file
- Check backend logs for more details

**"google.cloud module not found"**
- Run: `pip install google-cloud-translate`
- Verify it's in `backend/requirements.txt`

## Pricing

Google Cloud Translation API offers:
- Free tier: 500,000 characters per month
- Paid: $15 per 1 million characters after free tier

For a personal/testing setup, the free tier should be sufficient.

## Security Notes

- **Never commit** `.env`, `credentials.json`, or any API key to version control
- The `.env` file is already in `.gitignore`
- For production, use environment variables or secrets management service
- Use Service Account keys (Option B) instead of API keys for production deployments
