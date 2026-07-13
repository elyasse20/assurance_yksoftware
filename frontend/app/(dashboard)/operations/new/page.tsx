'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Loader2, AlertCircle, FileText, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { Nature, Category, Compagne, Tva, Parametre, ProductionParameter } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const emptyParam = (): Omit<ProductionParameter, 'name'> & { name: string } =>
  ({ name: '', primes: 0, taxe: 0, taxepara: 0, accessoire: 0, cnpc: 0 });

/* ── Sub-components ──────────────────────────────────────────────────────── */
function FieldRow({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function StyledInput({ id, value, onChange, required = false, type = 'text', placeholder }: any) {
  return (
    <Input id={id} type={type} value={value} onChange={onChange} required={required}
      placeholder={placeholder}
      className="bg-muted/30 border-border focus:border-primary" />
  );
}

function StyledSelect({ id, value, onChange, required = false, children }: any) {
  return (
    <select id={id} value={value} onChange={onChange} required={required}
      className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground bg-muted/30">
      {children}
    </select>
  );
}

export default function NewOperationPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [natures, setNatures] = useState<Nature[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [compagnes, setCompagnes] = useState<Compagne[]>([]);
  const [tvas, setTvas] = useState<Tva[]>([]);
  const [parametres, setParametres] = useState<Parametre[]>([]);

  const [form, setForm] = useState({
    natureOperation: '', client: '', dateEff: '',
    moisDem: '', compagne: '', tvaRate: '0',
    category: '', numpolice: '',
  });
  const [params, setParams] = useState([emptyParam()]);

  useEffect(() => {
    Promise.all([
      api.get<Nature[]>('/natures'), api.get<Category[]>('/categories'),
      api.get<Compagne[]>('/compagnes'), api.get<Tva[]>('/tva'),
      api.get<Parametre[]>('/parametres'),
    ]).then(([n, c, comp, t, p]) => {
      setNatures(n.data); setCategories(c.data);
      setCompagnes(comp.data); setTvas(t.data);
      setParametres(p.data);
    });
  }, []);

  const setF = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const setParam = (i: number, k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setParams(prev => {
      const next = [...prev];
      (next[i] as any)[k] = k === 'name' ? e.target.value : +e.target.value;
      return next;
    });
  };

  const montantTotal = params.reduce((s, p) => s + p.primes + p.taxe + p.taxepara + p.accessoire + p.cnpc, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await api.post('/productions', { ...form, tvaRate: +form.tvaRate, parameters: params });
      router.push('/operations');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur lors de la création');
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Nouvelle opération</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-10">Créer une nouvelle police d'assurance</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-red-400 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Main info */}
        <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-6">
          <h2 className="text-base font-semibold text-foreground">Informations générales</h2>
          <Separator />
          <div className="grid grid-cols-2 gap-5">
            <FieldRow label="Nature" id="nature">
              <StyledSelect id="nature" value={form.natureOperation} onChange={setF('natureOperation')} required>
                <option value="">-- Sélectionner --</option>
                {natures.map(n => <option key={n.id} value={n.name} className="bg-card">{n.name}</option>)}
              </StyledSelect>
            </FieldRow>
            <FieldRow label="Client (nom)" id="client">
              <StyledInput id="client" value={form.client} onChange={setF('client')} required placeholder="Nom du client" />
            </FieldRow>
            <FieldRow label="N° Police" id="numpolice">
              <StyledInput id="numpolice" value={form.numpolice} onChange={setF('numpolice')} required placeholder="Numéro de police" />
            </FieldRow>
            <FieldRow label="Date d'effet" id="dateEff">
              <StyledInput id="dateEff" type="date" value={form.dateEff} onChange={setF('dateEff')} required />
            </FieldRow>
            <FieldRow label="Mois de demande" id="moisDem">
              <StyledInput id="moisDem" value={form.moisDem} onChange={setF('moisDem')} required placeholder="Ex: Janvier 2024" />
            </FieldRow>
            <FieldRow label="Compagne" id="compagne">
              <StyledSelect id="compagne" value={form.compagne} onChange={setF('compagne')} required>
                <option value="">-- Sélectionner --</option>
                {compagnes.map(c => <option key={c.id} value={c.compagneName} className="bg-card">{c.compagneName}</option>)}
              </StyledSelect>
            </FieldRow>
            <FieldRow label="Catégorie" id="category">
              <StyledSelect id="category" value={form.category} onChange={setF('category')} required>
                <option value="">-- Sélectionner --</option>
                {categories.map(c => <option key={c.id} value={c.name} className="bg-card">{c.name}</option>)}
              </StyledSelect>
            </FieldRow>
            <FieldRow label="TVA" id="tva">
              <StyledSelect id="tva" value={form.tvaRate} onChange={setF('tvaRate')}>
                <option value="0" className="bg-card">Sans TVA (0%)</option>
                {tvas.map(t => <option key={t.id} value={t.rate} className="bg-card">{t.name} ({t.rate}%)</option>)}
              </StyledSelect>
            </FieldRow>
          </div>
        </div>

        {/* Parameters section */}
        <div className="rounded-xl border border-border bg-card shadow-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">Paramètres de tarification</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total TTC</p>
                <p className="text-lg font-bold text-green-400 tabular-nums">{montantTotal.toLocaleString('fr-MA')} DH</p>
              </div>
              <Button type="button" onClick={() => setParams(p => [...p, emptyParam()])} variant="outline" size="sm" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Ajouter
              </Button>
            </div>
          </div>
          <Separator />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Paramètre', 'Primes', 'Taxe', 'Taxe Para', 'Accessoire', 'CNPC', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider pb-3 pr-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {params.map((param, i) => (
                  <tr key={i}>
                    <td className="py-3 pr-3">
                      <select value={param.name} onChange={setParam(i, 'name')} required
                        className="flex h-9 w-full rounded-lg border border-input bg-muted/30 px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-foreground min-w-[160px]">
                        <option value="" className="bg-card">-- Paramètre --</option>
                        {parametres.map(p => <option key={p.id} value={p.name} className="bg-card">{p.name}</option>)}
                      </select>
                    </td>
                    {(['primes', 'taxe', 'taxepara', 'accessoire', 'cnpc'] as const).map(k => (
                      <td key={k} className="py-3 pr-3">
                        <Input type="number" min="0" step="0.01"
                          value={(param as any)[k]} onChange={setParam(i, k)}
                          className="bg-muted/30 border-border focus:border-primary w-24 h-9" />
                      </td>
                    ))}
                    <td className="py-3">
                      {params.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setParams(p => p.filter((_, idx) => idx !== i))}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form actions */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>Annuler</Button>
          <Button type="submit" disabled={saving} className="flex-1 shadow-lg shadow-primary/20">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Création...' : "Créer l'opération"}
          </Button>
        </div>
      </form>
    </div>
  );
}
