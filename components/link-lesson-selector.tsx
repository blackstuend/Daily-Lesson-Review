"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

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

const INITIAL_LIMIT = 5
const PAGE_SIZE = 10

export function LinkLessonSelector({
  value,
  onChange,
  id,
  label = "Related Link (optional)",
  helperText = "Link this entry back to the article or resource it came from.",
}: LinkLessonSelectorProps) {
  const [lessons, setLessons] = useState<LinkLessonOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousSearchRef = useRef("")
  const [selectedLesson, setSelectedLesson] = useState<LinkLessonOption | null>(null)

  const loadLessons = useCallback(async (search: string, loadOffset: number, append = false) => {
    if (!append) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const supabase = createClient()
      const limit = loadOffset === 0 && search.trim() === "" ? INITIAL_LIMIT : PAGE_SIZE

      let request = supabase
        .from("lessons")
        .select("id, title, link_url")
        .eq("lesson_type", "link")
        .order("lesson_date", { ascending: false })
        .range(loadOffset, loadOffset + limit - 1)

      const trimmed = search.trim()
      if (trimmed.length > 0) {
        const likeQuery = `%${trimmed}%`
        request = request.or(`title.ilike.${likeQuery},link_url.ilike.${likeQuery}`)
      }

      const { data, error, count } = await request

      if (error) throw error

      const newLessons = data ?? []
      setLessons((prev) => (append ? [...prev, ...newLessons] : newLessons))
      setHasMore(newLessons.length === limit)
      setOffset(loadOffset + newLessons.length)

      // Mark as loaded after initial data fetch
      if (!append && search.trim() === "") {
        setHasLoadedInitialData(true)
      }
    } catch (err) {
      console.error("Failed to load link lessons", err)
      if (!append) {
        setLessons([])
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) {
      // Reset search when popover closes
      setSearchQuery("")
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      previousSearchRef.current = ""
      return
    }

    const trimmed = searchQuery.trim()
    const previousTrimmed = previousSearchRef.current

    const shouldReloadInitial = trimmed === "" && previousTrimmed !== ""
    const shouldLoadInitial = trimmed === "" && !hasLoadedInitialData
    const shouldSearch = trimmed !== ""
    const shouldLoad = shouldSearch || shouldLoadInitial || shouldReloadInitial

    previousSearchRef.current = trimmed

    if (!shouldLoad) return

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      void loadLessons(trimmed, 0, false)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, loadLessons, isOpen, hasLoadedInitialData])

  useEffect(() => {
    if (!value) {
      setSelectedLesson(null)
      return
    }

    if (selectedLesson?.id === value) {
      return
    }

    let canceled = false
    const fetchSelectedLesson = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from("lessons")
          .select("id, title, link_url")
          .eq("id", value)
          .maybeSingle()

        if (error) throw error
        if (!canceled) {
          setSelectedLesson(data ?? null)
        }
      } catch (err) {
        console.error("Failed to load selected link lesson", err)
        if (!canceled) {
          setSelectedLesson(null)
        }
      }
    }

    void fetchSelectedLesson()

    return () => {
      canceled = true
    }
  }, [value, selectedLesson])

  const handleLoadMore = () => {
    void loadLessons(searchQuery, offset, true)
  }

  const handleSelect = (lessonId: string | null) => {
    onChange(lessonId)
    setIsOpen(false)
  }

  const selectedLessonFromList = lessons.find((lesson) => lesson.id === value)
  const effectiveSelectedLesson = selectedLessonFromList ?? selectedLesson
  const displayText = value === null ? "No linked source" : effectiveSelectedLesson?.title || "Select a link..."
  const hasSelectedInList = effectiveSelectedLesson ? lessons.some((lesson) => lesson.id === effectiveSelectedLesson.id) : false
  const renderedLessons =
    effectiveSelectedLesson && !hasSelectedInList
      ? [effectiveSelectedLesson, ...lessons]
      : lessons

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor={id}>
          {label}
        </Label>
        <p className="text-sm text-muted-foreground">{helperText}</p>
      </div>

      <div>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant="outline"
              role="combobox"
              aria-expanded={isOpen}
              className="h-9 w-full justify-between text-left font-normal"
            >
              <span className="truncate text-xs">{displayText}</span>
              <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="start">
            <div className="flex flex-col">
              {/* Search Bar */}
              <div className="border-b p-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by title or URL..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>

              {/* Scrollable List */}
              <div className="max-h-60 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">Loading links...</div>
                ) : lessons.length === 0 && searchQuery.trim() === "" ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Create a Link lesson first to attach reference material.
                  </div>
                ) : (
                  <>
                    {/* No linked source option */}
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center justify-between border-b px-3 py-2 text-left transition-colors hover:bg-muted",
                        value === null && "bg-muted"
                      )}
                      onClick={() => handleSelect(null)}
                    >
                      <span className="text-xs text-muted-foreground">No linked source</span>
                      {value === null && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>

                    {lessons.length === 0 && searchQuery.trim() !== "" ? (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        No links found. Try another search.
                      </div>
                    ) : (
                      <>
                        {/* Lesson options */}
                        {renderedLessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            type="button"
                            className={cn(
                              "flex w-full items-center justify-between border-b px-3 py-2 text-left transition-colors hover:bg-muted",
                              value === lesson.id && "bg-muted"
                            )}
                            onClick={() => handleSelect(lesson.id)}
                          >
                            <span className="truncate text-xs">{lesson.title}</span>
                            {value === lesson.id && <Check className="ml-2 h-3.5 w-3.5 shrink-0 text-primary" />}
                          </button>
                        ))}

                        {/* Load More button */}
                        {hasMore && (
                          <div className="border-t p-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleLoadMore}
                              disabled={isLoadingMore}
                              className="h-7 w-full text-xs"
                            >
                              {isLoadingMore ? "Loading..." : "Load More"}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Footer helper text */}
              {!isLoading && lessons.length > 0 && (
                <div className="border-t bg-muted/50 px-3 py-1.5">
                  <p className="text-[10px] text-muted-foreground">
                    {searchQuery.trim()
                      ? `Found ${lessons.length} link${lessons.length !== 1 ? 's' : ''}${hasMore ? '+' : ''}`
                      : `Showing ${lessons.length} link${lessons.length !== 1 ? 's' : ''}`
                    }
                  </p>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
