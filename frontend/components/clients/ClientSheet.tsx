'use client';

import { useState } from 'react';
import { User, Building2, Upload, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { Client } from '@/types';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

type ClientType = 'particulier' | 'societe';

interface ClientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (client: Client) => void;
}

const initialForm = {
  nom: '', prenom: '', cin: '', tel: '', adresse: '',
  ice: '', identifiantFiscal: '', rc: '',
  budget: '0', credit: '0',
};

export function ClientSheet({ open, onOpenChange, onCreated }: ClientSheetProps) {
  const [type, setType] = useState<ClientType>('particulier');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initialForm);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const resetForm = () => {
    setForm(initialForm);
    setFile(null);
    setError('');
    setType('particulier');
    setSaving(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data: Record<string, any> = {
        ...form,
        type,
        budget: +form.budget,
        credit: +form.credit,
      };
      const fd = new FormData();
      const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      fd.append('data', jsonBlob);
      if (file) fd.append('doc', file);

      const { data: created } = await api.post<Client>('/clients', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onCreated(created);
      handleOpenChange(false);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur lors de la création du client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl flex flex-col p-0 overflow-y-auto"
      >
        {/* Sheet Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <SheetTitle>Nouveau client</SheetTitle>
              <SheetDescription>
                Remplissez les informations pour créer un nouveau client
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

            {/* Error alert */}
            {error && (
              <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Type selector */}
            <div className="space-y-2">
              <Label>Type de client</Label>
              <div className="grid grid-cols-2 gap-3">
                {(['particulier', 'societe'] as ClientType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      'flex items-center gap-2.5 py-3 px-4 rounded-xl text-sm font-medium border-2 transition-all duration-200',
                      type === t
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-muted/30 text-muted-foreground hover:border-border/80 hover:text-foreground'
                    )}
                  >
                    {t === 'particulier'
                      ? <User className="w-4 h-4" />
                      : <Building2 className="w-4 h-4" />
                    }
                    {t === 'particulier' ? 'Particulier' : 'Société'}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Common fields */}
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Informations générales
              </p>
              <FieldRow label="Nom" id="nom" value={form.nom} onChange={set('nom')} required placeholder="Nom du client" />
              <FieldRow label="Téléphone" id="tel" value={form.tel} onChange={set('tel')} required placeholder="+212 6XX XXX XXX" />
              <FieldRow label="Adresse" id="adresse" value={form.adresse} onChange={set('adresse')} required placeholder="Adresse complète" />
            </div>

            {/* Particulier fields */}
            {type === 'particulier' && (
              <>
                <Separator />
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Identité personnelle
                  </p>
                  <FieldRow label="Prénom" id="prenom" value={form.prenom} onChange={set('prenom')} required placeholder="Prénom" />
                  <FieldRow label="CIN" id="cin" value={form.cin} onChange={set('cin')} required placeholder="A123456" />
                </div>
              </>
            )}

            {/* Société fields */}
            {type === 'societe' && (
              <>
                <Separator />
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Informations légales
                  </p>
                  <FieldRow label="ICE (15 chiffres)" id="ice" value={form.ice} onChange={set('ice')} required placeholder="000000000000000" />
                  <FieldRow label="Identifiant Fiscal" id="if" value={form.identifiantFiscal} onChange={set('identifiantFiscal')} required placeholder="Identifiant fiscal" />
                  <FieldRow label="RC" id="rc" value={form.rc} onChange={set('rc')} required placeholder="Registre de commerce" />
                </div>
              </>
            )}

            <Separator />

            {/* Financial */}
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Situation financière
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FieldRow label="Budget (DH)" id="budget" type="number" value={form.budget} onChange={set('budget')} placeholder="0" />
                <FieldRow label="Crédit (DH)" id="credit" type="number" value={form.credit} onChange={set('credit')} placeholder="0" />
              </div>
            </div>

            <Separator />

            {/* Document upload */}
            <div className="space-y-2">
              <Label>Document (CIN / Registre)</Label>
              <label
                className={cn(
                  'flex items-center gap-3 rounded-xl border-2 border-dashed px-4 py-4 cursor-pointer transition-all duration-200',
                  file
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border hover:border-primary/40 hover:bg-muted/30'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                  file ? 'bg-primary/20' : 'bg-muted'
                )}>
                  <Upload className={cn('w-4 h-4', file ? 'text-primary' : 'text-muted-foreground')} />
                </div>
                <div className="flex-1 min-w-0">
                  {file ? (
                    <>
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-muted-foreground">Cliquez pour choisir un fichier</p>
                      <p className="text-xs text-muted-foreground/60">PDF, JPG, PNG • Max 5 MB</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

          </div>

          {/* Footer — sticky */}
          <div className="px-6 py-4 border-t border-border bg-card/50 backdrop-blur-sm flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              className="flex-1"
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1 shadow-lg shadow-primary/20"
              disabled={saving}
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? 'Création...' : 'Créer le client'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

/* ── Sub-component ─────────────────────────────────────────────────────────── */
function FieldRow({
  label, id, value, onChange, required = false, type = 'text', placeholder,
}: {
  label: string; id: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean; type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="bg-muted/30 border-border focus:border-primary"
      />
    </div>
  );
}
