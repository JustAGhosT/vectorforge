# Environment Setup Guide

This document outlines the required GitHub secrets and environment variables needed to run VectorForge with AI optimization features.

## Required GitHub Secrets

VectorForge uses AI-powered image analysis to provide intelligent SVG conversion recommendations. To enable this functionality, you need to configure the following GitHub secrets:

### OpenAI API Configuration

The application uses OpenAI's GPT-4o model through the Spark LLM API for intelligent image analysis and optimization suggestions.

#### Required Secrets

| Secret Name | Description | How to Obtain |
|------------|-------------|---------------|
| `OPENAI_API_KEY` | Your OpenAI API key for GPT-4o access | 1. Go to [platform.openai.com](https://platform.openai.com)<br>2. Navigate to API Keys section<br>3. Create a new secret key<br>4. Copy the key immediately (it won't be shown again) |

#### Setting Up GitHub Secrets

1. Navigate to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secret:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-`)
5. Click **Add secret**

## Alternative: Azure AI Foundry Configuration

If you're using Azure AI Foundry instead of OpenAI directly, configure these secrets:

| Secret Name | Description | How to Obtain |
|------------|-------------|---------------|
| `AZURE_OPENAI_ENDPOINT` | Your Azure OpenAI endpoint URL | Available in Azure Portal under your Azure OpenAI resource |
| `AZURE_OPENAI_API_KEY` | Your Azure OpenAI API key | Found in Azure Portal under Keys and Endpoint section |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Deployment name for GPT-4o | The name you assigned when deploying the model |

### Setting Up Azure AI Foundry

1. Create an Azure OpenAI resource in the [Azure Portal](https://portal.azure.com)
2. Deploy the GPT-4o model
3. Copy your endpoint URL and API key
4. Add these as GitHub secrets following the same process above

## Environment Variables (Local Development)

For local development, create a `.env` file in the project root:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-api-key-here

# OR for Azure AI Foundry
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-azure-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
```

> **⚠️ Important**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

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
- [Spark Runtime SDK Documentation](https://github.com/github/spark)
