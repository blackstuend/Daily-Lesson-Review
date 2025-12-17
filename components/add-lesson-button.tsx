"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LessonDialog } from "@/components/lesson-dialog"

interface AddLessonButtonProps {
    className?: string
}

export function AddLessonButton({ className }: AddLessonButtonProps) {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    return (
        <>
            <Button onClick={() => setIsOpen(true)} className={className}>
                Add New Lesson
            </Button>
            <LessonDialog
                mode="add"
                open={isOpen}
                onOpenChange={setIsOpen}
                onSuccess={() => router.refresh()}
            />
        </>
    )
}
