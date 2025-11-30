import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, type Plugin } from "vite";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

/**
 * Validates that the Azure AI endpoint is reachable and properly configured.
 * Makes a lightweight test request to verify the endpoint exists.
 */
async function validateAzureEndpoint(endpoint: string, apiKey: string, deploymentName: string): Promise<void> {
  const baseEndpoint = endpoint.replace(/\/$/, '')
  const url = `${baseEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-01`

  let response: Response
  try {
    // Make a minimal test request to verify the endpoint
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      })
    })
  } catch (error) {
    // Network error - endpoint doesn't exist or is unreachable
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(
      `Azure AI endpoint validation failed: Unable to reach endpoint.\n` +
      `Error: ${errorMessage}\n` +
      `Please verify:\n` +
      `  - AZURE_AI_ENDPOINT is correct: ${endpoint}\n` +
      `  - The endpoint exists and is accessible from this network\n` +
      `  - You have internet connectivity`
    )
  }

  // We expect either a successful response or a rate limit/quota error
  // Both indicate the endpoint exists and credentials are valid
  // 404 means the endpoint or deployment doesn't exist
  // 401/403 means authentication failed
  if (response.status === 404) {
    throw new Error(
      `Azure AI endpoint validation failed: Endpoint or deployment not found (404).\n` +
      `Please verify:\n` +
      `  - AZURE_AI_ENDPOINT is correct: ${endpoint}\n` +
      `  - AZURE_AI_DEPLOYMENT_NAME exists: ${deploymentName}\n` +
      `The deployment may not exist or the endpoint URL may be incorrect.`
    )
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      `Azure AI endpoint validation failed: Authentication failed (${response.status}).\n` +
      `Please verify AZURE_SECRET_KEY is a valid API key for this endpoint.`
    )
  }

  // For other errors (like rate limits 429, server errors 5xx), we'll allow the build
  // since these are transient and don't indicate misconfiguration
  if (response.status >= 500) {
    console.log(`⚠️  Azure AI endpoint returned ${response.status} - service may be temporarily unavailable, but configuration appears valid`)
    return
  }

  // Success or rate limit (which means the endpoint is valid)
  console.log('✅ Azure AI endpoint validated successfully')
}

/**
 * Vite plugin to validate required Azure AI environment variables during production builds.
 * This ensures the build fails fast if the AI service is not properly configured.
 */
function validateAzureEnvPlugin(): Plugin {
  return {
    name: 'validate-azure-env',
    async buildStart() {
      // Only validate during production builds
      if (process.env.NODE_ENV !== 'production' && !process.env.CI) {
        return
      }

      const requiredVars = [
        'AZURE_AI_ENDPOINT',
        'AZURE_SECRET_KEY',
        'AZURE_AI_DEPLOYMENT_NAME'
      ]

      const missing = requiredVars.filter(varName => !process.env[varName])

      if (missing.length > 0) {
        throw new Error(
          `Build failed: Missing required Azure AI environment variables: ${missing.join(', ')}.\n` +
          `Please set these in your environment or CI/CD pipeline.\n` +
          `See docs/ENVIRONMENT_SETUP.md for details.`
        )
      }

      // Validate the endpoint URL format (only runs if all required vars are present)
      const endpoint = process.env.AZURE_AI_ENDPOINT!
      const apiKey = process.env.AZURE_SECRET_KEY!
      const deploymentName = process.env.AZURE_AI_DEPLOYMENT_NAME!

      if (!endpoint.startsWith('https://')) {
        throw new Error(
          `Build failed: AZURE_AI_ENDPOINT must start with 'https://'. ` +
          `Got: ${endpoint}`
        )
      }

      console.log('🔍 Validating Azure AI configuration...')

      // Validate that the endpoint is actually reachable
      try {
        await validateAzureEndpoint(endpoint, apiKey, deploymentName)
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Build failed: ${error.message}`)
        }
        throw error
      }

      console.log('✅ Azure AI configuration validated successfully')
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  envPrefix: ['VITE_', 'AZURE_'],
  plugins: [
    validateAzureEnvPlugin(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-radix': [
            '@radix-ui/react-tabs',
            '@radix-ui/react-slider',
            '@radix-ui/react-dialog',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-dropdown-menu',
          ],
          'vendor-ui': ['framer-motion', 'sonner', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          'vendor-charts': ['recharts', 'd3'],
        }
      }
    }
  },
  worker: {
    format: 'es'
  }
});
