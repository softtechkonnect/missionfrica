"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  ChevronLeft, 
  Camera, 
  Loader2, 
  User,
  Save,
  CheckCircle
} from "lucide-react"

interface UserData {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
}

export default function MissionarySettingsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [fullName, setFullName] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    async function loadUserData() {
      setIsLoading(true)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, full_name, email, avatar_url")
          .eq("id", user.id)
          .single()

        if (userError || !userData) {
          setError("Failed to load user data")
          return
        }

        setUserData(userData)
        setFullName(userData.full_name)
        if (userData.avatar_url) {
          setPreviewUrl(userData.avatar_url)
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load user data")
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [router])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userData) return

    // Validate file
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${userData.id}/avatar-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        setError("Failed to upload image: " + uploadError.message)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName)

      // Update user record
      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: publicUrl })
        .eq("id", userData.id)

      if (updateError) {
        setError("Failed to update profile: " + updateError.message)
        return
      }

      setPreviewUrl(publicUrl)
      setUserData({ ...userData, avatar_url: publicUrl })
      setSuccess("Profile picture updated!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err?.message || "Failed to upload image")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!userData || !fullName.trim()) return

    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      
      const { error: updateError } = await supabase
        .from("users")
        .update({ full_name: fullName.trim() })
        .eq("id", userData.id)

      if (updateError) {
        setError("Failed to update profile: " + updateError.message)
        return
      }

      setUserData({ ...userData, full_name: fullName.trim() })
      setSuccess("Profile updated successfully!")
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err?.message || "Failed to update profile")
    } finally {
      setIsSaving(false)
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
          <div className="flex items-center gap-3">
            <Link href="/missionary/dashboard">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Profile Settings</h1>
          <p className="text-gray-600">Update your profile picture and personal information</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Profile Picture */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>
                This picture will be shown alongside your posts and on your missionary profile page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-faith-100">
                    <AvatarImage src={previewUrl || undefined} alt={userData?.full_name} />
                    <AvatarFallback className="bg-faith-100 text-faith-700 text-2xl">
                      {userData?.full_name?.split(" ").map(n => n[0]).join("") || <User className="h-10 w-10" />}
                    </AvatarFallback>
                  </Avatar>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {previewUrl ? "Change Picture" : "Upload Picture"}
                  </Button>
                  <p className="text-xs text-gray-500">
                    JPG, PNG or GIF. Max 5MB.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your display name
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={userData?.email || ""}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving || !fullName.trim() || fullName === userData?.full_name}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
