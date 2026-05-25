'use client';

import { Plus, Edit, Trash2 } from 'lucide-react';

import { useEffect, useState } from 'react';
import { Button } from '@/src/presentation/components/ui/button';
import { Input } from '@/src/presentation/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/presentation/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/src/presentation/components/ui/dialog';
import { Label } from '@/src/presentation/components/ui/label';
import { Textarea } from '@/src/presentation/components/ui/textarea';
import { Alert, AlertDescription } from '@/src/presentation/components/ui/alert';
import { Badge } from '@/src/presentation/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/presentation/components/ui/table';
import { Key, Loader2, Search } from 'lucide-react';
import { rbacService, type Permission, type PermissionsByModule } from '@/src/domain/services/rbac.service';
import { ProtectedFeature } from '@/src/presentation/components/layout/protected-feature';

export function PermissionsContainer() {
    const [permissionsByModule, setPermissionsByModule] = useState<PermissionsByModule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Dialog states
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);

    // Form states
    const [permissionName, setPermissionName] = useState('');
    const [permissionModule, setPermissionModule] = useState('');
    const [permissionDescription, setPermissionDescription] = useState('');

    async function loadData() {
        try {
            setLoading(true);
            const data = await rbacService.getPermissionsByModule();
            setPermissionsByModule(data);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load permissions');
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);



    const handleCreatePermission = async () => {
        try {
            await rbacService.createPermission({
                name: permissionName,
                module: permissionModule,
                description: permissionDescription || undefined,
            });

            setIsCreateDialogOpen(false);
            resetForm();
            await loadData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create permission');
        }
    };

    const handleEditPermission = async () => {
        if (!selectedPermission) return;

        try {
            await rbacService.updatePermission(selectedPermission.id, {
                name: permissionName,
                module: permissionModule,
                description: permissionDescription || undefined,
            });

            setIsEditDialogOpen(false);
            setSelectedPermission(null);
            resetForm();
            await loadData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update permission');
        }
    };

    const handleDeletePermission = async (id: number) => {
        if (!confirm('Yakin ingin menghapus izin ini? Tindakan ini tidak dapat dibatalkan.')) {
            return;
        }

        try {
            await rbacService.deletePermission(id);
            await loadData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete permission');
        }
    };

    const openEditDialog = (permission: Permission) => {
        setSelectedPermission(permission);
        setPermissionName(permission.name);
        setPermissionModule(permission.module);
        setPermissionDescription(permission.description || '');
        setIsEditDialogOpen(true);
    };

    const resetForm = () => {
        setPermissionName('');
        setPermissionModule('');
        setPermissionDescription('');
    };

    const filteredPermissions = permissionsByModule.map(module => ({
        ...module,
        permissions: module.permissions.filter(perm =>
            perm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            perm.description?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(module => module.permissions.length > 0);

    const totalPermissions = permissionsByModule.reduce((sum, module) => sum + module.permissions.length, 0);

    return (
        <>
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Manajemen Izin</h2>
                        <p className="text-sm text-muted-foreground">Kelola izin sistem dan atur berdasarkan modul</p>
                    </div>
                </div>
            </div>

            <Card className="border-border/50 shadow-sm">
                <CardContent className="p-6">
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Total Izin</CardDescription>
                                <CardTitle className="text-3xl">{totalPermissions}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Modul</CardDescription>
                                <CardTitle className="text-3xl">{permissionsByModule.length}</CardTitle>
                            </CardHeader>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardDescription>Hasil Pencarian</CardDescription>
                                <CardTitle className="text-3xl">
                                    {filteredPermissions.reduce((sum, m) => sum + m.permissions.length, 0)}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </div>

                    {/* Search and Actions */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Cari izin..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <ProtectedFeature permission="permissions.create">
                                <Button onClick={() => setIsCreateDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Tambah Izin
                                </Button>
                            </ProtectedFeature>
                        </div>
                    </div>

                    {/* Permissions by Module */}
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {filteredPermissions.map((moduleGroup) => (
                                <Card key={moduleGroup.module}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                        <Key strokeWidth={1.5} className="h-5 w-5 text-primary" />
                                                <CardTitle className="text-xl capitalize">
                                                    {moduleGroup.module}
                                                </CardTitle>
                                                <Badge variant="secondary">
                                                    {moduleGroup.permissions.length} izin
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="border rounded-lg overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Nama Izin</TableHead>
                                                        <TableHead>Deskripsi</TableHead>
                                                        <TableHead>Dibuat</TableHead>
                                                        <TableHead className="text-right">Aksi</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {moduleGroup.permissions.map((permission) => (
                                                        <TableRow key={permission.id}>
                                                            <TableCell className="font-medium">
                                                                {permission.name}
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">
                                                                {permission.description || '-'}
                                                            </TableCell>
                                                            <TableCell className="text-sm text-muted-foreground">
                                                                {new Date(permission.created_at).toLocaleDateString()}
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <ProtectedFeature permission="permissions.update">
                                                                        <Button
                                                                            size="action"
                                                                            variant="soft-accent"
                                                                            onClick={() => openEditDialog(permission)}
                                                                        >
                                                                            <Edit /> Edit
                                                                        </Button>
                                                                    </ProtectedFeature>
                                                                    <ProtectedFeature permission="permissions.delete">
                                                                        <Button
                                                                            size="action"
                                                                            variant="outline"
                                                                            className="text-destructive border-destructive/20 hover:bg-destructive/10"
                                                                            onClick={() => handleDeletePermission(permission.id)}
                                                                        >
                                                                            <Trash2 /> Hapus
                                                                        </Button>
                                                                    </ProtectedFeature>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {filteredPermissions.length === 0 && !loading && (
                                <div className="text-center py-12">
                                    <Key className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Tidak Ada Izin Ditemukan</h3>
                                    <p className="text-muted-foreground">
                                        {searchQuery ? 'Tidak ada izin yang cocok dengan pencarian Anda.' : 'Tambah izin pertama untuk memulai.'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Permission Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tambah Izin</DialogTitle>
                        <DialogDescription>
                            Tambah izin baru ke sistem
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Izin</Label>
                            <Input
                                id="name"
                                value={permissionName}
                                onChange={(e) => setPermissionName(e.target.value)}
                                placeholder="Mis: users.create"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="module">Modul</Label>
                            <Input
                                id="module"
                                value={permissionModule}
                                onChange={(e) => setPermissionModule(e.target.value)}
                                placeholder="Mis: users"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Deskripsi</Label>
                            <Textarea
                                id="description"
                                value={permissionDescription}
                                onChange={(e) => setPermissionDescription(e.target.value)}
                                placeholder="Jelaskan apa yang diizinkan oleh izin ini..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            onClick={handleCreatePermission}
                            disabled={!permissionName.trim() || !permissionModule.trim()}
                        >
                            Tambah Izin
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Permission Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Izin</DialogTitle>
                        <DialogDescription>
                            Perbarui data izin
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nama Izin</Label>
                            <Input
                                id="edit-name"
                                value={permissionName}
                                onChange={(e) => setPermissionName(e.target.value)}
                                onFocus={(e) => {
                                    const val = e.target.value;
                                    e.target.setSelectionRange(val.length, val.length);
                                    setTimeout(() => {
                                        e.target.setSelectionRange(val.length, val.length);
                                    }, 0);
                                }}
                                placeholder="Mis: users.create"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-module">Modul</Label>
                            <Input
                                id="edit-module"
                                value={permissionModule}
                                onChange={(e) => setPermissionModule(e.target.value)}
                                placeholder="Mis: users"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Deskripsi</Label>
                            <Textarea
                                id="edit-description"
                                value={permissionDescription}
                                onChange={(e) => setPermissionDescription(e.target.value)}
                                placeholder="Jelaskan apa yang diizinkan oleh izin ini..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Batal
                        </Button>
                        <Button
                            onClick={handleEditPermission}
                            disabled={!permissionName.trim() || !permissionModule.trim()}
                        >
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
