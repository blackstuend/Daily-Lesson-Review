"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface QuickAddLinkedLessonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  linkedLessonId: string
  linkedLessonTitle: string
}

export function QuickAddLinkedLessonDialog({
  open,
  onOpenChange,
  linkedLessonId,
  linkedLessonTitle,
}: QuickAddLinkedLessonDialogProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [lessonType, setLessonType] = useState<"word" | "sentence">("word")
  const [lessonDate, setLessonDate] = useState<Date>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fetchDashboardData = useDashboardStore((state) => state.fetchDashboardData)

  const handleClose = (saved?: boolean) => {
    if (!isLoading) {
      if (saved) {
        // Reset form on successful save
        setTitle("")
        setContent("")
        setLessonType("word")
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        setLessonDate(today)
        setError(null)
      }
      onOpenChange(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // Get user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Format date
      const selectedDate = new Date(lessonDate)
      selectedDate.setHours(0, 0, 0, 0)
      const lessonDateString = format(selectedDate, "yyyy-MM-dd")

      // Insert lesson with linked_lesson_id pre-populated
      const { error: insertError } = await supabase.from("lessons").insert({
        user_id: user.id,
        title,
        content: content || null,
        lesson_type: lessonType,
        link_url: null,
        linked_lesson_id: linkedLessonId,
        lesson_date: lessonDateString,
      })

      if (insertError) throw insertError

      // Refresh dashboard data
      await fetchDashboardData(true)
      handleClose(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add Lesson Linked to {linkedLessonTitle}</DialogTitle>
          <DialogDescription>
            Add a new word or sentence lesson that references this link.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-type">Lesson Type</Label>
              <Select value={lessonType} onValueChange={(value: "word" | "sentence") => setLessonType(value)}>
                <SelectTrigger id="lesson-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="word">Word</SelectItem>
                  <SelectItem value="sentence">Sentence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linked-title">Title</Label>
              <Input
                id="linked-title"
                placeholder={lessonType === "word" ? "e.g., 'serendipity'" : "e.g., 'It was a serendipitous encounter'"}
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linked-content">Content (optional)</Label>
              <Textarea
                id="linked-content"
                placeholder={lessonType === "word" ? "Definition, etymology, etc..." : "Translation, notes, etc..."}
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Lesson Day</Label>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
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

            <div className="rounded-md border bg-muted/50 p-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Linked to:</span> {linkedLessonTitle}
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add Lesson"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
