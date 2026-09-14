import crypto from 'crypto-js'

import {
  ENCRYPTION_KEY,
  POSTGRES_DATABASE,
  POSTGRES_HOST,
  POSTGRES_PASSWORD,
  POSTGRES_PASSWORD_READ_ONLY,
  POSTGRES_PORT,
  POSTGRES_USER_READ_ONLY,
  POSTGRES_USER_READ_WRITE,
} from './constants'
import { IS_PLATFORM } from '@/lib/constants'

/**
 * Asserts that the current environment is self-hosted.
 */
export function assertSelfHosted() {
  if (IS_PLATFORM) {
    throw new Error('This function can only be called in self-hosted environments')
  }
}

export function encryptString(stringToEncrypt: string): string {
  return crypto.AES.encrypt(stringToEncrypt, ENCRYPTION_KEY).toString()
}

export const READ_ONLY_PASSWORD_NOT_CONFIGURED_MESSAGE =
  'Read-only database access is not configured. Set POSTGRES_PASSWORD_READ_ONLY to a password for the read-only role to enable it.'

export function getConnectionString({ readOnly }: { readOnly: boolean }) {
  if (readOnly) {
    if (!POSTGRES_PASSWORD_READ_ONLY) {
      throw new Error(READ_ONLY_PASSWORD_NOT_CONFIGURED_MESSAGE)
    }
    return `postgresql://${POSTGRES_USER_READ_ONLY}:${POSTGRES_PASSWORD_READ_ONLY}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}`
  }

  return `postgresql://${POSTGRES_USER_READ_WRITE}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DATABASE}`
}
