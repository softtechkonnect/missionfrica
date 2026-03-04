"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Loader2
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Withdrawal {
  id: string
  amount: number
  status: string
  created_at: string
  processed_at: string | null
  missionary_profiles: {
    users: { full_name: string; email: string }
  }
}

export default function AdminWithdrawalsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    loadWithdrawals()
  }, [])

  async function loadWithdrawals() {
    setIsLoading(true)
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = "/auth/login"
        return
      }

      const { data, error: queryError } = await supabase
        .from("withdrawals")
        .select(`
          id,
          amount,
          status,
          created_at,
          processed_at,
          missionary_id
        `)
        .order("created_at", { ascending: false })

      if (queryError) {
        setError(queryError.message)
      } else {
        setWithdrawals(data as any || [])
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load withdrawals")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleApprove(id: string) {
    setProcessingId(id)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("withdrawals")
        .update({ status: "approved", processed_at: new Date().toISOString() })
        .eq("id", id)

      if (!error) {
        loadWithdrawals()
      }
    } catch (err) {
      console.error("Error approving withdrawal:", err)
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(id: string) {
    setProcessingId(id)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("withdrawals")
        .update({ status: "rejected", processed_at: new Date().toISOString() })
        .eq("id", id)

      if (!error) {
        loadWithdrawals()
      }
    } catch (err) {
      console.error("Error rejecting withdrawal:", err)
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "approved":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      case "rejected":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-faith-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-faith-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
              <p className="text-gray-600">{withdrawals.length} withdrawal requests</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4 text-red-600">{error}</CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-600">Missionary</th>
                    <th className="text-left p-4 font-medium text-gray-600">Amount</th>
                    <th className="text-left p-4 font-medium text-gray-600">Status</th>
                    <th className="text-left p-4 font-medium text-gray-600">Requested</th>
                    <th className="text-right p-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.length > 0 ? (
                    withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <p className="font-medium">Missionary</p>
                          <p className="text-sm text-gray-500">ID: {withdrawal.id.slice(0, 8)}...</p>
                        </td>
                        <td className="p-4 font-semibold text-green-600">
                          {formatCurrency(withdrawal.amount)}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(withdrawal.status)}
                        </td>
                        <td className="p-4 text-gray-500">
                          {formatDate(withdrawal.created_at)}
                        </td>
                        <td className="p-4 text-right">
                          {withdrawal.status === "pending" && (
                            <div className="flex gap-2 justify-end">
                              <Button 
                                size="sm" 
                                onClick={() => handleApprove(withdrawal.id)}
                                disabled={processingId === withdrawal.id}
                              >
                                {processingId === withdrawal.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => handleReject(withdrawal.id)}
                                disabled={processingId === withdrawal.id}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        No withdrawal requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
