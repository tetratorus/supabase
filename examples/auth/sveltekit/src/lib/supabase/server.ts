import { createServerClient } from '@supabase/ssr'
import { getRequestEvent } from '$app/server'
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public'

export function createClient() {
  const event = getRequestEvent()

  return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return event.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        // SvelteKit's cookie API requires an explicit `path`.
        cookiesToSet.forEach(({ name, value, options }) =>
          event.cookies.set(name, value, { ...options, path: '/' })
        )
        if (Object.keys(headers).length > 0) {
          event.setHeaders(headers)
        }
      },
    },
  })
}
