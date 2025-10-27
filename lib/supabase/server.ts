import { cache } from "react"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const getSupabaseServerClient = cache(() => {
  const cookieStore = cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.then((cookieStore) => cookieStore.getAll())
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.then((cookieStore) => cookieStore.set(name, value, options)))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })

})

export async function createClient() {
  return getSupabaseServerClient()
}

export const getCurrentUser = cache(async () => {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  return user ?? null
})
