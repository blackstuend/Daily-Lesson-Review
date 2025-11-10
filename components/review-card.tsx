"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Trash2, Undo2, Calendar as CalendarIcon, ChevronRight, Pencil } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { EditLessonDialog } from "@/components/edit-lesson-dialog"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

interface ReviewCardProps {
  review: any
  showDate?: boolean
  showTodoStyle?: boolean
  allowRevert?: boolean
  hideBadgesWhenCompleted?: boolean
}

export function ReviewCard({
  review,
  showDate = false,
  showTodoStyle = false,
  allowRevert = false,
  hideBadgesWhenCompleted = false,
}: ReviewCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [optimisticCompleted, setOptimisticCompleted] = useState(review.completed)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const router = useRouter()

  // Sync optimistic state when review data updates from server
  useEffect(() => {
    setOptimisticCompleted(review.completed)
  }, [review.completed])

  const isLoading = isDeleting || isUpdating

  const intervalColors: Record<number, string> = {
    0: "bg-blue-500/10 text-blue-500",
    1: "bg-green-500/10 text-green-500",
    3: "bg-yellow-500/10 text-yellow-500",
    7: "bg-purple-500/10 text-purple-500",
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    // Delete the review schedule entry
    const { error } = await supabase.from("review_schedule").delete().eq("id", review.id)

    if (!error) {
      router.refresh()
    }
    setIsDeleting(false)
    setShowDeleteDialog(false)
  }

  const handleToggleComplete = async () => {
    setIsUpdating(true)
    // Optimistically update the UI immediately
    const newCompletedState = !optimisticCompleted
    setOptimisticCompleted(newCompletedState)

    const supabase = createClient()

    const { error } = await supabase
      .from("review_schedule")
      .update({
        completed: newCompletedState,
        completed_at: newCompletedState ? new Date().toISOString() : null,
      })
      .eq("id", review.id)

    if (error) {
      // Revert optimistic update on error
      setOptimisticCompleted(!newCompletedState)
      setIsUpdating(false)
    } else {
      // Refresh to sync with server
      router.refresh()
      setIsUpdating(false)
    }
  }

  const handleMoveToDate = async (date: Date) => {
    setIsUpdating(true)
    setShowDatePicker(false)

    const supabase = createClient()
    const newDate = format(date, "yyyy-MM-dd")

    const { error } = await supabase
      .from("review_schedule")
      .update({
        review_date: newDate,
      })
      .eq("id", review.id)

    if (!error) {
      router.refresh()
    }
    setIsUpdating(false)
  }

  const handleMoveToTomorrow = async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await handleMoveToDate(tomorrow)
  }

  return (
    <>
      <div className={`relative flex items-start gap-3 rounded-lg border p-4 ${optimisticCompleted && showTodoStyle ? "bg-muted/50" : ""}`}>
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>{isDeleting ? "Deleting..." : "Updating..."}</span>
            </div>
          </div>
        )}
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3
              className={`font-medium ${optimisticCompleted && showTodoStyle ? "text-muted-foreground line-through" : ""}`}
            >
              {review.lessons.title}
            </h3>
            {!(hideBadgesWhenCompleted && optimisticCompleted) && (
              <>
                <Badge variant="outline" className={intervalColors[review.review_interval]}>
                  Day {review.review_interval}
                </Badge>
                <Badge variant="secondary">{review.lessons.lesson_type}</Badge>
              </>
            )}
          </div>
          <p
            className={`text-sm text-muted-foreground line-clamp-1 ${optimisticCompleted && showTodoStyle ? "line-through" : ""}`}
          >
            {review.lessons.content}
          </p>
          {showDate && (
            <p className="mt-1 text-xs text-muted-foreground">
              {optimisticCompleted ? "Completed" : "Scheduled"}: {new Date(review.review_date).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="ml-4 flex flex-wrap gap-2">
          {review.lessons.lesson_type === "link" && review.lessons.link_url && (
            <Button variant="ghost" size="sm" asChild disabled={isLoading}>
              <a href={review.lessons.link_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
          {showTodoStyle && !optimisticCompleted && (
            <Button size="sm" onClick={handleToggleComplete} disabled={isLoading}>
              Finish
            </Button>
          )}
          {showTodoStyle && optimisticCompleted && (
            <Button variant="outline" size="sm" onClick={handleToggleComplete} disabled={isLoading}>
              Reopen
            </Button>
          )}
          {!optimisticCompleted && !showTodoStyle && (
            <Button variant="outline" size="sm" asChild disabled={isLoading}>
              <Link href={`/dashboard/review/${review.id}`}>Review</Link>
            </Button>
          )}
          {showTodoStyle && !optimisticCompleted && (
            <Button variant="outline" size="sm" asChild disabled={isLoading}>
              <Link href={`/dashboard/review/${review.id}`}>View</Link>
            </Button>
          )}
          {allowRevert && optimisticCompleted && !showTodoStyle && (
            <Button variant="outline" size="sm" onClick={handleToggleComplete} disabled={isLoading}>
              <Undo2 className="h-4 w-4" />
              <span className="ml-2">Revert</span>
            </Button>
          )}
          {!optimisticCompleted && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleMoveToTomorrow}
                disabled={isLoading}
                title="Move to tomorrow"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isLoading} title="Move to specific date">
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date)
                        handleMoveToDate(date)
                      }
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditDialog(true)}
            disabled={isLoading}
            title="Edit lesson"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isLoading}
            className="cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showEditDialog && (
        <EditLessonDialog
          lesson={review.lessons}
          onClose={(saved) => {
            setShowEditDialog(false)
            if (saved) {
              router.refresh()
            }
          }}
        />
      )}
    </>
  )
}
