import type { ApiError } from './types'

const list = (v: unknown) => (Array.isArray(v) ? v.map(String).join(', ') : '')

// User-facing copy for an API error; unknown codes show the server message as plain text.
export function errorMessage(error: ApiError): string {
  switch (error.code) {
    case 'invalid_request':
      return 'The request was not valid. Check the input and try again.'
    case 'validation_failed': {
      const fields = error.details?.fields
      const lines = fields && typeof fields === 'object' ? Object.entries(fields).map(([path, msg]) => `${path}: ${String(msg)}`) : []
      return lines.length ? `Some fields are not valid: ${lines.join('; ')}` : 'Some fields are not valid.'
    }
    case 'not_found':
      return 'Not found. The analysis may have been removed.'
    case 'method_not_allowed':
      return 'This action is not supported.'
    case 'payload_too_large':
      return 'Content is larger than 1 MiB'
    case 'internal_error':
      return 'Something went wrong on the server. Please try again later.'
    case 'unknown_analyzer':
      return `Unknown analyzer: ${list(error.details?.analyzer_ids) || 'unknown'}.`
    case 'analyzer_not_selectable':
      return 'This analyzer cannot be selected.'
    case 'job_finished':
      return 'This analysis has already finished.'
    case 'network_error':
      return 'Could not reach the backend. Check your connection and try again.'
    default:
      return error.message
  }
}
