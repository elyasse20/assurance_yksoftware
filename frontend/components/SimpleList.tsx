'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SimpleItem { id: string; name: string; [key: string]: any; }

interface Props {
  title: string;
  endpoint: string;
  icon?: React.ReactNode;
  extraFields?: { key: string; label: string; type?: string }[];
}

/**
 * Modernized reusable CRUD list for simple lookup items (Nature, Category, Parametre, TVA).
 */
export default function SimpleList({ title, endpoint, icon, extraFields = [] }: Props) {
  const [items, setItems] = useState<SimpleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [newName, setNewName] = useState('');
  const [newExtra, setNewExtra] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<SimpleItem[]>(`/${endpoint}`);
      setItems(data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [endpoint]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/${endpoint}`, { name: newName, ...newExtra });
      setNewName('');
      setNewExtra({});
      fetchAll();
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Erreur lors de la création');
    }
  };

  const handleEdit = (item: SimpleItem) => {
    setEditingId(item.id);
    setSaveError('');
    const vals: Record<string, string> = { name: item.name };
    extraFields.forEach(f => { vals[f.key] = String(item[f.key] ?? ''); });
    setEditValues(vals);
  };

  const handleUpdate = async (id: string) => {
    setSaveError('');
    try {
      const payload: Record<string, any> = { name: editValues.name };
      extraFields.forEach(f => { payload[f.key] = editValues[f.key]; });
      await api.put(`/${endpoint}/${id}`, payload);
      setEditingId(null);
      fetchAll();
    } catch (err: any) {
      setSaveError(err.response?.data?.message ?? 'Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/${endpoint}/${id}`);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              {icon}
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        </div>
        <p className="text-sm text-muted-foreground pl-10">
          {loading ? 'Chargement...' : `${items.length} élément(s)`}
        </p>
      </div>

      {/* Add form */}
      <div className="rounded-xl border border-border bg-card shadow-sm p-6">
        <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" />
          Ajouter un élément
        </h2>

        {error && (
          <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-red-400 rounded-lg px-3 py-2.5 mb-4 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <Label htmlFor="new-name" className="sr-only">Nom</Label>
            <Input
              id="new-name"
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder={`Nom du ${title.toLowerCase()}...`}
              required
              className="bg-muted/30 border-border focus:border-primary"
            />
          </div>
          {extraFields.map(f => (
            <div key={f.key} className="min-w-[140px]">
              <Label htmlFor={`new-${f.key}`} className="sr-only">{f.label}</Label>
              <Input
                id={`new-${f.key}`}
                type={f.type ?? 'text'}
                value={newExtra[f.key] ?? ''}
                onChange={e => setNewExtra(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.label}
                className="bg-muted/30 border-border focus:border-primary"
              />
            </div>
          ))}
          <Button type="submit" className="gap-2 shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
        </form>
      </div>

      {/* List table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {saveError && (
          <div className="flex items-center gap-2 bg-destructive/10 border-b border-destructive/30 text-red-400 px-6 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {saveError}
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead>Nom</TableHead>
              {extraFields.map(f => (
                <TableHead key={f.key}>{f.label}</TableHead>
              ))}
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent border-border/50">
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    {extraFields.map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}
                    <TableCell><div className="flex justify-end gap-2"><Skeleton className="h-8 w-8 rounded-lg" /><Skeleton className="h-8 w-8 rounded-lg" /></div></TableCell>
                  </TableRow>
                ))}
              </>
            ) : items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={extraFields.length + 2}>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4">
                      <Plus className="w-7 h-7 text-muted-foreground/40" />
                    </div>
                    <p className="text-base font-medium text-foreground mb-1">Aucun élément</p>
                    <p className="text-sm text-muted-foreground">Utilisez le formulaire ci-dessus pour ajouter votre premier élément.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map(item => (
                <TableRow key={item.id} className="border-border/40 group">
                  <TableCell>
                    {editingId === item.id ? (
                      <Input
                        value={editValues.name}
                        onChange={e => setEditValues(p => ({ ...p, name: e.target.value }))}
                        className="bg-muted/40 border-border focus:border-primary h-8 text-sm max-w-[240px]"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                    )}
                  </TableCell>
                  {extraFields.map(f => (
                    <TableCell key={f.key}>
                      {editingId === item.id ? (
                        <Input
                          type={f.type ?? 'text'}
                          value={editValues[f.key] ?? ''}
                          onChange={e => setEditValues(p => ({ ...p, [f.key]: e.target.value }))}
                          className="bg-muted/40 border-border focus:border-primary h-8 text-sm w-24"
                        />
                      ) : (
                        <span className="text-sm text-muted-foreground">{item[f.key]}</span>
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {editingId === item.id ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-400 hover:bg-green-500/10" onClick={() => handleUpdate(item.id)} title="Enregistrer">
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={() => setEditingId(null)} title="Annuler">
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => handleEdit(item)} title="Modifier">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" title="Supprimer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer cet élément ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  <span className="font-semibold text-foreground">{item.name}</span> sera définitivement supprimé.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(item.id)}>Supprimer</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
