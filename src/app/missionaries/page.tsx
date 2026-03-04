import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { 
  MapPin, 
  Users, 
  CheckCircle, 
  Search,
  Heart,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

export default async function MissionariesPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; location?: string }
}) {
  const supabase = await createClient()

  const page = parseInt(searchParams.page || "1")
  const perPage = 12
  const offset = (page - 1) * perPage
  const searchQuery = searchParams.search
  const locationFilter = searchParams.location

  let query = supabase
    .from("missionary_profiles")
    .select(`
      id,
      organization_name,
      mission_location,
      total_raised,
      users!inner (
        id,
        full_name,
        avatar_url,
        account_status,
        public_visible
      )
    `, { count: "exact" })
    .eq("users.account_status", "approved")
    .eq("users.public_visible", true)
    .order("total_raised", { ascending: false })
    .range(offset, offset + perPage - 1)

  if (searchQuery) {
    query = query.or(`organization_name.ilike.%${searchQuery}%,mission_location.ilike.%${searchQuery}%`)
  }

  if (locationFilter) {
    query = query.ilike("mission_location", `%${locationFilter}%`)
  }

  const { data: missionaries, count } = await query
  const totalPages = Math.ceil((count || 0) / perPage)

  // Get unique locations for filter
  const { data: locations } = await supabase
    .from("missionary_profiles")
    .select("mission_location")
    .eq("users.account_status", "approved")
    .eq("users.public_visible", true)

  const uniqueLocations = [...new Set(locations?.map(l => l.mission_location) || [])]

  return (
    <div className="min-h-screen bg-gradient-to-b from-faith-50 to-white">
      <Navbar />

      {/* Hero */}
      <section className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Support Missionaries Across Africa
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Browse verified missionaries and partner with them to spread the Gospel across the continent.
        </p>
      </section>

      {/* Search & Filters */}
      <section className="container mx-auto px-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <form className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[250px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    name="search"
                    placeholder="Search missionaries or organizations..."
                    defaultValue={searchQuery}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit">Search</Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Results */}
      <section className="container mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {count || 0} missionaries found
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {missionaries && missionaries.length > 0 ? (
            missionaries.map((missionary: any) => (
              <Card key={missionary.id} className="overflow-hidden hover:shadow-lg transition">
                <div className="h-32 bg-gradient-to-br from-faith-100 to-faith-200 flex items-center justify-center">
                  <Users className="h-16 w-16 text-faith-400" />
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="gap-1 text-green-700 bg-green-100">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">
                    {missionary.users?.full_name || "Missionary"}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {missionary.mission_location}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    {missionary.organization_name || "Independent Missionary"}
                  </p>
                  <Link href={`/missionary/${missionary.id}`}>
                    <Button className="w-full gap-2">
                      <Heart className="h-4 w-4" />
                      Support This Missionary
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No missionaries found matching your search.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Link href={`/missionaries?page=${page - 1}&search=${searchQuery || ""}`}>
              <Button variant="outline" disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
            </Link>
            <span className="text-gray-600">
              Page {page} of {totalPages}
            </span>
            <Link href={`/missionaries?page=${page + 1}&search=${searchQuery || ""}`}>
              <Button variant="outline" disabled={page >= totalPages}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
