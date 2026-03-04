"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2
} from "lucide-react"
import { getAccountStatusColor, formatDate } from "@/lib/utils"

interface Missionary {
  id: string
  full_name: string
  email: string
  account_status: string
  created_at: string
  missionary_profiles: { id: string; organization_name: string; mission_location: string; total_raised: number }[]
}

export default function AdminMissionariesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [missionaries, setMissionaries] = useState<Missionary[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const page = parseInt(searchParams.get("page") || "1")
  const perPage = 10
  const statusFilter = searchParams.get("status") || ""
  const searchQuery = searchParams.get("search") || ""

  const statusOptions = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "under_review", label: "Under Review" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "suspended", label: "Suspended" },
  ]

  useEffect(() => {
    async function loadMissionaries() {
      setIsLoading(true)
      try {
        const supabase = createClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          window.location.href = "/auth/login"
          return
        }

        // Build query - use explicit relationship hint to avoid embed error
        const offset = (page - 1) * perPage
        let query = supabase
          .from("users")
          .select(`
            id,
            full_name,
            email,
            account_status,
            created_at,
            missionary_profiles!missionary_profiles_user_id_fkey (
              id,
              organization_name,
              mission_location,
              total_raised
            )
          `, { count: "exact" })
          .eq("role", "missionary")
          .order("created_at", { ascending: false })
          .range(offset, offset + perPage - 1)

        if (statusFilter) {
          query = query.eq("account_status", statusFilter)
        }

        if (searchQuery) {
          query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        }

        const { data, count, error: queryError } = await query

        if (queryError) {
          console.error("Query error:", queryError)
          setError(queryError.message)
        } else {
          setMissionaries(data as Missionary[] || [])
          setTotalCount(count || 0)
        }
      } catch (err: any) {
        console.error("Error loading missionaries:", err)
        setError(err?.message || "Failed to load missionaries")
      } finally {
        setIsLoading(false)
      }
    }

    loadMissionaries()
  }, [page, statusFilter, searchQuery])

  const totalPages = Math.ceil(totalCount / perPage)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-faith-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading missionaries...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/admin" className="text-blue-600 hover:underline">
            Back to Admin Dashboard
          </Link>
        </div>
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
              <Users className="h-8 w-8 text-faith-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Manage Missionaries</h1>
                <p className="text-gray-600">{totalCount} missionaries total</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <form className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    name="search"
                    placeholder="Search by name or email..."
                    defaultValue={searchQuery}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {statusOptions.map((option) => (
                  <Link
                    key={option.value}
                    href={`/admin/missionaries?status=${option.value}&search=${searchQuery || ""}`}
                  >
                    <Button
                      variant={statusFilter === option.value || (!statusFilter && !option.value) ? "default" : "outline"}
                      size="sm"
                    >
                      {option.label}
                    </Button>
                  </Link>
                ))}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Missionaries List */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-600">Missionary</th>
                    <th className="text-left p-4 font-medium text-gray-600">Organization</th>
                    <th className="text-left p-4 font-medium text-gray-600">Location</th>
                    <th className="text-left p-4 font-medium text-gray-600">Status</th>
                    <th className="text-left p-4 font-medium text-gray-600">Joined</th>
                    <th className="text-right p-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {missionaries && missionaries.length > 0 ? (
                    missionaries.map((missionary: any) => (
                      <tr key={missionary.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{missionary.full_name}</p>
                            <p className="text-sm text-gray-500">{missionary.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          {missionary.missionary_profiles?.[0]?.organization_name || "-"}
                        </td>
                        <td className="p-4">
                          {missionary.missionary_profiles?.[0]?.mission_location || "-"}
                        </td>
                        <td className="p-4">
                          <Badge className={getAccountStatusColor(missionary.account_status)}>
                            {missionary.account_status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="p-4 text-gray-500">
                          {formatDate(missionary.created_at)}
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/admin/missionaries/${missionary.id}`}>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">
                        No missionaries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/missionaries?page=${page - 1}&status=${statusFilter || ""}&search=${searchQuery || ""}`}
                  >
                    <Button variant="outline" size="sm" disabled={page <= 1}>
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                  </Link>
                  <Link
                    href={`/admin/missionaries?page=${page + 1}&status=${statusFilter || ""}&search=${searchQuery || ""}`}
                  >
                    <Button variant="outline" size="sm" disabled={page >= totalPages}>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
