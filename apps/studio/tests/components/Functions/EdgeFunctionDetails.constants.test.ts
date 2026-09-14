import { describe, expect, it } from 'vitest'

import { INVOCATION_TABS } from '@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionDetails.constants'

const curlTab = INVOCATION_TABS.find((tab) => tab.id === 'curl')!

const getCurlCommand = ({ apiKey, showKey = false }: { apiKey: string; showKey?: boolean }) =>
  curlTab.code({
    showKey,
    apiKey,
    functionUrl: 'https://project.supabase.co/functions/v1/hello-world',
    functionName: 'hello-world',
  })

describe('curl invocation example', () => {
  it('sends a publishable key on the apikey header, not as a bearer token', () => {
    const command = getCurlCommand({ apiKey: 'sb_publishable_abc' })

    expect(command).toContain(`-H 'apikey: SUPABASE_PUBLISHABLE_KEY'`)
    expect(command).not.toContain('Authorization')
  })

  it('sends a legacy anon key as a bearer token', () => {
    const command = getCurlCommand({ apiKey: 'eyJhbGciOiJIUzI1NiJ9.anon' })

    expect(command).toContain(`-H 'Authorization: Bearer SUPABASE_ANON_KEY'`)
    expect(command).not.toContain('apikey:')
  })

  it('reveals the key value when the key is shown', () => {
    expect(getCurlCommand({ apiKey: 'sb_publishable_abc', showKey: true })).toContain(
      `-H 'apikey: sb_publishable_abc'`
    )
    expect(getCurlCommand({ apiKey: 'eyJhbGciOiJIUzI1NiJ9.anon', showKey: true })).toContain(
      `-H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.anon'`
    )
  })
})
