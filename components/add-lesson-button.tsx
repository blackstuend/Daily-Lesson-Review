"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LessonDialog } from "@/components/lesson-dialog"

interface AddLessonButtonProps {
    className?: string
}

export function AddLessonButton({ className }: AddLessonButtonProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Button onClick={() => setIsOpen(true)} className={className}>
                Add New Lesson
            </Button>
            <LessonDialog
                mode="add"
                open={isOpen}
                onOpenChange={setIsOpen}
            />
        </>
    )
}
