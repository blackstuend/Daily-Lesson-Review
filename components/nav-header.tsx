"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { BookOpen, LogOut, Menu } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useDashboardStore } from "@/stores/dashboard-store"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export function NavHeader() {
  const router = useRouter()
  const resetDashboard = useDashboardStore((state) => state.reset)
  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/wait", label: "Waiting List" },
    { href: "/dashboard/lessons", label: "Lessons" },
    { href: "/dashboard/reviews", label: "Reviews" },
    { href: "/dashboard/calendar", label: "Calendar" },
    { href: "/dashboard/settings", label: "Settings" },
  ]

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    resetDashboard()
    router.push("/")
  }

  const DesktopNav = (
    <nav className="hidden items-center gap-4 md:flex">
      {navLinks.map((link) => (
        <Link key={link.href} href={link.href} className="text-sm font-medium hover:underline">
          {link.label}
        </Link>
      ))}
      <ThemeToggle />
      <Button variant="ghost" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
      </Button>
    </nav>
  )

  const MobileNav = (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation menu</SheetTitle>
        </SheetHeader>
        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
              <BookOpen className="h-5 w-5" />
              Daily Study Review
            </Link>
          </div>
          <nav className="flex flex-1 flex-col gap-2 p-4">
            {navLinks.map((link) => (
              <SheetClose key={link.href} asChild>
                <Link href={link.href} className="rounded-md px-3 py-2 text-base font-medium hover:bg-muted">
                  {link.label}
                </Link>
              </SheetClose>
            ))}
          </nav>
          <div className="flex items-center justify-between gap-4 border-t p-4">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Log out</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <Link href="/dashboard">
            <span className="text-lg font-semibold">Daily Study Review</span>
          </Link>
        </div>
        {DesktopNav}
        {MobileNav}
      </div>
    </header>
  )
}
