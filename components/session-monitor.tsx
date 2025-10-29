"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"

/**
 * Client-side session monitor that listens for auth state changes
 * and handles session expiration/invalidation
 */
export function SessionMonitor() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        toast({
          title: "Session Ended",
          description: "You have been logged out.",
          variant: "destructive",
        })
        router.push("/auth/login?error=session_expired")
      } else if (event === "TOKEN_REFRESHED") {
        // Session was successfully refreshed
        console.log("Session refreshed successfully")
      } else if (event === "USER_UPDATED") {
        // User info was updated
        router.refresh()
      }
    })

    // Check session validity periodically
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session) {
          // Session is invalid or expired
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          })

          // Sign out to clear any stale session data
          await supabase.auth.signOut()
          router.push("/auth/login?error=session_expired")
        }
      } catch (error) {
        console.error("Error checking session:", error)
      }
    }

    // Check session every 5 minutes
    const intervalId = setInterval(checkSession, 5 * 60 * 1000)

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe()
      clearInterval(intervalId)
    }
  }, [router])

  return null // This component doesn't render anything
}
