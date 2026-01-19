"use client"

import * as React from "react"
import { Plus, Search, User, Briefcase, MapPin, Calendar, Euro, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://49.13.144.44:3003"

interface Candidate {
  id: string
  name: string
  phone: string
  email: string
  nationality: string
  language_skills: string[]
  employer: string
  job_position: string
  job_location: string
  job_start_date: string
  arrival_date: string
  preferred_city: string
  budget_max: number
  family_size: number
  needs_mietvertrag: boolean
  needs_anmeldung: boolean
  move_in_date: string
  status: string
  notes: string
  created_at: string
}

export default function CandidatesPage() {
  const { toast } = useToast()
  const [candidates, setCandidates] = React.useState<Candidate[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")

  const fetchCandidates = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/v1/candidates`)
      const data = await res.json()
      setCandidates(data.items || [])
    } catch (error) {
      toast({ variant: "destructive", title: "Fehler", description: "Kandidaten konnten nicht geladen werden" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchCandidates()
  }, [fetchCandidates])

  const triggerSearch = async (candidateId: string) => {
    try {
      const res = await fetch(`${API_URL}/v1/agents/search-housing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId, auto_negotiate: true })
      })
      const data = await res.json()
      if (data.success) {
        toast({
          title: "Suche gestartet",
          description: `${data.matched_count} passende Wohnungen gefunden`
        })
        fetchCandidates()
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Fehler", description: "Suche konnte nicht gestartet werden" })
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      searching: "bg-yellow-600",
      negotiating: "bg-blue-600",
      found: "bg-green-600",
      moved_in: "bg-purple-600"
    }
    const labels: Record<string, string> = {
      searching: "Sucht",
      negotiating: "Verhandelt",
      found: "Gefunden",
      moved_in: "Eingezogen"
    }
    return <Badge className={colors[status] || "bg-gray-600"}>{labels[status] || status}</Badge>
  }

  const filteredCandidates = candidates.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.employer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full" data-testid="candidates_page">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="candidates_title">Kandidaten</h1>
            <p className="text-muted-foreground">ATU Fachkräfte aus Bosnien</p>
          </div>
          <Button data-testid="candidates_add_button">
            <Plus className="h-4 w-4 mr-2" />
            Neuer Kandidat
          </Button>
        </div>

        {/* Search */}
        <div className="relative" data-testid="candidates_search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suche nach Name oder Arbeitgeber..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-md"
            data-testid="candidates_search_input"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64" data-testid="candidates_loading">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground" data-testid="candidates_empty">
            <User className="h-12 w-12 mb-4" />
            <p>Keine Kandidaten gefunden</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="candidates_list">
            {filteredCandidates.map((c) => (
              <Card key={c.id} data-testid={`candidate_card_${c.id}`} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    {getStatusBadge(c.status)}
                    <Badge variant="outline">{c.nationality}</Badge>
                  </div>
                  <CardTitle className="text-lg mt-2" data-testid={`candidate_name_${c.id}`}>{c.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {c.job_position || "Fachkraft"} bei {c.employer}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{c.phone}</span>
                    </div>
                    {c.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{c.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{c.preferred_city} (sucht)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span>Budget: max. {c.budget_max} EUR/Monat</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Familie: {c.family_size} Person(en)</span>
                    </div>
                    {c.job_start_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Job-Start: {c.job_start_date}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mb-4">
                    {c.language_skills?.map((lang) => (
                      <Badge key={lang} variant="outline" className="text-xs">{lang.toUpperCase()}</Badge>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {c.status === "searching" && (
                      <Button
                        size="sm"
                        onClick={() => triggerSearch(c.id)}
                        data-testid={`candidate_search_${c.id}`}
                      >
                        Wohnung suchen
                      </Button>
                    )}
                    <Button size="sm" variant="outline" data-testid={`candidate_details_${c.id}`}>
                      Details
                    </Button>
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
