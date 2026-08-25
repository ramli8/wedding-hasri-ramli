'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { MainLayout } from '@/src/presentation/components/layout/main-layout';
import { ProtectedRoute } from '@/src/presentation/components/layout/protected-route';
import { ProtectedModule, ProtectedFeature } from '@/src/presentation/components/layout/protected-feature';
import { Button } from '@/src/presentation/components/ui/button';
import { Input } from '@/src/presentation/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/presentation/components/ui/table';
import { Badge } from '@/src/presentation/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/presentation/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/src/presentation/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/src/presentation/components/ui/alert-dialog';
import { Label } from '@/src/presentation/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/presentation/components/ui/select';
import { Alert, AlertDescription } from '@/src/presentation/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/presentation/components/ui/tabs';
import { Switch } from '@/src/presentation/components/ui/switch';
import { Search, UserPlus, Edit, Trash2, Shield, Loader2, ChevronLeft, ChevronRight, Power, ArrowUpDown, RotateCcw, Users, UserX, User as UserIcon, Plus, Settings2, Check, X } from 'lucide-react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser, useToggleUserStatus, useDeletedUsers, useRestoreUser } from '@/src/application/hooks/use-users-query';
import { rbacService, type Role } from '@/src/domain/services/rbac.service';
import { UserListParams } from '@/src/domain/services/user.service';
import { User } from '@/src/domain/services/auth.service';
import { useEffect } from 'react';

export default function UsersPage() {
    const [activeTab, setActiveTab] = useState('active');

    // Query params state
    const [queryParams, setQueryParams] = useState<UserListParams>({
        page: 1,
        page_size: 10,
        search: '',
        sort_by: 'created_at',
        sort_dir: 'desc',
    });

    const [deletedQueryParams, setDeletedQueryParams] = useState<UserListParams>({
        page: 1,
        page_size: 10,
        search: '',
    });

    const [searchInput, setSearchInput] = useState('');
    const [deletedSearchInput, setDeletedSearchInput] = useState('');
    const [roles, setRoles] = useState<Role[]>([]);
    const [error, setError] = useState('');

    // Dialog states
    const [modalType, setModalType] = useState<'filter' | 'sort' | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

    // Prevent body scroll when custom modals are open
    useEffect(() => {
        if (isCreateDialogOpen || isEditDialogOpen || modalType) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isCreateDialogOpen, isEditDialogOpen, modalType]);
    // Form states
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });

    // API hooks
    const { data: usersData, isLoading } = useUsers(queryParams);
    const { data: deletedUsersData, isLoading: isLoadingDeleted, refetch: refetchDeletedUsersData } = useDeletedUsers(deletedQueryParams);
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const deleteUser = useDeleteUser();
    const toggleStatus = useToggleUserStatus();
    const restoreUser = useRestoreUser();

    const hasNextPage = usersData && (queryParams.page || 1) * (queryParams.page_size || 10) < usersData.total;

    const fetchNextPage = () => {
        setQueryParams(prev => ({ ...prev, page_size: (prev.page_size || 10) + 10 }));
    };

    // Load roles on mount
    useEffect(() => {
        rbacService.getAllRoles().then(setRoles).catch(console.error);
    }, []);

    // Prevent body scroll when custom modals are open
    useEffect(() => {
        if (modalType) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [modalType]);

    // Debounced search for active users
    useEffect(() => {
        const timer = setTimeout(() => {
            setQueryParams(prev => ({ ...prev, page: 1, search: searchInput }));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Debounced search for deleted users
    useEffect(() => {
        const timer = setTimeout(() => {
            setDeletedQueryParams(prev => ({ ...prev, page: 1, search: deletedSearchInput }));
        }, 300);
        return () => clearTimeout(timer);
    }, [deletedSearchInput]);

    const handleCreateUser = async () => {
        try {
            await createUser.mutateAsync({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role_ids: selectedRoles,
            });
            setIsCreateDialogOpen(false);
            resetForm();
            toast.success('Pengguna berhasil ditambahkan');
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Gagal menambahkan pengguna';
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;
        try {
            await updateUser.mutateAsync({
                id: selectedUser.id,
                data: {
                    name: formData.name,
                    email: formData.email,
                    role_ids: selectedRoles,
                },
            });
            setIsEditDialogOpen(false);
            resetForm();
            toast.success('Data pengguna berhasil diperbarui');
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Gagal memperbarui pengguna';
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        try {
            await deleteUser.mutateAsync(selectedUser.id);
            setIsDeleteDialogOpen(false);
            setSelectedUser(null);
            refetchDeletedUsersData();
            toast.error('Pengguna berhasil dihapus');
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Gagal menghapus pengguna';
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };

    const handleRestoreUser = async () => {
        if (!selectedUser) return;
        try {
            await restoreUser.mutateAsync(selectedUser.id);
            setIsRestoreDialogOpen(false);
            setSelectedUser(null);
            toast.success('Pengguna berhasil dipulihkan');
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Gagal memulihkan pengguna';
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };

    const handleToggleStatus = async (user: User) => {
        try {
            await toggleStatus.mutateAsync(user.id);
            toast.success(`Status pengguna ${user.name} berhasil diubah`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to toggle user status');
            toast.error('Gagal mengubah status pengguna');
        }
    };

    const handleAssignRoles = async () => {
        if (!selectedUser) return;
        try {
            await updateUser.mutateAsync({
                id: selectedUser.id,
                data: { role_ids: selectedRoles },
            });
            setIsRoleDialogOpen(false);
            setSelectedUser(null);
            setSelectedRoles([]);
            toast.success('Peran berhasil ditetapkan');
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Gagal menetapkan peran';
            setError(errorMsg);
            toast.error(errorMsg);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '' });
        setSelectedRoles([]);
        setSelectedUser(null);
        setError('');
    };

    const openEditDialog = (user: User) => {
        setSelectedUser(user);
        setFormData({ name: user.name, email: user.email, password: '' });
        const userRoleIds = roles
            .filter(role => user.roles?.includes(role.name))
            .map(role => role.id);
        setSelectedRoles(userRoleIds);
        setIsEditDialogOpen(true);
    };

    const openRoleDialog = (user: User) => {
        setSelectedUser(user);
        const userRoleIds = roles
            .filter(role => user.roles?.includes(role.name))
            .map(role => role.id);
        setSelectedRoles(userRoleIds);
        setIsRoleDialogOpen(true);
    };

    const handleSort = (field: string) => {
        setQueryParams(prev => ({
            ...prev,
            sort_by: field,
            sort_dir: prev.sort_by === field && prev.sort_dir === 'asc' ? 'desc' : 'asc',
        }));
    };

    const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
        <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => handleSort(field)}
        >
            {children}
            <ArrowUpDown className="h-3 w-3" />
        </button>
    );

    return (
        <ProtectedRoute>
            <ProtectedModule requiredRole={['Super Admin', 'Admin']}>
                <div className="min-h-screen bg-background text-foreground pb-32 relative font-sans transition-colors duration-300">
                    <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-primary/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] px-5 py-4 flex items-center justify-between mb-8 transition-all">
                        <Link
                            href="/admin"
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-[18px] font-extrabold tracking-tight absolute left-1/2 -translate-x-1/2 text-foreground">
                            Pengguna
                        </h1>
                        <div className="w-10 shrink-0" />
                    </div>

                    <div className="px-5">
                        {error ? (
                            <Alert variant="destructive" className="mb-4">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        ) : null}

                        
                        <div className="flex items-center gap-3 mb-6">
                                            <div className="relative flex-1">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                <Input
                                                    placeholder="Cari nama pengguna..."
                                                    value={searchInput}
                                                    onChange={(e) => setSearchInput(e.target.value)}
                                                    className="pl-11 rounded-full bg-card border-border/60 shadow-sm h-11 text-[13.5px] focus-visible:ring-primary"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setModalType("sort")}
                                                    className={`flex items-center justify-center w-11 h-11 rounded-full shadow-sm transition-colors border ${
                                                        queryParams.sort_by
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
                                                    }`}
                                                >
                                                    <ArrowUpDown className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setModalType("filter")}
                                                    className={`flex items-center justify-center w-11 h-11 rounded-full shadow-sm transition-colors border ${
                                                        queryParams.is_active !== undefined
                                                        ? "bg-primary text-primary-foreground border-primary"
                                                        : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
                                                    }`}
                                                >
                                                    <Settings2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    

                        <div className="flex items-center justify-between mt-2 mb-4 px-2 min-h-[32px]">
                            <span className="text-sm font-semibold text-foreground tracking-tight">
                                Semua Pengguna ({usersData?.total || 0})
                            </span>
                        </div>

                        {isLoading ? (
                                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary/50" />
                                            <p className="text-[13px]">Memuat pengguna...</p>
                                        </div>
                                    ) : !usersData?.items?.length ? (
                                        <div className="w-full flex-1 flex flex-col items-center justify-center space-y-6 py-12">
                                            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Shield className="w-10 h-10 text-primary" />
                                            </div>
                                            <div className="text-center w-full px-4">
                                                <h2 className="text-[19px] font-bold tracking-tight mb-2 text-foreground">Kosong</h2>
                                                <p className="text-[13px] text-muted-foreground leading-snug">
                                                    {queryParams.search ? 'Tidak ada pengguna ditemukan.' : 'Tambah pengguna pertama untuk memulai'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {usersData.items.map((user) => (
                                                <div key={user.id} className="bg-card rounded-[24px] p-5 shadow-sm border border-border/50 relative overflow-hidden flex flex-col">
                                                    {/* Card Content */}
                                                    <div className="flex flex-col flex-1 relative z-10">
                                                        <div className="flex justify-between items-start mb-1.5">
                                                            <div className="flex flex-col gap-1 min-w-0 pr-3">
                                                                <h3 className="font-bold text-[17px] text-foreground tracking-tight leading-tight truncate">
                                                                    {user.name}
                                                                </h3>
                                                                <p className="text-[13px] font-medium text-muted-foreground truncate">
                                                                    {user.email}
                                                                </p>
                                                            </div>
                                                            <div className="shrink-0 flex items-center">
                                                                <ProtectedFeature permission="users.manage_status">
                                                                    <label className={`flex items-center gap-2 cursor-pointer px-2.5 py-1 rounded-full border transition-colors ${user.is_active ? 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20' : 'bg-muted/30 border-border/50 hover:bg-muted/50'}`}>
                                                                        <span className={`font-bold text-[9px] uppercase tracking-wider select-none ${user.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                                                                            {user.is_active ? 'Aktif' : 'Nonaktif'}
                                                                        </span>
                                                                        <Switch 
                                                                            checked={user.is_active}
                                                                            onCheckedChange={() => handleToggleStatus(user)}
                                                                            className="data-[state=checked]:bg-green-600 scale-[0.7] origin-right"
                                                                        />
                                                                    </label>
                                                                </ProtectedFeature>
                                                            </div>
                                                        </div>

                                                        {/* Roles */}
                                                        <div className="flex items-center gap-1.5 flex-wrap mt-3 mb-2">
                                                            {user.roles && user.roles.length > 0 ? (
                                                                user.roles.map((role, idx) => (
                                                                    <span key={idx} className="bg-primary/5 border border-primary/15 text-primary font-bold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                                                                        {role}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="bg-muted border border-border/50 text-muted-foreground font-bold px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
                                                                    Tanpa Peran
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Mobile App Style Actions Footer */}
                                                    <div className="grid grid-cols-2 mt-auto pt-3 border-t border-border/40 divide-x divide-border/40">
                                                        <ProtectedFeature permission="users.update">
                                                            <button onClick={() => openEditDialog(user)} className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors active:bg-muted/30 w-full rounded-l-md">
                                                                <Edit className="w-3.5 h-3.5" /> Edit
                                                            </button>
                                                        </ProtectedFeature>
                                                        <ProtectedFeature permission="users.delete">
                                                            <button onClick={() => { setSelectedUser(user); setIsDeleteDialogOpen(true); }} className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-destructive transition-colors active:bg-muted/30 w-full rounded-r-md">
                                                                <Trash2 className="w-3.5 h-3.5" /> Hapus
                                                            </button>
                                                        </ProtectedFeature>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {/* Load More Button */}
                                    {hasNextPage && (
                                        <div className="flex justify-center mt-6 mb-10">
                                            <button
                                                onClick={fetchNextPage}
                                                disabled={isLoading}
                                                className="px-6 py-2 bg-primary text-primary-foreground rounded-full text-[13px] font-medium disabled:opacity-50 shadow-sm transition-opacity cursor-pointer active:scale-95"
                                            >
                                                {isLoading
                                                    ? "Memuat..."
                                                    : "Tampilkan Lainnya"}
                                            </button>
                                        </div>
                                    )}


                    </div>

                    {/* Floating Action Button */}
                    <ProtectedFeature permission="users.create">
                        <button
                            onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}
                            className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-40 flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.2)] active:scale-95 transition-transform"
                        >
                            <Plus className="w-6 h-6" />
                        </button>
                    </ProtectedFeature>

                    {/* Filter & Sort Modals (Floating Match Image Design) */}
                    {modalType && (
                        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
                            <div
                                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                                onClick={() => setModalType(null)}
                            ></div>
                            <div className="relative bg-background rounded-[2rem] w-full max-w-[400px] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85dvh] flex flex-col">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6 shrink-0 relative">
                                    {modalType === "filter" && (
                                        <button
                                            onClick={() => setQueryParams(prev => ({ ...prev, is_active: undefined, page: 1 }))}
                                            className="absolute left-0 text-destructive font-semibold text-sm"
                                        >
                                            Reset
                                        </button>
                                    )}
                                    <h2 className="text-base font-bold w-full text-center">
                                        {modalType === "filter" ? "Filter" : "Urutkan"}
                                    </h2>
                                </div>

                                <div className="flex-1 overflow-y-auto pb-4 space-y-6 no-scrollbar">
                                    {modalType === "filter" && (
                                        <>
                                            {/* Status */}
                                            <div>
                                                <h3 className="font-semibold text-sm mb-3">Status</h3>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {[
                                                        { id: "all", label: "Semua", value: undefined },
                                                        { id: "Aktif", label: "Aktif", value: true },
                                                        { id: "Nonaktif", label: "Tidak Aktif", value: false },
                                                    ].map((opt) => {
                                                        const isSelected = queryParams.is_active === opt.value;
                                                        return (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => setQueryParams(prev => ({ ...prev, is_active: opt.value, page: 1 }))}
                                                                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors border ${
                                                                    isSelected
                                                                    ? "bg-primary text-primary-foreground border-primary"
                                                                    : "bg-transparent text-muted-foreground border-border hover:bg-muted/50"
                                                                } flex items-center gap-1.5`}
                                                            >
                                                                {opt.label}
                                                                {isSelected && <Check className="w-3.5 h-3.5" />}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {modalType === "sort" && (
                                        <div className="space-y-0.5">
                                            {[
                                                { id: "Terbaru", field: "created_at", dir: "desc" },
                                                { id: "Terlama", field: "created_at", dir: "asc" },
                                                { id: "Nama: A-Z", field: "name", dir: "asc" },
                                                { id: "Nama: Z-A", field: "name", dir: "desc" },
                                            ].map((opt) => {
                                                const isSelected = queryParams.sort_by === opt.field && queryParams.sort_dir === opt.dir;
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => setQueryParams(prev => ({ ...prev, sort_by: opt.field, sort_dir: opt.dir as any, page: 1 }))}
                                                        className="w-full flex items-center justify-between py-3 bg-transparent transition-colors text-left"
                                                    >
                                                        <span
                                                            className={`text-[13.5px] ${
                                                                isSelected
                                                                ? "font-semibold text-foreground"
                                                                : "font-medium text-foreground/80"
                                                            }`}
                                                        >
                                                            {opt.id}
                                                        </span>
                                                        <div
                                                            className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center ${
                                                                isSelected ? "border-primary" : "border-border"
                                                            }`}
                                                        >
                                                            {isSelected && (
                                                                <div className="w-2 h-2 rounded-full bg-primary"></div>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3 shrink-0 mt-3 flex flex-col gap-2.5">
                                    <button
                                        onClick={() => setModalType(null)}
                                        className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors"
                                    >
                                        {modalType === "filter" 
                                            ? `Terapkan (${queryParams.is_active !== undefined ? 1 : 0})`
                                            : "Terapkan"
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Create & Edit User Dialog */}
                    {(isCreateDialogOpen || isEditDialogOpen) && (
                        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
                            <div
                                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                                onClick={() => { setIsCreateDialogOpen(false); setIsEditDialogOpen(false); }}
                            ></div>
                            <div className="relative bg-background rounded-[2rem] w-full max-w-[400px] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85dvh] flex flex-col">
                                <div className="flex items-center justify-between mb-5 shrink-0 relative">
                                    <h2 className="text-[15px] font-bold w-full text-center">
                                        {isEditDialogOpen ? "Edit Pengguna" : "Tambah Pengguna"}
                                    </h2>
                                    <button
                                        onClick={() => { setIsCreateDialogOpen(false); setIsEditDialogOpen(false); }}
                                        className="absolute right-0 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 space-y-4 no-scrollbar">
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
                                            Nama
                                        </Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Nama lengkap"
                                            className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
                                            Email
                                        </Label>
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="email@contoh.com"
                                            className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
                                            Kata Sandi
                                        </Label>
                                        <Input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                            placeholder={isEditDialogOpen ? "Kosongkan jika tidak ingin diubah" : "Minimal 8 karakter"}
                                            className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                                        />
                                    </div>
                                    
                                    <div className="space-y-1.5 pt-2">
                                        <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1 block mb-2">
                                            Peran
                                        </Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {roles.map((role) => {
                                                const isSelected = selectedRoles.includes(role.id);
                                                return (
                                                    <button
                                                        key={role.id}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                                                            } else {
                                                                setSelectedRoles([...selectedRoles, role.id]);
                                                            }
                                                        }}
                                                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                                                            isSelected 
                                                                ? "border-primary bg-primary/5 text-foreground" 
                                                                : "border-border bg-muted/30 text-foreground hover:bg-muted/50 hover:border-muted-foreground/30"
                                                        }`}
                                                    >
                                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 bg-background ${
                                                            isSelected ? "border-primary" : "border-muted-foreground/60"
                                                        }`}>
                                                            {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                        </div>
                                                        <span className="text-[13px] font-medium leading-none">{role.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 shrink-0 mt-3 flex border-t border-border/40">
                                    <button
                                        onClick={isEditDialogOpen ? handleUpdateUser : handleCreateUser}
                                        disabled={createUser.isPending || updateUser.isPending}
                                        className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-[13px] font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {createUser.isPending || updateUser.isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            "Simpan"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Yakin ingin menghapus {selectedUser?.name}? Anda dapat memulihkan pengguna ini nanti dari tab Diarsipkan.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Hapus
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Restore Confirmation Dialog */}
                    <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Pulihkan Pengguna</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Yakin ingin memulihkan {selectedUser?.name}? Pengguna akan dapat masuk kembali.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRestoreUser}>
                                    Pulihkan
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </ProtectedModule>
        </ProtectedRoute>
    );
}
