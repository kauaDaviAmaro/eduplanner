/**
 * Check if error is a build-time dynamic server usage error
 * These errors are expected during static generation and should not be logged
 */
export function isBuildTimeError(error: any): boolean {
  if (!error) return false
  const message = error.message || error.description || String(error)
  return message.includes('Dynamic server usage') || 
         message.includes('couldn\'t be rendered statically') ||
         message.includes('used `headers`')
}



