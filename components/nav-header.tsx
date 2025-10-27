"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { BookOpen, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function NavHeader() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <span className="text-lg font-semibold">Daily Lesson Review</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium hover:underline">
            Dashboard
          </Link>
          <Link href="/dashboard/add" className="text-sm font-medium hover:underline">
            Add Lesson
          </Link>
          <Link href="/dashboard/reviews" className="text-sm font-medium hover:underline">
            Reviews
          </Link>
          <Link href="/dashboard/calendar" className="text-sm font-medium hover:underline">
            Calendar
          </Link>
          <Link href="/dashboard/settings" className="text-sm font-medium hover:underline">
            Settings
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </header>
  )
}
