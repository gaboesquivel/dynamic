export function getErrorMessage(err: unknown): string | null {
  if (!err) return null
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message
  }
  return String(err)
}
