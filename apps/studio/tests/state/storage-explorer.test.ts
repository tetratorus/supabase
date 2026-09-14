import { HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import type { StorageItem } from '@/components/interfaces/Storage/Storage.types'
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

const mockListObjects = () => {
  const searches: (string | undefined)[] = []

  addAPIMock({
    method: 'post',
    path: '/platform/storage/:ref/buckets/:id/objects/list',
    response: async ({ request }) => {
      const body = (await request.json()) as { options?: { search?: string } }
      searches.push(body.options?.search)
      return HttpResponse.json([])
    },
  })

  return searches
}

describe('refetchAllOpenedFolders', () => {
  it('keeps filtering on the active search string', async () => {
    const searches = mockListObjects()
    const state = createState()
    state.openedFolders = [{ name: 'folder' } as StorageItem]
    state.setItemSearchString('invoice')

    await state.refetchAllOpenedFolders()

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
