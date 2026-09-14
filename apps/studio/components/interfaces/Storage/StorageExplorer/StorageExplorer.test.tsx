import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { StorageExplorer } from './StorageExplorer'
import type { StorageObject } from '@/data/storage/bucket-objects-list-mutation'
import { StorageExplorerStateContextProvider } from '@/state/storage-explorer'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ProjectDetailResponse = components['schemas']['ProjectDetailResponse_Output']
type ProjectSettingsResponse = components['schemas']['ProjectSettingsResponse_Output']
type StorageBucketResponse = components['schemas']['StorageBucketResponse_Output']

vi.mock('common', async (importOriginal: any) => {
  const actual = await importOriginal()
  return {
    ...(typeof actual === 'object' ? actual : {}),
    useParams: () => ({ ref: 'default', bucketId: 'bucket-id' }),
  }
})

const OBJECT_NAMES = ['invoice-keep.txt', 'other.txt']

const createObject = (name: string): StorageObject => ({
  id: `${name}-id`,
  name,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  last_accessed_at: '2026-01-01T00:00:00.000Z',
  metadata: { size: 1, mimetype: 'text/plain' },
})

const mockStorageExplorer = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () =>
      HttpResponse.json<ProjectDetailResponse>({
        id: 1,
        ref: 'default',
        name: 'Default',
        organization_id: 1,
        cloud_provider: 'AWS',
        region: 'us-east-1',
        status: 'ACTIVE_HEALTHY',
        db_host: 'db.default.supabase.co',
        restUrl: 'https://default.supabase.co/rest/v1/',
        inserted_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        subscription_id: 'sub_123',
        is_branch_enabled: false,
        is_physical_backups_enabled: false,
        high_availability: false,
        integration_source: null,
        connectionString: 'postgresql://postgres@localhost:5432/postgres',
      }),
  })

  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/settings',
    response: () =>
      HttpResponse.json<ProjectSettingsResponse>({
        app_config: {
          db_schema: 'public',
          endpoint: 'default.supabase.co',
          storage_endpoint: 'default.supabase.co/storage',
        },
        cloud_provider: 'AWS',
        db_dns_name: 'db.default.supabase.co',
        db_host: 'db.default.supabase.co',
        db_name: 'postgres',
        db_port: 5432,
        db_user: 'postgres',
        inserted_at: '2026-01-01T00:00:00.000Z',
        name: 'Default',
        ref: 'default',
        region: 'us-east-1',
        ssl_enforced: false,
        status: 'ACTIVE_HEALTHY',
      }),
  })

  addAPIMock({
    method: 'get',
    path: '/platform/storage/:ref/buckets/:id',
    response: () =>
      HttpResponse.json<StorageBucketResponse>({
        id: 'bucket-id',
        name: 'bucket',
        owner: '',
        public: false,
        type: 'STANDARD',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }),
  })

  const searches: string[] = []

  addAPIMock({
    method: 'post',
    path: '/platform/storage/:ref/buckets/:id/objects/list',
    response: async ({ request }) => {
      const body = (await request.json()) as { options?: { search?: string } }
      const search = body.options?.search ?? ''
      searches.push(search)
      return HttpResponse.json<StorageObject[]>(
        OBJECT_NAMES.filter((name) => name.includes(search)).map(createObject)
      )
    },
  })

  return searches
}

describe('StorageExplorer', () => {
  it('keeps the search filter applied when the explorer refetches', async () => {
    const searches = mockStorageExplorer()

    customRender(
      <StorageExplorerStateContextProvider>
        <StorageExplorer />
      </StorageExplorerStateContextProvider>
    )

    await waitFor(() => expect(searches).toEqual(['']))

    await userEvent.type(await screen.findByPlaceholderText(/Search/i), 'invoice')

    // The search is debounced, so the request only goes out once typing settles
    await waitFor(() => expect(searches.at(-1)).toBe('invoice'), { timeout: 2000 })

    searches.length = 0
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }))

    await waitFor(() => expect(searches).toEqual(['invoice']))
  })
})
