import { describe, it, expect } from 'vitest'
import { parseLLMError } from '../lib/utils'

describe('parseLLMError', () => {
  it('should extract title from HTML error page', () => {
    const htmlError = new Error(`404  - <!DOCTYPE html>
<html lang="en">
  <head>
    <title>Page not found</title>
  </head>
  <body>Some content</body>
</html>`)
    
    const result = parseLLMError(htmlError)
    expect(result).toBe('LLM service error: Page not found')
  })

  it('should handle HTML without title', () => {
    const htmlError = new Error(`<!DOCTYPE html><html><body>Error</body></html>`)
    
    const result = parseLLMError(htmlError)
    expect(result).toBe('LLM service is unavailable. Please try again later.')
  })

  it('should handle 404 status in message', () => {
    const error = new Error('Request failed with status 404')
    
    const result = parseLLMError(error)
    expect(result).toBe('LLM service endpoint not found. The AI service may be temporarily unavailable.')
  })

  it('should handle 500 status in message', () => {
    const error = new Error('Request failed with status 500')
    
    const result = parseLLMError(error)
    expect(result).toBe('LLM service is experiencing issues. Please try again later.')
  })

  it('should handle 502 status in message', () => {
    const error = new Error('Request failed with status 502')
    
    const result = parseLLMError(error)
    expect(result).toBe('LLM service is experiencing issues. Please try again later.')
  })

  it('should handle 503 status in message', () => {
    const error = new Error('Request failed with status 503')
    
    const result = parseLLMError(error)
    expect(result).toBe('LLM service is experiencing issues. Please try again later.')
  })

  it('should handle 401 authentication error', () => {
    const error = new Error('Request failed with status 401')
    
    const result = parseLLMError(error)
    expect(result).toBe('LLM service authentication failed. Please check your configuration.')
  })

  it('should handle 403 authentication error', () => {
    const error = new Error('Request failed with status 403')
    
    const result = parseLLMError(error)
    expect(result).toBe('LLM service authentication failed. Please check your configuration.')
  })

  it('should handle timeout errors', () => {
    const error = new Error('Request timeout')
    
    const result = parseLLMError(error)
    expect(result).toBe('LLM request timed out. Please try again.')
  })

  it('should handle ETIMEDOUT errors', () => {
    const error = new Error('ETIMEDOUT')
    
    const result = parseLLMError(error)
    expect(result).toBe('LLM request timed out. Please try again.')
  })

  it('should handle network errors', () => {
    const error = new Error('network connection failed')
    
    const result = parseLLMError(error)
    expect(result).toBe('Network error: Unable to reach AI service. Check your internet connection.')
  })

  it('should handle fetch errors', () => {
    const error = new Error('fetch failed')
    
    const result = parseLLMError(error)
    expect(result).toBe('Network error: Unable to reach AI service. Check your internet connection.')
  })

  it('should handle ECONNREFUSED errors', () => {
    const error = new Error('ECONNREFUSED')
    
    const result = parseLLMError(error)
    expect(result).toBe('Network error: Unable to reach AI service. Check your internet connection.')
  })

  it('should truncate long error messages', () => {
    const longMessage = 'A'.repeat(250)
    const error = new Error(longMessage)
    
    const result = parseLLMError(error)
    expect(result.length).toBe(203) // 200 chars + '...'
    expect(result.endsWith('...')).toBe(true)
  })

  it('should pass through normal error messages', () => {
    const error = new Error('Some normal error')
    
    const result = parseLLMError(error)
    expect(result).toBe('Some normal error')
  })

  it('should handle string errors', () => {
    const result = parseLLMError('A string error')
    expect(result).toBe('A string error')
  })

  it('should handle string HTML errors', () => {
    const result = parseLLMError('<!DOCTYPE html><html></html>')
    expect(result).toBe('LLM service is unavailable. Please try again later.')
  })

  it('should handle unknown error types', () => {
    const result = parseLLMError({ unknown: 'error' })
    expect(result).toBe('An unexpected error occurred with the AI service.')
  })

  it('should handle null error', () => {
    const result = parseLLMError(null)
    expect(result).toBe('An unexpected error occurred with the AI service.')
  })

  it('should handle undefined error', () => {
    const result = parseLLMError(undefined)
    expect(result).toBe('An unexpected error occurred with the AI service.')
  })
})
