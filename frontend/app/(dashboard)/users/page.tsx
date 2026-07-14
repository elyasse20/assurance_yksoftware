'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Shield, UserIcon, Trash2, RefreshCw,
  Plus, Edit2, X, Eye, EyeOff, AlertCircle, KeyRound,
} from 'lucide-react';
import api from '@/lib/api';
import { User } from '@/types';
import { useAuth } from '@/context/AuthContext';

import { Button }   from '@/components/ui/button';
import { Badge }    from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// ── Types ─────────────────────────────────────────────────────────────────────
interface UserFormData {
  username: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'USER';
}

const EMPTY_FORM: UserFormData = { username: '', email: '', password: '', role: 'USER' };

const ROLE_OPTIONS: { value: 'ADMIN' | 'USER'; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'ADMIN', label: 'Administrateur', icon: Shield,   color: 'bg-violet-500/10 text-violet-400 border-violet-500/30' },
  { value: 'USER',  label: 'Utilisateur',    icon: UserIcon, color: 'bg-secondary text-secondary-foreground border-border' },
];

// ── Form Modal ────────────────────────────────────────────────────────────────
function UserFormModal({
  open,
  onClose,
  onSaved,
  editUser,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editUser: User | null;
}) {
  const isEdit = editUser !== null;
  const [form, setForm]     = useState<UserFormData>(EMPTY_FORM);
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setError('');
      setShowPwd(false);
      if (editUser) {
        setForm({
          username: editUser.username,
          email:    editUser.email,
          password: '',            // leave blank to keep current password
          role:     (editUser.role as 'ADMIN' | 'USER') ?? 'USER',
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [open, editUser]);

  const set = (key: keyof UserFormData, value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim()) { setError("Le nom d'utilisateur est requis."); return; }
    if (!form.email.trim())    { setError("L'email est requis."); return; }
    if (!isEdit && !form.password) { setError("Le mot de passe est requis pour la création."); return; }

    setSaving(true);
    try {
      const payload: Record<string, string> = {
        username: form.username,
        email:    form.email,
        role:     form.role,
      };
      if (form.password) payload.password = form.password;

      if (isEdit) {
        await api.put(`/users/${editUser!.id}`, payload);
      } else {
        await api.post('/users', payload);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'bg-muted/30 border-border focus:border-primary h-10';

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              {isEdit ? <Edit2 className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-primary" />}
            </div>
            {isEdit ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Username */}
          <div className="space-y-1.5">
            <Label htmlFor="um-username">Nom d'utilisateur <span className="text-destructive">*</span></Label>
            <Input
              id="um-username"
              value={form.username}
              onChange={e => set('username', e.target.value)}
              placeholder="ex : jean.dupont"
              className={inputCls}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="um-email">Email <span className="text-destructive">*</span></Label>
            <Input
              id="um-email"
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="email@exemple.com"
              className={inputCls}
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="um-password">
              Mot de passe
              {isEdit && <span className="text-muted-foreground text-xs ml-1">(laisser vide pour conserver)</span>}
              {!isEdit && <span className="text-destructive"> *</span>}
            </Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                id="um-password"
                type={showPwd ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder={isEdit ? '••••••••' : 'Minimum 6 caractères'}
                className={`${inputCls} pl-9 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label="Afficher/masquer le mot de passe"
              >
                {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Rôle <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-3">
              {ROLE_OPTIONS.map(r => {
                const Icon = r.icon;
                const active = form.role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => set('role', r.value)}
                    className={`
                      flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium
                      transition-all duration-150
                      ${active
                        ? `${r.color} ring-2 ring-offset-1 ring-primary/30 shadow-sm`
                        : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              <X className="w-3.5 h-3.5 mr-1.5" /> Annuler
            </Button>
            <Button type="submit" disabled={saving} className="gap-2 shadow-lg shadow-primary/20">
              {saving
                ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                : isEdit
                  ? <><Edit2 className="w-3.5 h-3.5" /> Enregistrer</>
                  : <><Plus className="w-3.5 h-3.5" /> Créer</>
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { isAdminUser, user: me } = useAuth();
  const router = useRouter();
  const [users,      setUsers]      = useState<User[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editUser,   setEditUser]   = useState<User | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const { data } = await api.get<User[]>('/users');
      setUsers(data);
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    if (!isAdminUser) { router.push('/unauthorized'); return; }
    fetchData();
  }, [isAdminUser, router, fetchData]);

  const handleDelete = async (id: string) => {
    await api.delete(`/users/${id}`);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const openCreate = () => { setEditUser(null); setModalOpen(true); };
  const openEdit   = (u: User) => { setEditUser(u); setModalOpen(true); };
  const closeModal = () => setModalOpen(false);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Utilisateurs</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-12">
            {loading ? 'Chargement…' : `${users.length} utilisateur(s) enregistré(s)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchData(true)} disabled={refreshing} className="h-9 w-9" title="Actualiser">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={openCreate} className="gap-2 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Nouvel utilisateur
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/60">
              <TableHead>Utilisateur</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead className="w-[110px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <>
                {Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent border-border/50">
                    <TableCell><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-4 w-28" /></div></TableCell>
                    <TableCell><Skeleton className="h-4 w-44" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><div className="flex justify-end gap-1"><Skeleton className="h-8 w-8 rounded-lg" /><Skeleton className="h-8 w-8 rounded-lg" /></div></TableCell>
                  </TableRow>
                ))}
              </>
            ) : users.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={4}>
                  <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                      <Users className="w-7 h-7 text-muted-foreground/40" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground mb-1">Aucun utilisateur</p>
                      <p className="text-sm text-muted-foreground">Créez le premier compte utilisateur.</p>
                    </div>
                    <Button onClick={openCreate} className="gap-2">
                      <Plus className="w-4 h-4" /> Créer un utilisateur
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map(u => {
                const isSelf = u.id === me?.id;
                const initials = u.username.slice(0, 2).toUpperCase();
                const isAdmin = u.role === 'ADMIN';
                return (
                  <TableRow key={u.id} className="border-border/40 group">
                    {/* User info */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarFallback className={`text-[11px] font-bold ${isAdmin ? 'bg-violet-500/20 text-violet-400' : 'bg-primary/10 text-primary'}`}>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{u.username}</span>
                            {isSelf && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                                Vous
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>

                    {/* Role badge */}
                    <TableCell>
                      <Badge variant={isAdmin ? 'violet' : 'secondary'}>
                        {isAdmin ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                        {u.role}
                      </Badge>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {/* Edit */}
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => openEdit(u)}
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        {/* Delete — prevent deleting yourself */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-30"
                              title={isSelf ? 'Vous ne pouvez pas supprimer votre propre compte' : 'Supprimer'}
                              disabled={isSelf}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Le compte de <span className="font-semibold text-foreground">{u.username}</span>{' '}
                                (<span className="font-mono text-xs">{u.email}</span>) sera définitivement supprimé.
                                Cette action est irréversible.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(u.id)}
                                className="bg-destructive hover:bg-destructive/90 text-white"
                              >
                                Supprimer définitivement
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit modal */}
      <UserFormModal
        open={modalOpen}
        onClose={closeModal}
        onSaved={() => fetchData(true)}
        editUser={editUser}
      />
    </div>
  );
}
