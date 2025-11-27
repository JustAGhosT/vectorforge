import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses an LLM error message and extracts a user-friendly message.
 * Handles cases where the error contains HTML (e.g., 404 error pages) or HTTP status codes.
 */
export function parseLLMError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message
    
    // Check if the message contains HTML (e.g., a 404 error page)
    if (message.includes('<!DOCTYPE') || message.includes('<html')) {
      // Extract the title if present
      const titleMatch = message.match(/<title>([^<]*)<\/title>/i)
      if (titleMatch && titleMatch[1]) {
        const title = titleMatch[1].trim()
        return `LLM service error: ${title}`
      }
      return 'LLM service is unavailable. Please try again later.'
    }
    
    // Check for common HTTP error patterns
    if (message.includes('404')) {
      return 'LLM service endpoint not found. The AI service may be temporarily unavailable.'
    }
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return 'LLM service is experiencing issues. Please try again later.'
    }
    if (message.includes('401') || message.includes('403')) {
      return 'LLM service authentication failed. Please check your configuration.'
    }
    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      return 'LLM request timed out. Please try again.'
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('ECONNREFUSED')) {
      return 'Network error: Unable to reach AI service. Check your internet connection.'
    }
    
    // Return cleaned message (truncate if too long)
    if (message.length > 200) {
      return message.substring(0, 200) + '...'
    }
    return message
  }
  
  if (typeof error === 'string') {
    // Check if the string is HTML
    if (error.includes('<!DOCTYPE') || error.includes('<html')) {
      return 'LLM service is unavailable. Please try again later.'
    }
    if (error.length > 200) {
      return error.substring(0, 200) + '...'
    }
    return error
  }
  
  return 'An unexpected error occurred with the AI service.'
}
