"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type LessonType = "link" | "word" | "sentence"

export type WaitingLesson = {
  id: string
  title: string
  content: string | null
  lesson_type: LessonType
  link_url: string | null
  planned_start_date: string | null
}

interface EditWaitingLessonDialogProps {
  lesson: WaitingLesson
  onClose: (saved?: boolean) => void
}

export function EditWaitingLessonDialog({ lesson, onClose }: EditWaitingLessonDialogProps) {
  const [title, setTitle] = useState(lesson.title)
  const [content, setContent] = useState(lesson.content ?? "")
  const [lessonType, setLessonType] = useState<LessonType>(lesson.lesson_type)
  const [linkUrl, setLinkUrl] = useState(lesson.link_url ?? "")
  const [plannedDate, setPlannedDate] = useState<Date | null>(() => {
    if (!lesson.planned_start_date) return null
    const initial = new Date(lesson.planned_start_date)
    initial.setHours(0, 0, 0, 0)
    return initial
  })
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setTitle(lesson.title)
    setContent(lesson.content ?? "")
    setLessonType(lesson.lesson_type)
    setLinkUrl(lesson.link_url ?? "")
    if (lesson.planned_start_date) {
      const next = new Date(lesson.planned_start_date)
      next.setHours(0, 0, 0, 0)
      setPlannedDate(next)
    } else {
      setPlannedDate(null)
    }
  }, [lesson])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    const supabase = createClient()

    try {
      const formattedDate = plannedDate ? format(plannedDate, "yyyy-MM-dd") : null
      const { error: updateError } = await supabase
        .from("waiting_lessons")
        .update({
          title,
          content: content || null,
          lesson_type: lessonType,
          link_url: lessonType === "link" ? linkUrl : null,
          planned_start_date: formattedDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lesson.id)

      if (updateError) throw updateError

      onClose(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose(false)}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit Waiting Lesson</DialogTitle>
          <DialogDescription>Update the details for this waiting lesson.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="waiting-lesson-type">Lesson Type</Label>
            <Select value={lessonType} onValueChange={(value) => setLessonType(value as LessonType)}>
              <SelectTrigger id="waiting-lesson-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="word">Word</SelectItem>
                <SelectItem value="sentence">Sentence</SelectItem>
                <SelectItem value="link">Link</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="waiting-lesson-title">Title</Label>
            <Input
              id="waiting-lesson-title"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What do you plan to study?"
            />
          </div>

          {lessonType === "link" && (
            <div className="space-y-2">
              <Label htmlFor="waiting-lesson-url">URL</Label>
              <Input
                id="waiting-lesson-url"
                type="url"
                required
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://example.com/article"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="waiting-lesson-notes">Notes</Label>
            <Textarea
              id="waiting-lesson-notes"
              rows={4}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Add details, reminders, or why this lesson matters."
            />
          </div>

          <div className="space-y-2">
            <Label>Target Start Date (optional)</Label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !plannedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {plannedDate ? format(plannedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={plannedDate ?? undefined}
                  onSelect={(date) => {
                    if (date) {
                      const normalized = new Date(date)
                      normalized.setHours(0, 0, 0, 0)
                      setPlannedDate(normalized)
                    } else {
                      setPlannedDate(null)
                    }
                    setIsDatePickerOpen(false)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
