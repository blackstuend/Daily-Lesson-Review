"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExternalLink, Trash2, Pencil, Search, ChevronLeft, ChevronRight, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
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
import { useDashboardStore } from "@/stores/dashboard-store"

const ITEMS_PER_PAGE = 10

type Lesson = {
  id: string
  title: string
  content: string | null
  lesson_type: "link" | "word" | "sentence"
  link_url: string | null
  lesson_date: string
  created_at: string
  updated_at: string
  linked_lesson_id: string | null
}

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalLessons, setTotalLessons] = useState(0)
  const [lessonStats, setLessonStats] = useState({ words: 0, sentences: 0, links: 0 })
  const router = useRouter()
  const fetchDashboardData = useDashboardStore((state) => state.fetchDashboardData)

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset to first page on new search
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchLessons = useCallback(
    async (page: number, search: string, type: string) => {
      setIsLoading(true)

      const supabase = createClient()
      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1

      try {
        // Fetch paginated lessons and all lesson types in parallel
        const [paginatedResult, allLessonsResult] = await Promise.all([
          // Paginated query with search and type filter
          (async () => {
            let query = supabase
              .from("lessons")
              .select("*", { count: "exact" })
              .order("lesson_date", { ascending: false })
              .order("created_at", { ascending: false })

            if (search.trim()) {
              query = query.or(
                `title.ilike.%${search}%,content.ilike.%${search}%,lesson_type.ilike.%${search}%`
              )
            }

            if (type !== "all") {
              query = query.eq("lesson_type", type)
            }

            query = query.range(from, to)
            return query
          })(),
          // Get all lesson types for stats (only if no search to avoid extra query)
          search.trim()
            ? supabase.from("lessons").select("lesson_type")
            : supabase.from("lessons").select("lesson_type"),
        ])

        const { data, error, count } = paginatedResult

        if (!error && data) {
          setLessons(data)
          setTotalCount(count || 0)
        }

        // Calculate stats from all lessons
        const { data: allLessons } = allLessonsResult
        if (allLessons) {
          const stats = {
            words: allLessons.filter((l) => l.lesson_type === "word").length,
            sentences: allLessons.filter((l) => l.lesson_type === "sentence").length,
            links: allLessons.filter((l) => l.lesson_type === "link").length,
          }
          setTotalLessons(allLessons.length)
          setLessonStats(stats)
        }
      } catch (error) {
        console.error("Error fetching lessons:", error)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchLessons(currentPage, debouncedSearch, selectedType)
  }, [currentPage, debouncedSearch, selectedType, fetchLessons])

  const handleDeleteClick = (lesson: Lesson) => {
    setLessonToDelete(lesson)
    setShowDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!lessonToDelete) return

    setDeletingId(lessonToDelete.id)
    const supabase = createClient()

    // Delete the lesson - cascade will automatically delete associated reviews
    const { error } = await supabase.from("lessons").delete().eq("id", lessonToDelete.id)

    if (!error) {
      // Refresh the current page
      await fetchLessons(currentPage, debouncedSearch, selectedType)
      await fetchDashboardData(true)
    }

    setDeletingId(null)
    setShowDeleteDialog(false)
    setLessonToDelete(null)
  }

  const handleEditClick = (lesson: Lesson) => {
    setEditingLesson(lesson)
  }

  const handleEditComplete = (saved?: boolean) => {
    setEditingLesson(null)
    // Only refresh if changes were saved
    if (saved) {
      void fetchLessons(currentPage, debouncedSearch, selectedType)
      void fetchDashboardData(true)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getLessonTypeLabel = (type: string) => {
    switch (type) {
      case "word":
        return "Word"
      case "sentence":
        return "Sentence"
      case "link":
        return "Link"
      default:
        return type
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Lessons</h1>
          <p className="text-muted-foreground">Manage all your saved lessons</p>
        </div>
        <Button onClick={() => router.push("/dashboard/add")}>Add New Lesson</Button>
      </div>

      {/* Search Bar and Type Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search lessons by title, content, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md bg-muted/70 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="Select lesson type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types ({lessonStats.words + lessonStats.sentences + lessonStats.links})</SelectItem>
              <SelectItem value="word">Vocabulary ({lessonStats.words})</SelectItem>
              <SelectItem value="sentence">Sentence ({lessonStats.sentences})</SelectItem>
              <SelectItem value="link">Link ({lessonStats.links})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalLessons}</div>
            <p className="text-xs text-muted-foreground">Total Lessons</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{lessonStats.words}</div>
            <p className="text-xs text-muted-foreground">Words</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{lessonStats.sentences}</div>
            <p className="text-xs text-muted-foreground">Sentences</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{lessonStats.links}</div>
            <p className="text-xs text-muted-foreground">Links</p>
          </CardContent>
        </Card>
      </div>

      {/* Lessons List */}
      {isLoading && lessons.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">Loading lessons...</div>
      ) : lessons.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          {searchQuery || selectedType !== "all"
            ? `No ${selectedType !== "all" ? selectedType : ""} lessons found${searchQuery ? " matching your search" : ""}.`
            : "No lessons yet. Add your first lesson!"}
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} lessons
              {(searchQuery || selectedType !== "all") && " (filtered)"}
            </span>
          </div>

          <div className="space-y-3">
            {lessons.map((lesson: Lesson) => (
            <Card key={lesson.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="font-medium">{lesson.title}</h3>
                    <Badge variant="secondary">{getLessonTypeLabel(lesson.lesson_type)}</Badge>
                  </div>
                  {lesson.content && <p className="text-sm text-muted-foreground line-clamp-2">{lesson.content}</p>}
                  {lesson.lesson_type === "link" && lesson.link_url && (
                    <div className="mt-2 flex items-center gap-2">
                      <a
                        href={lesson.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1.5 text-xs text-blue-600 transition hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:hover:bg-blue-900"
                        aria-label="Open link"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                      <span className="truncate text-xs text-muted-foreground" title={lesson.link_url}>
                        {lesson.link_url}
                      </span>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lesson day {new Date(lesson.lesson_date).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-shrink-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(lesson)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteClick(lesson)}
                    disabled={deletingId === lesson.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)

                  if (!showPage) {
                    // Show ellipsis
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span key={page} className="px-2">
                          ...
                        </span>
                      )
                    }
                    return null
                  }

                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className="min-w-10"
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{lessonToDelete?.title}"? This will permanently remove the lesson and
              all associated review schedules. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deletingId ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      {editingLesson && <EditLessonDialog lesson={editingLesson} onClose={handleEditComplete} />}
    </div>
  )
}
