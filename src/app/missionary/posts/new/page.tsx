"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  ImagePlus,
  FileText,
  Upload,
  X,
  Video
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const MAX_POSTS = 10

const postSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  content: z.string().min(50, "Content must be at least 50 characters").max(5000, "Content must be less than 5000 characters"),
})

type PostInput = z.infer<typeof postSchema>

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"]

export default function NewPostPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [postCount, setPostCount] = useState<number>(0)
  const [isLoadingCount, setIsLoadingCount] = useState(true)
  const [missionaryId, setMissionaryId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PostInput>({
    resolver: zodResolver(postSchema),
  })

  const contentLength = watch("content")?.length || 0

  useEffect(() => {
    async function fetchPostCount() {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase
        .from("missionary_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (!profile) {
        router.push("/missionary/onboarding")
        return
      }

      setMissionaryId(profile.id)
      setUserId(user.id)

      const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("missionary_id", profile.id)

      setPostCount(count || 0)
      setIsLoadingCount(false)
    }

    fetchPostCount()
  }, [router])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" is too large. Maximum size is 50MB.`)
        return
      }
      if (![...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].includes(file.type)) {
        setError(`File "${file.name}" is not a supported format. Use JPG, PNG, WebP, GIF, MP4, or WebM.`)
        return
      }
    }
    
    if (selectedFiles.length + files.length > 5) {
      setError("You can only upload up to 5 files per post.")
      return
    }
    
    setSelectedFiles(prev => [...prev, ...files])
    setError(null)
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: PostInput) => {
    if (postCount >= MAX_POSTS) {
      setError("You have reached the maximum number of posts (10). Please delete an existing post to create a new one.")
      return
    }

    if (!missionaryId || !userId) {
      setError("Unable to find your missionary profile. Please try again.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const mediaUrls: string[] = []

      // Upload files to Supabase Storage
      if (selectedFiles.length > 0) {
        setUploadProgress(0)
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i]
          const fileExt = file.name.split(".").pop()
          const fileName = `${userId}/${missionaryId}/${Date.now()}-${i}.${fileExt}`

          const { error: uploadError, data: uploadData } = await supabase.storage
            .from("post-media")
            .upload(fileName, file, {
              cacheControl: "3600",
              upsert: false,
            })

          if (uploadError) {
            console.error("Upload error:", uploadError)
            throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from("post-media")
            .getPublicUrl(fileName)

          mediaUrls.push(publicUrl)
          setUploadProgress(((i + 1) / selectedFiles.length) * 100)
        }
      }

      const { error: insertError } = await supabase
        .from("posts")
        .insert({
          missionary_id: missionaryId,
          title: data.title,
          content: data.content,
          media_urls: mediaUrls,
          status: "pending_review",
        })

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        router.push("/missionary/posts")
      }, 2000)
    } catch (err: any) {
      console.error("Failed to create post:", err)
      setError(err.message || "Failed to create post. Please try again.")
    } finally {
      setIsLoading(false)
      setUploadProgress(0)
    }
  }

  const canCreatePost = postCount < MAX_POSTS

  if (isLoadingCount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-faith-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link 
            href="/missionary/dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-faith-600 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Create New Post
            </CardTitle>
            <CardDescription>
              Share an update with your supporters. Posts are reviewed before going live.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Post Limit Progress */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Posts Used</span>
                <span className="text-sm text-gray-600">{postCount} / {MAX_POSTS}</span>
              </div>
              <Progress value={(postCount / MAX_POSTS) * 100} className="h-2" />
              {postCount >= MAX_POSTS && (
                <p className="text-sm text-red-600 mt-2">
                  You&apos;ve reached the maximum number of posts. Delete an existing post to create a new one.
                </p>
              )}
            </div>

            {success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Post Submitted!</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your post has been submitted for review. You will be notified once it&apos;s approved.
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Post Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter a compelling title for your update"
                    {...register("title")}
                    disabled={!canCreatePost}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Share your story, update, or prayer request with your supporters..."
                    rows={8}
                    {...register("content")}
                    disabled={!canCreatePost}
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{errors.content?.message}</span>
                    <span>{contentLength} / 5000</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ImagePlus className="h-4 w-4" />
                    Media (Optional - up to 5 images/videos)
                  </Label>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={!canCreatePost || selectedFiles.length >= 5}
                    />
                    
                    {selectedFiles.length === 0 ? (
                      <div
                        className="text-center cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          Click to upload images or videos
                        </p>
                        <p className="text-xs text-gray-400">
                          JPG, PNG, WebP, GIF, MP4, WebM (max 50MB each)
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="relative group">
                              {file.type.startsWith("video/") ? (
                                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Video className="h-8 w-8 text-gray-400" />
                                  <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1 rounded">
                                    Video
                                  </span>
                                </div>
                              ) : (
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${index + 1}`}
                                  className="aspect-square object-cover rounded-lg"
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                              >
                                <X className="h-3 w-3" />
                              </button>
                              <p className="text-xs text-gray-500 truncate mt-1">{file.name}</p>
                            </div>
                          ))}
                        </div>
                        {selectedFiles.length < 5 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <ImagePlus className="h-4 w-4 mr-2" />
                            Add More
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="space-y-1">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-gray-500">Uploading... {Math.round(uploadProgress)}%</p>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 mb-2">Posting Guidelines</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• All posts are reviewed by our team before going live</li>
                    <li>• Share authentic updates about your mission work</li>
                    <li>• Include prayer requests to connect with supporters</li>
                    <li>• Avoid asking for specific monetary amounts</li>
                    <li>• You can have a maximum of {MAX_POSTS} posts</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={isLoading || !canCreatePost}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit for Review"
                    )}
                  </Button>
                  <Link href="/missionary/posts">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
