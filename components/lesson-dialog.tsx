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
import { toast } from "@/hooks/use-toast"
import { useDashboardStore } from "@/stores/dashboard-store"
import { LinkLessonSelector } from "@/components/link-lesson-selector"
import { generateTTSForLesson } from "@/lib/tts-utils"
import { useTTSStore } from "@/stores/tts-store"

type LessonType = "link" | "word" | "sentence"

// Existing lesson type (for edit mode)
export type Lesson = {
    id: string
    title: string
    content: string | null
    lesson_type: LessonType
    link_url: string | null
    lesson_date: string
    linked_lesson_id: string | null
}

// Waiting lesson type (for edit-waiting mode)
export type WaitingLesson = {
    id: string
    title: string
    content: string | null
    lesson_type: LessonType
    link_url: string | null
    planned_start_date: string | null
}

type DialogMode = "add" | "edit" | "add-waiting" | "edit-waiting" | "add-linked"

interface LessonDialogBaseProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface AddModeProps extends LessonDialogBaseProps {
    mode: "add"
}

interface EditModeProps extends LessonDialogBaseProps {
    mode: "edit"
    lesson: Lesson
}

interface AddWaitingModeProps extends LessonDialogBaseProps {
    mode: "add-waiting"
}

interface EditWaitingModeProps extends LessonDialogBaseProps {
    mode: "edit-waiting"
    lesson: WaitingLesson
}

interface AddLinkedModeProps extends LessonDialogBaseProps {
    mode: "add-linked"
    linkedLessonId: string
    linkedLessonTitle: string
}

export type LessonDialogProps =
    | AddModeProps
    | EditModeProps
    | AddWaitingModeProps
    | EditWaitingModeProps
    | AddLinkedModeProps

const lessonTypeOptions: { value: LessonType; label: string }[] = [
    { value: "word", label: "Difficult Word" },
    { value: "sentence", label: "Difficult Sentence" },
    { value: "link", label: "Link" },
]

// Waiting modes only allow word/sentence/link but show simpler labels
const waitingLessonTypeOptions: { value: LessonType; label: string }[] = [
    { value: "word", label: "Word" },
    { value: "sentence", label: "Sentence" },
    { value: "link", label: "Link" },
]

function getDialogTitle(mode: DialogMode): string {
    switch (mode) {
        case "add": return "Add New Lesson"
        case "edit": return "Edit Lesson"
        case "add-waiting": return "Add Waiting Lesson"
        case "edit-waiting": return "Edit Waiting Lesson"
        case "add-linked": return "Add Linked Lesson"
    }
}

function getDialogDescription(mode: DialogMode, linkedTitle?: string): string {
    switch (mode) {
        case "add": return "Save a link, word, or sentence to review later"
        case "edit": return "Make changes to your lesson. Click save when you're done."
        case "add-waiting": return "Add links, vocabulary, or sentences you want to study later."
        case "edit-waiting": return "Update the details for this waiting lesson."
        case "add-linked": return `Add a new word or sentence lesson that references "${linkedTitle}".`
    }
}

export function LessonDialog(props: LessonDialogProps) {
    const { open, onOpenChange, mode } = props

    // Form state
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
    const [plannedDate, setPlannedDate] = useState<Date | null>(null)
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
    const [isPlannedDatePickerOpen, setIsPlannedDatePickerOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchDashboardData = useDashboardStore((state) => state.fetchDashboardData)
    const accent = useTTSStore((state) => state.accent)

    // Determine what fields to show based on mode
    const isWaitingMode = mode === "add-waiting" || mode === "edit-waiting"
    const isLinkedMode = mode === "add-linked"
    const showLessonDate = mode === "add" || mode === "edit"
    const showPlannedDate = mode === "add-waiting" || mode === "edit-waiting"
    const showLinkedLessonSelector = (mode === "add" || mode === "edit") && lessonType !== "link"
    const showLinkUrl = lessonType === "link"
    const showLinkedToInfo = isLinkedMode

    // In linked mode, only word/sentence allowed
    const availableLessonTypes = isLinkedMode
        ? [{ value: "word" as LessonType, label: "Word" }, { value: "sentence" as LessonType, label: "Sentence" }]
        : isWaitingMode
            ? waitingLessonTypeOptions
            : lessonTypeOptions

    // Reset form when dialog opens or lesson changes
    useEffect(() => {
        if (!open) return

        if (mode === "edit" && "lesson" in props) {
            const lesson = props.lesson
            setTitle(lesson.title)
            setContent(lesson.content || "")
            setLessonType(lesson.lesson_type)
            setLinkUrl(lesson.link_url || "")
            setLinkedLessonId(lesson.linked_lesson_id)
            const date = lesson.lesson_date ? new Date(lesson.lesson_date) : new Date()
            date.setHours(0, 0, 0, 0)
            setLessonDate(date)
            setPlannedDate(null)
        } else if (mode === "edit-waiting" && "lesson" in props) {
            const lesson = props.lesson as WaitingLesson
            setTitle(lesson.title)
            setContent(lesson.content || "")
            setLessonType(lesson.lesson_type)
            setLinkUrl(lesson.link_url || "")
            setLinkedLessonId(null)
            if (lesson.planned_start_date) {
                const date = new Date(lesson.planned_start_date)
                date.setHours(0, 0, 0, 0)
                setPlannedDate(date)
            } else {
                setPlannedDate(null)
            }
        } else {
            // Reset for add modes
            setTitle("")
            setContent("")
            setLessonType("word")
            setLinkUrl("")
            setLinkedLessonId(isLinkedMode && "linkedLessonId" in props ? props.linkedLessonId : null)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            setLessonDate(today)
            setPlannedDate(null)
        }
        setError(null)
        setIsDatePickerOpen(false)
        setIsPlannedDatePickerOpen(false)
    }, [open, mode, props])

    const handleLessonTypeChange = (value: string) => {
        const nextType = value as LessonType
        setLessonType(nextType)
        if (nextType === "link") {
            setLinkedLessonId(null)
        }
    }

    const handleClose = (saved?: boolean) => {
        if (!isSaving) {
            onOpenChange(false)
            if (saved) {
                toast({ title: getSuccessMessage(mode) })
            }
        }
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setIsSaving(true)
        setError(null)

        const supabase = createClient()

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser()
            if (userError) throw userError
            if (!user) throw new Error("You must be signed in")

            if (mode === "add" || mode === "add-linked") {
                await handleAddLesson(supabase, user.id)
            } else if (mode === "edit") {
                await handleEditLesson(supabase)
            } else if (mode === "add-waiting") {
                await handleAddWaitingLesson(supabase, user.id)
            } else if (mode === "edit-waiting") {
                await handleEditWaitingLesson(supabase)
            }

            await fetchDashboardData(true)
            handleClose(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred")
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddLesson = async (supabase: ReturnType<typeof createClient>, userId: string) => {
        const lessonDateString = format(lessonDate, "yyyy-MM-dd")
        const isWordOrSentence = lessonType === "word" || lessonType === "sentence"

        if (isWordOrSentence) {
            const lessonId = crypto.randomUUID()
            const ttsData = await generateTTSForLesson({
                lessonId,
                text: title,
                accent,
                skipDatabaseUpdate: true,
            })

            const { error: insertError } = await supabase
                .from("lessons")
                .insert({
                    id: lessonId,
                    user_id: userId,
                    title,
                    content: content || null,
                    lesson_type: lessonType,
                    link_url: null,
                    linked_lesson_id: mode === "add-linked" && "linkedLessonId" in props ? props.linkedLessonId : linkedLessonId,
                    lesson_date: lessonDateString,
                    tts_audio_url: ttsData?.audioUrl || null,
                    tts_audio_accent: ttsData?.accent || null,
                    tts_audio_generated_at: ttsData?.generatedAt || null,
                })

            if (insertError) throw insertError
        } else {
            const { error: insertError } = await supabase
                .from("lessons")
                .insert({
                    user_id: userId,
                    title,
                    content: content || null,
                    lesson_type: lessonType,
                    link_url: linkUrl,
                    linked_lesson_id: null,
                    lesson_date: lessonDateString,
                })

            if (insertError) throw insertError
        }
    }

    const handleEditLesson = async (supabase: ReturnType<typeof createClient>) => {
        if (mode !== "edit" || !("lesson" in props)) return

        const lessonDateString = format(lessonDate, "yyyy-MM-dd")
        const { error: updateError } = await supabase
            .from("lessons")
            .update({
                title,
                content: content || null,
                lesson_type: lessonType,
                link_url: lessonType === "link" ? linkUrl : null,
                linked_lesson_id: lessonType === "link" ? null : linkedLessonId,
                lesson_date: lessonDateString,
                updated_at: new Date().toISOString(),
            })
            .eq("id", props.lesson.id)

        if (updateError) throw updateError
    }

    const handleAddWaitingLesson = async (supabase: ReturnType<typeof createClient>, userId: string) => {
        const formattedDate = plannedDate ? format(plannedDate, "yyyy-MM-dd") : null
        const { error: insertError } = await supabase.from("waiting_lessons").insert({
            user_id: userId,
            title,
            content: content || null,
            lesson_type: lessonType,
            link_url: lessonType === "link" ? linkUrl : null,
            planned_start_date: formattedDate,
        })

        if (insertError) throw insertError
    }

    const handleEditWaitingLesson = async (supabase: ReturnType<typeof createClient>) => {
        if (mode !== "edit-waiting" || !("lesson" in props)) return

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
            .eq("id", (props.lesson as WaitingLesson).id)

        if (updateError) throw updateError
    }

    const getSuccessMessage = (m: DialogMode): string => {
        switch (m) {
            case "add": return "Lesson added"
            case "edit": return "Lesson updated"
            case "add-waiting": return "Lesson added to waiting list"
            case "edit-waiting": return "Waiting lesson updated"
            case "add-linked": return "Linked lesson added"
        }
    }

    const linkedTitle = mode === "add-linked" && "linkedLessonTitle" in props ? props.linkedLessonTitle : undefined

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                    <DialogTitle>{getDialogTitle(mode)}</DialogTitle>
                    <DialogDescription>{getDialogDescription(mode, linkedTitle)}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Lesson Type */}
                    <div className="space-y-2">
                        <Label htmlFor="lesson-type">Lesson Type</Label>
                        <Select value={lessonType} onValueChange={handleLessonTypeChange}>
                            <SelectTrigger id="lesson-type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {availableLessonTypes.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="lesson-title">Title</Label>
                        <Input
                            id="lesson-title"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={
                                lessonType === "word"
                                    ? "e.g., 'Ephemeral'"
                                    : lessonType === "sentence"
                                        ? "e.g., 'It was a serendipitous encounter'"
                                        : "e.g., 'React Hooks Tutorial'"
                            }
                            autoFocus={mode === "add" || mode === "add-linked" || mode === "add-waiting"}
                        />
                    </div>

                    {/* Link URL (for link type) */}
                    {showLinkUrl && (
                        <div className="space-y-2">
                            <Label htmlFor="lesson-url">URL</Label>
                            <Input
                                id="lesson-url"
                                type="url"
                                required
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://example.com/article"
                            />
                        </div>
                    )}

                    {/* Lesson Date (for add/edit non-waiting lessons) */}
                    {showLessonDate && (
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
                                            }
                                            setIsDatePickerOpen(false)
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    {/* Planned Date (for edit-waiting) */}
                    {showPlannedDate && (
                        <div className="space-y-2">
                            <Label>Target Start Date (optional)</Label>
                            <Popover open={isPlannedDatePickerOpen} onOpenChange={setIsPlannedDatePickerOpen}>
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
                                            setIsPlannedDatePickerOpen(false)
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    {/* Linked Lesson Selector (for add/edit non-link lessons) */}
                    {showLinkedLessonSelector && (
                        <LinkLessonSelector
                            id="linked-lesson"
                            value={linkedLessonId}
                            onChange={setLinkedLessonId}
                            label="Related Link (optional)"
                        />
                    )}

                    {/* Linked To Info (for add-linked mode) */}
                    {showLinkedToInfo && linkedTitle && (
                        <div className="rounded-md border bg-muted/50 p-3">
                            <p className="text-sm text-muted-foreground">
                                <span className="font-medium">Linked to:</span> {linkedTitle}
                            </p>
                        </div>
                    )}

                    {/* Content/Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="lesson-content">
                            {lessonType === "link" ? "Notes" : lessonType === "word" ? "Definition" : "Sentence"}
                        </Label>
                        <Textarea
                            id="lesson-content"
                            rows={4}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={
                                lessonType === "link"
                                    ? "Add notes about this link (optional)..."
                                    : lessonType === "word"
                                        ? "Enter the definition (optional)..."
                                        : "Enter the sentence (optional)..."
                            }
                        />
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleClose()} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? "Saving..." : mode.startsWith("edit") ? "Save Changes" : "Add Lesson"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
