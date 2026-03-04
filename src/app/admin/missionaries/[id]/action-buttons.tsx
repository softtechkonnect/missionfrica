"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { 
  CheckCircle, 
  XCircle, 
  Ban,
  Loader2
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface MissionaryActionButtonsProps {
  missionaryId: string
  currentStatus: string
}

export function MissionaryActionButtons({ 
  missionaryId, 
  currentStatus 
}: MissionaryActionButtonsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleApprove = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Get fresh session token
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setError("Session expired. Please refresh the page and try again.")
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/admin/missionaries/${missionaryId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        credentials: "include",
        body: JSON.stringify({ action: "approve" })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        setError(result.error || "Failed to approve")
      } else {
        setSuccess("Missionary approved successfully!")
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    }
    
    setIsLoading(false)
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setError("Session expired. Please refresh the page and try again.")
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/admin/missionaries/${missionaryId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        credentials: "include",
        body: JSON.stringify({ action: "reject", rejectionReason })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        setError(result.error || "Failed to reject")
      } else {
        setShowRejectForm(false)
        setSuccess("Missionary rejected")
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    }
    
    setIsLoading(false)
  }

  const handleSuspend = async () => {
    if (!confirm("Are you sure you want to suspend this missionary?")) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.access_token) {
        setError("Session expired. Please refresh the page and try again.")
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/admin/missionaries/${missionaryId}`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        credentials: "include",
        body: JSON.stringify({ action: "suspend" })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        setError(result.error || "Failed to suspend")
      } else {
        setSuccess("Missionary suspended")
        setTimeout(() => window.location.reload(), 1000)
      }
    } catch (err: any) {
      setError(err.message || "An error occurred")
    }
    
    setIsLoading(false)
  }

  if (showRejectForm) {
    return (
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg max-w-md">
        <p className="font-medium text-red-600">Reject Missionary</p>
        <Textarea
          placeholder="Enter reason for rejection..."
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          rows={3}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Rejection"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowRejectForm(false)
              setRejectionReason("")
              setError(null)
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {error && <p className="text-sm text-red-600 mr-2">{error}</p>}
      {success && <p className="text-sm text-green-600 mr-2">{success}</p>}
      
      {(currentStatus === "under_review" || currentStatus === "rejected") && (
        <Button
          onClick={handleApprove}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          Approve
        </Button>
      )}

      {(currentStatus === "under_review" || currentStatus === "pending") && (
        <Button
          variant="destructive"
          onClick={() => setShowRejectForm(true)}
          disabled={isLoading}
          className="gap-2"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </Button>
      )}

      {currentStatus === "approved" && (
        <Button
          variant="destructive"
          onClick={handleSuspend}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Ban className="h-4 w-4" />
          )}
          Suspend
        </Button>
      )}

      {currentStatus === "suspended" && (
        <Button
          onClick={handleApprove}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          Reactivate
        </Button>
      )}
    </div>
  )
}
