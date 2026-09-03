'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, Shield, UserCheck, Loader2, Key } from 'lucide-react';
import { dbPush, dbUpdate, dbRemove, dbSet, dbSubscribe } from '@/lib/db-service';
import { useTranslation } from '@/lib/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AdminRole, AdminUser } from '@/types/database';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ALL_PERMISSIONS = [
  'dashboard', 'notices', 'teachers', 'departments', 'students',
  'exams', 'results', 'blogs', 'gallery', 'admission',
  'donation', 'settings', 'messages', 'events', 'applications',
  'activity-log', 'payment-history', 'hifz', 'exams-mcq',
  'attendance', 'library', 'calendar', 'fee', 'alumni',
  'prayer', 'hadith', 'sms', 'backup', 'expenses', 'salary',
  'financial-reports', 'vouchers', 'subscriptions', 'hostel',
  'dawah', 'materials', 'roles', 'qr-payment', 'report-builder',
];

const EMPTY_ROLE_FORM = {
  name: '',
  description: '',
  permissions: '' as string,
};

const EMPTY_USER_FORM = {
  username: '',
  password: '',
  name: '',
  roleId: '',
  roleName: '',
  isActive: true,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminRoles() {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const locale = language === 'ar' ? 'ar-EG' : language === 'en' ? 'en-GB' : 'bn-BD';

  /* Display label for a permission key (DB value stays English) */
  const permissionLabel = useCallback((perm: string) => {
    const key = `adminRoles.perm.${perm}`;
    const label = t(key);
    return label === key ? perm : label;
  }, [t]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles');

  /* Role Dialog */
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);
  const [roleForm, setRoleForm] = useState(EMPTY_ROLE_FORM);
  const [roleSubmitting, setRoleSubmitting] = useState(false);

  /* User Dialog */
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [userSubmitting, setUserSubmitting] = useState(false);

  /* Delete */
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; item: any } | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Subscribe */
  useEffect(() => {
    const unsubRoles = dbSubscribe('/adminRoles', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: AdminRole[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        setRoles(list);
        // Pre-populate default role if none exist
        if (list.length === 0) {
          dbSet('/adminRoles/default', {
            name: 'সুপার এডমিন',
            description: 'সকল অনুমতি সহ সুপার এডমিন রোল',
            permissions: ALL_PERMISSIONS,
            createdAt: Date.now(),
          }).catch(() => {});
        }
      } else {
        setRoles([]);
        // Pre-populate default role
        dbSet('/adminRoles/default', {
          name: 'সুপার এডমিন',
          description: 'সকল অনুমতি সহ সুপার এডমিন রোল',
          permissions: ALL_PERMISSIONS,
          createdAt: Date.now(),
        }).catch(() => {});
      }
    });

    const unsubUsers = dbSubscribe('/adminUsers', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: AdminUser[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        setUsers(list);
      } else {
        setUsers([]);
      }
    });

    return () => { unsubRoles(); unsubUsers(); };
  }, []);

  /* Summary */
  const activeUsers = useMemo(() => users.filter((u) => u.isActive).length, [users]);

  /* Role handlers */
  const resetAndOpenRole = useCallback(() => {
    setEditingRole(null);
    setRoleForm(EMPTY_ROLE_FORM);
    setRoleDialogOpen(true);
  }, []);

  const openEditRole = useCallback((role: AdminRole) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissions: (role.permissions || []).join(','),
    });
    setRoleDialogOpen(true);
  }, []);

  const handleSubmitRole = async () => {
    if (!roleForm.name.trim()) {
      toast({ title: t('common.error'), description: t('adminRoles.nameRequired'), variant: 'destructive' });
      return;
    }
    setRoleSubmitting(true);
    try {
      const permissions = roleForm.permissions.split(',').map((p) => p.trim()).filter(Boolean);
      const payload = {
        name: roleForm.name.trim(),
        description: roleForm.description.trim(),
        permissions,
      };
      if (editingRole) {
        await dbUpdate('/adminRoles/' + editingRole.id, payload);
        toast({ title: t('common.success'), description: t('adminRoles.roleUpdated') });
      } else {
        await dbPush('/adminRoles', { ...payload, createdAt: Date.now() });
        toast({ title: t('common.success'), description: t('adminRoles.roleAdded') });
      }
      setRoleDialogOpen(false);
      setRoleForm(EMPTY_ROLE_FORM);
      setEditingRole(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setRoleSubmitting(false);
    }
  };

  /* User handlers */
  const resetAndOpenUser = useCallback(() => {
    setEditingUser(null);
    setUserForm(EMPTY_USER_FORM);
    setUserDialogOpen(true);
  }, []);

  const openEditUser = useCallback((user: AdminUser) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      password: user.password,
      name: user.name,
      roleId: user.roleId,
      roleName: user.roleName,
      isActive: user.isActive,
    });
    setUserDialogOpen(true);
  }, []);

  const handleSubmitUser = async () => {
    if (!userForm.username.trim() || !userForm.name.trim() || !userForm.roleId) {
      toast({ title: t('common.error'), description: t('adminRoles.userRequired'), variant: 'destructive' });
      return;
    }
    setUserSubmitting(true);
    try {
      const selectedRole = roles.find((r) => r.id === userForm.roleId);
      const payload = {
        username: userForm.username.trim(),
        password: userForm.password.trim() || userForm.username.trim(),
        name: userForm.name.trim(),
        roleId: userForm.roleId,
        roleName: selectedRole?.name || userForm.roleName,
        isActive: userForm.isActive,
      };
      if (editingUser) {
        await dbUpdate('/adminUsers/' + editingUser.id, payload);
        toast({ title: t('common.success'), description: t('adminRoles.userUpdated') });
      } else {
        await dbPush('/adminUsers', { ...payload, lastLogin: 0, createdAt: Date.now() });
        toast({ title: t('common.success'), description: t('adminRoles.userAdded') });
      }
      setUserDialogOpen(false);
      setUserForm(EMPTY_USER_FORM);
      setEditingUser(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setUserSubmitting(false);
    }
  };

  const toggleUserActive = async (user: AdminUser) => {
    try {
      await dbUpdate('/adminUsers/' + user.id, { isActive: !user.isActive });
      toast({ title: t('common.success'), description: user.isActive ? t('adminRoles.userDeactivated') : t('adminRoles.userActivated') });
    } catch {
      toast({ title: t('common.error'), description: t('adminRoles.updateFailed'), variant: 'destructive' });
    }
  };

  /* Delete handler */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const path = deleteTarget.type === 'role' ? '/adminRoles/' : '/adminUsers/';
      await dbRemove(path + deleteTarget.item.id);
      toast({ title: t('common.success'), description: t('adminRoles.itemDeleted') });
      setDeleteTarget(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminRoles.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminRoles.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'roles' ? 'default' : 'outline'}
            onClick={() => setActiveTab('roles')}
            className={`gap-2 cursor-pointer ${activeTab === 'roles' ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
          >
            <Shield className="size-4" />
            {t('adminRoles.role')}
          </Button>
          <Button
            variant={activeTab === 'users' ? 'default' : 'outline'}
            onClick={() => setActiveTab('users')}
            className={`gap-2 cursor-pointer ${activeTab === 'users' ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
          >
            <UserCheck className="size-4" />
            {t('adminRoles.users')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-islamic-dark">{roles.length}</p>
            <p className="text-xs text-muted-foreground">{t('adminRoles.statTotalRoles')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
            <p className="text-xs text-muted-foreground">{t('adminRoles.statActiveUsers')}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{users.length}</p>
            <p className="text-xs text-muted-foreground">{t('adminRoles.statTotalUsers')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <>
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              {roles.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminRoles.roleName')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.description')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('adminRoles.permissions')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.map((role) => (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium text-sm text-islamic-dark py-3">
                            <div className="flex items-center gap-2">
                              <Shield className="size-4 text-islamic" />
                              {role.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{role.description || '—'}</TableCell>
                          <TableCell className="py-3 text-center">
                            <Badge variant="secondary" className="text-xs">{t('adminRoles.permCount', { count: (role.permissions || []).length })}</Badge>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEditRole(role)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer" onClick={() => setDeleteTarget({ type: 'role', item: role })}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Shield className="size-12 opacity-20 mb-3" />
                  <p className="text-sm">{t('adminRoles.noRoles')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Roles Mobile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {roles.length > 0 ? roles.map((role) => (
              <Card key={role.id} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{role.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{role.description || '—'}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEditRole(role)}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteTarget({ type: 'role', item: role })}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">{t('adminRoles.permCount', { count: (role.permissions || []).length })}</span>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Shield className="size-10 opacity-20 mb-2" />
                <p className="text-sm">{t('adminRoles.noRoles')}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={resetAndOpenRole} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              <Plus className="size-4" />
              {t('adminRoles.addRole')}
            </Button>
          </div>
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <>
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              {users.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.name')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminNav.username')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminRoles.role')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('common.status')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminRoles.createdAt')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium text-sm text-islamic-dark py-3">{user.name}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground flex items-center gap-1">
                            <Key className="size-3" /> {user.username}
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge variant="secondary" className="text-xs">{user.roleName || '—'}</Badge>
                          </TableCell>
                          <TableCell className="py-3 text-center">
                            <Badge className={`text-xs cursor-pointer ${
                              user.isActive ? 'bg-green-100 text-green-700 border-green-200' :
                              'bg-red-100 text-red-700 border-red-200'
                            }`} onClick={() => toggleUserActive(user)}>
                              {user.isActive ? t('common.active') : t('common.inactive')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString(locale) : '—'}
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-islamic cursor-pointer" onClick={() => openEditUser(user)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer" onClick={() => setDeleteTarget({ type: 'user', item: user })}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <UserCheck className="size-12 opacity-20 mb-3" />
                  <p className="text-sm">{t('adminRoles.noUsers')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Users Mobile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {users.length > 0 ? users.map((user) => (
              <Card key={user.id} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">@{user.username} • {user.roleName || '—'}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEditUser(user)}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteTarget({ type: 'user', item: user })}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {user.createdAt && <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium">{new Date(user.createdAt).toLocaleDateString(locale)}</span>}
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium cursor-pointer ${
                      user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`} onClick={() => toggleUserActive(user)}>{user.isActive ? t('common.active') : t('common.inactive')}</span>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <UserCheck className="size-10 opacity-20 mb-2" />
                <p className="text-sm">{t('adminRoles.noUsers')}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={resetAndOpenUser} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              <Plus className="size-4" />
              {t('adminRoles.addUser')}
            </Button>
          </div>
        </>
      )}

      {/* Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={(open) => {
        setRoleDialogOpen(open);
        if (!open) { setEditingRole(null); setRoleForm(EMPTY_ROLE_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingRole ? t('adminRoles.editRoleTitle') : t('adminRoles.addRole')}
            </DialogTitle>
            <DialogDescription>
              {editingRole ? t('adminRoles.editRoleDesc') : t('adminRoles.newRoleDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="role-name">{t('adminRoles.roleName')} *</Label>
              <Input id="role-name" placeholder={t('adminRoles.roleNamePlaceholder')} value={roleForm.name} onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-desc">{t('common.description')}</Label>
              <Textarea id="role-desc" placeholder={t('adminRoles.roleDescPlaceholder')} rows={2} value={roleForm.description} onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-perms">{t('adminRoles.permsLabel')}</Label>
              <Textarea
                id="role-perms"
                placeholder="dashboard, notices, teachers..."
                rows={3}
                value={roleForm.permissions}
                onChange={(e) => setRoleForm((f) => ({ ...f, permissions: e.target.value }))}
              />
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {ALL_PERMISSIONS.map((perm) => {
                  const permList = roleForm.permissions.split(',').map((p) => p.trim());
                  const checked = permList.includes(perm);
                  return (
                    <Badge
                      key={perm}
                      variant={checked ? 'default' : 'outline'}
                      className={`text-xs cursor-pointer ${checked ? 'bg-islamic text-white' : ''}`}
                      onClick={() => {
                        if (checked) {
                          setRoleForm((f) => ({ ...f, permissions: permList.filter((p) => p !== perm).join(',') }));
                        } else {
                          setRoleForm((f) => ({ ...f, permissions: [...permList, perm].join(',') }));
                        }
                      }}
                    >
                      {permissionLabel(perm)}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRoleDialogOpen(false); setEditingRole(null); setRoleForm(EMPTY_ROLE_FORM); }}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmitRole} disabled={roleSubmitting} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              {roleSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editingRole ? t('common.update') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={(open) => {
        setUserDialogOpen(open);
        if (!open) { setEditingUser(null); setUserForm(EMPTY_USER_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingUser ? t('adminRoles.editUserTitle') : t('adminRoles.addUser')}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? t('adminRoles.editUserDesc') : t('adminRoles.newUserDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">{t('payment.fullName')} *</Label>
                <Input id="user-name" placeholder={t('payment.fullName')} value={userForm.name} onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-username">{t('adminNav.username')} *</Label>
                <Input id="user-username" placeholder={t('adminNav.username')} value={userForm.username} onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-password">{t('admin.password')}</Label>
                <Input id="user-password" type="password" placeholder={t('admin.password')} value={userForm.password} onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t('adminRoles.role')} *</Label>
                <Select value={userForm.roleId} onValueChange={(v) => {
                  const role = roles.find((r) => r.id === v);
                  setUserForm((f) => ({ ...f, roleId: v, roleName: role?.name || '' }));
                }}>
                  <SelectTrigger><SelectValue placeholder={t('adminRoles.selectRole')} /></SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setUserDialogOpen(false); setEditingUser(null); setUserForm(EMPTY_USER_FORM); }}>{t('common.cancel')}</Button>
            <Button onClick={handleSubmitUser} disabled={userSubmitting} className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer">
              {userSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editingUser ? t('common.update') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('adminRoles.deleteWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white gap-2 cursor-pointer">
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {t('common.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
