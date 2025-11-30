/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AZURE_AI_ENDPOINT: string
  readonly VITE_AZURE_SECRET_KEY: string
  readonly VITE_AZURE_AI_DEPLOYMENT_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
