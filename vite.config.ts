import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, type Plugin } from "vite";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

/**
 * Vite plugin to validate required Azure AI environment variables during production builds.
 * This ensures the build fails fast if the AI service is not properly configured.
 * 
 * Set SKIP_AZURE_VALIDATION=true to skip validation (AI features will be disabled at runtime).
 */
function validateAzureEnvPlugin(): Plugin {
  return {
    name: 'validate-azure-env',
    buildStart() {
      console.log('🔍 Validating Azure AI configuration...')

      // Allow skipping validation for deployments that don't need AI features
      if (process.env.SKIP_AZURE_VALIDATION === 'true') {
        console.log('⚠️  Azure AI validation skipped (SKIP_AZURE_VALIDATION=true)')
        console.log('   AI features will be unavailable at runtime.')
        return
      }

      // Only validate during production builds or CI
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
          `To build without AI features, set SKIP_AZURE_VALIDATION=true.\n` +
          `See docs/ENVIRONMENT_SETUP.md for details.`
        )
      }

      // Validate the endpoint URL format (only runs if all required vars are present)
      const endpoint = process.env.AZURE_AI_ENDPOINT!
      if (!endpoint.startsWith('https://')) {
        throw new Error(
          `Build failed: AZURE_AI_ENDPOINT must start with 'https://'. ` +
          `Got: ${endpoint}`
        )
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
