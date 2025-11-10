"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type LinkLessonOption = {
  id: string
  title: string
  link_url: string | null
}

type LinkLessonSelectorProps = {
  value: string | null
  onChange: (value: string | null) => void
  id: string
  label?: string
  helperText?: string
}

const RECENT_LIMIT = 5
const SEARCH_LIMIT = 25

export function LinkLessonSelector({
  value,
  onChange,
  id,
  label = "Related Link (optional)",
  helperText = "Link this entry back to the article or resource it came from.",
}: LinkLessonSelectorProps) {
  const [recentLinks, setRecentLinks] = useState<LinkLessonOption[]>([])
  const [isRecentLoading, setIsRecentLoading] = useState(true)
  const [selectedLesson, setSelectedLesson] = useState<LinkLessonOption | null>(null)
  const [isBrowseDialogOpen, setIsBrowseDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<LinkLessonOption[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const didInitialSearch = useRef(false)

  useEffect(() => {
    let isMounted = true

    async function loadRecentLinks() {
      setIsRecentLoading(true)
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("lessons")
          .select("id, title, link_url")
          .eq("lesson_type", "link")
          .order("lesson_date", { ascending: false })
          .limit(RECENT_LIMIT)

        if (error) throw error
        if (isMounted) {
          setRecentLinks(data ?? [])
        }
      } catch (err) {
        console.error("Failed to load recent link lessons", err)
        if (isMounted) {
          setRecentLinks([])
        }
      } finally {
        if (isMounted) {
          setIsRecentLoading(false)
        }
      }
    }

    void loadRecentLinks()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!value) {
      setSelectedLesson(null)
      return
    }

    if (recentLinks.some((lesson) => lesson.id === value)) {
      setSelectedLesson(null)
      return
    }

    let isMounted = true

    async function loadSelectedLesson() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("lessons")
          .select("id, title, link_url")
          .eq("id", value)
          .single()

        if (!isMounted) return

        if (error) {
          console.error("Failed to load selected linked lesson", error)
          return
        }

        if (!data) {
          onChange(null)
          return
        }

        setSelectedLesson(data)
      } catch (err) {
        console.error("Failed to load selected linked lesson", err)
      }
    }

    void loadSelectedLesson()

    return () => {
      isMounted = false
    }
  }, [value, recentLinks, onChange])

  const runSearch = useCallback(
    async (query: string) => {
      setIsSearching(true)
      setSearchError(null)
      try {
        const supabase = createClient()
        let request = supabase
          .from("lessons")
          .select("id, title, link_url")
          .eq("lesson_type", "link")
          .order("lesson_date", { ascending: false })
          .limit(SEARCH_LIMIT)

        const trimmed = query.trim()
        if (trimmed.length > 0) {
          const likeQuery = `%${trimmed}%`
          request = request.or(`title.ilike.${likeQuery},link_url.ilike.${likeQuery}`)
        }

        const { data, error } = await request

        if (error) throw error
        setSearchResults(data ?? [])
      } catch (err) {
        console.error("Failed to search link lessons", err)
        setSearchError("Something went wrong while searching. Please try again.")
        setSearchResults([])
      } finally {
        setIsSearching(false)
        didInitialSearch.current = true
      }
    },
    []
  )

  useEffect(() => {
    if (!isBrowseDialogOpen) {
      setSearchQuery("")
      setSearchResults([])
      setSearchError(null)
      didInitialSearch.current = false
      return
    }

    const trimmedQuery = searchQuery.trim()
    if (trimmedQuery.length === 0) {
      setSearchResults([])
      setSearchError(null)
      setIsSearching(false)
      didInitialSearch.current = false
      return
    }

    const handler = setTimeout(() => {
      void runSearch(searchQuery)
    }, 300)

    return () => clearTimeout(handler)
  }, [isBrowseDialogOpen, searchQuery, runSearch])

  const combinedOptions = useMemo(() => {
    const options = [...recentLinks]
    if (value && !options.some((lesson) => lesson.id === value) && selectedLesson) {
      options.unshift(selectedLesson)
    }
    return options
  }, [recentLinks, selectedLesson, value])

  const handleSelect = (nextValue: string) => {
    onChange(nextValue === "none" ? null : nextValue)
  }

  return (
    <div className="rounded-xl border bg-card/70 p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Label htmlFor={id} className="text-base font-semibold">
            {label}
          </Label>
          <p className="text-sm text-muted-foreground">{helperText}</p>
        </div>
        <Button variant="secondary" size="sm" type="button" onClick={() => setIsBrowseDialogOpen(true)}>
          Broswe other links
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        <Select value={value ?? "none"} onValueChange={handleSelect} disabled={isRecentLoading}>
          <SelectTrigger id={id} className="h-11 text-left">
            <SelectValue placeholder={isRecentLoading ? "Loading links..." : "Choose a link"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No linked source</SelectItem>
            {combinedOptions.map((lesson) => (
              <SelectItem key={lesson.id} value={lesson.id}>
                {lesson.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {recentLinks.length === 0
            ? "Create a Link lesson first to attach reference material."
            : `Showing your ${Math.min(recentLinks.length, RECENT_LIMIT)} most recent links.`}
        </p>
      </div>

      <Dialog open={isBrowseDialogOpen} onOpenChange={setIsBrowseDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Broswe other links</DialogTitle>
            <DialogDescription>Search across every saved link lesson.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search by title or URL"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              autoFocus
            />
            <div className="rounded-md border">
              {isSearching ? (
                <p className="p-4 text-sm text-muted-foreground">Searching…</p>
              ) : searchError ? (
                <p className="p-4 text-sm text-destructive">{searchError}</p>
              ) : !didInitialSearch.current ? (
                <p className="p-4 text-sm text-muted-foreground">Start typing to search your saved links.</p>
              ) : searchResults.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No links found. Try another search.</p>
              ) : (
                <ul className="max-h-64 divide-y overflow-y-auto">
                  {searchResults.map((lesson) => (
                    <li key={lesson.id}>
                      <button
                        type="button"
                        className="w-full px-4 py-3 text-left hover:bg-muted"
                        onClick={() => {
                          onChange(lesson.id)
                          setIsBrowseDialogOpen(false)
                        }}
                      >
                        <p className="font-medium">{lesson.title}</p>
                        {lesson.link_url && (
                          <p className="text-sm text-muted-foreground">{lesson.link_url}</p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsBrowseDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
