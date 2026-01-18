"use client"

import * as React from "react"
import { Plus, Search, Home, Euro, Users, MapPin, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://49.13.144.44:3003"

interface Housing {
  id: string
  title: string
  type: string
  address: string
  city: string
  district: string
  size_sqm: number
  rooms: number
  max_persons: number
  price_monthly: number
  deposit: number
  is_available: boolean
  mietvertrag_possible: boolean
  anmeldung_possible: boolean
  vermieter_name: string
  vermieter_phone: string
  amenities: string[]
  status: string
}

export default function HousingPage() {
  const { toast } = useToast()
  const [housing, setHousing] = React.useState<Housing[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchCity, setSearchCity] = React.useState("München")
  const [maxPrice, setMaxPrice] = React.useState("")

  const fetchHousing = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchCity) params.append("city", searchCity)
      if (maxPrice) params.append("max_price", maxPrice)

      const res = await fetch(`${API_URL}/v1/housing?${params}`)
      const data = await res.json()
      setHousing(data.items || [])
    } catch (error) {
      toast({ variant: "destructive", title: "Fehler", description: "Wohnungen konnten nicht geladen werden" })
    } finally {
      setLoading(false)
    }
  }, [searchCity, maxPrice, toast])

  React.useEffect(() => {
    fetchHousing()
  }, [fetchHousing])

  const getStatusBadge = (h: Housing) => {
    if (!h.is_available) return <Badge variant="secondary">Reserviert</Badge>
    if (h.status === "active") return <Badge variant="default" className="bg-green-600">Verfügbar</Badge>
    return <Badge variant="outline">{h.status}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      monteurzimmer: "bg-blue-600",
      apartment: "bg-purple-600",
      wg: "bg-orange-600",
      house: "bg-green-600"
    }
    return <Badge className={colors[type] || "bg-gray-600"}>{type}</Badge>
  }

  return (
    <div className="flex flex-col h-full" data-testid="housing_page">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="housing_title">Wohnungen & Monteurzimmer</h1>
            <p className="text-muted-foreground">Verfügbare Unterkünfte in München</p>
          </div>
          <Button data-testid="housing_add_button">
            <Plus className="h-4 w-4 mr-2" />
            Neue Wohnung
          </Button>
        </div>

        {/* Search */}
        <div className="flex gap-4" data-testid="housing_search">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Stadt..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="pl-10"
              data-testid="housing_search_city"
            />
          </div>
          <div className="w-48">
            <Input
              type="number"
              placeholder="Max. Preis EUR"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              data-testid="housing_search_price"
            />
          </div>
          <Button onClick={fetchHousing} data-testid="housing_search_button">
            Suchen
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64" data-testid="housing_loading">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : housing.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground" data-testid="housing_empty">
            <Home className="h-12 w-12 mb-4" />
            <p>Keine Wohnungen gefunden</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="housing_list">
            {housing.map((h) => (
              <Card key={h.id} data-testid={`housing_card_${h.id}`} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2">
                      {getTypeBadge(h.type)}
                      {getStatusBadge(h)}
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-2" data-testid={`housing_title_${h.id}`}>{h.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {h.address}, {h.city} {h.district && `(${h.district})`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{h.price_monthly} EUR/Monat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span>{h.size_sqm} m² / {h.rooms} Zimmer</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Max. {h.max_persons} Personen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span>Kaution: {h.deposit} EUR</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <Badge variant={h.mietvertrag_possible ? "default" : "secondary"} className="text-xs">
                      {h.mietvertrag_possible ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                      Mietvertrag
                    </Badge>
                    <Badge variant={h.anmeldung_possible ? "default" : "secondary"} className="text-xs">
                      {h.anmeldung_possible ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                      Anmeldung
                    </Badge>
                  </div>

                  <div className="border-t pt-3">
                    <p className="text-sm text-muted-foreground">Vermieter:</p>
                    <p className="font-medium">{h.vermieter_name}</p>
                    <p className="text-sm text-primary">{h.vermieter_phone}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
