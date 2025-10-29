import type React from "react"
import { NavHeader } from "@/components/nav-header"
import { SessionMonitor } from "@/components/session-monitor"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <SessionMonitor />
      <NavHeader />
      <main className="flex-1">{children}</main>
    </div>
  )
}
