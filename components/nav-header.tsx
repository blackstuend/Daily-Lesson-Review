"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { BookOpen, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDashboardStore } from "@/stores/dashboard-store"
import { ThemeToggle } from "@/components/theme-toggle"

export function NavHeader() {
  const router = useRouter()
  const resetDashboard = useDashboardStore((state) => state.reset)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    resetDashboard()
    router.push("/")
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <Link href="/dashboard">
            <span className="text-lg font-semibold">Daily Lesson Review</span>
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium hover:underline">
            Dashboard
          </Link>
          <Link href="/dashboard/add" className="text-sm font-medium hover:underline">
            Add Lesson
          </Link>
          <Link href="/dashboard/lessons" className="text-sm font-medium hover:underline">
            Lessons
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
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </nav>
      </div>
    </header>
  )
}
