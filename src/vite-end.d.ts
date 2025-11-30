/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly AZURE_AI_ENDPOINT: string
  readonly AZURE_SECRET_KEY: string
  readonly AZURE_AI_DEPLOYMENT_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
