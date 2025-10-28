"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useDashboardStore } from "@/stores/dashboard-store"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Lesson = {
  id: string
  title: string
  content: string | null
  lesson_type: "link" | "word" | "sentence"
  link_url: string | null
  lesson_date: string
}

interface EditLessonDialogProps {
  lesson: Lesson
  onClose: (saved?: boolean) => void
}

export function EditLessonDialog({ lesson, onClose }: EditLessonDialogProps) {
  const [title, setTitle] = useState(lesson.title)
  const [content, setContent] = useState(lesson.content || "")
  const [lessonType, setLessonType] = useState<"link" | "word" | "sentence">(lesson.lesson_type)
  const [linkUrl, setLinkUrl] = useState(lesson.link_url || "")
  const [lessonDate, setLessonDate] = useState<Date>(() => {
    const initial = lesson.lesson_date ? new Date(lesson.lesson_date) : new Date()
    initial.setHours(0, 0, 0, 0)
    return initial
  })
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fetchDashboardData = useDashboardStore((state) => state.fetchDashboardData)

  // Reset form when lesson changes
  useEffect(() => {
    setTitle(lesson.title)
    setContent(lesson.content || "")
    setLessonType(lesson.lesson_type)
    setLinkUrl(lesson.link_url || "")
    const nextDate = lesson.lesson_date ? new Date(lesson.lesson_date) : new Date()
    nextDate.setHours(0, 0, 0, 0)
    setLessonDate(nextDate)
    setIsDatePickerOpen(false)
  }, [lesson])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const selectedDate = new Date(lessonDate)
      selectedDate.setHours(0, 0, 0, 0)
      const lessonDateIso = selectedDate.toISOString()

      const { error: updateError } = await supabase
        .from("lessons")
        .update({
          title,
          content: content || null,
          lesson_type: lessonType,
          link_url: lessonType === "link" ? linkUrl : null,
          lesson_date: lessonDateIso,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lesson.id)

      if (updateError) throw updateError

      await fetchDashboardData(true)
      onClose(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => onClose(false)}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Edit Lesson</DialogTitle>
          <DialogDescription>Make changes to your lesson. Click save when you're done.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-lesson-type">Lesson Type</Label>
              <Select value={lessonType} onValueChange={(value: any) => setLessonType(value)}>
                <SelectTrigger id="edit-lesson-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="word">Difficult Word</SelectItem>
                  <SelectItem value="sentence">Difficult Sentence</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                placeholder="e.g., 'Ephemeral' or 'React Hooks Tutorial'"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {lessonType === "link" && (
              <div className="space-y-2">
                <Label htmlFor="edit-link-url">URL</Label>
                <Input
                  id="edit-link-url"
                  type="url"
                  placeholder="https://example.com/article"
                  required
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Lesson Day</Label>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !lessonDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {lessonDate ? format(lessonDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={lessonDate}
                    onSelect={(date) => {
                      if (date) {
                        const normalized = new Date(date)
                        normalized.setHours(0, 0, 0, 0)
                        setLessonDate(normalized)
                        setIsDatePickerOpen(false)
                      } else {
                        setIsDatePickerOpen(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content">
                {lessonType === "link" ? "Notes" : lessonType === "word" ? "Definition" : "Sentence"}
              </Label>
              <Textarea
                id="edit-content"
                placeholder={
                  lessonType === "link"
                    ? "Add notes about this link (optional)..."
                    : lessonType === "word"
                      ? "Enter the definition (optional)..."
                      : "Enter the sentence (optional)..."
                }
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
