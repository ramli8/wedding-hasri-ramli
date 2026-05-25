'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/src/presentation/components/layout/main-layout';
import { ProtectedRoute } from '@/src/presentation/components/layout/protected-route';
import { ProtectedModule, ProtectedFeature } from '@/src/presentation/components/layout/protected-feature';
import { Button } from '@/src/presentation/components/ui/button';
import { Input } from '@/src/presentation/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/src/presentation/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/presentation/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/src/presentation/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/src/presentation/components/ui/alert-dialog';
import { Label } from '@/src/presentation/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/presentation/components/ui/select';
import { Alert, AlertDescription } from '@/src/presentation/components/ui/alert';
import { Switch } from '@/src/presentation/components/ui/switch';
import { Search, Plus, Edit, Trash2, Loader2, ChevronLeft, ChevronRight, Clock, ArrowUpDown, Tags } from 'lucide-react';
import { useGuestCategories, useCreateGuestCategory, useUpdateGuestCategory, useDeleteGuestCategory } from '@/src/application/hooks/use-guest-query';
import { GuestCategory } from '@/src/domain/services/guest.service';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function GuestCategoriesPage() {
    const [queryParams, setQueryParams] = useState({
        page: 1,
        page_size: 10,
        search: '',
        sort_by: 'created_at',
        sort_dir: 'desc',
    });

    const [searchInput, setSearchInput] = useState('');
    const [error, setError] = useState('');

    // Dialog states
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<GuestCategory | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        hasTime: false,
        startTime: '08:00',
        endTime: '10:00',
    });

    // API hooks
    const { data: categoriesData, isLoading } = useGuestCategories(queryParams);
    const createCategory = useCreateGuestCategory();
    const updateCategory = useUpdateGuestCategory();
    const deleteCategory = useDeleteGuestCategory();

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setQueryParams(prev => ({ ...prev, page: 1, search: searchInput }));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const resetForm = () => {
        setFormData({ name: '', hasTime: false, startTime: '08:00', endTime: '10:00' });
        setError('');
        setSelectedCategory(null);
    };

    const handleCreate = async () => {
        try {
            await createCategory.mutateAsync({
                name: formData.name,
                start_time: formData.hasTime ? combineTimeWithToday(formData.startTime) : null,
                end_time: formData.hasTime ? combineTimeWithToday(formData.endTime) : null,
            });
            setIsCreateDialogOpen(false);
            resetForm();
            toast.success('Category created successfully');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create category');
        }
    };

    const handleUpdate = async () => {
        if (!selectedCategory) return;
        try {
            await updateCategory.mutateAsync({
                id: selectedCategory.id,
                data: {
                    name: formData.name,
                    start_time: formData.hasTime ? combineTimeWithToday(formData.startTime) : null,
                    end_time: formData.hasTime ? combineTimeWithToday(formData.endTime) : null,
                },
            });
            setIsEditDialogOpen(false);
            resetForm();
            toast.success('Category updated successfully');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update category');
        }
    };

    const handleDelete = async () => {
        if (!selectedCategory) return;
        try {
            await deleteCategory.mutateAsync(selectedCategory.id);
            setIsDeleteDialogOpen(false);
            setSelectedCategory(null);
            toast.success('Category deleted successfully');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete category');
        }
    };

    const openEditDialog = (category: GuestCategory) => {
        const hasTime = !!category.start_time;
        setFormData({
            name: category.name,
            hasTime: hasTime,
            startTime: hasTime ? format(new Date(category.start_time!), 'HH:mm') : '08:00',
            endTime: hasTime ? format(new Date(category.end_time!), 'HH:mm') : '10:00',
        });
        setSelectedCategory(category);
        setIsEditDialogOpen(true);
    };

    // Helper to combine HH:mm with today's date for backend (TIMESTAMP)
    const combineTimeWithToday = (timeStr: string) => {
        if (!timeStr) return null;
        const [hours, minutes] = timeStr.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return date.toISOString();
    };

    const formatTime = (isoString: string | null) => {
        if (!isoString) return '-';
        try {
            return format(new Date(isoString), 'HH:mm');
        } catch {
            return '-';
        }
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
                <MainLayout>
                    {/* Page Header */}
                    <div className="mb-8">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <Tags strokeWidth={1.5} className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Kategori Tamu</h2>
                                <p className="text-sm text-muted-foreground">Kelola kategori tamu dan waktu sesinya</p>
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

                            {/* Search and Actions */}
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="flex gap-2 flex-1">
                                    <Select
                                        value={queryParams.page_size?.toString() || '10'}
                                        onValueChange={(value) =>
                                            setQueryParams(prev => ({
                                                ...prev,
                                                page: 1,
                                                page_size: parseInt(value),
                                            }))
                                        }
                                    >
                                        <SelectTrigger className="w-[110px]">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">Show:</span>
                                                <SelectValue placeholder="10" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                            <SelectItem value="99999">All</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                        <Input
                                            placeholder="Cari kategori..."
                                            value={searchInput}
                                            onChange={(e) => setSearchInput(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ProtectedFeature permission="guest_categories.create">
                                        <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Tambah Kategori
                                        </Button>
                                    </ProtectedFeature>
                                </div>
                            </div>

                            {/* Table */}
                            {isLoading ? (
                                <div className="flex justify-center items-center h-64">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : !categoriesData?.items?.length ? (
                                <div className="text-center py-12">
                                    <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">Tidak ada kategori ditemukan</h3>
                                    <p className="text-muted-foreground">
                                        {queryParams.search ? 'Coba kata kunci pencarian lain' : 'Tambah kategori pertama untuk memulai'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead><SortButton field="name">Nama Kategori</SortButton></TableHead>
                                                    <TableHead>Waktu Mulai</TableHead>
                                                    <TableHead>Waktu Selesai</TableHead>
                                                    <TableHead className="text-right">Aksi</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {categoriesData.items.map((category) => (
                                                    <TableRow key={category.id}>
                                                        <TableCell className="font-medium">{category.name}</TableCell>
                                                        <TableCell>{formatTime(category.start_time)}</TableCell>
                                                        <TableCell>{formatTime(category.end_time)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <ProtectedFeature permission="guest_categories.update">
                                                                    <Button
                                                                        size="action"
                                                                        variant="soft-accent"
                                                                        onClick={() => openEditDialog(category)}
                                                                        title="Edit"
                                                                    >
                                                                        <Edit /> Edit
                                                                    </Button>
                                                                </ProtectedFeature>
                                                                <ProtectedFeature permission="guest_categories.delete">
                                                                    <Button
                                                                        size="action"
                                                                        variant="outline"
                                                                        className="text-destructive border-destructive/20 hover:bg-destructive/10"
                                                                        onClick={() => {
                                                                            setSelectedCategory(category);
                                                                            setIsDeleteDialogOpen(true);
                                                                        }}
                                                                        title="Delete"
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

                                    {/* Pagination */}
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Menampilkan {((queryParams.page || 1) - 1) * (queryParams.page_size || 10) + 1} ke{' '}
                                            {Math.min((queryParams.page || 1) * (queryParams.page_size || 10), categoriesData.total)} dari{' '}
                                            {categoriesData.total} kategori
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={(queryParams.page || 1) === 1}
                                                onClick={() => setQueryParams(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                Sebelumnya
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={(queryParams.page || 1) >= categoriesData.total_pages}
                                                onClick={() => setQueryParams(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                                            >
                                                Selanjutnya
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Create Dialog */}
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Kategori Tamu</DialogTitle>
                                <DialogDescription>Tambah kategori baru untuk tamu</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nama Kategori</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="cth. Sesi Pagi"
                                    />
                                </div>
                                <div className="flex items-center space-x-2 py-2">
                                    <Switch
                                        id="has-time"
                                        checked={formData.hasTime}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasTime: checked }))}
                                    />
                                    <Label htmlFor="has-time">Punya Waktu Sesi Tertentu?</Label>
                                </div>
                                
                                {formData.hasTime && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="space-y-2">
                                            <Label>Waktu Mulai (24h)</Label>
                                            <Input
                                                type="time"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Waktu Selesai (24h)</Label>
                                            <Input
                                                type="time"
                                                value={formData.endTime}
                                                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Batal</Button>
                                <Button onClick={handleCreate} disabled={createCategory.isPending}>
                                    {createCategory.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Tambah
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Kategori Tamu</DialogTitle>
                                <DialogDescription>Perbarui data kategori</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Category Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        onFocus={(e) => {
                                            const val = e.target.value;
                                            e.target.setSelectionRange(val.length, val.length);
                                            setTimeout(() => {
                                                e.target.setSelectionRange(val.length, val.length);
                                            }, 0);
                                        }}
                                    />
                                </div>
                                <div className="flex items-center space-x-2 py-2">
                                    <Switch
                                        id="edit-has-time"
                                        checked={formData.hasTime}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasTime: checked }))}
                                    />
                                    <Label htmlFor="edit-has-time">Punya Waktu Sesi Tertentu?</Label>
                                </div>
                                
                                {formData.hasTime && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="space-y-2">
                                            <Label>Waktu Mulai (24h)</Label>
                                            <Input
                                                type="time"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Waktu Selesai (24h)</Label>
                                            <Input
                                                type="time"
                                                value={formData.endTime}
                                                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button>
                                <Button onClick={handleUpdate} disabled={updateCategory.isPending}>
                                    {updateCategory.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Yakin ingin menghapus kategori ini?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Hapus
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </MainLayout>
            </ProtectedModule>
        </ProtectedRoute>
    );
}
