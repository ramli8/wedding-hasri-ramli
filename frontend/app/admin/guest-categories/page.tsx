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
import { Alert, AlertDescription } from '@/src/presentation/components/ui/alert';
import { Switch } from '@/src/presentation/components/ui/switch';
import { Search, Plus, Edit, Trash2, Loader2, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useGuestCategories, useCreateGuestCategory, useUpdateGuestCategory, useDeleteGuestCategory } from '@/src/application/hooks/use-guest-query';
import { GuestCategory } from '@/src/domain/services/guest.service';
import { format } from 'date-fns';

export default function GuestCategoriesPage() {
    const [queryParams, setQueryParams] = useState({
        page: 1,
        page_size: 10,
        search: '',
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
        startTime: '', // format "HH:mm"
        endTime: '',   // format "HH:mm"
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
        } catch (e) {
            return '-';
        }
    };

    return (
        <ProtectedRoute>
            <ProtectedModule requiredRole={['Super Admin', 'Admin']} requiredPermission="guest_categories.read">
                <MainLayout>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold">Guest Categories</CardTitle>
                            <CardDescription>
                                Manage guest categories and their session times
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {/* Search and Actions */}
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        placeholder="Search categories..."
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <ProtectedFeature permission="guest_categories.create">
                                    <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Category
                                    </Button>
                                </ProtectedFeature>
                            </div>

                            {/* Table */}
                            {isLoading ? (
                                <div className="flex justify-center items-center h-64">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : !categoriesData?.items?.length ? (
                                <div className="text-center py-12">
                                    <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Categories Found</h3>
                                    <p className="text-muted-foreground">
                                        {queryParams.search ? 'Try a different search term' : 'Add your first category to get started'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Start Time</TableHead>
                                                    <TableHead>End Time</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
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
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => openEditDialog(category)}
                                                                    >
                                                                        <Edit className="h-4 w-4" />
                                                                    </Button>
                                                                </ProtectedFeature>
                                                                <ProtectedFeature permission="guest_categories.delete">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            setSelectedCategory(category);
                                                                            setIsDeleteDialogOpen(true);
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
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
                                            Showing {((queryParams.page || 1) - 1) * (queryParams.page_size || 10) + 1} to{' '}
                                            {Math.min((queryParams.page || 1) * (queryParams.page_size || 10), categoriesData.total)} of{' '}
                                            {categoriesData.total} categories
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={(queryParams.page || 1) === 1}
                                                onClick={() => setQueryParams(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={(queryParams.page || 1) >= categoriesData.total_pages}
                                                onClick={() => setQueryParams(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                                            >
                                                Next
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
                                <DialogTitle>Add Guest Category</DialogTitle>
                                <DialogDescription>Create a new category for guests</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Category Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Morning Session"
                                    />
                                </div>
                                <div className="flex items-center space-x-2 py-2">
                                    <Switch
                                        id="has-time"
                                        checked={formData.hasTime}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasTime: checked }))}
                                    />
                                    <Label htmlFor="has-time">Has Specific Session Time?</Label>
                                </div>
                                
                                {formData.hasTime && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="space-y-2">
                                            <Label>Start Time (24h)</Label>
                                            <Input
                                                type="time"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Time (24h)</Label>
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
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreate} disabled={createCategory.isPending}>
                                    {createCategory.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Guest Category</DialogTitle>
                                <DialogDescription>Update category information</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Category Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="flex items-center space-x-2 py-2">
                                    <Switch
                                        id="edit-has-time"
                                        checked={formData.hasTime}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasTime: checked }))}
                                    />
                                    <Label htmlFor="edit-has-time">Has Specific Session Time?</Label>
                                </div>
                                
                                {formData.hasTime && (
                                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div className="space-y-2">
                                            <Label>Start Time (24h)</Label>
                                            <Input
                                                type="time"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Time (24h)</Label>
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
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleUpdate} disabled={updateCategory.isPending}>
                                    {updateCategory.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Guest Category</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete this category? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </MainLayout>
            </ProtectedModule>
        </ProtectedRoute>
    );
}
