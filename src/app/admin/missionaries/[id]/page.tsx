"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ChevronLeft,
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  FileText,
  Calendar,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react"
import { getAccountStatusColor, formatDate, formatCurrency } from "@/lib/utils"
import { MissionaryActionButtons } from "./action-buttons"

interface MissionaryData {
  id: string
  full_name: string
  email: string
  account_status: string
  email_verified: boolean
  created_at: string
  missionary_profiles: any[]
}

export default function AdminMissionaryDetailPage() {
  const params = useParams()
  const missionaryId = params.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [missionary, setMissionary] = useState<MissionaryData | null>(null)
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null)
  const [stats, setStats] = useState({ postsCount: 0, totalDonations: 0, totalAmount: 0 })

  useEffect(() => {
    async function loadMissionary() {
      setIsLoading(true)
      try {
        const supabase = createClient()
        
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          window.location.href = "/auth/login"
          return
        }

        // Get missionary details - use explicit relationship hint
        const { data: missionaryData, error: missionaryError } = await supabase
          .from("users")
          .select(`
            *,
            missionary_profiles!missionary_profiles_user_id_fkey (*)
          `)
          .eq("id", missionaryId)
          .eq("role", "missionary")
          .single()

        if (missionaryError || !missionaryData) {
          console.error("Missionary fetch error:", missionaryError)
          setError("Missionary not found")
          setIsLoading(false)
          return
        }

        console.log("Missionary data loaded:", {
          id: missionaryData.id,
          name: missionaryData.full_name,
          profilesCount: missionaryData.missionary_profiles?.length,
          profiles: missionaryData.missionary_profiles
        })

        setMissionary(missionaryData as MissionaryData)
        const profile = missionaryData.missionary_profiles?.[0]
        
        if (!profile) {
          console.warn("No missionary profile found for user:", missionaryId)
        }

        // Get signed URL for certificate if exists
        if (profile?.certificate_url) {
          const { data } = await supabase.storage
            .from("certificates")
            .createSignedUrl(profile.certificate_url, 3600)
          setCertificateUrl(data?.signedUrl || null)
        }

        // Get posts count
        const { count: postsCount } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("missionary_id", profile?.id)

        // Get donations count and total
        const { data: donations } = await supabase
          .from("donations")
          .select("amount, net_amount")
          .eq("missionary_id", profile?.id)
          .eq("status", "completed")

        const totalDonations = donations?.length || 0
        const totalAmount = donations?.reduce((sum: number, d: any) => sum + (d.net_amount || 0), 0) || 0

        setStats({ postsCount: postsCount || 0, totalDonations, totalAmount })
      } catch (err: any) {
        console.error("Error loading missionary:", err)
        setError(err?.message || "Failed to load missionary")
      } finally {
        setIsLoading(false)
      }
    }

    loadMissionary()
  }, [missionaryId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-faith-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading missionary details...</p>
        </div>
      </div>
    )
  }

  if (error || !missionary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error || "Missionary not found"}</p>
          <Link href="/admin/missionaries" className="text-blue-600 hover:underline">
            Back to Missionaries
          </Link>
        </div>
      </div>
    )
  }

  const profile = missionary.missionary_profiles?.[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/admin/missionaries">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Missionaries
              </Button>
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-faith-100 flex items-center justify-center">
                <User className="h-8 w-8 text-faith-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{missionary.full_name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getAccountStatusColor(missionary.account_status)}>
                    {missionary.account_status.replace("_", " ")}
                  </Badge>
                  {profile?.stripe_onboarding_complete && (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Stripe Connected
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <MissionaryActionButtons 
              missionaryId={missionary.id}
              currentStatus={missionary.account_status}
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!profile && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 font-medium">⚠️ No missionary profile found</p>
            <p className="text-amber-700 text-sm mt-1">
              This missionary has not completed their onboarding form yet. Profile data will appear once they submit their onboarding information.
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{missionary.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {missionary.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {profile?.phone || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">WhatsApp</p>
                    <p className="font-medium">{profile?.whatsapp || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Created</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(missionary.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Verified</p>
                    <p className="font-medium">
                      {missionary.email_verified ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Yes
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center gap-1">
                          <XCircle className="h-4 w-4" />
                          No
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organization Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Organization Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Organization Name</p>
                    <p className="font-medium">{profile?.organization_name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Organization Type</p>
                    <p className="font-medium capitalize">
                      {profile?.organization_type?.replace("_", " ") || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mission Location</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profile?.mission_location || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Role in Organization</p>
                    <p className="font-medium">{profile?.role_in_org || "-"}</p>
                  </div>
                  {profile?.organization_type === "church_extension" && (
                    <div>
                      <p className="text-sm text-gray-500">Church Registered</p>
                      <p className="font-medium">
                        {profile?.is_church_registered ? "Yes" : "No"}
                      </p>
                    </div>
                  )}
                  {profile?.organization_type === "independent" && (
                    <div>
                      <p className="text-sm text-gray-500">Registration Number</p>
                      <p className="font-medium">{profile?.registration_number || "-"}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Certificate */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Registration Certificate
                </CardTitle>
              </CardHeader>
              <CardContent>
                {certificateUrl ? (
                  <div className="border rounded-lg p-4">
                    <a
                      href={certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-faith-600 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Certificate Document
                    </a>
                    <p className="text-sm text-gray-500 mt-2">
                      File: {profile?.certificate_url}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500">No certificate uploaded</p>
                )}
              </CardContent>
            </Card>

            {/* Rejection Reason (if rejected) */}
            {missionary.account_status === "rejected" && profile?.rejection_reason && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600 flex items-center gap-2">
                    <XCircle className="h-5 w-5" />
                    Rejection Reason
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{profile.rejection_reason}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Raised</span>
                  <span className="font-semibold">{formatCurrency(stats.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Donations Received</span>
                  <span className="font-semibold">{stats.totalDonations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Posts</span>
                  <span className="font-semibold">{stats.postsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Terms Accepted</span>
                  <span className="font-semibold">
                    {profile?.terms_accepted ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-red-600">No</span>
                    )}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 w-px bg-gray-200 my-1"></div>
                    </div>
                    <div>
                      <p className="font-medium">Account Created</p>
                      <p className="text-sm text-gray-500">{formatDate(missionary.created_at)}</p>
                    </div>
                  </div>
                  {profile?.terms_accepted_at && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 w-px bg-gray-200 my-1"></div>
                      </div>
                      <div>
                        <p className="font-medium">Profile Submitted</p>
                        <p className="text-sm text-gray-500">{formatDate(profile.terms_accepted_at)}</p>
                      </div>
                    </div>
                  )}
                  {profile?.approved_at && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium">Profile Approved</p>
                        <p className="text-sm text-gray-500">{formatDate(profile.approved_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
