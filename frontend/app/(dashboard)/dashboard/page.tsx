'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Users, TrendingUp, CreditCard, AlertCircle,
  CheckCircle2, Clock, BarChart2, ArrowRight, Building2,
} from 'lucide-react';
import api from '@/lib/api';
import { formatAmount, formatDate, formatMonthLabel } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// ── Types ─────────────────────────────────────────────────────────────────────
interface CategoryStat { category: string; count: number; montant: number; }
interface LabelValue   { label: string; value: number; }
interface RecentProd   {
  id: string; numpolice: string; client: string; category: string;
  compagne: string; montant: number; dateEff: string; reglementStatus?: string;
}
interface DashboardStats {
  totalProductions: number;
  montantTotal: number;
  montantRegle: number;
  montantRestant: number;
  totalClients: number;
  reglementsPaie: number;
  reglementsPartiel: number;
  reglementsEnAttente: number;
  byCategory: CategoryStat[];
  byCompagne: LabelValue[];
  byMonth: LabelValue[];
  recentProductions: RecentProd[];
}

// ── Palette (css vars-aware) ──────────────────────────────────────────────────
const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#06b6d4', '#f97316', '#84cc16',
];

const STATUS_CFG = {
  PAYE:       { label: 'Payé',        cls: 'green'     },
  PARTIEL:    { label: 'Partiel',     cls: 'amber'     },
  EN_ATTENTE: { label: 'En attente',  cls: 'secondary' },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color, loading,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string; loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4 relative overflow-hidden group hover:border-primary/30 transition-colors">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${color} rounded-xl`} />
      <div className="relative flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="relative">
        {loading ? (
          <Skeleton className="h-9 w-36" />
        ) : (
          <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
        )}
        {sub && !loading && (
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        )}
      </div>
    </div>
  );

}

/** Simple CSS-only horizontal bar chart */
function BarChart({ data, maxVal, colorFn }: {
  data: LabelValue[];
  maxVal: number;
  colorFn?: (i: number) => string;
}) {
  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0;
        const color = colorFn ? colorFn(i) : CHART_COLORS[i % CHART_COLORS.length];
        return (
          <div key={d.label} className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="truncate max-w-[160px]">{d.label}</span>
              <span className="font-semibold tabular-nums">{Math.round(d.value)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** SVG donut chart for category breakdown */
function DonutChart({ data }: { data: CategoryStat[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) return (
    <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">Aucune donnée</div>
  );

  // Build SVG path segments
  const R = 70; const CX = 80; const CY = 80;
  let cumPct = 0;
  const segments: { pct: number; color: string; label: string; count: number }[] = [];

  data.forEach((d, i) => {
    const pct = d.count / total;
    segments.push({ pct, color: CHART_COLORS[i % CHART_COLORS.length], label: d.category, count: d.count });
  });

  const polarToXY = (pct: number, r: number) => {
    const angle = pct * 2 * Math.PI - Math.PI / 2;
    return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
  };

  const paths = segments.map((seg, i) => {
    const start = cumPct;
    cumPct += seg.pct;
    const startPt = polarToXY(start, R);
    const endPt   = polarToXY(cumPct, R);
    const largeArc = seg.pct > 0.5 ? 1 : 0;
    const d = `M ${CX} ${CY} L ${startPt.x} ${startPt.y} A ${R} ${R} 0 ${largeArc} 1 ${endPt.x} ${endPt.y} Z`;
    return <path key={i} d={d} fill={seg.color} className="opacity-90 hover:opacity-100 transition-opacity cursor-pointer" />;
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160" className="flex-shrink-0">
        <circle cx={CX} cy={CY} r={R} fill="none" />
        {paths}
        {/* Center hole */}
        <circle cx={CX} cy={CY} r={44} fill="hsl(var(--card))" />
        <text x={CX} y={CY - 6} textAnchor="middle" fill="hsl(var(--foreground))" fontSize="20" fontWeight="bold">{total}</text>
        <text x={CX} y={CY + 12} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize="9">opérations</text>
      </svg>
      <div className="space-y-2 flex-1 min-w-0">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-muted-foreground truncate flex-1">{s.label}</span>
            <span className="text-xs font-semibold tabular-nums text-foreground">{s.count}</span>
            <span className="text-xs text-muted-foreground">({Math.round(s.pct * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Vertical bar chart for monthly productions */
function MonthlyBarChart({ data }: { data: LabelValue[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1.5 h-28 w-full">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const isThisMonth = i === data.length - 1;
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="w-full flex-1 flex items-end">
              <div
                className="w-full rounded-t transition-all duration-500 ease-out"
                style={{
                  height: `${Math.max(pct, 2)}%`,
                  backgroundColor: isThisMonth ? '#3b82f6' : 'hsl(var(--muted))',
                  minHeight: '4px',
                }}
                title={`${d.value} opérations`}
              />
            </div>
            <span className="text-[9px] text-muted-foreground rotate-[-45deg] origin-center whitespace-nowrap overflow-hidden w-6 text-center leading-none">
              {formatMonthLabel(d.label)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<DashboardStats>('/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(() => setError('Erreur lors du chargement des statistiques'))
      .finally(() => setLoading(false));
  }, []);

  const maxMonth = stats ? Math.max(...stats.byMonth.map(d => d.value), 1) : 1;
  const maxCompagne = stats ? Math.max(...stats.byCompagne.map(d => d.value), 1) : 1;

  const txRecouvrement = stats && stats.montantTotal > 0
    ? Math.round((stats.montantRegle / stats.montantTotal) * 100)
    : 0;

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Tableau de bord</h1>
        </div>
        <p className="text-sm text-muted-foreground pl-12">
          Vue d'ensemble de l'activité — {new Date().toLocaleDateString('fr-MA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
        <KpiCard loading={loading} label="Opérations" icon={FileText}
          value={loading ? '…' : String(stats?.totalProductions ?? 0)}
          sub="polices enregistrées"
          color="from-blue-500/20 to-blue-600/5" />
        <KpiCard loading={loading} label="Revenu Total" icon={TrendingUp}
          value={loading ? '…' : formatAmount(stats?.montantTotal ?? 0)}
          sub="primes TTC cumulées"
          color="from-green-500/20 to-green-600/5" />
        <KpiCard loading={loading} label="Réglé" icon={CreditCard}
          value={loading ? '…' : formatAmount(stats?.montantRegle ?? 0)}
          sub={`Taux: ${txRecouvrement}%`}
          color="from-emerald-500/20 to-emerald-600/5" />
        <KpiCard loading={loading} label="Restant" icon={AlertCircle}
          value={loading ? '…' : formatAmount(stats?.montantRestant ?? 0)}
          sub="à encaisser"
          color="from-amber-500/20 to-amber-600/5" />
        <KpiCard loading={loading} label="Clients" icon={Users}
          value={loading ? '…' : String(stats?.totalClients ?? 0)}
          sub="actifs"
          color="from-purple-500/20 to-purple-600/5" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Monthly bar chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-7 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Productions par mois</h2>
              <p className="text-xs text-muted-foreground">12 derniers mois</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" />Mois courant
              <span className="w-2.5 h-2.5 rounded-sm bg-muted inline-block ml-2" />Mois précédents
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-28 w-full rounded-lg" />
          ) : (
            <MonthlyBarChart data={stats?.byMonth ?? []} />
          )}
        </div>

        {/* Status donut / breakdown */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Statuts règlements</h2>
            <p className="text-xs text-muted-foreground">État des paiements</p>
          </div>
          {loading ? (
            <Skeleton className="h-28 w-full rounded-lg" />
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Payé',        count: stats?.reglementsPaie ?? 0,       color: '#10b981', icon: CheckCircle2 },
                { label: 'Partiel',     count: stats?.reglementsPartiel ?? 0,    color: '#f59e0b', icon: AlertCircle },
                { label: 'En attente',  count: stats?.reglementsEnAttente ?? 0,  color: '#64748b', icon: Clock },
              ].map(item => {
                const Icon = item.icon;
                const total = (stats?.reglementsPaie ?? 0) + (stats?.reglementsPartiel ?? 0) + (stats?.reglementsEnAttente ?? 0);
                const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: item.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-semibold text-foreground">{item.count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Category + Compagne charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Category donut */}
        <div className="rounded-xl border border-border bg-card p-7 space-y-5">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Répartition par catégorie</h2>
            <p className="text-xs text-muted-foreground">Toutes les opérations</p>
          </div>
          {loading ? (
            <Skeleton className="h-40 w-full rounded-lg" />
          ) : (
            <DonutChart data={stats?.byCategory ?? []} />
          )}
        </div>

        {/* Top compagnes */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Top compagnies</h2>
            <p className="text-xs text-muted-foreground">Nombre d'opérations par CIE</p>
          </div>
          {loading ? (
            <Skeleton className="h-40 w-full rounded-lg" />
          ) : (
            <BarChart
              data={stats?.byCompagne ?? []}
              maxVal={maxCompagne}
              colorFn={i => CHART_COLORS[i % CHART_COLORS.length]}
            />
          )}
        </div>
      </div>

      {/* Recent productions */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Dernières opérations</h2>
            <p className="text-xs text-muted-foreground">5 opérations les plus récentes</p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={() => router.push('/operations')}>
            Voir tout <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="divide-y divide-border/50">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-24 ml-auto" />
              </div>
            ))
          ) : (stats?.recentProductions ?? []).length === 0 ? (
            <div className="flex flex-col items-center py-12 text-sm text-muted-foreground gap-2">
              <FileText className="w-8 h-8 opacity-30" />
              Aucune opération enregistrée
            </div>
          ) : (
            (stats?.recentProductions ?? []).map(prod => {
              const sc = STATUS_CFG[(prod.reglementStatus ?? 'EN_ATTENTE') as keyof typeof STATUS_CFG] ?? STATUS_CFG.EN_ATTENTE;
              return (
                <div key={prod.id} className="flex items-center gap-5 px-7 py-5 hover:bg-muted/30 transition-colors group">
                  <span className="font-mono text-sm text-primary font-semibold w-28 flex-shrink-0">{prod.numpolice}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{prod.client}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <Building2 className="w-3 h-3" />{prod.compagne}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs font-normal flex-shrink-0">{prod.category}</Badge>
                  {prod.reglementStatus && (
                    <Badge variant={sc.cls as any} className="text-xs flex-shrink-0">{sc.label}</Badge>
                  )}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-green-400 tabular-nums">{formatAmount(prod.montant)}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(prod.dateEff)}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => router.push(`/regelements/${prod.id}`)}>
                    <CreditCard className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
