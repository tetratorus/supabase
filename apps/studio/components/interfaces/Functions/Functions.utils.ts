export const isNewApiKey = (apiKey: string) =>
  apiKey.startsWith('sb_secret_') || apiKey.startsWith('sb_publishable_')

export const isPublishableApiKey = (apiKey: string) => apiKey.startsWith('sb_publishable_')

/**
 * Publishable and secret keys are not JWTs, so they belong on `apikey`. Legacy anon and service
 * role keys are JWTs and are sent as bearer tokens.
 * https://supabase.com/docs/guides/functions/auth-headers
 */
export const buildEdgeFunctionAuthHeader = ({
  keyValue,
  isNewKey,
}: {
  keyValue: string
  isNewKey: boolean
}) =>
  isNewKey
    ? { name: 'apikey', value: keyValue }
    : { name: 'Authorization', value: `Bearer ${keyValue}` }

export const getEdgeFunctionAuthHeader = (apiKey: string) =>
  buildEdgeFunctionAuthHeader({ keyValue: apiKey, isNewKey: isNewApiKey(apiKey) })

/**
 * The same header rendered for cURL examples, where the value may be a placeholder such as
 * SUPABASE_PUBLISHABLE_KEY rather than the key itself.
 */
export const formatEdgeFunctionAuthHeader = (params: { keyValue: string; isNewKey: boolean }) => {
  const { name, value } = buildEdgeFunctionAuthHeader(params)
  return `${name}: ${value}`
}
