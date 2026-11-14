import { tActive as t } from '../i18n'
import type { ApiError } from './types'

const list = (v: unknown) => (Array.isArray(v) ? v.map(String).join(', ') : '')

// User-facing copy for an API error in the active locale; unknown codes show the server message as plain text (API data is never translated).
export function errorMessage(error: ApiError): string {
  switch (error.code) {
    case 'invalid_request':
    case 'not_found':
    case 'method_not_allowed':
    case 'payload_too_large':
    case 'internal_error':
    case 'analyzer_not_selectable':
    case 'job_finished':
    case 'network_error':
      return t(`common.errors.${error.code}`)
    case 'validation_failed': {
      const fields = error.details?.fields
      const lines = fields && typeof fields === 'object' ? Object.entries(fields).map(([path, msg]) => `${path}: ${String(msg)}`) : []
      return lines.length ? t('common.errors.validation_failed_fields', { fields: lines.join('; ') }) : t('common.errors.validation_failed')
    }
    case 'unknown_analyzer':
      return t('common.errors.unknown_analyzer', { ids: list(error.details?.analyzer_ids) || t('common.errors.unknown_value') })
    default:
      return error.message
  }
}
