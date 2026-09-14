import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'

import { del, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

const DeletedObjectsSchema = z.array(z.object({ name: z.string() }))

/**
 * Deleting objects succeeds with a 200 even when storage policies prevent some of the paths from
 * being deleted - the response only lists the objects that were actually deleted. Returns the
 * requested paths that storage did not delete, or none when the response omits the object list.
 */
export const getUndeletedPaths = (paths: string[], data: unknown) => {
  const deletedObjects = DeletedObjectsSchema.safeParse(data)
  if (!deletedObjects.success) return []

  const deletedPaths = new Set(deletedObjects.data.map((object) => object.name))
  return paths.filter((path) => !deletedPaths.has(path))
}

type DeleteBucketObjectParams = {
  projectRef: string
  bucketId?: string
  paths: string[]
}
export const deleteBucketObject = async (
  { projectRef, bucketId, paths }: DeleteBucketObjectParams,
  signal?: AbortSignal
) => {
  if (!bucketId) throw new Error('bucketId is required')

  const { data, error } = await del('/platform/storage/{ref}/buckets/{id}/objects', {
    params: {
      path: {
        ref: projectRef,
        id: bucketId,
      },
    },
    body: {
      paths,
    },
    signal,
  })

  if (error) handleError(error)
  return data
}

type BucketObjectDeleteData = Awaited<ReturnType<typeof deleteBucketObject>>

export const useBucketObjectDeleteMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<BucketObjectDeleteData, ResponseError, DeleteBucketObjectParams>,
  'mutationFn'
> = {}) => {
  return useMutation<BucketObjectDeleteData, ResponseError, DeleteBucketObjectParams>({
    mutationFn: (vars) => deleteBucketObject(vars),
    async onSuccess(data, variables, context) {
      // [Joshen] TODO figure out what queries to invalidate
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to delete bucket object: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
