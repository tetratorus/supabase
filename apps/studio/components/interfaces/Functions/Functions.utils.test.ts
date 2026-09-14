import { describe, expect, it } from 'vitest'

import { formatEdgeFunctionAuthHeader, isPublishableApiKey } from './Functions.utils'

describe('isPublishableApiKey', () => {
  it('only matches the publishable key prefix', () => {
    expect(isPublishableApiKey('sb_publishable_abc')).toBe(true)
    expect(isPublishableApiKey('sb_secret_abc')).toBe(false)
    expect(isPublishableApiKey('my-publishable-key')).toBe(false)
  })
})

describe('formatEdgeFunctionAuthHeader', () => {
  it('puts new keys on apikey and legacy keys on Authorization', () => {
    expect(formatEdgeFunctionAuthHeader({ keyValue: 'sb_publishable_abc', isNewKey: true })).toBe(
      'apikey: sb_publishable_abc'
    )
    expect(formatEdgeFunctionAuthHeader({ keyValue: 'anon-jwt', isNewKey: false })).toBe(
      'Authorization: Bearer anon-jwt'
    )
  })
})
