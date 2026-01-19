"use client"

import * as React from "react"
import { FileCheck, Check, X, Calendar, Euro, User, Building2, Key, FileText, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://49.13.144.44:3003"

interface Deal {
  id: string
  negotiation_id: string
  candidate_id: string
  candidate_name: string
  vermieter_id: string
  vermieter_name: string
  housing_id: string
  housing_title: string
  address: string
  monthly_rent: number
  deposit: number
  move_in_date: string
  contract_start: string
  contract_end: string
  status: string
  contract_signed: boolean
  deposit_paid: boolean
  keys_handed_over: boolean
  anmeldung_done: boolean
  signed_at: string
  moved_in_at: string
  notes: string
  created_at: string
}

export default function DealsPage() {
  const { toast } = useToast()
  const [deals, setDeals] = React.useState<Deal[]>([])
  const [loading, setLoading] = React.useState(true)

  const fetchDeals = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/v1/deals`)
      const data = await res.json()
      setDeals(data.items || [])
    } catch (error) {
      toast({ variant: "destructive", title: "Fehler", description: "Deals konnten nicht geladen werden" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    fetchDeals()
  }, [fetchDeals])

  const updateDeal = async (dealId: string, updates: Partial<Deal>) => {
    try {
      const res = await fetch(`${API_URL}/v1/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      })
      if (res.ok) {
        toast({ title: "Deal aktualisiert" })
        fetchDeals()
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Fehler", description: "Deal konnte nicht aktualisiert werden" })
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-600",
      signed: "bg-blue-600",
      active: "bg-green-600",
      completed: "bg-purple-600",
      cancelled: "bg-red-600"
    }
    const labels: Record<string, string> = {
      pending: "Ausstehend",
      signed: "Unterschrieben",
      active: "Aktiv",
      completed: "Abgeschlossen",
      cancelled: "Abgebrochen"
    }
    return <Badge className={colors[status] || "bg-gray-600"}>{labels[status] || status}</Badge>
  }

  const getProgress = (deal: Deal) => {
    let completed = 0
    if (deal.contract_signed) completed++
    if (deal.deposit_paid) completed++
    if (deal.keys_handed_over) completed++
    if (deal.anmeldung_done) completed++
    return (completed / 4) * 100
  }

  const ChecklistItem = ({ done, label, onClick }: { done: boolean; label: string; onClick?: () => void }) => (
    <div
      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${
        done ? "bg-green-100 dark:bg-green-900" : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
      }`}
      onClick={onClick}
    >
      {done ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <div className="h-4 w-4 rounded-full border-2 border-gray-400" />
      )}
      <span className={done ? "line-through text-muted-foreground" : ""}>{label}</span>
    </div>
  )

  return (
    <div className="flex flex-col h-full" data-testid="deals_page">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="deals_title">Deals</h1>
            <p className="text-muted-foreground">Abgeschlossene Mietverträge</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{deals.filter(d => d.status === "active").length}</p>
              <p className="text-sm text-muted-foreground">Aktive Deals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64" data-testid="deals_loading">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : deals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground" data-testid="deals_empty">
            <FileCheck className="h-12 w-12 mb-4" />
            <p>Keine Deals gefunden</p>
            <p className="text-sm">Akzeptierte Verhandlungen erscheinen hier</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2" data-testid="deals_list">
            {deals.map((deal) => (
              <Card key={deal.id} data-testid={`deal_card_${deal.id}`} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    {getStatusBadge(deal.status)}
                    <span className="text-lg font-bold text-green-600">
                      {deal.monthly_rent} EUR/Monat
                    </span>
                  </div>
                  <CardTitle className="text-lg mt-2 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {deal.housing_title || "Wohnung"}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {deal.address}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Mieter:</p>
                      <p className="font-medium flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {deal.candidate_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Vermieter:</p>
                      <p className="font-medium">{deal.vermieter_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Einzug:</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {deal.move_in_date}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Kaution:</p>
                      <p className="font-medium flex items-center gap-1">
                        <Euro className="h-4 w-4" />
                        {deal.deposit || deal.monthly_rent} EUR
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Fortschritt</span>
                      <span>{Math.round(getProgress(deal))}%</span>
                    </div>
                    <Progress value={getProgress(deal)} className="h-2" />
                  </div>

                  {/* Checklist */}
                  <div className="grid grid-cols-2 gap-2" data-testid={`deal_checklist_${deal.id}`}>
                    <ChecklistItem
                      done={deal.contract_signed}
                      label="Vertrag unterschrieben"
                      onClick={() => updateDeal(deal.id, { contract_signed: !deal.contract_signed })}
                    />
                    <ChecklistItem
                      done={deal.deposit_paid}
                      label="Kaution bezahlt"
                      onClick={() => updateDeal(deal.id, { deposit_paid: !deal.deposit_paid })}
                    />
                    <ChecklistItem
                      done={deal.keys_handed_over}
                      label="Schlüssel übergeben"
                      onClick={() => updateDeal(deal.id, { keys_handed_over: !deal.keys_handed_over })}
                    />
                    <ChecklistItem
                      done={deal.anmeldung_done}
                      label="Anmeldung erledigt"
                      onClick={() => updateDeal(deal.id, { anmeldung_done: !deal.anmeldung_done })}
                    />
                  </div>

                  {/* Actions */}
                  {deal.status === "pending" && getProgress(deal) === 100 && (
                    <div className="mt-4">
                      <Button
                        className="w-full"
                        onClick={() => updateDeal(deal.id, { status: "active" })}
                        data-testid={`deal_activate_${deal.id}`}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Deal aktivieren
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
