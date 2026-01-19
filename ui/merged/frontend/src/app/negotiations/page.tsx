"use client"

import * as React from "react"
import { Phone, PhoneCall, PhoneOff, Check, X, Clock, Euro, User, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://49.13.144.44:3003"

interface Negotiation {
  id: string
  candidate_id: string
  candidate_name: string
  vermieter_id: string
  vermieter_name: string
  housing_id: string
  housing_title: string
  status: string
  offered_price: number
  final_price: number
  move_in_date: string
  call_attempts: number
  last_call_at: string
  rejection_reason: string
  notes: string
  created_at: string
  updated_at: string
}

export default function NegotiationsPage() {
  const { toast } = useToast()
  const [negotiations, setNegotiations] = React.useState<Negotiation[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState<string>("all")

  const fetchNegotiations = React.useCallback(async () => {
    setLoading(true)
    try {
      const params = filter !== "all" ? `?status=${filter}` : ""
      const res = await fetch(`${API_URL}/v1/negotiations${params}`)
      const data = await res.json()
      setNegotiations(data.items || [])
    } catch (error) {
      toast({ variant: "destructive", title: "Fehler", description: "Verhandlungen konnten nicht geladen werden" })
    } finally {
      setLoading(false)
    }
  }, [filter, toast])

  React.useEffect(() => {
    fetchNegotiations()
  }, [fetchNegotiations])

  const triggerCall = async (neg: Negotiation) => {
    try {
      const res = await fetch(`${API_URL}/v1/agents/trigger-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: neg.candidate_id,
          vermieter_id: neg.vermieter_id,
          housing_id: neg.housing_id
        })
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Anruf gestartet", description: `Rufe ${neg.vermieter_name} an...` })
        fetchNegotiations()
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Fehler", description: "Anruf konnte nicht gestartet werden" })
    }
  }

  const updateStatus = async (negId: string, status: string, finalPrice?: number) => {
    try {
      const res = await fetch(`${API_URL}/v1/negotiations/${negId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, final_price: finalPrice, move_in_date: new Date().toISOString().split("T")[0] })
      })
      if (res.ok) {
        toast({ title: "Status aktualisiert", description: `Verhandlung auf ${status} gesetzt` })
        fetchNegotiations()
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Fehler", description: "Status konnte nicht aktualisiert werden" })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />
      case "calling": return <PhoneCall className="h-4 w-4 animate-pulse" />
      case "in_progress": return <Phone className="h-4 w-4" />
      case "accepted": return <Check className="h-4 w-4" />
      case "rejected": return <X className="h-4 w-4" />
      default: return <PhoneOff className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-gray-500",
      calling: "bg-yellow-600",
      in_progress: "bg-blue-600",
      accepted: "bg-green-600",
      rejected: "bg-red-600",
      cancelled: "bg-gray-400"
    }
    const labels: Record<string, string> = {
      pending: "Ausstehend",
      calling: "Ruft an...",
      in_progress: "In Verhandlung",
      accepted: "Akzeptiert",
      rejected: "Abgelehnt",
      cancelled: "Abgebrochen"
    }
    return (
      <Badge className={`${colors[status] || "bg-gray-600"} flex items-center gap-1`}>
        {getStatusIcon(status)}
        {labels[status] || status}
      </Badge>
    )
  }

  const filterButtons = [
    { value: "all", label: "Alle" },
    { value: "pending", label: "Ausstehend" },
    { value: "calling", label: "Aktiv" },
    { value: "accepted", label: "Akzeptiert" },
    { value: "rejected", label: "Abgelehnt" }
  ]

  return (
    <div className="flex flex-col h-full" data-testid="negotiations_page">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="negotiations_title">Verhandlungen</h1>
            <p className="text-muted-foreground">Anrufe und Verhandlungen mit Vermietern</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2" data-testid="negotiations_filter">
          {filterButtons.map((btn) => (
            <Button
              key={btn.value}
              variant={filter === btn.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(btn.value)}
              data-testid={`negotiations_filter_${btn.value}`}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64" data-testid="negotiations_loading">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : negotiations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground" data-testid="negotiations_empty">
            <Phone className="h-12 w-12 mb-4" />
            <p>Keine Verhandlungen gefunden</p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="negotiations_list">
            {negotiations.map((neg) => (
              <Card key={neg.id} data-testid={`negotiation_card_${neg.id}`} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    {getStatusBadge(neg.status)}
                    <span className="text-sm text-muted-foreground">
                      {neg.call_attempts} Anrufversuch(e)
                    </span>
                  </div>
                  <CardTitle className="text-lg mt-2 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {neg.housing_title || "Wohnung"}
                  </CardTitle>
                  <CardDescription>
                    Vermieter: {neg.vermieter_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Kandidat:</p>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {neg.candidate_name}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Preis:</p>
                      <div className="flex items-center gap-2 text-sm">
                        <Euro className="h-4 w-4 text-muted-foreground" />
                        {neg.final_price || neg.offered_price} EUR/Monat
                        {neg.final_price && neg.final_price !== neg.offered_price && (
                          <span className="text-muted-foreground line-through">{neg.offered_price}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {neg.rejection_reason && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 rounded-md">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        <strong>Ablehnungsgrund:</strong> {neg.rejection_reason}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {neg.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => triggerCall(neg)}
                        data-testid={`negotiation_call_${neg.id}`}
                      >
                        <PhoneCall className="h-4 w-4 mr-2" />
                        Anrufen
                      </Button>
                    )}
                    {(neg.status === "pending" || neg.status === "in_progress") && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600"
                          onClick={() => updateStatus(neg.id, "accepted", neg.offered_price)}
                          data-testid={`negotiation_accept_${neg.id}`}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Akzeptieren
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => updateStatus(neg.id, "rejected")}
                          data-testid={`negotiation_reject_${neg.id}`}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Ablehnen
                        </Button>
                      </>
                    )}
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
