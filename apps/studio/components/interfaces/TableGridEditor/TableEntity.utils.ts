import { ident, literal } from '@supabase/pg-meta'

import { SupaColumn, SupaTable } from '@/components/grid/types'
import { Lint } from '@/data/lint/lint-query'

export const getEntityLintDetails = (
  entityName: string,
  lintName: string,
  lintLevels: ('ERROR' | 'WARN' | 'INFO')[],
  lints: Lint[],
  schema: string
): { hasLint: boolean; count: number; matchingLint: Lint | null } => {
  const matchingLint =
    lints?.find(
      (lint) =>
        lint?.metadata?.name === entityName &&
        lint?.metadata?.schema === schema &&
        lint?.name === lintName &&
        lintLevels.includes(lint?.level)
    ) || null

  return {
    hasLint: matchingLint !== null,
    count: matchingLint ? 1 : 0,
    matchingLint,
  }
}

export const getTablePoliciesUrl = (
  projectRef: string | undefined,
  schema: string | undefined,
  name: string | undefined
): string => {
  return `/project/${projectRef ?? ''}/database/policies?search=${encodeURIComponent(
    name ?? ''
  )}&schema=${encodeURIComponent(schema ?? '')}`
}

/**
 * Format a single row value as a Postgres literal
 *
 * Only NULL, array and JSON types need dedicated handling, everything else can be quoted as a
 * literal given that Postgres implicitly casts to the right type based on the column type
 */
const formatValueForSql = (value: unknown, column: SupaColumn): string => {
  if (value === null || value === undefined) return 'null'

  if (column.dataType === 'ARRAY') {
    const array = Array.isArray(value) ? value : JSON.parse(value as string)
    return formatArrayForSql(array as unknown[])
  }

  // JSON columns come through either as raw JSON text or as an already parsed value
  if (column.format.includes('json')) {
    return literal(typeof value === 'string' ? value : JSON.stringify(value))
  }

  // Booleans are emitted unquoted so the statement stays readable
  if (typeof value === 'boolean') return `${value}`

  return literal(value)
}

export const formatTableRowsToSQL = (table: SupaTable, rows: any[]) => {
  if (rows.length === 0) return ''

  const columns = table.columns.map((col) => ident(col.name)).join(', ')

  // Values are emitted per column rather than per row property, so that the column list and every
  // VALUES tuple always have the same arity even if a row is missing or has extra properties
  const valuesSets = rows
    .map((row) => {
      const values = table.columns.map((col) =>
        Object.prototype.hasOwnProperty.call(row, col.name)
          ? formatValueForSql(row[col.name], col)
          : 'default'
      )
      return `(${values.join(', ')})`
    })
    .join(', ')

  const relation = table.schema
    ? `${ident(table.schema)}.${ident(table.name)}`
    : `${ident(table.name)}`

  return `INSERT INTO ${relation} (${columns}) VALUES ${valuesSets};`
}

/**
 * Generate a random tag for dollar-quoting of SQL strings
 *
 * @return A random tag in the format `$tag$`
 */
const generateRandomTag = (): `$${string}$` => {
  const inner = Math.random().toString(36).substring(2, 15)
  // Ensure the tag starts with a character not a digit to avoid conflicts with
  // Postgres parameter syntax
  return `$x${inner}$`
}

/**
 * Wrap a string in dollar-quote tags, ensuring the tag does not appear in the string
 *
 * @throws Error if unable to generate a unique dollar-quote tag after multiple attempts
 */
const safeDollarQuote = (str: string): string => {
  let tag = generateRandomTag()

  let attempts = 0
  const maxAttempts = 100
  while (str.includes(tag)) {
    if (attempts >= maxAttempts) {
      throw new Error('Unable to generate a unique dollar-quote tag after multiple attempts.')
    }

    attempts++
    tag = generateRandomTag()
  }
  return `${tag}${str}${tag}`
}

const formatArrayForSql = (arr: unknown[]): string => {
  let result = 'ARRAY['

  arr.forEach((item, index) => {
    if (Array.isArray(item)) {
      result += formatArrayForSql(item)
    } else if (typeof item === 'boolean') {
      result += `${item}`
    } else if (!!item && typeof item === 'object') {
      result += `${safeDollarQuote(JSON.stringify(item))}::json`
    } else {
      result += literal(item)
    }

    if (index < arr.length - 1) {
      result += ','
    }
  })

  result += ']'

  return result
}
