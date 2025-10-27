"use client"

import { useState, type ComponentProps } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

type LogoutButtonProps = Omit<ComponentProps<typeof Button>, "onClick">

export function LogoutButton({ children = "Log out", disabled, ...props }: LogoutButtonProps) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleLogout = async () => {
    setIsSigningOut(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.refresh()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <Button
      {...props}
      disabled={disabled || isSigningOut}
      onClick={handleLogout}
    >
      {children}
    </Button>
  )
}
