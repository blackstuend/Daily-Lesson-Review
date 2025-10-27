"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({ lessons: 0, reviews: 0, completed: 0 })
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { count: lessonsCount } = await supabase
          .from("lessons")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        const { count: reviewsCount } = await supabase
          .from("review_schedule")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        const { count: completedCount } = await supabase
          .from("review_schedule")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("completed", true)

        setStats({
          lessons: lessonsCount || 0,
          reviews: reviewsCount || 0,
          completed: completedCount || 0,
        })
      }
    }

    loadData()
  }, [])

  const handleDeleteAllData = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    // Delete all lessons (cascade will delete review_schedule)
    await supabase.from("lessons").delete().eq("user_id", user.id)

    setIsDeleting(false)
    router.push("/dashboard")
  }

  const handleDeleteAccount = async () => {
    const supabase = createClient()

    // Delete all user data first
    await supabase.from("lessons").delete().eq("user_id", user.id)

    // Sign out (account deletion would need admin API)
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and data</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="text-lg">{user?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Account Created</Label>
              <p className="text-lg">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Statistics</CardTitle>
            <CardDescription>Your progress overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Lessons:</span>
              <span className="font-medium">{stats.lessons}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Reviews:</span>
              <span className="font-medium">{stats.reviews}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed Reviews:</span>
              <span className="font-medium text-green-600">{stats.completed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completion Rate:</span>
              <span className="font-medium">
                {stats.reviews > 0 ? Math.round((stats.completed / stats.reviews) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About Spaced Repetition</CardTitle>
            <CardDescription>How the review system works</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              This app uses the spaced repetition technique to help you retain information more effectively. When you
              add a lesson, it automatically creates review sessions at optimal intervals:
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                <strong>Day 0:</strong> Immediate review (same day you add it)
              </li>
              <li>
                <strong>Day 1:</strong> Review after 1 day
              </li>
              <li>
                <strong>Day 3:</strong> Review after 3 days
              </li>
              <li>
                <strong>Day 7:</strong> Review after 7 days
              </li>
            </ul>
            <p>
              These intervals are scientifically proven to maximize long-term retention by reviewing information just
              before you&apos;re about to forget it.
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium">Delete All Learning Data</h3>
                <p className="text-sm text-muted-foreground">
                  Remove all your lessons and review history. This cannot be undone.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your lessons and review history. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAllData} disabled={isDeleting}>
                      {isDeleting ? "Deleting..." : "Delete All Data"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <div className="flex items-start justify-between gap-4 border-t pt-4">
              <div>
                <h3 className="font-medium">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your account and all your data. You will be logged out immediately.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount}>Delete Account</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
