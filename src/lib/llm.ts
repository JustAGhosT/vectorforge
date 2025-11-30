/**
 * Azure OpenAI LLM service
 * Replaces the GitHub Spark LLM integration
 */

export interface LLMConfig {
  endpoint: string
  apiKey: string
  deploymentName: string
}

function getConfig(): LLMConfig {
  const endpoint = import.meta.env.AZURE_AI_ENDPOINT
  const apiKey = import.meta.env.AZURE_SECRET_KEY
  const deploymentName = import.meta.env.AZURE_AI_DEPLOYMENT_NAME

  if (!endpoint || !apiKey || !deploymentName) {
    throw new Error('Azure AI configuration missing. Please set AZURE_AI_ENDPOINT, AZURE_SECRET_KEY, and AZURE_AI_DEPLOYMENT_NAME.')
  }

  return { endpoint, apiKey, deploymentName }
}

export function isLLMConfigured(): boolean {
  try {
    getConfig()
    return true
  } catch {
    return false
  }
}

export async function llm(
  prompt: string,
  _modelName?: string, // Ignored - uses deployment from config
  jsonMode?: boolean
): Promise<string> {
  const config = getConfig()

  // Normalize endpoint (remove trailing slash if present)
  const baseEndpoint = config.endpoint.replace(/\/$/, '')
  const url = `${baseEndpoint}/openai/deployments/${config.deploymentName}/chat/completions?api-version=2024-02-01`

  const body: Record<string, unknown> = {
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    max_completion_tokens: 4096,
    temperature: 0.7
  }

  if (jsonMode) {
    body.response_format = { type: 'json_object' }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': config.apiKey
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`${response.status}: ${errorText}`)
  }

  const data = await response.json()

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Invalid response from Azure OpenAI')
  }

  return data.choices[0].message.content
}
