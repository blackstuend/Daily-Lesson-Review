"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, CheckCircle2, Trash2 } from "lucide-react"
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
} from "@/components/ui/alert-dialog"

export default function ReviewPage({ params }: { params: { id: string } }) {
  const [review, setReview] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadReview() {
      const supabase = createClient()
      const { data } = await supabase.from("review_schedule").select("*, lessons(*)").eq("id", params.id).single()

      setReview(data)
      setIsLoading(false)
    }

    loadReview()
  }, [params.id])

  const handleComplete = async () => {
    setIsCompleting(true)
    const supabase = createClient()

    const { error } = await supabase
      .from("review_schedule")
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", params.id)

    if (!error) {
      router.push("/dashboard/reviews")
    }
    setIsCompleting(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    const { error } = await supabase.from("review_schedule").delete().eq("id", params.id)

    if (!error) {
      router.push("/dashboard/reviews")
    }
    setIsDeleting(false)
    setShowDeleteDialog(false)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </div>
    )
  }

  if (!review) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Review not found</p>
      </div>
    )
  }

  const intervalColors: Record<number, string> = {
    0: "bg-blue-500/10 text-blue-500",
    1: "bg-green-500/10 text-green-500",
    3: "bg-yellow-500/10 text-yellow-500",
    7: "bg-purple-500/10 text-purple-500",
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardHeader>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className={intervalColors[review.review_interval]}>
              Day {review.review_interval}
            </Badge>
            <Badge variant="secondary">{review.lessons.lesson_type}</Badge>
          </div>
          <CardTitle className="text-2xl">{review.lessons.title}</CardTitle>
          <CardDescription>Review this lesson to reinforce your learning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {review.lessons.lesson_type === "link" && review.lessons.link_url && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="mb-2 text-sm font-medium">Link:</p>
              <a
                href={review.lessons.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                {review.lessons.link_url}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          <div className="rounded-lg border bg-muted/50 p-4">
            <p className="mb-2 text-sm font-medium">
              {review.lessons.lesson_type === "link"
                ? "Notes:"
                : review.lessons.lesson_type === "word"
                  ? "Definition:"
                  : "Sentence:"}
            </p>
            <p className="whitespace-pre-wrap leading-relaxed">{review.lessons.content}</p>
          </div>

          <div className="rounded-lg border bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Spaced Repetition:</strong> This is your day {review.review_interval} review. Reviewing at optimal
              intervals helps transfer information to long-term memory.
            </p>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleComplete} disabled={isCompleting || review.completed} className="flex-1">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {review.completed ? "Already Completed" : isCompleting ? "Completing..." : "Mark as Reviewed"}
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Back
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This will remove it from your schedule but keep the original
              lesson.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
