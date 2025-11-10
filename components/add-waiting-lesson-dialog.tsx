"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

type LessonType = "link" | "word" | "sentence"

interface AddWaitingLessonDialogProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

const lessonTypeOptions: { value: LessonType; label: string }[] = [
  { value: "word", label: "Word" },
  { value: "sentence", label: "Sentence" },
  { value: "link", label: "Link" },
]

export function AddWaitingLessonDialog({ open, onClose, onCreated }: AddWaitingLessonDialogProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [lessonType, setLessonType] = useState<LessonType>("word")
  const [linkUrl, setLinkUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle("")
    setContent("")
    setLessonType("word")
    setLinkUrl("")
    setError(null)
  }, [open])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    const supabase = createClient()

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error("You must be signed in")

      const { error: insertError } = await supabase.from("waiting_lessons").insert({
        user_id: user.id,
        title,
        content: content || null,
        lesson_type: lessonType,
        link_url: lessonType === "link" ? linkUrl : null,
      })

      if (insertError) throw insertError

      toast({ title: "Lesson added to waiting list" })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add waiting lesson")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add Waiting Lesson</DialogTitle>
          <DialogDescription>Add links, vocabulary, or sentences you want to study later.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-lesson-type">Lesson Type</Label>
            <Select value={lessonType} onValueChange={(value) => setLessonType(value as LessonType)}>
              <SelectTrigger id="new-lesson-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lessonTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-lesson-title">Title</Label>
            <Input
              id="new-lesson-title"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="What do you plan to study?"
            />
          </div>

          {lessonType === "link" && (
            <div className="space-y-2">
              <Label htmlFor="new-lesson-url">URL</Label>
              <Input
                id="new-lesson-url"
                type="url"
                required
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="https://example.com/article"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-lesson-notes">Notes</Label>
            <Textarea
              id="new-lesson-notes"
              rows={4}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Add context, reminders, or definitions."
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Adding..." : "Add to waiting list"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
