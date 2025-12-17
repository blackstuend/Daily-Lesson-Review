"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Trash2, Undo2, Calendar as CalendarIcon, ChevronRight, Pencil, Link2, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { LessonDialog, type Lesson } from "@/components/lesson-dialog"
import { TTSButton } from "@/components/ui/tts-button"
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
import { cn } from "@/lib/utils"

interface ReviewCardProps {
  review: any
  showDate?: boolean
  showTodoStyle?: boolean
  allowRevert?: boolean
  hideBadgesWhenCompleted?: boolean
  linkedChildren?: any[]
  isNested?: boolean
}

export function ReviewCard({
  review,
  showDate = false,
  showTodoStyle = false,
  allowRevert = false,
  hideBadgesWhenCompleted = false,
  linkedChildren = [],
  isNested = false,
}: ReviewCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteType, setDeleteType] = useState<"review" | "lesson" | null>(null)
  const [optimisticCompleted, setOptimisticCompleted] = useState(review.completed)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showQuickAddDialog, setShowQuickAddDialog] = useState(false)
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(review.lessons?.tts_audio_url || null)
  const [ttsAudioAccent, setTtsAudioAccent] = useState<string | null>(review.lessons?.tts_audio_accent || null)
  const router = useRouter()

  // Sync optimistic state when review data updates from server
  useEffect(() => {
    setOptimisticCompleted(review.completed)
    setTtsAudioUrl(review.lessons?.tts_audio_url || null)
    setTtsAudioAccent(review.lessons?.tts_audio_accent || null)
  }, [review.completed, review.lessons?.tts_audio_url, review.lessons?.tts_audio_accent])

  const isLoading = isDeleting || isUpdating

  const intervalColors: Record<number, string> = {
    0: "bg-blue-500/10 text-blue-500",
    1: "bg-green-500/10 text-green-500",
    3: "bg-yellow-500/10 text-yellow-500",
    7: "bg-purple-500/10 text-purple-500",
  }

  const lessonTypeStyles: Record<string, string> = {
    word: "border-sky-500/30 bg-sky-500/10 text-sky-600",
    sentence: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    link: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  }

  const handleDeleteReview = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    // Delete the review schedule entry only
    const { error } = await supabase.from("review_schedule").delete().eq("id", review.id)

    if (!error) {
      router.refresh()
    }
    setIsDeleting(false)
    setShowDeleteDialog(false)
    setDeleteType(null)
  }

  const handleDeleteLesson = async () => {
    setIsDeleting(true)
    const supabase = createClient()

    // Delete the lesson (this will cascade delete all related review_schedule entries)
    const { error } = await supabase.from("lessons").delete().eq("id", review.lessons.id)

    if (!error) {
      router.refresh()
    }
    setIsDeleting(false)
    setShowDeleteDialog(false)
    setDeleteType(null)
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

  const containerClasses = cn(
    "relative flex flex-wrap items-start gap-3 rounded-lg border p-4",
    optimisticCompleted && showTodoStyle ? "bg-muted/50" : "",
    isNested ? "border-dashed bg-muted/60 w-full" : ""
  )

  const linkedLesson = !isNested ? review.lessons?.linked_lesson : null
  const hasLinkedChildren = !isNested && linkedChildren.length > 0

  return (
    <>
      <div className={containerClasses}>
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
              {review.lessons.lesson_type === "link" && review.lessons.link_url ? (
                <a
                  href={review.lessons.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-inherit underline hover:text-primary"
                >
                  {review.lessons.title}
                </a>
              ) : (
                review.lessons.title
              )}
            </h3>
            {!(hideBadgesWhenCompleted && optimisticCompleted) && (
              <>
                <Badge variant="outline" className={intervalColors[review.review_interval]}>
                  Day {review.review_interval}
                </Badge>
                <Badge
                  variant="secondary"
                  className={cn("capitalize", lessonTypeStyles[review.lessons.lesson_type] ?? "")}
                >
                  {review.lessons.lesson_type}
                </Badge>
              </>
            )}
          </div>
          <div className="flex items-start gap-2">
            <p
              className={`flex-1 text-sm text-muted-foreground line-clamp-1 ${optimisticCompleted && showTodoStyle ? "line-through" : ""}`}
            >
              {review.lessons.content}
            </p>
          </div>
          {showDate && (
            <p className="mt-1 text-xs text-muted-foreground">
              {optimisticCompleted ? "Completed" : "Scheduled"}: {new Date(review.review_date).toLocaleDateString()}
            </p>
          )}
          {linkedLesson && (
            <div className="mt-3 rounded-md border border-dashed bg-muted/60 p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Link2 className="h-3 w-3" />
                Linked Resource
              </div>
              <p className="mt-1 text-sm font-medium text-foreground">{linkedLesson.title}</p>
              {linkedLesson.link_url && (
                <a
                  href={linkedLesson.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Visit link
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="ml-4 flex flex-wrap gap-2">
          {(review.lessons.lesson_type === "word" || review.lessons.lesson_type === "sentence") && (
            <TTSButton
              text={review.lessons.title}
              lessonId={review.lessons.id}
              ttsAudioUrl={ttsAudioUrl}
              ttsAudioAccent={ttsAudioAccent}
              onTTSGenerated={(audioUrl, accent) => {
                setTtsAudioUrl(audioUrl)
                setTtsAudioAccent(accent)
              }}
            />
          )}
          {review.lessons.lesson_type === "link" && review.lessons.link_url && (
            <>
              <Button variant="ghost" size="sm" asChild disabled={isLoading}>
                <a href={review.lessons.link_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              {!isNested && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickAddDialog(true)}
                  disabled={isLoading}
                  title="Add lesson linked to this resource"
                >
                  <Plus className="h-4 w-4" />
                  <span className="ml-1">Add Linked</span>
                </Button>
              )}
            </>
          )}
          {!isNested && linkedLesson?.link_url && review.lessons.lesson_type !== "link" && (
            <Button variant="ghost" size="sm" asChild disabled={isLoading} title="Open linked resource">
              <a href={linkedLesson.link_url} target="_blank" rel="noopener noreferrer">
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

        {hasLinkedChildren && (
          <div className="mt-4 w-full space-y-2 border-t pt-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Related items</div>
            <div className="space-y-2">
              {linkedChildren.map((child) => (
                <ReviewCard
                  key={child.id}
                  review={child}
                  showTodoStyle={showTodoStyle}
                  allowRevert={allowRevert}
                  hideBadgesWhenCompleted={hideBadgesWhenCompleted}
                  isNested
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={(open) => {
        setShowDeleteDialog(open)
        if (!open) setDeleteType(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>What would you like to delete?</AlertDialogTitle>
            <AlertDialogDescription>
              Choose whether to delete just this review schedule or the entire lesson with all its reviews.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-2 py-2">
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start",
                (deleteType === "review" || deleteType === null) && "border-destructive ring-1 ring-destructive bg-destructive"
              )}
              onClick={() => setDeleteType("review")}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete review only
              <span className="ml-auto text-xs text-muted-foreground">Keep the lesson</span>
            </Button>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start",
                deleteType === "lesson" && "border-destructive ring-1 ring-destructive bg-destructive"
              )}
              onClick={() => setDeleteType("lesson")}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete entire lesson
              <span className="ml-auto text-xs text-muted-foreground">Removes all reviews</span>
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteType === "lesson" ? handleDeleteLesson : handleDeleteReview}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LessonDialog
        mode="edit"
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open)
          if (!open) router.refresh()
        }}
        lesson={review.lessons as Lesson}
      />

      {review.lessons.lesson_type === "link" && (
        <LessonDialog
          mode="add-linked"
          open={showQuickAddDialog}
          onOpenChange={(open) => {
            setShowQuickAddDialog(open)
            if (!open) router.refresh()
          }}
          linkedLessonId={review.lessons.id}
          linkedLessonTitle={review.lessons.title}
        />
      )}
    </>
  )
}
