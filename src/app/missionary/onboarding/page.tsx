"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Heart, Loader2, Upload, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { missionaryProfileSchema, type MissionaryProfileInput } from "@/lib/validations/auth"

export default function MissionaryOnboardingPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [certificateFile, setCertificateFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MissionaryProfileInput>({
    resolver: zodResolver(missionaryProfileSchema),
    defaultValues: {
      termsAccepted: false,
    },
  })

  const organizationType = watch("organizationType")
  const termsAccepted = watch("termsAccepted")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }
      setCertificateFile(file)
      setError(null)
    }
  }

  const onSubmit = async (data: MissionaryProfileInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      console.log("[Onboarding] Auth check:", { userId: user?.id, email: user?.email, error: authError?.message })

      if (!user || authError) {
        setError("You must be logged in to complete onboarding. Please sign out and sign in again.")
        setIsLoading(false)
        return
      }

      // Check user role from database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, account_status")
        .eq("id", user.id)
        .single()

      console.log("[Onboarding] User data:", { userData, error: userError?.message })

      if (userError || !userData) {
        setError("Unable to verify your account. Please try signing out and signing in again.")
        setIsLoading(false)
        return
      }

      if (userData.role !== "missionary") {
        setError(`This form is only for missionary accounts. Your account role is: ${userData.role}. Please sign out and use the correct account.`)
        setIsLoading(false)
        return
      }

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from("missionary_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (existingProfile) {
        console.log("[Onboarding] Profile already exists, redirecting to dashboard")
        router.push("/missionary/dashboard")
        return
      }

      let certificateUrl = null

      // Upload certificate only if provided (optional)
      if (certificateFile) {
        const fileExt = certificateFile.name.split(".").pop()
        const fileName = `${user.id}/certificate-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from("certificates")
          .upload(fileName, certificateFile, {
            cacheControl: "3600",
            upsert: false,
          })

        if (uploadError) {
          console.error("Certificate upload error:", uploadError)
          // Continue without certificate if upload fails
        } else {
          certificateUrl = fileName
        }
      }

      // Create missionary profile
      console.log("[Onboarding] Creating missionary profile for user:", user.id)
      const profileData = {
        user_id: user.id,
        organization_name: data.organizationName,
        organization_type: data.organizationType,
        is_church_registered: data.isChurchRegistered,
        registration_number: data.registrationNumber || null,
        certificate_url: certificateUrl,
        mission_location: data.missionLocation,
        role_in_org: data.roleInOrg,
        phone: data.phone,
        whatsapp: data.whatsapp,
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
      }
      console.log("[Onboarding] Profile data:", profileData)

      const { data: insertedProfile, error: profileError } = await supabase
        .from("missionary_profiles")
        .insert(profileData)
        .select()

      if (profileError) {
        console.error("[Onboarding] Profile creation error:", profileError)
        setError("Failed to create profile: " + profileError.message)
        setIsLoading(false)
        return
      }

      console.log("[Onboarding] Profile created successfully:", insertedProfile)

      // Update user status
      await supabase
        .from("users")
        .update({ account_status: "under_review" })
        .eq("id", user.id)

      // Show success message
      setShowSuccess(true)
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  // Success popup
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-faith-50 to-white py-12 px-4 flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-700">Profile Submitted!</CardTitle>
            <CardDescription className="text-base mt-2">
              Thank you for completing your missionary profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <p className="text-blue-800 font-medium mb-2">What happens next?</p>
              <ul className="text-sm text-blue-700 space-y-2">
                <li>• Your profile is now <strong>under review</strong> by our admin team</li>
                <li>• This typically takes 1-3 business days</li>
                <li>• You will receive an email once your account is approved</li>
                <li>• After approval, you can start creating posts and receiving donations</li>
              </ul>
            </div>
            <Button 
              onClick={() => router.push("/missionary/dashboard")} 
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-faith-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-10 w-10 text-faith-600" />
            <span className="text-2xl font-bold text-faith-900">Mission<span className="text-amber-600">Frica</span></span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="text-gray-600 mt-2">
            Please provide the following information to complete your missionary registration.
            Your profile will be reviewed by our team before being made public.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Missionary Profile</CardTitle>
            <CardDescription>
              All fields are required unless marked optional. Your information will be kept secure.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              {/* Organization Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Organization Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <Input
                    id="organizationName"
                    placeholder="e.g., Hope for Africa Ministries"
                    {...register("organizationName")}
                    disabled={isLoading}
                  />
                  {errors.organizationName && (
                    <p className="text-sm text-red-600">{errors.organizationName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationType">Organization Type</Label>
                  <Select
                    onValueChange={(value: "church_extension" | "independent") => 
                      setValue("organizationType", value)
                    }
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="church_extension">Church Extension</SelectItem>
                      <SelectItem value="independent">Independent Organization</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.organizationType && (
                    <p className="text-sm text-red-600">{errors.organizationType.message}</p>
                  )}
                </div>

                {/* Conditional fields based on organization type */}
                {organizationType === "church_extension" && (
                  <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                    <Label>Is the Church Registered?</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="true"
                          {...register("isChurchRegistered")}
                          onChange={() => setValue("isChurchRegistered", true)}
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="false"
                          {...register("isChurchRegistered")}
                          onChange={() => setValue("isChurchRegistered", false)}
                        />
                        No
                      </label>
                    </div>
                    {errors.isChurchRegistered && (
                      <p className="text-sm text-red-600">{errors.isChurchRegistered.message}</p>
                    )}
                  </div>
                )}

                {organizationType === "independent" && (
                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Government Registration Number <span className="text-gray-400 font-normal">(Optional)</span></Label>
                    <Input
                      id="registrationNumber"
                      placeholder="Enter registration number if available"
                      {...register("registrationNumber")}
                      disabled={isLoading}
                    />
                    {errors.registrationNumber && (
                      <p className="text-sm text-red-600">{errors.registrationNumber.message}</p>
                    )}
                  </div>
                )}

                {/* Certificate Upload */}
                <div className="space-y-2">
                  <Label>Registration Certificate <span className="text-gray-400 font-normal">(Optional)</span></Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {certificateFile ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span>{certificateFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Upload your registration certificate if available (PDF, JPG, PNG - Max 10MB)
                        </p>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleFileChange}
                      className="mt-2"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Mission Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Mission Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="missionLocation">Current Mission Location</Label>
                  <Input
                    id="missionLocation"
                    placeholder="e.g., Kampala, Uganda"
                    {...register("missionLocation")}
                    disabled={isLoading}
                  />
                  {errors.missionLocation && (
                    <p className="text-sm text-red-600">{errors.missionLocation.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roleInOrg">Your Role in the Organization</Label>
                  <Input
                    id="roleInOrg"
                    placeholder="e.g., Lead Pastor, Field Missionary, etc."
                    {...register("roleInOrg")}
                    disabled={isLoading}
                  />
                  {errors.roleInOrg && (
                    <p className="text-sm text-red-600">{errors.roleInOrg.message}</p>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Contact Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    {...register("email")}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1234567890"
                      {...register("phone")}
                      disabled={isLoading}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp Number</Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="+1234567890"
                      {...register("whatsapp")}
                      disabled={isLoading}
                    />
                    {errors.whatsapp && (
                      <p className="text-sm text-red-600">{errors.whatsapp.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="termsAccepted"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => 
                      setValue("termsAccepted", checked as boolean)
                    }
                    disabled={isLoading}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="termsAccepted" className="cursor-pointer">
                      I agree to the Terms of Service and Code of Conduct
                    </Label>
                    <p className="text-sm text-gray-500">
                      By checking this box, you agree to our{" "}
                      <a href="/terms" className="text-faith-600 hover:underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="/code-of-conduct" className="text-faith-600 hover:underline">
                        Code of Conduct
                      </a>
                      .
                    </p>
                  </div>
                </div>
                {errors.termsAccepted && (
                  <p className="text-sm text-red-600">{errors.termsAccepted.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit for Review"
                )}
              </Button>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
  )
}
