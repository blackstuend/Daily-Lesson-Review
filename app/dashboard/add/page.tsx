"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function AddLessonPage() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [lessonType, setLessonType] = useState<"link" | "word" | "sentence">("word")
  const [linkUrl, setLinkUrl] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error: insertError } = await supabase.from("lessons").insert({
        user_id: user.id,
        title,
        content,
        lesson_type: lessonType,
        link_url: lessonType === "link" ? linkUrl : null,
      })

      if (insertError) throw insertError

      router.push("/dashboard")
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
              <Select value={lessonType} onValueChange={(value: any) => setLessonType(value)}>
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
