import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'

import { del, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

const DeletedObjectsSchema = z.array(z.object({ name: z.string() }))

export type DeleteObjectsResult =
  | { status: 'unknown' }
  | { status: 'deleted'; deletedPaths: string[] }
  | { status: 'partial'; deletedPaths: string[]; undeletedPaths: string[] }

/**
 * The generated platform API type declares no response body for this endpoint
 * (`StorageObjectsController_deleteObjects` 200 is `content?: never` in
 * `packages/api-types/types/platform.d.ts`), while storage does return the deleted objects. Parse
 * the unknown response at runtime and report unknown when it cannot be safely interpreted.
 */
export const getDeleteObjectsResult = (paths: string[], data: unknown): DeleteObjectsResult => {
  const deletedObjects = DeletedObjectsSchema.safeParse(data)
  if (!deletedObjects.success) return { status: 'unknown' }

  const deletedNames = new Set(deletedObjects.data.map((object) => object.name))
  const deletedPaths = paths.filter((path) => deletedNames.has(path))
  const undeletedPaths = paths.filter((path) => !deletedNames.has(path))

  // Returned names that match none of the requested paths mean the response isn't keyed the way
  // this assumes, not that every delete failed
  if (deletedNames.size > 0 && deletedPaths.length === 0) return { status: 'unknown' }

  if (undeletedPaths.length === 0) return { status: 'deleted', deletedPaths }
  return { status: 'partial', deletedPaths, undeletedPaths }
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
