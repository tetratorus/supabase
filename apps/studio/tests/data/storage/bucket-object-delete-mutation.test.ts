import { describe, expect, it } from 'vitest'

import { getUndeletedPaths } from '@/data/storage/bucket-object-delete-mutation'

describe('getUndeletedPaths', () => {
  it('returns the paths that are missing from the deleted objects', () => {
    const deletedObjects = [{ name: 'folder/deleted.txt' }]

    expect(getUndeletedPaths(['folder/deleted.txt', 'folder/kept.txt'], deletedObjects)).toEqual([
      'folder/kept.txt',
    ])
  })

  it('returns every path when storage deleted nothing', () => {
    expect(getUndeletedPaths(['folder/kept.txt'], [])).toEqual(['folder/kept.txt'])
  })

  it('returns no paths when every object was deleted', () => {
    const deletedObjects = [{ name: 'folder/deleted.txt' }, { name: 'other.txt' }]

    expect(getUndeletedPaths(['folder/deleted.txt', 'other.txt'], deletedObjects)).toEqual([])
  })

  it('returns no paths when the response does not list deleted objects', () => {
    expect(getUndeletedPaths(['folder/kept.txt'], undefined)).toEqual([])
  })
})
