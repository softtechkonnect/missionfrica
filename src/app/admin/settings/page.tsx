"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ChevronLeft,
  Settings,
  Save,
  Loader2
} from "lucide-react"

export default function AdminSettingsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  const [settings, setSettings] = useState({
    platformName: "MissionFrica",
    platformFeePercent: "5",
    minDonationAmount: "5",
    contactEmail: "support@missionfrica.com",
    supportPhone: "",
  })

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = "/auth/login"
        return
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)
    
    try {
      // In a real app, you would save to database
      await new Promise(resolve => setTimeout(resolve, 1000))
      setMessage({ type: "success", text: "Settings saved successfully!" })
    } catch (err) {
      setMessage({ type: "error", text: "Failed to save settings" })
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
          <div className="flex items-center gap-3 mb-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-faith-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
              <p className="text-gray-600">Configure platform-wide settings</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {message.text}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="platformName">Platform Name</Label>
              <Input
                id="platformName"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supportPhone">Support Phone (Optional)</Label>
              <Input
                id="supportPhone"
                value={settings.supportPhone}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                placeholder="+1 234 567 8900"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Financial Settings</CardTitle>
            <CardDescription>Configure donation and fee settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="platformFeePercent">Platform Fee (%)</Label>
              <Input
                id="platformFeePercent"
                type="number"
                min="0"
                max="20"
                value={settings.platformFeePercent}
                onChange={(e) => setSettings({ ...settings, platformFeePercent: e.target.value })}
              />
              <p className="text-sm text-gray-500">Percentage taken from each donation</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minDonationAmount">Minimum Donation Amount ($)</Label>
              <Input
                id="minDonationAmount"
                type="number"
                min="1"
                value={settings.minDonationAmount}
                onChange={(e) => setSettings({ ...settings, minDonationAmount: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}
