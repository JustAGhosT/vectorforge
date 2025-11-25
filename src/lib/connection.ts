export interface ConnectionStatus {
  isOnline: boolean
  lastChecked: number
}

export function checkConnection(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.onLine) {
      resolve(false)
      return
    }

    const timeout = setTimeout(() => {
      resolve(false)
    }, 5000)

    fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
    })
      .then(() => {
        clearTimeout(timeout)
        resolve(true)
      })
      .catch(() => {
        clearTimeout(timeout)
        resolve(false)
      })
  })
}

export function getConnectionErrorMessage(error: unknown): string {
  if (!navigator.onLine) {
    return 'No internet connection detected. Please check your network settings.'
  }

  if (error instanceof Error) {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network error: Unable to complete the request. Check your internet connection.'
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. The server took too long to respond.'
    }
    if (error.message.includes('CORS')) {
      return 'Access blocked by security policy. Please try again.'
    }
    return error.message
  }

  return 'An unexpected error occurred. Please try again.'
}

export function setupConnectionMonitoring(
  onStatusChange: (isOnline: boolean) => void
): () => void {
  const handleOnline = () => onStatusChange(true)
  const handleOffline = () => onStatusChange(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
