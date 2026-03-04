"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options?: any }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore
          }
        },
      },
    }
  )
}

export async function approveMissionary(missionaryId: string, currentStatus: string) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Get missionary email for notification
  const { data: missionary } = await supabase
    .from("users")
    .select("email, full_name")
    .eq("id", missionaryId)
    .single()

  // Update user status
  const { error: userError } = await supabase
    .from("users")
    .update({ 
      account_status: "approved",
      public_visible: true
    })
    .eq("id", missionaryId)

  if (userError) {
    return { error: userError.message }
  }

  // Update missionary profile
  const { error: profileError } = await supabase
    .from("missionary_profiles")
    .update({ 
      approved_at: new Date().toISOString(),
      approved_by: user.id,
      rejection_reason: null
    })
    .eq("user_id", missionaryId)

  if (profileError) {
    return { error: profileError.message }
  }

  // Log audit
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "missionary_approved",
    entity_type: "user",
    entity_id: missionaryId,
    metadata: { previous_status: currentStatus }
  })

  // Send approval email notification
  if (missionary?.email) {
    try {
      // Use Supabase's built-in email via Edge Function or direct API
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
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
              <p>Thank you for being part of MissionFrica!</p>
            </div>
          `,
        }),
      })
      console.log("Approval email sent:", response.ok)
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError)
      // Don't fail the approval if email fails
    }
  }

  revalidatePath(`/admin/missionaries/${missionaryId}`)
  revalidatePath("/admin/missionaries")
  
  return { success: true, email: missionary?.email }
}

export async function rejectMissionary(
  missionaryId: string, 
  currentStatus: string,
  rejectionReason: string
) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  if (!rejectionReason.trim()) {
    return { error: "Rejection reason is required" }
  }

  // Update user status
  const { error: userError } = await supabase
    .from("users")
    .update({ 
      account_status: "rejected",
      public_visible: false
    })
    .eq("id", missionaryId)

  if (userError) {
    return { error: userError.message }
  }

  // Update missionary profile
  const { error: profileError } = await supabase
    .from("missionary_profiles")
    .update({ 
      rejection_reason: rejectionReason,
      approved_at: null,
      approved_by: null
    })
    .eq("user_id", missionaryId)

  if (profileError) {
    return { error: profileError.message }
  }

  // Log audit
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "missionary_rejected",
    entity_type: "user",
    entity_id: missionaryId,
    metadata: { 
      previous_status: currentStatus,
      rejection_reason: rejectionReason
    }
  })

  revalidatePath(`/admin/missionaries/${missionaryId}`)
  revalidatePath("/admin/missionaries")
  
  return { success: true }
}

export async function suspendMissionary(missionaryId: string, currentStatus: string) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Update user status
  const { error: userError } = await supabase
    .from("users")
    .update({ 
      account_status: "suspended",
      public_visible: false
    })
    .eq("id", missionaryId)

  if (userError) {
    return { error: userError.message }
  }

  // Log audit
  await supabase.from("audit_logs").insert({
    user_id: user.id,
    action: "missionary_suspended",
    entity_type: "user",
    entity_id: missionaryId,
    metadata: { previous_status: currentStatus }
  })

  revalidatePath(`/admin/missionaries/${missionaryId}`)
  revalidatePath("/admin/missionaries")
  
  return { success: true }
}
