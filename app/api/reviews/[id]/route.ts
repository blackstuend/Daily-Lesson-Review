import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { handleSessionError } from "@/lib/auth-error-handler"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()
    const body = await request.json()

    const { review_date, completed, completed_at } = body

    // Build update object based on what was provided
    const updates: Record<string, any> = {}

    // Handle review_date update
    if (review_date !== undefined) {
      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(review_date)) {
        return NextResponse.json(
          { error: "Invalid date format. Expected YYYY-MM-DD" },
          { status: 400 }
        )
      }
      updates.review_date = review_date
    }

    // Handle completion status update
    if (completed !== undefined) {
      updates.completed = completed
      updates.completed_at = completed_at
    }

    // Ensure at least one field is being updated
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("review_schedule")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      handleSessionError(error)
      return NextResponse.json(
        { error: error?.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    handleSessionError(error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
