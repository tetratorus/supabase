import { DEFAULT_EXPOSED_SCHEMAS } from './constants'

export type OpenApiSpec = {
  definitions?: Record<string, unknown>
  paths?: Record<string, unknown>
  [key: string]: unknown
}

async function fetchOpenApiSpec(schema?: string): Promise<OpenApiSpec | null> {
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
    method: 'GET',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_KEY!,
      ...(schema ? { 'Accept-Profile': schema } : {}),
    },
  })
  if (!response.ok) return null
  return (await response.json()) as OpenApiSpec
}

/**
 * Merges the definitions and paths of additional schema specs into the default
 * schema spec. Entities from the default schema take precedence when names collide.
 */
export function mergeOpenApiSpecs(
  defaultSpec: OpenApiSpec,
  otherSpecs: (OpenApiSpec | null)[]
): OpenApiSpec {
  const definitions: Record<string, unknown> = { ...defaultSpec.definitions }
  const paths: Record<string, unknown> = { ...defaultSpec.paths }

  for (const spec of otherSpecs) {
    if (!spec) continue
    for (const [name, definition] of Object.entries(spec.definitions ?? {})) {
      if (!(name in definitions)) definitions[name] = definition
    }
    for (const [path, value] of Object.entries(spec.paths ?? {})) {
      if (!(path in paths)) paths[path] = value
    }
  }

  return { ...defaultSpec, definitions, paths }
}

/**
 * PostgREST only returns the OpenAPI spec for the default (first) exposed schema
 * unless an `Accept-Profile` header is sent. Fetch the spec for every schema in
 * PGRST_DB_SCHEMAS and merge them so tables and functions from all exposed
 * schemas appear in the API docs.
 *
 * _Only call this from server-side self-hosted code._
 */
export async function getOpenApiSpecForExposedSchemas(): Promise<OpenApiSpec | null> {
  const schemas = DEFAULT_EXPOSED_SCHEMAS.split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  const [defaultSpec, ...otherSpecs] = await Promise.all([
    fetchOpenApiSpec(),
    ...schemas.slice(1).map((schema) => fetchOpenApiSpec(schema)),
  ])

  if (!defaultSpec) return null
  return mergeOpenApiSpecs(defaultSpec, otherSpecs)
}
