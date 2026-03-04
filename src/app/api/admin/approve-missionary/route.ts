import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminCheck } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!adminCheck || adminCheck.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { missionaryId, action } = await request.json()

    if (!missionaryId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get missionary details
    const { data: missionary, error: fetchError } = await supabase
      .from("users")
      .select("id, email, full_name")
      .eq("id", missionaryId)
      .single()

    if (fetchError || !missionary) {
      return NextResponse.json({ error: "Missionary not found" }, { status: 404 })
    }

    if (action === "approve") {
      // Update account status
      const { error: updateError } = await supabase
        .from("users")
        .update({ account_status: "approved" })
        .eq("id", missionaryId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Send approval email via Supabase Edge Function or direct SMTP
      // For now, we'll use Supabase's built-in email (via auth.admin)
      try {
        const emailResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-approval-email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              to: missionary.email,
              name: missionary.full_name,
              type: "approved",
            }),
          }
        )
        
        // Log email attempt (don't fail if email fails)
        console.log("Approval email sent:", emailResponse.ok)
      } catch (emailErr) {
        console.error("Failed to send approval email:", emailErr)
        // Continue anyway - don't fail the approval just because email failed
      }

      return NextResponse.json({ 
        success: true, 
        message: "Missionary approved successfully",
        email: missionary.email 
      })

    } else if (action === "reject") {
      // Update account status to rejected
      const { error: updateError } = await supabase
        .from("users")
        .update({ account_status: "suspended" })
        .eq("id", missionaryId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: "Missionary application rejected" 
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error: any) {
    console.error("Approval error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
