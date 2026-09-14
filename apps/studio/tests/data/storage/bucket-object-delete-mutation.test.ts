import { describe, expect, it } from 'vitest'

import { getDeleteObjectsResult } from '@/data/storage/bucket-object-delete-mutation'

describe('getDeleteObjectsResult', () => {
  it('reports partially deleted paths', () => {
    const deletedObjects = [{ name: 'folder/deleted.txt' }]

    expect(
      getDeleteObjectsResult(['folder/deleted.txt', 'folder/kept.txt'], deletedObjects)
    ).toEqual({
      status: 'partial',
      deletedPaths: ['folder/deleted.txt'],
      undeletedPaths: ['folder/kept.txt'],
    })
  })

  it('reports when storage deleted nothing', () => {
    expect(getDeleteObjectsResult(['folder/kept.txt'], [])).toEqual({
      status: 'partial',
      deletedPaths: [],
      undeletedPaths: ['folder/kept.txt'],
    })
  })

  it('reports when every requested object was deleted', () => {
    const deletedObjects = [{ name: 'folder/deleted.txt' }, { name: 'other.txt' }]

    expect(getDeleteObjectsResult(['folder/deleted.txt', 'other.txt'], deletedObjects)).toEqual({
      status: 'deleted',
      deletedPaths: ['folder/deleted.txt', 'other.txt'],
    })
  })

  it('reports an unknown result when the response is unparseable', () => {
    expect(getDeleteObjectsResult(['folder/kept.txt'], undefined)).toEqual({ status: 'unknown' })
  })

  it('reports an unknown result when returned names do not match requested paths', () => {
    expect(getDeleteObjectsResult(['folder/a.txt'], [{ name: 'bucket/folder/a.txt' }])).toEqual({
      status: 'unknown',
    })
  })
})
