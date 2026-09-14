import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getOpenApiSpecForExposedSchemas, mergeOpenApiSpecs } from './open-api-spec'

vi.mock('./constants', () => ({
  DEFAULT_EXPOSED_SCHEMAS: 'public, custom_schema,graphql_public',
}))

describe('api/self-hosted/open-api-spec', () => {
  describe('mergeOpenApiSpecs', () => {
    it('merges definitions and paths from other schemas into the default spec', () => {
      const merged = mergeOpenApiSpecs(
        {
          swagger: '2.0',
          definitions: { users: { type: 'object' } },
          paths: { '/': {}, '/users': {}, '/rpc/public_fn': {} },
        },
        [
          {
            definitions: { orders: { type: 'object' } },
            paths: { '/': {}, '/orders': {}, '/rpc/custom_fn': {} },
          },
          null,
        ]
      )

      expect(merged.swagger).toBe('2.0')
      expect(Object.keys(merged.definitions ?? {})).toEqual(['users', 'orders'])
      expect(Object.keys(merged.paths ?? {})).toEqual([
        '/',
        '/users',
        '/rpc/public_fn',
        '/orders',
        '/rpc/custom_fn',
      ])
    })

    it('keeps the default schema entity when names collide', () => {
      const merged = mergeOpenApiSpecs(
        { definitions: { users: { description: 'public' } }, paths: {} },
        [{ definitions: { users: { description: 'custom' } }, paths: {} }]
      )

      expect(merged.definitions?.users).toEqual({ description: 'public' })
    })
  })

  describe('getOpenApiSpecForExposedSchemas', () => {
    const fetchMock = vi.fn()

    beforeEach(() => {
      vi.stubGlobal('fetch', fetchMock)
      vi.stubEnv('SUPABASE_URL', 'http://kong:8000')
      vi.stubEnv('SUPABASE_SERVICE_KEY', 'service-key')
    })

    afterEach(() => {
      vi.unstubAllGlobals()
      vi.unstubAllEnvs()
      fetchMock.mockReset()
    })

    it('fetches the default spec plus one spec per additional exposed schema', async () => {
      fetchMock.mockImplementation(async (_url: string, init: RequestInit) => {
        const headers = init.headers as Record<string, string>
        const schema = headers['Accept-Profile']
        if (schema === 'graphql_public') return { ok: false, status: 406 }
        return {
          ok: true,
          json: async () =>
            schema
              ? { definitions: { [`${schema}_table`]: {} }, paths: {} }
              : { swagger: '2.0', definitions: { users: {} }, paths: {} },
        }
      })

      const spec = await getOpenApiSpecForExposedSchemas()

      expect(fetchMock).toHaveBeenCalledTimes(3)
      expect(fetchMock.mock.calls[0][1].headers).toEqual({ apikey: 'service-key' })
      expect(fetchMock.mock.calls[1][1].headers).toEqual({
        apikey: 'service-key',
        'Accept-Profile': 'custom_schema',
      })
      expect(fetchMock.mock.calls[2][1].headers).toEqual({
        apikey: 'service-key',
        'Accept-Profile': 'graphql_public',
      })
      expect(Object.keys(spec?.definitions ?? {})).toEqual(['users', 'custom_schema_table'])
    })

    it('returns null when the default spec cannot be fetched', async () => {
      fetchMock.mockResolvedValue({ ok: false, status: 500 })

      expect(await getOpenApiSpecForExposedSchemas()).toBeNull()
    })
  })
})
