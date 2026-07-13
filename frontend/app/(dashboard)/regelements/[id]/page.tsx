'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Plus, Check, Clock, AlertCircle, Loader2, CreditCard, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Reglement, Production, PaymentMode } from '@/types';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';

const STATUS_CONFIG = {
  PAYE:       { label: 'Payé',       variant: 'green'  as const, icon: Check },
  PARTIEL:    { label: 'Partiel',    variant: 'amber'  as const, icon: AlertCircle },
  EN_ATTENTE: { label: 'En attente', variant: 'secondary' as const, icon: Clock },
};

const PAYMENT_MODES: PaymentMode[] = ['CHEQUE', 'ESPECE', 'VIREMENT', 'AUTRE'];

export default function RegelementPage() {
  const router = useRouter();
  const { id: productionId } = useParams<{ id: string }>();
  const [production, setProduction] = useState<Production | null>(null);
  const [reglement, setReglement] = useState<Reglement | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState<PaymentMode>('ESPECE');
  const [montant, setMontant] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const [prodRes] = await Promise.allSettled([api.get<Production>(`/productions/${productionId}`)]);
      if (prodRes.status === 'fulfilled') setProduction(prodRes.value.data);
      try {
        const { data } = await api.get<Reglement>(`/regelements/${productionId}`);
        setReglement(data);
      } catch { /* No reglement yet */ }
      setLoading(false);
    };
    load();
  }, [productionId]);

  const totalPaid = reglement?.payments.reduce((s, p) => s + p.montant, 0) ?? 0;
  const totalDue = reglement?.montantTotal ?? production?.parameters?.reduce(
    (s, p) => s + p.primes + p.taxe + p.taxepara + p.accessoire + p.cnpc, 0
  ) ?? 0;
  const remaining = Math.max(0, totalDue - totalPaid);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const req = {
        client: production?.client,
        natureOperation: production?.natureOperation,
        dateEff: production?.dateEff,
        moisDem: production?.moisDem,
        compagne: production?.compagne,
        category: production?.category,
        numpolice: production?.numpolice,
        montantTotal: totalDue,
        payments: [{ mode, montant: parseFloat(montant) }],
      };
      const formData = new FormData();
      formData.append('data', JSON.stringify(req));
      const { data } = await api.post<Reglement>(
        `/regelements/${productionId}/paiement`, formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setReglement(data);
      setShowForm(false);
      setMontant('');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur lors de l\'enregistrement');
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="space-y-8 max-w-4xl">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5"><Skeleton className="h-7 w-40" /><Skeleton className="h-4 w-60" /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[0,1,2].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const status = reglement?.status ?? 'EN_ATTENTE';
  const statusCfg = STATUS_CONFIG[status];
  const StatusIcon = statusCfg.icon;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Règlement</h1>
            </div>
            <p className="text-sm text-muted-foreground pl-10">
              Police <span className="font-mono text-primary font-semibold">{production?.numpolice}</span>
              {' — '}{production?.client}
            </p>
          </div>
        </div>
        <Badge variant={statusCfg.variant} className="text-sm px-3 py-1.5 gap-1.5">
          <StatusIcon className="w-3.5 h-3.5" />
          {statusCfg.label}
        </Badge>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total TTC', value: totalDue, color: 'text-foreground' },
          { label: 'Payé', value: totalPaid, color: 'text-green-400' },
          { label: 'Restant', value: remaining, color: remaining > 0 ? 'text-amber-400' : 'text-green-400' },
        ].map(card => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color} tabular-nums`}>
              {card.value.toLocaleString('fr-MA')}
              <span className="text-sm font-normal text-muted-foreground ml-1">DH</span>
            </p>
          </div>
        ))}
      </div>

      {/* Payment history + add payment */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Section header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">Historique des paiements</h2>
          <Button
            onClick={() => setShowForm(!showForm)}
            variant={showForm ? 'secondary' : 'default'}
            className="gap-2"
            size="sm"
          >
            <Plus className={cn('w-4 h-4 transition-transform', showForm && 'rotate-45')} />
            {showForm ? 'Annuler' : 'Ajouter paiement'}
          </Button>
        </div>

        {/* Add payment form */}
        {showForm && (
          <div className="px-6 py-5 border-b border-border bg-muted/20">
            {error && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-red-400 rounded-lg px-3 py-2.5 mb-4 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <form onSubmit={handleAddPayment} className="flex gap-4 items-end flex-wrap">
              <div className="flex-1 min-w-[160px] space-y-1.5">
                <Label htmlFor="mode-select">Mode de paiement</Label>
                <select
                  id="mode-select"
                  value={mode}
                  onChange={e => setMode(e.target.value as PaymentMode)}
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground"
                >
                  {PAYMENT_MODES.map(m => <option key={m} value={m} className="bg-card">{m}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[160px] space-y-1.5">
                <Label htmlFor="montant-input">Montant (DH)</Label>
                <Input
                  id="montant-input"
                  type="number" min="0.01" step="0.01"
                  value={montant}
                  onChange={e => setMontant(e.target.value)}
                  required
                  placeholder="0.00"
                  className="bg-muted/30 border-border focus:border-primary"
                />
              </div>
              <Button type="submit" disabled={saving} className="gap-2 shadow-sm shadow-primary/20">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </form>
          </div>
        )}

        {/* Payments table */}
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead>Mode</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Banque</TableHead>
              <TableHead>Commentaire</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!reglement?.payments?.length ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-3">
                      <CreditCard className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">Aucun paiement enregistré</p>
                    <p className="text-xs text-muted-foreground">Cliquez sur "Ajouter paiement" pour enregistrer un versement.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reglement.payments.map((p, i) => (
                <TableRow key={i} className="border-border/40">
                  <TableCell>
                    <Badge variant="blue">{p.mode}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-semibold text-green-400 tabular-nums">
                      {p.montant.toLocaleString('fr-MA')} DH
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.dateEcheance ?? p.dateVirement ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.banque ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.commentaire ?? '—'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
