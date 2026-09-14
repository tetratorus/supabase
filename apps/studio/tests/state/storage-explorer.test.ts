import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import type { StorageItem } from '@/components/interfaces/Storage/Storage.types'
import type { StorageObject } from '@/data/storage/bucket-objects-list-mutation'
import type { Bucket } from '@/data/storage/buckets-query'
import { createStorageExplorerState } from '@/state/storage-explorer'
import { addAPIMock } from '@/tests/lib/msw'

const BUCKET = { id: 'bucket-id', name: 'bucket' } as Bucket

const createState = () =>
  createStorageExplorerState({
    projectRef: 'project-ref',
    connectionString: '',
    bucket: BUCKET,
    resumableUploadUrl: '',
    clientEndpoint: '',
  })

const createObject = (name: string): StorageObject => ({
  id: `${name}-id`,
  name,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  last_accessed_at: '2026-01-01T00:00:00.000Z',
  metadata: { size: 1, mimetype: 'text/plain' },
})

/**
 * Records the `search` of every list request, and optionally holds a response back until the
 * returned gate for that search is released, to order concurrent requests deterministically
 */
const mockListObjects = ({
  objectsBySearch = {},
  gatesBySearch = {},
}: {
  objectsBySearch?: Record<string, string[]>
  gatesBySearch?: Record<string, Promise<void>>
} = {}) => {
  const searches: string[] = []

  addAPIMock({
    method: 'post',
    path: '/platform/storage/:ref/buckets/:id/objects/list',
    response: async ({ request }) => {
      const body = (await request.json()) as { options?: { search?: string } }
      const search = body.options?.search ?? ''
      searches.push(search)
      await gatesBySearch[search]
      return HttpResponse.json<StorageObject[]>(
        (objectsBySearch[search] ?? []).map((name) => createObject(name))
      )
    },
  })

  return searches
}

const createGate = () => {
  let release!: () => void
  const promise = new Promise<void>((resolve) => (release = resolve))
  return { promise, release }
}

describe('refetchAllOpenedFolders', () => {
  it('keeps filtering on the active search string', async () => {
    const searches = mockListObjects()
    const state = createState()
    state.openedFolders = [{ name: 'folder' } as StorageItem]
    state.setSearchString('invoice')

    await state.refetchAllOpenedFolders()

    // One request per column: the bucket root and the opened folder
    expect(searches).toEqual(['invoice', 'invoice'])
  })

  it('lists every object when no search string is set', async () => {
    const searches = mockListObjects()
    const state = createState()
    state.openedFolders = [{ name: 'folder' } as StorageItem]

    await state.refetchAllOpenedFolders()

    expect(searches).toEqual(['', ''])
  })
})

describe('refreshAll', () => {
  it('keeps filtering on the active search string', async () => {
    const searches = mockListObjects()
    const state = createState()
    state.openedFolders = [{ name: 'folder' } as StorageItem]
    state.setSearchString('invoice')

    await state.refreshAll()

    expect(searches).toEqual(['invoice', 'invoice'])
    expect(state.isRefreshing).toBe(false)
  })
})

describe('fetchFoldersByPath', () => {
  it('discards a response from a request that a later one superseded', async () => {
    const staleGate = createGate()
    mockListObjects({
      objectsBySearch: { invoice: ['invoice.txt'], receipt: ['receipt.txt'] },
      gatesBySearch: { invoice: staleGate.promise },
    })
    const state = createState()

    const stale = state.fetchFoldersByPath({ paths: ['folder'], searchString: 'invoice' })
    await state.fetchFoldersByPath({ paths: ['folder'], searchString: 'receipt' })

    staleGate.release()
    await stale

    expect(state.columns.map((column) => column.items.map((item) => item.name))).toEqual([
      ['receipt.txt'],
      ['receipt.txt'],
    ])
  })
})
