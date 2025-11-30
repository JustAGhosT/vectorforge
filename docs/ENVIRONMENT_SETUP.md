# Environment Setup Guide

This document provides **detailed step-by-step instructions** for setting up VectorForge credentials. Follow these instructions exactly.

---

## 🎯 Quick Summary: What You Need

VectorForge needs **3 things** from Azure to use AI features:
1. **Endpoint URL** - looks like `https://something.openai.azure.com/`
2. **API Key** - a long string of random characters
3. **Deployment Name** - the name you gave your model (e.g., `gpt-4o`)

---

## 📁 LOCAL DEVELOPMENT SETUP (Step-by-Step)

### Step 1: Create the `.env` file

1. Open your terminal/command prompt
2. Navigate to the VectorForge project folder:
   ```bash
   cd vectorforge
   ```
3. Create a new file called `.env` (note the dot at the beginning):
   
   **On Mac/Linux:**
   ```bash
   touch .env
   ```
   
   **On Windows (Command Prompt):**
   ```cmd
   type nul > .env
   ```
   
   **On Windows (PowerShell):**
   ```powershell
   New-Item -Path .env -ItemType File
   ```
   
   **Or just use your code editor:**
   - Right-click in the project folder
   - Create new file
   - Name it exactly: `.env` (with the dot!)

### Step 2: Copy this EXACT content into your `.env` file

Open the `.env` file in any text editor and paste this:

```bash
AZURE_AI_ENDPOINT=PASTE_YOUR_ENDPOINT_HERE
AZURE_SECRET_KEY=PASTE_YOUR_API_KEY_HERE
AZURE_AI_DEPLOYMENT_NAME=PASTE_YOUR_DEPLOYMENT_NAME_HERE
```

### Step 3: Get your Azure credentials and paste them in

Replace the placeholder values with your actual credentials:

| Replace this... | With... | Example |
|-----------------|---------|---------|
| `PASTE_YOUR_ENDPOINT_HERE` | Your Azure endpoint URL | `https://myresource.openai.azure.com/` |
| `PASTE_YOUR_API_KEY_HERE` | Your Azure API key | `abc123def456ghi789...` |
| `PASTE_YOUR_DEPLOYMENT_NAME_HERE` | Your model deployment name | `gpt-4o` |

**Your final `.env` file should look like this:**
```bash
AZURE_AI_ENDPOINT=https://myresource.openai.azure.com/
AZURE_SECRET_KEY=abc123def456ghi789jkl012mno345pqr678
AZURE_AI_DEPLOYMENT_NAME=gpt-4o
```

### Step 4: Restart your development server

After saving the `.env` file:
1. Stop the server (press `Ctrl+C` in the terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

---

## 🔑 WHERE TO FIND YOUR AZURE CREDENTIALS

### Finding Your Endpoint URL

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for **"Azure OpenAI"** in the search bar
3. Click on your Azure OpenAI resource
4. In the left sidebar, click **"Keys and Endpoint"**
5. Copy the **Endpoint** URL (it looks like `https://your-resource-name.openai.azure.com/`)

<!-- The endpoint and key are found in the "Keys and Endpoint" section of your Azure OpenAI resource -->

### Finding Your API Key

1. On the same **"Keys and Endpoint"** page
2. Copy either **KEY 1** or **KEY 2** (both work)
3. Click the copy button next to the key

### Finding Your Deployment Name

1. In your Azure OpenAI resource
2. Click **"Model deployments"** in the left sidebar (or go to Azure AI Studio)
3. Look for the **Name** column - this is your deployment name
4. If you deployed GPT-4o, it might be named `gpt-4o` or whatever you called it during deployment

---

## 🌐 GITHUB SECRETS SETUP (For CI/CD Deployment)

If you want to deploy VectorForge automatically via GitHub Actions:

### Step 1: Go to your repository settings

1. Open your GitHub repository
2. Click **Settings** (tab at the top)
3. In the left sidebar, click **Secrets and variables**
4. Click **Actions**

### Step 2: Add each secret

Click **"New repository secret"** and add these one by one:

| Name (copy exactly) | Value |
|---------------------|-------|
| `AZURE_AI_ENDPOINT` | Your endpoint URL (e.g., `https://myresource.openai.azure.com/`) |
| `AZURE_SECRET_KEY` | Your API key |
| `AZURE_AI_DEPLOYMENT_NAME` | Your deployment name (e.g., `gpt-4o`) |
| `NETLIFY_AUTH_TOKEN` | Your Netlify personal access token |
| `NETLIFY_SITE_ID` | Your Netlify site ID |

---

## ⚠️ COMMON MISTAKES (AND HOW TO FIX THEM)

### ❌ Mistake 1: Wrong file name
- **Wrong:** `env`, `.env.txt`, `.env.local`
- **Correct:** `.env` (exactly this, with the dot, no extension)

### ❌ Mistake 2: Spaces around the equals sign
- **Wrong:** `AZURE_AI_ENDPOINT = https://...`
- **Correct:** `AZURE_AI_ENDPOINT=https://...` (no spaces!)

### ❌ Mistake 3: Quotes around values
- **Wrong:** `AZURE_AI_ENDPOINT="https://..."`
- **Correct:** `AZURE_AI_ENDPOINT=https://...` (no quotes needed)

### ❌ Mistake 4: Extra trailing slash issues
- **Both work:** `https://myresource.openai.azure.com/` or `https://myresource.openai.azure.com`
- The app handles both formats automatically

### ❌ Mistake 5: Forgetting to restart the server
- After changing `.env`, you MUST restart the dev server
- Press `Ctrl+C` to stop, then `npm run dev` to start again

### ❌ Mistake 6: File in wrong location
- The `.env` file must be in the **root** of the project (same folder as `package.json`)
- **Wrong:** `vectorforge/src/.env`
- **Correct:** `vectorforge/.env`

---

## ✅ VERIFICATION: How to Check If It's Working

1. Start your dev server: `npm run dev`
2. Open the app in your browser
3. Upload any image
4. Click the **"AI Optimize"** button
5. If configured correctly, you'll see AI suggestions appear
6. If not configured, you'll see an error message

---

## 🆘 STILL NOT WORKING?

### Check 1: File exists and is readable
```bash
# In terminal, from project root:
cat .env
```
You should see your credentials printed out.

### Check 2: No typos in variable names
The variable names must be EXACTLY:
- `AZURE_AI_ENDPOINT`
- `AZURE_SECRET_KEY`
- `AZURE_AI_DEPLOYMENT_NAME`

### Check 3: API key is valid
- Make sure you copied the full key
- Try regenerating a new key in Azure Portal

### Check 4: Deployment exists
- Make sure you actually deployed a model in Azure AI Studio
- The deployment name must match exactly what you put in `.env`

---

## 📋 COMPLETE EXAMPLE `.env` FILE

Here's exactly what a working `.env` file looks like:

```bash
# VectorForge Environment Configuration
# =====================================
# Copy this file and replace the values with your actual credentials

# Azure OpenAI Settings (all 3 are required)
AZURE_AI_ENDPOINT=https://my-openai-resource.openai.azure.com/
AZURE_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AZURE_AI_DEPLOYMENT_NAME=gpt-4o
```

Save this as `.env` in your project root folder and you're done!

## Features Requiring AI Configuration

The following features require proper AI configuration:

### AI Optimizer
- **What it does**: Analyzes uploaded images and suggests optimal SVG conversion settings
- **Triggered by**: Clicking the "AI Optimize" button in the Settings Panel
- **Models used**: GPT-4o for intelligent analysis
- **Fallback**: If AI is unavailable, the app will use local heuristic analysis only

### How It Works

1. **Local Analysis**: First, the app performs local image analysis to gather:
   - Dominant colors and color count
   - Image complexity level
   - Transparency detection
   - Dimensions and aspect ratio

2. **AI Analysis**: The local data is sent to GPT-4o along with current settings to receive:
   - Image type classification (photo, logo, icon, etc.)
   - Optimal conversion settings recommendations
   - Quality estimation
   - Potential warnings

3. **User Review**: Suggestions are displayed in an AI Suggestion Card where users can:
   - Review the reasoning
   - Apply recommended settings automatically
   - Dismiss suggestions

## Verification

To verify your setup is working:

1. Start the development server: `npm run dev`
2. Upload an image to VectorForge
3. Click the **"AI Optimize"** button in the Settings Panel
4. You should see:
   - Loading state while analysis runs
   - AI Suggestion Card with recommendations
   - Toast notification confirming analysis completion

If you see errors:
- Check that your API key is correctly set
- Verify you have sufficient API credits/quota
- Check browser console for detailed error messages

## Cost Considerations

### OpenAI Pricing (as of 2024)
- **GPT-4o**: ~$0.005 per image analysis
- Each analysis requires sending image metadata (not the full image)
- Typical usage: 100 analyses ≈ $0.50

### Azure AI Foundry
- Pricing varies based on your Azure subscription
- Check [Azure OpenAI Pricing](https://azure.microsoft.com/en-us/pricing/details/cognitive-services/openai-service/) for current rates

## Security Best Practices

1. **Never hardcode API keys** in your source code
2. **Rotate keys regularly** (every 90 days recommended)
3. **Use separate keys** for development and production
4. **Monitor usage** through OpenAI or Azure dashboards
5. **Set spending limits** in your OpenAI/Azure account to prevent unexpected charges
6. **Use environment-specific secrets** in GitHub Actions workflows

## Troubleshooting

### "Failed to analyze image with AI"

**Possible causes**:
- API key not configured or invalid
- API quota exceeded
- Network connectivity issues
- Rate limiting

**Solutions**:
1. Verify API key is correctly set in GitHub secrets
2. Check OpenAI/Azure dashboard for quota status
3. Review API key permissions and validity
4. Check for typos in secret names

### AI Suggestions Not Appearing

**Possible causes**:
- Secrets not properly configured
- API call failing silently
- Browser blocking requests

**Solutions**:
1. Open browser developer console and check for errors
2. Verify network tab shows API requests completing
3. Check that secrets match exact names specified above
4. Restart the development server after adding secrets

## Support

For issues related to:
- **OpenAI API**: [OpenAI Support](https://help.openai.com)
- **Azure AI Foundry**: [Azure Support](https://azure.microsoft.com/en-us/support/)
- **VectorForge Application**: Check GitHub Issues or create a new issue

## Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Azure OpenAI Service Documentation](https://learn.microsoft.com/en-us/azure/ai-services/openai/)
- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Azure OpenAI REST API Reference](https://learn.microsoft.com/en-us/azure/ai-services/openai/reference)
