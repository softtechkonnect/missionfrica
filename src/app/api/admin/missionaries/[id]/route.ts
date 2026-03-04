import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      console.log("[Admin API] No auth token provided")
      return NextResponse.json({ error: "Not authenticated - no token" }, { status: 401 })
    }

    // Create Supabase client with the user's token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    console.log("[Admin API] Auth check:", { userId: user?.id, error: authError?.message })

    if (!user || authError) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Use service role client for database operations (bypasses RLS)
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify admin role
    const { data: userData } = await serviceClient
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()
    
    if (userData?.role !== "admin") {
      return NextResponse.json({ error: "Not authorized - admin only" }, { status: 403 })
    }

    const body = await request.json()
    const { action, rejectionReason } = body
    const missionaryId = params.id

    if (action === "approve") {
      // Get missionary info for email
      const { data: missionary } = await serviceClient
        .from("users")
        .select("email, full_name")
        .eq("id", missionaryId)
        .single()

      // Update user status
      const { error: userError } = await serviceClient
        .from("users")
        .update({ 
          account_status: "approved",
          public_visible: true
        })
        .eq("id", missionaryId)

      if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }

      // Update missionary profile
      await serviceClient
        .from("missionary_profiles")
        .update({ 
          approved_at: new Date().toISOString(),
          approved_by: user.id,
          rejection_reason: null
        })
        .eq("user_id", missionaryId)

      // Log audit
      await serviceClient.from("audit_logs").insert({
        user_id: user.id,
        action: "missionary_approved",
        entity_type: "user",
        entity_id: missionaryId,
      })

      // Send approval email (non-blocking)
      if (missionary?.email && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({
              to: missionary.email,
              subject: "Your MissionFrica Account Has Been Approved!",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #0ea5e9;">Account Approved!</h1>
                  <p>Dear ${missionary.full_name || 'Missionary'},</p>
                  <p>Great news! Your missionary account on MissionFrica has been <strong style="color: #16a34a;">approved</strong>.</p>
                  <p>You can now:</p>
                  <ul>
                    <li>Create and publish posts about your mission work</li>
                    <li>Receive donations from supporters</li>
                    <li>Share updates with donors</li>
                  </ul>
                  <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/missionary/dashboard" style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard</a></p>
                </div>
              `,
            }),
          })
        } catch (e) {
          console.log("Email send failed (non-critical):", e)
        }
      }

      return NextResponse.json({ success: true, message: "Missionary approved" })

    } else if (action === "reject") {
      if (!rejectionReason?.trim()) {
        return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
      }

      const { error: userError } = await serviceClient
        .from("users")
        .update({ 
          account_status: "rejected",
          public_visible: false
        })
        .eq("id", missionaryId)

      if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }

      await serviceClient
        .from("missionary_profiles")
        .update({ 
          rejection_reason: rejectionReason,
          approved_at: null,
          approved_by: null
        })
        .eq("user_id", missionaryId)

      await serviceClient.from("audit_logs").insert({
        user_id: user.id,
        action: "missionary_rejected",
        entity_type: "user",
        entity_id: missionaryId,
        metadata: { rejection_reason: rejectionReason }
      })

      return NextResponse.json({ success: true, message: "Missionary rejected" })

    } else if (action === "suspend") {
      const { error: userError } = await serviceClient
        .from("users")
        .update({ 
          account_status: "suspended",
          public_visible: false
        })
        .eq("id", missionaryId)

      if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }

      await serviceClient.from("audit_logs").insert({
        user_id: user.id,
        action: "missionary_suspended",
        entity_type: "user",
        entity_id: missionaryId,
      })

      return NextResponse.json({ success: true, message: "Missionary suspended" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error: any) {
    console.error("API error:", error)
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 })
  }
}
