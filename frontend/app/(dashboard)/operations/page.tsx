'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Plus, Edit2, Trash2, CreditCard, RefreshCw,
  TrendingUp, Calendar, Building2, Hash,
} from 'lucide-react';
import api from '@/lib/api';
import { Production } from '@/types';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i} className="hover:bg-transparent border-border/50">
          {Array.from({ length: 8 }).map((_, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full max-w-[120px]" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function EmptyOperations({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl scale-150" />
        <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-lg">
          <FileText className="w-10 h-10 text-primary/60" />
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary/30 animate-pulse" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-3">Aucune opération enregistrée</h3>
      <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-8">
        Commencez par créer votre première opération (police d'assurance) pour gérer vos productions.
      </p>
      <Button onClick={onAdd} className="gap-2 shadow-lg shadow-primary/20" size="lg">
        <Plus className="w-4 h-4" />
        Créer une opération
      </Button>
    </div>
  );
}

export default function OperationsPage() {
  const router = useRouter();
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const { data } = await api.get<Production[]>('/productions');
      setProductions(data);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string) => {
    await api.delete(`/productions/${id}`);
    setProductions(prev => prev.filter(p => p.id !== id));
  };

  const total = (prod: Production) =>
    prod.parameters?.reduce((s, p) => s + p.primes + p.taxe + p.taxepara + p.accessoire + p.cnpc, 0) ?? 0;

  const totalRevenu = productions.reduce((s, p) => s + total(p), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Opérations</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-10">
            {loading ? 'Chargement...' : `${productions.length} opération(s) • Total: ${totalRevenu.toLocaleString('fr-MA')} DH`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchData(true)} disabled={refreshing} className="h-9 w-9" title="Actualiser">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => router.push('/operations/new')} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Nouvelle opération
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead><div className="flex items-center gap-1.5"><Hash className="w-3 h-3" />Police</div></TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Compagne</TableHead>
              <TableHead><div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />Date Effet</div></TableHead>
              <TableHead>Mois Dem</TableHead>
              <TableHead className="text-right"><div className="flex items-center justify-end gap-1.5"><TrendingUp className="w-3 h-3" />Total TTC</div></TableHead>
              <TableHead className="w-[120px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableSkeleton /> : productions.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="p-0">
                  <EmptyOperations onAdd={() => router.push('/operations/new')} />
                </TableCell>
              </TableRow>
            ) : (
              productions.map(prod => (
                <TableRow key={prod.id} className="border-border/40 group">
                  <TableCell>
                    <span className="font-mono text-sm text-primary font-semibold">{prod.numpolice}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-foreground">{prod.client}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-normal">{prod.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="w-3 h-3" />
                      {prod.compagne}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{prod.dateEff?.slice(0, 10)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{prod.moisDem}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-semibold text-green-400 tabular-nums">
                      {total(prod).toLocaleString('fr-MA')} DH
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
                        onClick={() => router.push(`/regelements/${prod.id}`)} title="Règlement">
                        <CreditCard className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => router.push(`/operations/${prod.id}/edit`)} title="Modifier">
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
                            <AlertDialogTitle>Supprimer cette opération ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Police <span className="font-semibold text-foreground font-mono">{prod.numpolice}</span> — {prod.client}. Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(prod.id)}>Supprimer</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Stats footer */}
      {!loading && productions.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>{productions.length} opération(s)</span>
          <span>Revenu total : <span className="font-semibold text-green-400">{totalRevenu.toLocaleString('fr-MA')} DH</span></span>
        </div>
      )}
    </div>
  );
}
