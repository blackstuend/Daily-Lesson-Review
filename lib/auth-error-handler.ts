import { AuthError } from "@supabase/supabase-js"
import { redirect } from "next/navigation"

/**
 * Check if an error is a session-related authentication error
 */
export function isSessionError(error: unknown): boolean {
  if (!error) return false

  if (error instanceof AuthError) {
    return (
      error.name === "AuthSessionMissingError" ||
      error.message === "Auth session missing!" ||
      error.status === 401 ||
      error.message.includes("session") ||
      error.message.includes("JWT")
    )
  }

  // Check for generic error objects with session-related messages
  if (typeof error === "object" && "message" in error) {
    const message = String(error.message).toLowerCase()
    return (
      message.includes("session") ||
      message.includes("unauthorized") ||
      message.includes("jwt") ||
      message.includes("auth")
    )
  }

  return false
}

/**
 * Handle session errors by redirecting to login with a warning message
 */
export function handleSessionError(error: unknown): never {
  if (isSessionError(error)) {
    // Redirect to login page with session expired message
    redirect("/auth/login?error=session_expired")
  }

  // Re-throw if not a session error
  throw error
}

/**
 * Get user-friendly error message for session errors
 */
export function getSessionErrorMessage(errorType: string | null): string | null {
  switch (errorType) {
    case "session_expired":
      return "Your session has expired. Please log in again."
    case "session_invalid":
      return "Your session is invalid. Please log in again."
    case "unauthorized":
      return "You are not authorized. Please log in."
    default:
      return null
  }
}
