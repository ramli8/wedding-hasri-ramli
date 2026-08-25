'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/src/presentation/components/layout/protected-route';
import { ProtectedModule, ProtectedFeature } from '@/src/presentation/components/layout/protected-feature';
import { toast } from 'react-toastify';
import { Button } from '@/src/presentation/components/ui/button';
import { Input } from '@/src/presentation/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/presentation/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/src/presentation/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/src/presentation/components/ui/alert-dialog';
import { Label } from '@/src/presentation/components/ui/label';
import { Textarea } from '@/src/presentation/components/ui/textarea';
import { Alert, AlertDescription } from '@/src/presentation/components/ui/alert';
import { Badge } from '@/src/presentation/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/presentation/components/ui/table';
import { Plus, Edit, Trash2, Shield, Loader2, CheckCircle, Search, Users, Key, Settings, ShieldCheck, ChevronLeft, ArrowUpDown, Settings2, Check, X } from 'lucide-react';
import { rbacService, type Role, type RoleWithPermissions, type Permission } from '@/src/domain/services/rbac.service';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/presentation/components/ui/tabs';
import { ScrollArea } from '@/src/presentation/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/src/presentation/components/ui/accordion';
import { Switch } from '@/src/presentation/components/ui/switch';

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [modalType, setModalType] = useState<"filter" | "sort" | null>(null);
    const [sortBy, setSortBy] = useState<"name" | "created_at" | undefined>("created_at");
    const [sortDir, setSortDir] = useState<"asc" | "desc" | undefined>("desc");
    const [filterType, setFilterType] = useState<"all" | "system" | "custom">("all");
    const [displayLimit, setDisplayLimit] = useState(10);

    // Dialog states
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [rolesData, permissionsData] = await Promise.all([
                rbacService.getAllRoles(),
                rbacService.getAllPermissions(),
            ]);

            setRoles(rolesData);
            setPermissions(permissionsData);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load data');
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '' });
        setSelectedRole(null);
        setSelectedPermissions([]);
        setError('');
    };

    const handleCreateRole = async () => {
        if (!formData.name.trim()) return;

        try {
            setIsSubmitting(true);
            await rbacService.createRole({
                name: formData.name,
                description: formData.description || undefined,
            });

            setIsCreateDialogOpen(false);
            resetForm();
            await loadData();
            toast.success('Peran berhasil ditambahkan');
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to create role';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateRole = async () => {
        if (!selectedRole || !formData.name.trim()) return;

        try {
            setIsSubmitting(true);
            await rbacService.updateRole(selectedRole.id, {
                name: formData.name,
                description: formData.description || undefined,
            });

            setIsEditDialogOpen(false);
            resetForm();
            await loadData();
            toast.success('Peran berhasil diperbarui');
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to update role';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteRole = async () => {
        if (!selectedRole) return;

        try {
            setIsSubmitting(true);
            await rbacService.deleteRole(selectedRole.id);

            setIsDeleteDialogOpen(false);
            setSelectedRole(null);
            await loadData();
            toast.error('Peran berhasil dihapus');
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to delete role';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssignPermissions = async () => {
        if (!selectedRole) return;

        try {
            setIsSubmitting(true);
            await rbacService.assignPermissionsToRole(selectedRole.id, {
                permission_ids: selectedPermissions,
            });

            setIsPermissionsDialogOpen(false);
            setSelectedRole(null);
            await loadData();
            toast.success('Izin berhasil diperbarui');
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to assign permissions';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditDialog = (role: Role) => {
        setFormData({ name: role.name, description: role.description || '' });
        setSelectedRole(role as RoleWithPermissions);
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (role: Role) => {
        setSelectedRole(role as RoleWithPermissions);
        setIsDeleteDialogOpen(true);
    };

    const openPermissionsDialog = async (role: Role) => {
        try {
            const roleWithPerms = await rbacService.getRoleById(role.id);
            setSelectedRole(roleWithPerms);
            setSelectedPermissions(roleWithPerms.permissions.map(p => p.id));
            setIsPermissionsDialogOpen(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load role permissions');
        }
    };

    // Derived state for filtered and sorted roles
    const filteredRoles = useMemo(() => {
        return roles
            .filter(role => {
                const matchesSearch = role.name.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesFilter = filterType === "all" 
                    ? true 
                    : filterType === "system" ? role.is_system : !role.is_system;
                return matchesSearch && matchesFilter;
            })
            .sort((a, b) => {
                if (!sortBy || !sortDir) return 0;
                
                if (sortBy === "name") {
                    return sortDir === "asc" 
                        ? a.name.localeCompare(b.name)
                        : b.name.localeCompare(a.name);
                } else {
                    const dateA = new Date(a.created_at).getTime();
                    const dateB = new Date(b.created_at).getTime();
                    return sortDir === "asc" ? dateA - dateB : dateB - dateA;
                }
            });
    }, [roles, searchQuery, filterType, sortBy, sortDir]);

    const displayedRoles = filteredRoles.slice(0, displayLimit);
    const hasNextPage = displayLimit < filteredRoles.length;

    const fetchNextPage = () => {
        setDisplayLimit(prev => prev + 10);
    };

    // Group permissions by module
    const permissionsByModule = permissions.reduce((acc, perm) => {
        if (!acc[perm.module]) {
            acc[perm.module] = [];
        }
        acc[perm.module].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    // Count permissions for a role (for display in table)
    const getPermissionCount = async (roleId: number): Promise<number> => {
        try {
            const roleWithPerms = await rbacService.getRoleById(roleId);
            return roleWithPerms.permissions.length;
        } catch {
            return 0;
        }
    };

    // Toggle all permissions in a module
    const toggleModulePermissions = (modulePermissions: Permission[], isSelected: boolean) => {
        const modulePermIds = modulePermissions.map(p => p.id);
        if (isSelected) {
            // Remove all permissions from this module
            setSelectedPermissions(prev => prev.filter(id => !modulePermIds.includes(id)));
        } else {
            // Add all permissions from this module
            setSelectedPermissions(prev => [...new Set([...prev, ...modulePermIds])]);
        }
    };

    // Check if all permissions in a module are selected
    const isModuleFullySelected = (modulePermissions: Permission[]) => {
        return modulePermissions.every(perm => selectedPermissions.includes(perm.id));
    };

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
                            Manajemen Peran
                        </h1>
                        <div className="w-10 shrink-0" />
                    </div>

                    <div className="px-5">
                        {error && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex items-center gap-3 mb-6">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    placeholder="Cari peran..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-11 rounded-full bg-card border-border/60 shadow-sm h-11 text-[13.5px] focus-visible:ring-primary"
                                />
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => setModalType("sort")}
                                    className={`flex items-center justify-center w-11 h-11 rounded-full shadow-sm transition-colors border ${
                                        sortBy !== undefined
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <ArrowUpDown className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setModalType("filter")}
                                    className={`flex items-center justify-center w-11 h-11 rounded-full shadow-sm transition-colors border ${
                                        filterType !== 'all'
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
                                Semua Peran ({roles.length})
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary/50" />
                                <p className="text-[13px]">Memuat peran...</p>
                            </div>
                        ) : filteredRoles.length === 0 ? (
                            <div className="w-full flex-1 flex flex-col items-center justify-center space-y-6 py-12">
                                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                                    <ShieldCheck className="w-10 h-10 text-primary" />
                                </div>
                                <div className="text-center w-full px-4">
                                    <h2 className="text-[19px] font-bold tracking-tight mb-2 text-foreground">Tidak Ada Peran Ditemukan</h2>
                                    <p className="text-[13px] text-muted-foreground leading-snug">
                                        {searchQuery ? 'Coba kata kunci pencarian lain' : 'Tambah peran pertama untuk memulai'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {displayedRoles.map((role) => (
                                    <div key={role.id} className="bg-card rounded-[24px] p-5 shadow-sm border border-border/50 relative overflow-hidden flex flex-col">
                                        <div className="flex flex-col flex-1 relative z-10">
                                            <div className="mb-5">
                                                <div className="flex justify-between items-start mb-1.5">
                                                    <h3 className="font-extrabold text-[18px] text-primary tracking-tight pr-3 truncate">
                                                        {role.name}
                                                    </h3>
                                                    {role.is_system ? (
                                                        <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-widest">
                                                            Sistem
                                                        </span>
                                                    ) : (
                                                        <span className="shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-transparent border border-primary/30 text-primary/80 uppercase tracking-widest">
                                                            Kustom
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[13px] font-medium text-foreground/70 line-clamp-2 leading-relaxed">
                                                    {role.description || 'Tidak ada deskripsi'}
                                                </p>
                                            </div>
                                            
                                            {/* Mobile App Style Actions Footer */}
                                            <div className="flex mt-auto pt-4 border-t border-border/40 divide-x divide-border/40">
                                                <ProtectedFeature permission="permissions.assign">
                                                    <button 
                                                        onClick={() => openPermissionsDialog(role)} 
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors active:bg-muted/30 rounded-l-md"
                                                    >
                                                        <Key className="w-3.5 h-3.5" /> Izin
                                                    </button>
                                                </ProtectedFeature>
                                                <ProtectedFeature permission="roles.update">
                                                    <button 
                                                        onClick={() => openEditDialog(role)} 
                                                        disabled={role.is_system}
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors active:bg-muted/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" /> Edit
                                                    </button>
                                                </ProtectedFeature>
                                                <ProtectedFeature permission="roles.delete">
                                                    <button 
                                                        onClick={() => openDeleteDialog(role)} 
                                                        disabled={role.is_system}
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-destructive transition-colors active:bg-muted/30 rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                                                    </button>
                                                </ProtectedFeature>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                    {/* Load More Button */}
                    {hasNextPage && !loading && filteredRoles.length > 0 && (
                        <div className="flex justify-center mt-6 mb-10">
                            <button
                                onClick={fetchNextPage}
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-full text-[13px] font-medium shadow-sm transition-opacity cursor-pointer active:scale-95 hover:bg-primary/90"
                            >
                                Tampilkan Lainnya
                            </button>
                        </div>
                    )}

                    {/* Create & Edit Role Dialog */}
                    {(isCreateDialogOpen || isEditDialogOpen) && (
                        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
                            <div
                                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                                onClick={() => { setIsCreateDialogOpen(false); setIsEditDialogOpen(false); }}
                            ></div>
                            <div className="relative bg-background rounded-[2rem] w-full max-w-[400px] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85dvh] flex flex-col">
                                <div className="flex items-center justify-between mb-5 shrink-0 relative">
                                    <h2 className="text-[15px] font-bold w-full text-center">
                                        {isEditDialogOpen ? "Edit Peran" : "Tambah Peran"}
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
                                            Nama Peran
                                        </Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Mis: Editor, Viewer"
                                            className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
                                            Deskripsi
                                        </Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Jelaskan apa yang bisa dilakukan peran ini..."
                                            rows={3}
                                            className="rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="pt-3 shrink-0 mt-3 flex flex-col gap-2.5">
                                    <Button
                                        onClick={isEditDialogOpen ? handleUpdateRole : handleCreateRole}
                                        disabled={!formData.name.trim() || isSubmitting}
                                        className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors"
                                    >
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Simpan
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delete Role Dialog */}
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Peran</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Yakin ingin menghapus peran &quot;{selectedRole?.name}&quot;?
                                    Tindakan ini tidak dapat dibatalkan. Pengguna dengan peran ini akan kehilangan izin yang ditetapkan.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteRole}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Hapus
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Manage Permissions Dialog */}
                    {isPermissionsDialogOpen && (
                        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
                            <div
                                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                                onClick={() => setIsPermissionsDialogOpen(false)}
                            ></div>
                            <div className="relative bg-background rounded-[2rem] w-full max-w-[800px] p-5 sm:p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[90dvh] flex flex-col">
                                <div className="flex items-center justify-between mb-3 shrink-0 relative">
                                    <h2 className="text-[16px] sm:text-[18px] font-bold w-full text-center flex items-center justify-center gap-2">
                                        <Key className="h-5 w-5 text-primary" />
                                        Kelola Izin
                                    </h2>
                                    <button
                                        onClick={() => setIsPermissionsDialogOpen(false)}
                                        className="absolute right-0 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-[13px] text-muted-foreground text-center mb-5 shrink-0 leading-snug px-4">
                                    Tetapkan izin untuk <span className="font-semibold text-foreground">{selectedRole?.name}</span>.<br className="sm:hidden" />
                                    <span className="hidden sm:inline"> </span>Terpilih: <span className="font-bold text-primary">{selectedPermissions.length}</span> dari {permissions.length} izin
                                </p>

                                <div className="flex-1 overflow-hidden flex flex-col pt-2 -mx-1 px-1">
                                    {Object.keys(permissionsByModule).length > 0 ? (
                                        <div className="flex-1 overflow-y-auto pr-2 pb-4 space-y-3 sm:space-y-4 no-scrollbar">
                                            <Accordion 
                                                type="multiple" 
                                                className="w-full space-y-3 sm:space-y-4"
                                                defaultValue={selectedPermissions.length === 0 && Object.keys(permissionsByModule).length > 0 ? [Object.keys(permissionsByModule)[0]] : []}
                                            >
                                                {Object.entries(permissionsByModule).map(([module, perms]) => {
                                                    const allSelected = isModuleFullySelected(perms);
                                                    const selectedCount = perms.filter(p => selectedPermissions.includes(p.id)).length;
                                                    return (
                                                        <AccordionItem key={module} value={module} className="bg-card border-2 border-border/50 hover:border-primary/40 transition-all rounded-xl overflow-hidden relative group/accordion">
                                                            <AccordionTrigger className="px-3 sm:px-4 py-4 hover:bg-primary/5 transition-colors hover:no-underline w-full min-w-0">
                                                                <div className="flex flex-col items-start justify-center flex-1 min-w-0 pr-2">
                                                                    <div className="flex items-center gap-2 sm:gap-3 mb-1 w-full min-w-0">
                                                                        <div className="p-1.5 sm:p-2 rounded-md bg-primary/10 shrink-0 group-hover/accordion:bg-primary/20 transition-colors">
                                                                            <Settings className="h-4 w-4 text-primary shrink-0" />
                                                                        </div>
                                                                        <span className="font-bold capitalize text-[14px] sm:text-[15px] text-foreground truncate min-w-0">{module}</span>
                                                                        <Badge variant={selectedCount === perms.length ? "default" : selectedCount > 0 ? "secondary" : "outline"} className="text-[10px] sm:text-[11px] font-bold ml-auto shrink-0 transition-colors">
                                                                            {selectedCount}/{perms.length}
                                                                        </Badge>
                                                                    </div>
                                                                    <span className="text-[11px] text-muted-foreground ml-9 sm:ml-10 hidden sm:block opacity-70 group-hover/accordion:opacity-100 group-hover/accordion:text-primary transition-colors truncate w-full min-w-0 text-left">
                                                                        Klik untuk atur izin
                                                                    </span>
                                                                </div>
                                                            </AccordionTrigger>

                                                            <AccordionContent className="pt-0 pb-2 px-1 sm:px-2">
                                                                {/* Master Toggle Area */}
                                                                <div className="flex items-center justify-between p-3 sm:p-3.5 mx-2 mt-1 mb-2 bg-primary/5 rounded-xl border border-primary/20 hover:bg-primary/10 transition-colors cursor-pointer" onClick={() => toggleModulePermissions(perms, allSelected)}>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[13px] sm:text-[14px] font-bold text-primary">Akses Penuh</span>
                                                                        <span className="text-[11px] sm:text-[11.5px] text-muted-foreground font-medium">Aktifkan seluruh izin di modul ini</span>
                                                                    </div>
                                                                    <div className="shrink-0 pl-3">
                                                                        <Switch
                                                                            checked={allSelected}
                                                                            onCheckedChange={() => toggleModulePermissions(perms, allSelected)}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="data-[state=checked]:bg-primary shadow-sm"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div className="divide-y divide-border/40 mt-1">
                                                                    {perms.map((perm) => {
                                                                        const isSelected = selectedPermissions.includes(perm.id);
                                                                        return (
                                                                            <div
                                                                                key={perm.id}
                                                                                className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3.5 hover:bg-muted/20 transition-colors cursor-pointer group gap-2 sm:gap-4 min-w-0"
                                                                                onClick={() => {
                                                                                    if (isSelected) {
                                                                                        setSelectedPermissions(prev => prev.filter(id => id !== perm.id));
                                                                                    } else {
                                                                                        setSelectedPermissions(prev => [...prev, perm.id]);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <div className="flex flex-col pr-0 sm:pr-4 min-w-0 flex-1">
                                                                                    <span className={`font-semibold text-[13px] sm:text-[14px] truncate ${isSelected ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"}`}>
                                                                                        {perm.name}
                                                                                    </span>
                                                                                    {perm.description && (
                                                                                        <span className="text-[11.5px] sm:text-[12px] text-muted-foreground mt-0.5 truncate">
                                                                                            {perm.description}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="shrink-0 flex items-center justify-start sm:justify-end">
                                                                                    <Switch 
                                                                                        checked={isSelected}
                                                                                        onCheckedChange={() => {
                                                                                            if (isSelected) {
                                                                                                setSelectedPermissions(prev => prev.filter(id => id !== perm.id));
                                                                                            } else {
                                                                                                setSelectedPermissions(prev => [...prev, perm.id]);
                                                                                            }
                                                                                        }}
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                        className="data-[state=checked]:bg-primary"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    );
                                                })}
                                            </Accordion>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-[300px] text-center">
                                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                                <Key className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <h3 className="font-bold text-foreground text-[16px] mb-1">Tidak Ada Izin</h3>
                                            <p className="text-[13px] text-muted-foreground">Belum ada modul izin yang tersedia di sistem.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 shrink-0 mt-3">
                                    <Button
                                        onClick={handleAssignPermissions}
                                        disabled={isSubmitting}
                                        className="w-full py-4 h-auto bg-primary text-primary-foreground rounded-xl text-[14px] sm:text-[15px] font-bold shadow-sm hover:bg-primary/90 transition-colors"
                                    >
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Simpan Izin ({selectedPermissions.length})
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Floating Action Button */}
                    <ProtectedFeature permission="roles.create">
                        <button
                            onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}
                            className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-40 flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.2)] active:scale-95 transition-transform hover:shadow-lg"
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
                                    {(modalType === "filter" || modalType === "sort") && (
                                        <button
                                            onClick={() => {
                                                if (modalType === "filter") setFilterType("all");
                                                if (modalType === "sort") {
                                                    setSortBy(undefined);
                                                    setSortDir(undefined);
                                                }
                                            }}
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
                                            {/* Tipe Peran */}
                                            <div>
                                                <h3 className="font-semibold text-sm mb-3">Tipe Peran</h3>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {[
                                                        { id: "all", label: "Semua", value: "all" as const },
                                                        { id: "system", label: "Sistem", value: "system" as const },
                                                        { id: "custom", label: "Kustom", value: "custom" as const },
                                                    ].map((opt) => {
                                                        const isSelected = filterType === opt.value;
                                                        return (
                                                            <button
                                                                key={opt.id}
                                                                onClick={() => setFilterType(opt.value)}
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
                                                const isSelected = sortBy === opt.field && sortDir === opt.dir;
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => {
                                                            setSortBy(opt.field as any);
                                                            setSortDir(opt.dir as any);
                                                        }}
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
                                            ? `Terapkan (${filterType !== 'all' ? 1 : 0})`
                                            : "Terapkan"
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            </ProtectedModule>
        </ProtectedRoute>
    );
}
