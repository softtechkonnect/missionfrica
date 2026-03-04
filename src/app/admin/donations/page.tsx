"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Loader2
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Donation {
  id: string
  amount: number
  net_amount: number
  platform_fee: number
  status: string
  created_at: string
  donor_name: string
  donor_email: string
  is_anonymous: boolean
}

export default function AdminDonationsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [donations, setDonations] = useState<Donation[]>([])
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalFees, setTotalFees] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDonations() {
      setIsLoading(true)
      try {
        const supabase = createClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          window.location.href = "/auth/login"
          return
        }

        const { data, error: queryError } = await supabase
          .from("donations")
          .select(`
            id,
            amount,
            net_amount,
            platform_fee,
            status,
            created_at,
            donor_name,
            donor_email,
            is_anonymous
          `)
          .order("created_at", { ascending: false })

        if (queryError) {
          setError(queryError.message)
        } else {
          setDonations(data as Donation[] || [])
          const completed = data?.filter(d => d.status === "completed") || []
          setTotalAmount(completed.reduce((sum, d) => sum + (d.amount || 0), 0))
          setTotalFees(completed.reduce((sum, d) => sum + (d.platform_fee || 0), 0))
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load donations")
      } finally {
        setIsLoading(false)
      }
    }

    loadDonations()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
      case "failed":
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-faith-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">All Donations</h1>
                <p className="text-gray-600">{donations.length} donations total</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Raised</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
              <p className="text-sm text-gray-500">Platform fees: {formatCurrency(totalFees)}</p>
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
                    <th className="text-left p-4 font-medium text-gray-600">Donor</th>
                    <th className="text-left p-4 font-medium text-gray-600">Amount</th>
                    <th className="text-left p-4 font-medium text-gray-600">Net</th>
                    <th className="text-left p-4 font-medium text-gray-600">Fee</th>
                    <th className="text-left p-4 font-medium text-gray-600">Status</th>
                    <th className="text-left p-4 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.length > 0 ? (
                    donations.map((donation) => (
                      <tr key={donation.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          {donation.is_anonymous ? (
                            <p className="text-gray-500 italic">Anonymous</p>
                          ) : (
                            <>
                              <p className="font-medium">{donation.donor_name || "Guest"}</p>
                              <p className="text-sm text-gray-500">{donation.donor_email}</p>
                            </>
                          )}
                        </td>
                        <td className="p-4 font-semibold">
                          {formatCurrency(donation.amount)}
                        </td>
                        <td className="p-4 text-green-600">
                          {formatCurrency(donation.net_amount)}
                        </td>
                        <td className="p-4 text-gray-500">
                          {formatCurrency(donation.platform_fee)}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(donation.status)}
                        </td>
                        <td className="p-4 text-gray-500">
                          {formatDate(donation.created_at)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        No donations found
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
