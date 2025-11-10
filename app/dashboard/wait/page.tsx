"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Clock, Loader2, Pencil, Play, Search, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { AddWaitingLessonDialog } from "@/components/add-waiting-lesson-dialog"
import { EditWaitingLessonDialog, type WaitingLesson } from "@/components/edit-waiting-lesson-dialog"
import { toast } from "@/hooks/use-toast"
import { useDashboardStore } from "@/stores/dashboard-store"

type LessonType = "link" | "word" | "sentence"

const lessonTypeOptions: { value: LessonType; label: string }[] = [
  { value: "word", label: "Word" },
  { value: "sentence", label: "Sentence" },
  { value: "link", label: "Link" },
]

export default function WaitingLessonsPage() {
  const [lessons, setLessons] = useState<WaitingLesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [editingLesson, setEditingLesson] = useState<WaitingLesson | null>(null)
  const [lessonToDelete, setLessonToDelete] = useState<WaitingLesson | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [promotingId, setPromotingId] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const fetchDashboardData = useDashboardStore((state) => state.fetchDashboardData)

  const fetchWaitingLessons = useCallback(async () => {
    const supabase = createClient()
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("waiting_lessons")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setLessons(data ?? [])
    } catch (error) {
      toast({
        title: "Unable to load waiting lessons",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchWaitingLessons()
  }, [fetchWaitingLessons])

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) => {
      if (filterType !== "all" && lesson.lesson_type !== filterType) {
        return false
      }
      if (!searchTerm.trim()) {
        return true
      }
      const term = searchTerm.toLowerCase()
      return (
        lesson.title.toLowerCase().includes(term) ||
        (lesson.content ?? "").toLowerCase().includes(term)
      )
    })
  }, [lessons, searchTerm, filterType])

  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return
    setDeletingId(lessonToDelete.id)
    const supabase = createClient()
    try {
      const { error } = await supabase.from("waiting_lessons").delete().eq("id", lessonToDelete.id)
      if (error) throw error
      toast({ title: "Waiting lesson removed" })
      setLessonToDelete(null)
      await fetchWaitingLessons()
    } catch (error) {
      toast({
        title: "Unable to delete waiting lesson",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const handlePromoteLesson = async (lesson: WaitingLesson) => {
    setPromotingId(lesson.id)
    const supabase = createClient()
    try {
      const { error } = await supabase.rpc("promote_waiting_lesson", {
        p_waiting_lesson_id: lesson.id,
        p_lesson_date: format(new Date(), "yyyy-MM-dd"),
      })
      if (error) throw error
      toast({ title: "Lesson moved to your study list" })
      await Promise.all([fetchWaitingLessons(), fetchDashboardData(true)])
    } catch (error) {
      toast({
        title: "Unable to start this lesson",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      })
    } finally {
      setPromotingId(null)
    }
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Waiting List</h1>
          <p className="text-muted-foreground">
            Capture lessons you want to study later. Move them into your main lesson list whenever you are ready.
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          Add to waiting list
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Waiting lessons</CardTitle>
              <CardDescription>Manage, edit, or start lessons right from this list.</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search titles or notes"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {lessonTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading waiting lessons
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
              No waiting lessons yet. Add one above to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLessons.map((lesson) => (
                <div key={lesson.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{lesson.title}</h3>
                        <Badge variant="secondary">{lesson.lesson_type}</Badge>
                        {lesson.planned_start_date && (
                          <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(lesson.planned_start_date), "MMM d")}
                          </div>
                        )}
                      </div>
                      {lesson.content && (
                        <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{lesson.content}</p>
                      )}
                      {lesson.lesson_type === "link" && lesson.link_url && (
                        <a
                          href={lesson.link_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-sm text-blue-600 hover:underline"
                        >
                          Open link
                        </a>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="default"
                        onClick={() => handlePromoteLesson(lesson)}
                        disabled={promotingId === lesson.id}
                      >
                        {promotingId === lesson.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Play className="mr-2 h-4 w-4" />
                        )}
                        Start studying
                      </Button>
                      <Button variant="outline" onClick={() => setEditingLesson(lesson)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </Button>
                      <Button variant="destructive" onClick={() => setLessonToDelete(lesson)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editingLesson && (
        <EditWaitingLessonDialog
          lesson={editingLesson}
          onClose={(saved) => {
            setEditingLesson(null)
            if (saved) {
              void fetchWaitingLessons()
            }
          }}
        />
      )}

      <AlertDialog open={!!lessonToDelete} onOpenChange={(open) => !open && setLessonToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete waiting lesson</AlertDialogTitle>
            <AlertDialogDescription>
              This lesson will be permanently removed from your waiting list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLesson} disabled={!!deletingId} className="bg-destructive text-white hover:bg-destructive/90">
              {deletingId ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddWaitingLessonDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onCreated={() => {
          setIsAddDialogOpen(false)
          void fetchWaitingLessons()
        }}
      />
    </div>
  )
}
