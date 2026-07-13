'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Client } from '@/types';
import { FiArrowLeft, FiUpload } from 'react-icons/fi';

type ClientType = 'particulier' | 'societe';

export default function NewClientPage() {
  const router = useRouter();
  const [type, setType] = useState<ClientType>('particulier');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nom: '', prenom: '', cin: '', tel: '', adresse: '',
    ice: '', identifiantFiscal: '', rc: '',
    budget: '0', credit: '0',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data: Record<string, any> = { ...form, type, budget: +form.budget, credit: +form.credit };
      const fd = new FormData();
      const jsonBlob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      fd.append('data', jsonBlob);
      if (file) fd.append('doc', file);

      await api.post<Client>('/clients', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      router.push('/clients');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition">
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Nouveau client</h1>
          <p className="text-slate-400 text-sm">Remplissez les informations du client</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Type de client</label>
          <div className="flex gap-3">
            {(['particulier', 'societe'] as ClientType[]).map(t => (
              <button
                key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border transition
                  ${type === t
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                  }`}
              >
                {t === 'particulier' ? '👤 Particulier' : '🏢 Société'}
              </button>
            ))}
          </div>
        </div>

        {/* Common fields */}
        <Field label="Nom" id="nom" value={form.nom} onChange={set('nom')} required />
        <Field label="Téléphone" id="tel" value={form.tel} onChange={set('tel')} required />
        <Field label="Adresse" id="adresse" value={form.adresse} onChange={set('adresse')} required />

        {/* Particulier fields */}
        {type === 'particulier' && (
          <>
            <Field label="Prénom" id="prenom" value={form.prenom} onChange={set('prenom')} required />
            <Field label="CIN" id="cin" value={form.cin} onChange={set('cin')} required />
          </>
        )}

        {/* Société fields */}
        {type === 'societe' && (
          <>
            <Field label="ICE (15 chiffres)" id="ice" value={form.ice} onChange={set('ice')} required />
            <Field label="Identifiant Fiscal" id="if" value={form.identifiantFiscal}
                   onChange={set('identifiantFiscal')} required />
            <Field label="RC" id="rc" value={form.rc} onChange={set('rc')} required />
          </>
        )}

        {/* Financial */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Budget (DH)" id="budget" type="number" value={form.budget} onChange={set('budget')} />
          <Field label="Crédit (DH)" id="credit" type="number" value={form.credit} onChange={set('credit')} />
        </div>

        {/* Document upload */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Document (CIN / Registre)</label>
          <label className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3
                            cursor-pointer hover:border-blue-500 transition">
            <FiUpload className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-400">{file ? file.name : 'Choisir un fichier...'}</span>
            <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
                  className="flex-1 py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm transition">
            Annuler
          </button>
          <button type="submit" disabled={saving}
                  className="flex-1 py-3 px-6 bg-blue-600 hover:bg-blue-500 disabled:opacity-60
                             text-white font-semibold rounded-xl text-sm transition">
            {saving ? 'Enregistrement...' : 'Créer le client'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, id, value, onChange, required = false, type = 'text' }: {
  label: string; id: string; value: string; onChange: any; required?: boolean; type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <input
        id={id} type={type} value={value} onChange={onChange} required={required}
        className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500
                   rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                   focus:border-transparent transition"
      />
    </div>
  );
}
