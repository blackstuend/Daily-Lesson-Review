"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useDashboardStore } from "@/stores/dashboard-store"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { LinkLessonSelector } from "@/components/link-lesson-selector"
import { generateTTSForLesson } from "@/lib/tts-utils"
import { useTTSStore } from "@/stores/tts-store"

type LessonType = "link" | "word" | "sentence"

export default function AddLessonPage() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [lessonType, setLessonType] = useState<LessonType>("word")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkedLessonId, setLinkedLessonId] = useState<string | null>(null)
  const [lessonDate, setLessonDate] = useState<Date>(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const fetchDashboardData = useDashboardStore((state) => state.fetchDashboardData)
  const accent = useTTSStore((state) => state.accent)

  const handleLessonTypeChange = (value: LessonType) => {
    setLessonType(value)
    if (value === "link") {
      setLinkedLessonId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    // Format date as YYYY-MM-DD to preserve the user's calendar date
    // This prevents timezone conversion issues where midnight local time
    // becomes the previous day in UTC
    const lessonDateString = format(lessonDate, 'yyyy-MM-dd')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Auto-generate TTS BEFORE inserting lesson for words and sentences
      let ttsData: { audioUrl: string; accent: string; generatedAt: string } | null = null
      if (lessonType === "word" || lessonType === "sentence") {
        // Generate a UUID for the lesson
        const lessonId = crypto.randomUUID()

        // Generate TTS audio and upload to storage (but don't update any lesson record yet)
        ttsData = await generateTTSForLesson({
          lessonId,
          text: title,
          accent,
          skipDatabaseUpdate: true,
        })

        // If TTS generation failed, we still continue with lesson creation
        if (!ttsData) {
          console.warn("TTS generation failed, creating lesson without TTS")
        }

        // Insert lesson with pre-generated ID and TTS data
        const { error: insertError } = await supabase
          .from("lessons")
          .insert({
            id: lessonId,
            user_id: user.id,
            title,
            content: content || null,
            lesson_type: lessonType,
            link_url: null,
            linked_lesson_id: linkedLessonId,
            lesson_date: lessonDateString,
            tts_audio_url: ttsData?.audioUrl || null,
            tts_audio_accent: ttsData?.accent || null,
            tts_audio_generated_at: ttsData?.generatedAt || null,
          })

        if (insertError) throw insertError
      } else {
        // For link lessons, just insert normally without TTS
        const { error: insertError } = await supabase
          .from("lessons")
          .insert({
            user_id: user.id,
            title,
            content: content || null,
            lesson_type: lessonType,
            link_url: linkUrl,
            linked_lesson_id: null,
            lesson_date: lessonDateString,
          })

        if (insertError) throw insertError
      }

      // Force refresh dashboard data to update stats
      await fetchDashboardData(true)

      // Redirect to dashboard
      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Add New Lesson</CardTitle>
          <CardDescription>Save a link, word, or sentence to review later</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="lesson-type">Lesson Type</Label>
              <Select value={lessonType} onValueChange={(value) => handleLessonTypeChange(value as LessonType)}>
                <SelectTrigger id="lesson-type">
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
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., 'Ephemeral' or 'React Hooks Tutorial'"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {lessonType !== "link" && (
              <LinkLessonSelector id="linked-lesson" value={linkedLessonId} onChange={setLinkedLessonId} />
            )}

            {lessonType === "link" && (
              <div className="space-y-2">
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
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
              <Label htmlFor="content">
                {lessonType === "link" ? "Notes" : lessonType === "word" ? "Definition" : "Sentence"}
              </Label>
              <Textarea
                id="content"
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

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? "Adding..." : "Add Lesson"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
