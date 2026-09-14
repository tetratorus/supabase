import { describe, expect, it } from 'vitest'

import { INVOCATION_TABS } from '@/components/interfaces/Functions/EdgeFunctionDetails/EdgeFunctionDetails.constants'

const curlTab = INVOCATION_TABS.find((tab) => tab.id === 'curl')!

const functionUrl = 'https://project.supabase.co/functions/v1/hello-world'

const getCurlCommand = ({
  apiKey,
  isPublishableKey,
  showKey = false,
}: {
  apiKey: string
  isPublishableKey: boolean
  showKey?: boolean
}) =>
  curlTab.code({
    showKey,
    apiKey,
    isPublishableKey,
    functionUrl,
    functionName: 'hello-world',
  })

const expectedCommand = (authHeader: string) => `curl -L -X POST '${functionUrl}' \\
  -H '${authHeader}' \\
  -H 'Content-Type: application/json' \\
  --data '{"name":"Functions"}'`

describe('curl invocation example', () => {
  it('sends a publishable key on the apikey header', () => {
    expect(getCurlCommand({ apiKey: 'sb_publishable_abc', isPublishableKey: true })).toBe(
      expectedCommand('apikey: SUPABASE_PUBLISHABLE_KEY')
    )
  })

  it('sends a legacy anon key as a bearer token', () => {
    expect(getCurlCommand({ apiKey: 'eyJhbGciOiJIUzI1NiJ9.anon', isPublishableKey: false })).toBe(
      expectedCommand('Authorization: Bearer SUPABASE_ANON_KEY')
    )
  })

  it('reveals the key value when the key is shown', () => {
    expect(
      getCurlCommand({ apiKey: 'sb_publishable_abc', isPublishableKey: true, showKey: true })
    ).toBe(expectedCommand('apikey: sb_publishable_abc'))
    expect(
      getCurlCommand({
        apiKey: 'eyJhbGciOiJIUzI1NiJ9.anon',
        isPublishableKey: false,
        showKey: true,
      })
    ).toBe(expectedCommand('Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.anon'))
  })
})
