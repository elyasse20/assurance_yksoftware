'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, User, Building2, Upload, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { Client } from '@/types';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

type ClientType = 'particulier' | 'societe';

function FieldRow({ label, id, value, onChange, required = false, type = 'text', placeholder }: {
  label: string; id: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
      <Input id={id} type={type} value={value} onChange={onChange} required={required}
        placeholder={placeholder}
        className="bg-muted/30 border-border focus:border-primary" />
    </div>
  );
}

export default function EditClientPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [type, setType] = useState<ClientType>('particulier');
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    nom: '', prenom: '', cin: '', tel: '', adresse: '',
    ice: '', identifiantFiscal: '', rc: '',
    budget: '0', credit: '0',
  });

  useEffect(() => {
    api.get<Client>(`/clients/${id}`).then(({ data }) => {
      setType(data.type);
      setForm({
        nom: data.nom ?? '', prenom: data.prenom ?? '', cin: data.cin ?? '',
        tel: data.tel ?? '', adresse: data.adresse ?? '',
        ice: data.ice ?? '', identifiantFiscal: data.identifiantFiscal ?? '', rc: data.rc ?? '',
        budget: String(data.budget ?? 0), credit: String(data.credit ?? 0),
      });
    }).finally(() => setLoading(false));
  }, [id]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      const data: Record<string, any> = { ...form, type, budget: +form.budget, credit: +form.credit };
      const fd = new FormData();
      const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      fd.append('data', jsonBlob);
      if (file) fd.append('doc', file);
      await api.put(`/clients/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      router.push('/clients');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur lors de la mise à jour');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="max-w-2xl space-y-6">
      {[1,2,3,4].map(i => <div key={i} className="h-12 bg-muted/30 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Modifier le client</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-10">{form.nom} {form.prenom}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card shadow-sm p-8 space-y-6">
        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-red-400 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Type selector */}
        <div className="space-y-2">
          <Label>Type de client</Label>
          <div className="grid grid-cols-2 gap-3">
            {(['particulier', 'societe'] as ClientType[]).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={cn(
                  'flex items-center gap-2.5 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all duration-200',
                  type === t
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/30 text-muted-foreground hover:border-border/80 hover:text-foreground'
                )}>
                {t === 'particulier' ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                {t === 'particulier' ? 'Particulier' : 'Société'}
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Common fields */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Informations générales</p>
          <FieldRow label="Nom" id="nom" value={form.nom} onChange={set('nom')} required />
          <FieldRow label="Téléphone" id="tel" value={form.tel} onChange={set('tel')} required />
          <FieldRow label="Adresse" id="adresse" value={form.adresse} onChange={set('adresse')} required />
        </div>

        {type === 'particulier' && (
          <>
            <Separator />
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identité personnelle</p>
              <FieldRow label="Prénom" id="prenom" value={form.prenom} onChange={set('prenom')} required />
              <FieldRow label="CIN" id="cin" value={form.cin} onChange={set('cin')} required />
            </div>
          </>
        )}

        {type === 'societe' && (
          <>
            <Separator />
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Informations légales</p>
              <FieldRow label="ICE (15 chiffres)" id="ice" value={form.ice} onChange={set('ice')} required />
              <FieldRow label="Identifiant Fiscal" id="if" value={form.identifiantFiscal} onChange={set('identifiantFiscal')} required />
              <FieldRow label="RC" id="rc" value={form.rc} onChange={set('rc')} required />
            </div>
          </>
        )}

        <Separator />

        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Situation financière</p>
          <div className="grid grid-cols-2 gap-4">
            <FieldRow label="Budget (DH)" id="budget" type="number" value={form.budget} onChange={set('budget')} />
            <FieldRow label="Crédit (DH)" id="credit" type="number" value={form.credit} onChange={set('credit')} />
          </div>
        </div>

        <Separator />

        {/* Document upload */}
        <div className="space-y-2">
          <Label>Nouveau document (optionnel)</Label>
          <label className={cn(
            'flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 cursor-pointer transition-all duration-200',
            file ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30'
          )}>
            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', file ? 'bg-primary/20' : 'bg-muted')}>
              <Upload className={cn('w-4 h-4', file ? 'text-primary' : 'text-muted-foreground')} />
            </div>
            <div className="flex-1 min-w-0">
              {file ? (
                <><p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p></>
              ) : (
                <><p className="text-sm font-medium text-muted-foreground">Conserver ou changer le fichier...</p>
                  <p className="text-xs text-muted-foreground/60">PDF, JPG, PNG</p></>
              )}
            </div>
            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>Annuler</Button>
          <Button type="submit" disabled={saving} className="flex-1 shadow-lg shadow-primary/20">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Enregistrement...' : 'Sauvegarder'}
          </Button>
        </div>
      </form>
    </div>
  );
}
