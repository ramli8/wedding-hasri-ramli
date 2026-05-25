'use client';

import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/src/presentation/components/ui/alert';
import { Textarea } from '@/src/presentation/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/presentation/components/ui/tabs';
import { Checkbox } from '@/src/presentation/components/ui/checkbox';
import { Search, UserPlus, Edit, Trash2, Loader2, ChevronLeft, ChevronRight, QrCode, RotateCcw, Users, UserX, User, ArrowUpDown, Instagram, Download, Upload, FileSpreadsheet, AlertTriangle, UserRound } from 'lucide-react';
import { useGuests, useCreateGuest, useUpdateGuest, useDeleteGuest, useGuestCategories, useDeletedGuests, useRestoreGuest, useUpdateGuestStatusSent, usePreviewImport, useExecuteImport } from '@/src/application/hooks/use-guest-query';
import { guestService, Guest, GuestListParams } from '@/src/domain/services/guest.service';
import { Progress } from '@/src/presentation/components/ui/progress';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

// Custom WhatsApp Icon in Lucide style
const Whatsapp = ({ className }: { className?: string }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
        <path d="M9 10c0 0 1 2 3.5 3.5S15 13 15 13" />
    </svg>
);

export default function GuestsPage() {
    const [activeTab, setActiveTab] = useState('active');
    const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);

    // Query params state
    const [queryParams, setQueryParams] = useState<GuestListParams>({
        page: 1,
        page_size: 10,
        search: '',
        category_id: undefined,
        status_attending: undefined,
        status_sent: undefined,
        is_checked_in: undefined,
        sort_by: 'created_at',
        sort_dir: 'desc',
    });

    const [deletedQueryParams, setDeletedQueryParams] = useState<GuestListParams>({
        page: 1,
        page_size: 10,
        search: '',
    });

    const [searchInput, setSearchInput] = useState('');
    const [deletedSearchInput, setDeletedSearchInput] = useState('');
    const [error, setError] = useState('');

    // Dialog states
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
    const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
    const [isSendMessageDialogOpen, setIsSendMessageDialogOpen] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
    const [messageType, setMessageType] = useState<'whatsapp' | 'instagram' | null>(null);

    // Import states
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importPreviewData, setImportPreviewData] = useState<any>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        guest_category_id: 0,
        phone_number: '',
        instagram_username: '',
        address: '',
        note: '',
        status_attending: 'pending',
        status_sent: 'pending',
    });

    // API hooks
    const { data: guestsData, isLoading } = useGuests(queryParams);
    const { data: deletedGuestsData, isLoading: isLoadingDeleted } = useDeletedGuests(deletedQueryParams);
    const { data: categoriesData } = useGuestCategories({ page_size: 100 });
    const createGuest = useCreateGuest();
    const updateGuest = useUpdateGuest();
    const deleteGuest = useDeleteGuest();
    const restoreGuest = useRestoreGuest();
    const updateStatusSent = useUpdateGuestStatusSent();
    const previewImport = usePreviewImport();
    const executeImport = useExecuteImport();

    // Debounced search for active guests
    useEffect(() => {
        const timer = setTimeout(() => {
            setQueryParams(prev => ({ ...prev, page: 1, search: searchInput }));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Debounced search for deleted guests
    useEffect(() => {
        const timer = setTimeout(() => {
            setDeletedQueryParams(prev => ({ ...prev, page: 1, search: deletedSearchInput }));
        }, 300);
        return () => clearTimeout(timer);
    }, [deletedSearchInput]);

    // Clear selection when data changes
    useEffect(() => {
        setSelectedGuestIds([]);
    }, [queryParams, activeTab]);

    const handleCreateGuest = async () => {
        // Validation: either phone or instagram must be filled
        if (!formData.phone_number && !formData.instagram_username) {
            setError('Minimal salah satu No. HP atau Instagram harus diisi');
            return;
        }

        try {
            await createGuest.mutateAsync({
                name: formData.name,
                guest_category_id: formData.guest_category_id,
                phone_number: formData.phone_number || undefined,
                instagram_username: formData.instagram_username || undefined,
                address: formData.address || undefined,
                note: formData.note || undefined,
            });
            setIsCreateDialogOpen(false);
            resetForm();
            toast.success('Tamu berhasil ditambahkan');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Gagal menambah tamu');
        }
    };

    const handleUpdateGuest = async () => {
        if (!selectedGuest) return;

        // Validation: either phone or instagram must be filled
        if (!formData.phone_number && !formData.instagram_username) {
            setError('Minimal salah satu No. HP atau Instagram harus diisi');
            return;
        }

        try {
            await updateGuest.mutateAsync({
                id: selectedGuest.id,
                data: {
                    name: formData.name,
                    guest_category_id: formData.guest_category_id,
                    phone_number: formData.phone_number || null,
                    instagram_username: formData.instagram_username || null,
                    address: formData.address || null,
                    note: formData.note || null,
                    status_attending: undefined,
                    status_sent: undefined,
                },
            });
            setIsEditDialogOpen(false);
            resetForm();
            toast.success('Tamu berhasil diperbarui');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Gagal memperbarui tamu');
        }
    };

    const handleDeleteGuest = async () => {
        if (!selectedGuest) return;
        try {
            await deleteGuest.mutateAsync(selectedGuest.id);
            setIsDeleteDialogOpen(false);
            setSelectedGuest(null);
            toast.success('Tamu berhasil dihapus');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Gagal menghapus tamu');
        }
    };

    const handleRestoreGuest = async () => {
        if (!selectedGuest) return;
        try {
            await restoreGuest.mutateAsync(selectedGuest.id);
            setIsRestoreDialogOpen(false);
            setSelectedGuest(null);
            toast.success('Tamu berhasil dipulihkan');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Gagal memulihkan tamu');
        }
    };

    const handleConfirmSendMessage = async () => {
        if (!selectedGuest || !messageType) return;

        const url = messageType === 'whatsapp' 
            ? `https://wa.me/${selectedGuest.phone_number}`
            : `https://instagram.com/${selectedGuest.instagram_username}`;
        
        window.open(url, '_blank');

        try {
            await updateStatusSent.mutateAsync({ id: selectedGuest.id, status: 'sent' });
            setIsSendMessageDialogOpen(false);
            setSelectedGuest(null);
            setMessageType(null);
            toast.success('Status undangan berhasil diperbarui menjadi Terkirim');
        } catch {
            toast.error('Gagal memperbarui status undangan');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            guest_category_id: categoriesData?.items[0]?.id || 0,
            phone_number: '',
            instagram_username: '',
            address: '',
            note: '',
            status_attending: 'pending',
            status_sent: 'pending',
        });
        setSelectedGuest(null);
        setError('');
    };

    const handleExport = async () => {
        try {
            const blob = await guestService.exportGuests();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `guests_export_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Tamu berhasil diekspor');
        } catch {
            toast.error('Gagal mengekspor tamu');
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await guestService.getTemplate();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'guests_import_template.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch {
            toast.error('Gagal mengunduh template');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportFile(file);
    };

    const handleAnalyzeFile = async () => {
        if (!importFile) return;

        setImportPreviewData(null);
        setImportProgress(0);

        try {
            const preview = await previewImport.mutateAsync(importFile);
            setImportPreviewData(preview);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal melihat pratinjau file');
        }
    };

    const handleConfirmImport = async () => {
        if (!importPreviewData) return;

        const validItems = importPreviewData.items.filter((item: any) => item.is_valid);
        if (validItems.length === 0) {
            toast.error('Tidak ada item valid untuk diimpor');
            return;
        }

        setIsImporting(true);
        setImportProgress(0);

        const chunkSize = 10;
        const totalItems = validItems.length;
        let processedCount = 0;

        try {
            for (let i = 0; i < totalItems; i += chunkSize) {
                const chunk = validItems.slice(i, i + chunkSize);
                await executeImport.mutateAsync(chunk.map((item: any) => ({
                    name: item.name,
                    guest_category_id: item.guest_category_id,
                    phone_number: item.phone_number,
                    instagram_username: item.instagram_username,
                    address: item.address,
                    note: item.note,
                })));
                
                processedCount += chunk.length;
                setImportProgress(Math.round((processedCount / totalItems) * 100));
            }

            toast.success(`Berhasil mengimpor ${processedCount} tamu`);
            setIsImportModalOpen(false);
            resetImportState();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Gagal mengimpor tamu');
        } finally {
            setIsImporting(false);
        }
    };

    const resetImportState = () => {
        setImportFile(null);
        setImportPreviewData(null);
        setImportProgress(0);
        setIsImporting(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files?.[0];
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
            setImportFile(file);
        } else {
            toast.error('Unggah file Excel yang valid (.xlsx atau .xls)');
        }
    };

    const openEditDialog = (guest: Guest) => {
        setSelectedGuest(guest);
        setFormData({
            name: guest.name,
            guest_category_id: guest.guest_category_id,
            phone_number: guest.phone_number || '',
            instagram_username: guest.instagram_username || '',
            address: guest.address || '',
            note: guest.note || '',
            status_attending: guest.status_attending,
            status_sent: guest.status_sent,
        });
        setIsEditDialogOpen(true);
    };

    const handleSort = (field: string) => {
        if (field !== 'name') return;
        setQueryParams(prev => ({
            ...prev,
            sort_by: field,
            sort_dir: prev.sort_by === field && prev.sort_dir === 'asc' ? 'desc' : 'asc',
        }));
    };

    const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => {
        const isActive = queryParams.sort_by === field;
        return (
            <button
                className={`flex items-center gap-1 hover:text-foreground ${isActive ? 'text-foreground font-bold' : ''}`}
                onClick={() => handleSort(field)}
            >
                {children}
                <ArrowUpDown className="h-3 w-3" />
            </button>
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'going': return <Badge variant="default">Hadir</Badge>;
            case 'not_going': return <Badge variant="destructive">Tidak Hadir</Badge>;
            case 'pending': return <Badge variant="secondary">Menunggu</Badge>;
            case 'sent': return <Badge variant="default">Terkirim</Badge>;
            case 'not_sent': return <Badge variant="secondary">Belum Dikirim</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const toggleSelectGuest = (id: string) => {
        setSelectedGuestIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedGuestIds.length === guestsData?.items.length) {
            setSelectedGuestIds([]);
        } else {
            setSelectedGuestIds(guestsData?.items.map(g => g.id) || []);
        }
    };

    return (
        <ProtectedRoute>
            <ProtectedModule requiredRole={['Super Admin', 'Admin']}>
                <MainLayout>
                    {/* Page Header */}
                    <div className="mb-8">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                <UserRound strokeWidth={1.5} className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Daftar Tamu</h2>
                                <p className="text-sm text-muted-foreground">Kelola tamu undangan, status RSVP, dan undangan</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Card */}
                    <Card className="border-border/50 shadow-sm">
                        <CardContent className="p-6">
                            {error && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="mb-4">
                                    <TabsTrigger value="active" className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Aktif
                                        {guestsData?.total ? <Badge variant="secondary">{guestsData.total}</Badge> : null}
                                    </TabsTrigger>
                                    <TabsTrigger value="deleted" className="flex items-center gap-2">
                                        <UserX className="h-4 w-4" />
                                        Dihapus
                                        {deletedGuestsData?.total ? <Badge variant="secondary">{deletedGuestsData.total}</Badge> : null}
                                    </TabsTrigger>
                                </TabsList>

                                {/* Active Guests Tab */}
                                <TabsContent value="active">
                                    {/* Primary Filter Row */}
                                    <div className="flex flex-col md:flex-row gap-4 mb-4">
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
                                                        <span className="text-xs text-muted-foreground">Tampil:</span>
                                                        <SelectValue placeholder="10" />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="10">10</SelectItem>
                                                    <SelectItem value="25">25</SelectItem>
                                                    <SelectItem value="50">50</SelectItem>
                                                    <SelectItem value="100">100</SelectItem>
                                                    <SelectItem value="99999">Semua</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                                <Input
                                                    placeholder="Cari tamu..."
                                                    value={searchInput}
                                                    onChange={(e) => setSearchInput(e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedGuestIds.length > 0 && (
                                                <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                                                    <Whatsapp className="mr-2 h-4 w-4" />
                                                    Kirim ({selectedGuestIds.length})
                                                </Button>
                                            )}
                                            <Button variant="outline" onClick={handleExport}>
                                                <Download className="mr-2 h-4 w-4" />
                                                Ekspor
                                            </Button>
                                            <ProtectedFeature permission="guests.create">
                                                <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Impor
                                                </Button>
                                                <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Tambah Tamu
                                                </Button>
                                            </ProtectedFeature>
                                        </div>
                                    </div>

                                    {/* Secondary (Custom) Filter Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                        <Select
                                            value={queryParams.category_id?.toString() || 'all'}
                                            onValueChange={(value) =>
                                                setQueryParams(prev => ({
                                                    ...prev,
                                                    page: 1,
                                                    category_id: value === 'all' ? undefined : parseInt(value),
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Semua Kategori" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Kategori</SelectItem>
                                                {categoriesData?.items.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={queryParams.status_attending || 'all'}
                                            onValueChange={(value) =>
                                                setQueryParams(prev => ({
                                                    ...prev,
                                                    page: 1,
                                                    status_attending: value === 'all' ? undefined : value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Semua Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Status</SelectItem>
                                                <SelectItem value="pending">Menunggu</SelectItem>
                                                <SelectItem value="going">Hadir</SelectItem>
                                                <SelectItem value="not_going">Tidak Hadir</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={queryParams.status_sent || 'all'}
                                            onValueChange={(value) =>
                                                setQueryParams(prev => ({
                                                    ...prev,
                                                    page: 1,
                                                    status_sent: value === 'all' ? undefined : value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Semua Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Status</SelectItem>
                                                <SelectItem value="pending">Menunggu</SelectItem>
                                                <SelectItem value="sent">Terkirim</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={queryParams.is_checked_in === undefined ? 'all' : queryParams.is_checked_in.toString()}
                                            onValueChange={(value) =>
                                                setQueryParams(prev => ({
                                                    ...prev,
                                                    page: 1,
                                                    is_checked_in: value === 'all' ? undefined : value === 'true',
                                                }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Semua Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Status</SelectItem>
                                                <SelectItem value="true">Sudah Check In</SelectItem>
                                                <SelectItem value="false">Belum Check In</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Guests Table */}
                                    {isLoading ? (
                                        <div className="flex justify-center items-center h-64">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : !guestsData?.items?.length ? (
                                        <div className="text-center py-12">
                                            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold mb-2">Tidak Ada Tamu Ditemukan</h3>
                                            <p className="text-muted-foreground">
                                                {queryParams.search ? 'Coba kata kunci pencarian lain' : 'Tambah tamu pertama untuk memulai'}
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="border rounded-lg overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead className="w-10">
                                                                <Checkbox
                                                                    checked={selectedGuestIds.length === guestsData.items.length && guestsData.items.length > 0}
                                                                    onCheckedChange={toggleSelectAll}
                                                                />
                                                            </TableHead>
                                                            <TableHead><SortButton field="name">Nama</SortButton></TableHead>
                                                            <TableHead>Kategori</TableHead>
                                                            <TableHead>No. HP / Instagram</TableHead>
                                                            <TableHead>RSVP & Undangan</TableHead>
                                                            <TableHead>Check In</TableHead>
                                                            <TableHead className="text-right">Aksi</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {guestsData.items.map((guest) => (
                                                            <TableRow key={guest.id}>
                                                                <TableCell>
                                                                    <Checkbox
                                                                        checked={selectedGuestIds.includes(guest.id)}
                                                                        onCheckedChange={() => toggleSelectGuest(guest.id)}
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="font-medium">
                                                                    {guest.name}
                                                                </TableCell>
                                                                <TableCell>{guest.category_name}</TableCell>
                                                                <TableCell>
                                                                    <div className="text-sm space-y-1">
                                                                        {guest.phone_number && <div className="flex items-center gap-1.5"><Whatsapp className="h-4 w-4 text-muted-foreground" /> {guest.phone_number}</div>}
                                                                        {guest.instagram_username && <div className="flex items-center gap-1.5"><Instagram className="h-4 w-4 text-muted-foreground" /> @{guest.instagram_username}</div>}
                                                                        {!guest.phone_number && !guest.instagram_username && <span className="text-muted-foreground italic">-</span>}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-col gap-2 text-xs">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-muted-foreground w-12">RSVP:</span>
                                                                            {getStatusBadge(guest.status_attending)}
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-muted-foreground w-12">Undang:</span>
                                                                            {getStatusBadge(guest.status_sent)}
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {guest.check_in_at ? (
                                                                        <div className="text-sm">
                                                                            <Badge variant="outline" className="text-sm">
                                                                                {format(new Date(guest.check_in_at), 'HH:mm')}
                                                                            </Badge>
                                                                            <div className="text-xs text-muted-foreground mt-1">
                                                                                {format(new Date(guest.check_in_at), 'dd MMM')}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-muted-foreground text-sm italic">Belum</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end gap-1 flex-wrap">
                                                                        <Button
                                                                            size="action"
                                                                            variant="soft"
                                                                            onClick={() => { setSelectedGuest(guest); setIsQRDialogOpen(true); }}
                                                                            title="Detail"
                                                                        >
                                                                            <QrCode /> Detail
                                                                        </Button>
                                                                        <ProtectedFeature permission="guests.send_message">
                                                                            {guest.phone_number && (
                                                                                <Button
                                                                                    size="action"
                                                                                    variant="soft"
                                                                                    className="text-green-600 hover:bg-green-600/10"
                                                                                    title="Pesan WA"
                                                                                    onClick={() => {
                                                                                        setSelectedGuest(guest);
                                                                                        setMessageType('whatsapp');
                                                                                        setIsSendMessageDialogOpen(true);
                                                                                    }}
                                                                                >
                                                                                    <Whatsapp /> WA
                                                                                </Button>
                                                                            )}
                                                                            {guest.instagram_username && (
                                                                                <Button
                                                                                    size="action"
                                                                                    variant="soft"
                                                                                    className="text-pink-600 hover:bg-pink-600/10"
                                                                                    title="Pesan IG"
                                                                                    onClick={() => {
                                                                                        setSelectedGuest(guest);
                                                                                        setMessageType('instagram');
                                                                                        setIsSendMessageDialogOpen(true);
                                                                                    }}
                                                                                >
                                                                                    <Instagram /> IG
                                                                                </Button>
                                                                            )}
                                                                        </ProtectedFeature>
                                                                        <ProtectedFeature permission="guests.update">
                                                                            <Button
                                                                                size="action"
                                                                                variant="soft-accent"
                                                                                onClick={() => openEditDialog(guest)}
                                                                                title="Edit"
                                                                            >
                                                                                <Edit /> Edit
                                                                            </Button>
                                                                        </ProtectedFeature>
                                                                        <ProtectedFeature permission="guests.delete">
                                                                            <Button
                                                                                size="action"
                                                                                variant="outline"
                                                                                className="text-destructive border-destructive/20 hover:bg-destructive/10"
                                                                                onClick={() => {
                                                                                    setSelectedGuest(guest);
                                                                                    setIsDeleteDialogOpen(true);
                                                                                }}
                                                                                title="Hapus"
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
                                                    {Math.min((queryParams.page || 1) * (queryParams.page_size || 10), guestsData.total)} dari{' '}
                                                    {guestsData.total} tamu
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
                                                        disabled={(queryParams.page || 1) >= guestsData.total_pages}
                                                        onClick={() => setQueryParams(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                                                    >
                                                        Selanjutnya
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </TabsContent>

                                {/* Deleted Guests Tab */}
                                <TabsContent value="deleted">
                                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                                        <div className="flex gap-2 flex-1">
                                            <Select
                                                value={deletedQueryParams.page_size?.toString() || '10'}
                                                onValueChange={(value) =>
                                                    setDeletedQueryParams(prev => ({
                                                        ...prev,
                                                        page: 1,
                                                        page_size: parseInt(value),
                                                    }))
                                                }
                                            >
                                                <SelectTrigger className="w-[110px]">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">Tampil:</span>
                                                        <SelectValue placeholder="10" />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="10">10</SelectItem>
                                                    <SelectItem value="25">25</SelectItem>
                                                    <SelectItem value="50">50</SelectItem>
                                                    <SelectItem value="100">100</SelectItem>
                                                    <SelectItem value="99999">Semua</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <div className="relative flex-1">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                                <Input
                                                    placeholder="Cari tamu yang dihapus..."
                                                    value={deletedSearchInput}
                                                    onChange={(e) => setDeletedSearchInput(e.target.value)}
                                                    className="pl-10"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deleted Guests Table */}
                                    {isLoadingDeleted ? (
                                        <div className="flex justify-center items-center h-64">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        </div>
                                    ) : !deletedGuestsData?.items?.length ? (
                                        <div className="text-center py-12">
                                            <UserX className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                            <h3 className="text-lg font-semibold mb-2">Tidak Ada Tamu Dihapus</h3>
                                            <p className="text-muted-foreground">
                                                Tamu yang dihapus akan muncul di sini untuk dipulihkan
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="border rounded-lg overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Nama</TableHead>
                                                            <TableHead>Kategori</TableHead>
                                                            <TableHead className="text-right">Aksi</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {deletedGuestsData.items.map((guest) => (
                                                            <TableRow key={guest.id}>
                                                                <TableCell className="font-medium">{guest.name}</TableCell>
                                                                <TableCell>{guest.category_name}</TableCell>
                                                                <TableCell className="text-right">
                                                                    <ProtectedFeature permission="guests.update">
                                                                        <Button
                                                                            size="action"
                                                                            variant="soft-accent"
                                                                            onClick={() => {
                                                                                setSelectedGuest(guest);
                                                                                setIsRestoreDialogOpen(true);
                                                                            }}
                                                                        >
                                                                            <RotateCcw />
                                                                            Pulihkan
                                                                        </Button>
                                                                    </ProtectedFeature>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>

                                            {/* Pagination */}
                                            <div className="flex items-center justify-between mt-4">
                                                <p className="text-sm text-muted-foreground">
                                                    Menampilkan {((deletedQueryParams.page || 1) - 1) * (deletedQueryParams.page_size || 10) + 1} ke{' '}
                                                    {Math.min((deletedQueryParams.page || 1) * (deletedQueryParams.page_size || 10), deletedGuestsData.total)} dari{' '}
                                                    {deletedGuestsData.total} tamu dihapus
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={(deletedQueryParams.page || 1) === 1}
                                                        onClick={() => setDeletedQueryParams(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                        Sebelumnya
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={(deletedQueryParams.page || 1) >= deletedGuestsData.total_pages}
                                                        onClick={() => setDeletedQueryParams(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                                                    >
                                                        Selanjutnya
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>

                    {/* Create Guest Dialog */}
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Tambah Tamu</DialogTitle>
                                <DialogDescription>Tambah tamu baru ke daftar undangan</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-2">
                                    <Label>Nama</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Nama lengkap"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Kategori</Label>
                                    <Select
                                        value={formData.guest_category_id?.toString()}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, guest_category_id: parseInt(value) }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categoriesData?.items.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>No. HP</Label>
                                        <Input
                                            value={formData.phone_number}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                                            placeholder="cth. 628123456789"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Username Instagram</Label>
                                        <Input
                                            value={formData.instagram_username}
                                            onChange={(e) => setFormData(prev => ({ ...prev, instagram_username: e.target.value }))}
                                            placeholder="Username tanpa @"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">* Minimal salah satu No. HP atau Instagram harus diisi</p>
                                <div className="space-y-2">
                                    <Label>Alamat</Label>
                                    <Textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Catatan</Label>
                                    <Textarea
                                        value={formData.note}
                                        onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Batal</Button>
                                <Button onClick={handleCreateGuest} disabled={createGuest.isPending}>
                                    {createGuest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Tambah
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Guest Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Tamu</DialogTitle>
                                <DialogDescription>Perbarui data tamu</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-2">
                                    <Label>Nama</Label>
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
                                <div className="space-y-2">
                                    <Label>Kategori</Label>
                                    <Select
                                        value={formData.guest_category_id?.toString()}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, guest_category_id: parseInt(value) }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categoriesData?.items.map(cat => (
                                                <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>No. HP</Label>
                                        <Input
                                            value={formData.phone_number}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Username Instagram</Label>
                                        <Input
                                            value={formData.instagram_username}
                                            onChange={(e) => setFormData(prev => ({ ...prev, instagram_username: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Alamat</Label>
                                    <Textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Catatan</Label>
                                    <Textarea
                                        value={formData.note}
                                        onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Batal</Button>
                                <Button onClick={handleUpdateGuest} disabled={updateGuest.isPending}>
                                    {updateGuest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Simpan
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* QR Code & Detail Dialog */}
                    {/* Import Dialog */}
            <Dialog open={isImportModalOpen} onOpenChange={(open) => {
                if (!isImporting) {
                    setIsImportModalOpen(open);
                    if (!open) resetImportState();
                }
            }}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Impor Tamu</DialogTitle>
                        <DialogDescription>
                            Impor tamu dari file Excel
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-4 flex-1 overflow-hidden">
                        <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                <span className="text-sm font-medium">Template Excel</span>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                                <Download className="mr-2 h-4 w-4" />
                                Unduh Template
                            </Button>
                        </div>

                        {!importPreviewData ? (
                            <div 
                                className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 transition-colors hover:bg-muted/50"
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                {previewImport.isPending ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                                        <p className="text-sm font-medium">Menganalisis file...</p>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                                        {importFile ? (
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-primary mb-2">{importFile.name}</p>
                                                <p className="text-xs text-muted-foreground mb-4">{(importFile.size / 1024).toFixed(2)} KB</p>
                                                <div className="flex gap-2 justify-center">
                                                    <Button size="sm" onClick={handleAnalyzeFile}>
                                                        Analisis File
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => setImportFile(null)}>
                                                        Ganti
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-sm text-muted-foreground mb-4">Seret dan letakkan file Excel di sini, atau klik untuk memilih</p>
                                                <Input 
                                                    type="file" 
                                                    accept=".xlsx, .xls" 
                                                    className="hidden" 
                                                    id="excel-upload" 
                                                    onChange={handleFileChange}
                                                    onClick={(e) => (e.target as HTMLInputElement).value = ''}
                                                />
                                                <Button asChild>
                                                    <label htmlFor="excel-upload" className="cursor-pointer">
                                                        Pilih File
                                                    </label>
                                                </Button>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                                <div className="grid grid-cols-3 gap-4">
                                    <Card className="p-3 bg-blue-50/50">
                                        <div className="text-xs text-muted-foreground">Total Baris</div>
                                        <div className="text-xl font-bold">{importPreviewData.total}</div>
                                    </Card>
                                    <Card className="p-3 bg-green-50/50">
                                        <div className="text-xs text-muted-foreground">Valid</div>
                                        <div className="text-xl font-bold text-green-600">{importPreviewData.valid_count}</div>
                                    </Card>
                                    <Card className="p-3 bg-red-50/50">
                                        <div className="text-xs text-muted-foreground">Tidak Valid</div>
                                        <div className="text-xl font-bold text-red-600">{importPreviewData.error_count}</div>
                                    </Card>
                                </div>

                                <div className="border rounded-md overflow-auto flex-1">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-white">
                                            <TableRow>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Nama</TableHead>
                                                <TableHead>Kategori</TableHead>
                                                <TableHead>No. HP / IG</TableHead>
                                                <TableHead>Pesan Error</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {importPreviewData.items.map((item: any, idx: number) => (
                                                <TableRow key={idx} className={!item.is_valid ? "bg-red-50/30" : ""}>
                                                    <TableCell>
                                                        {item.is_valid ? (
                                                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Valid</Badge>
                                                        ) : (
                                                            <Badge variant="destructive">Tidak Valid</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{item.name || "-"}</TableCell>
                                                    <TableCell>{item.category_name || `ID: ${item.guest_category_id}`}</TableCell>
                                                    <TableCell>
                                                        <div className="text-xs">
                                                            {item.phone_number && <div>{item.phone_number}</div>}
                                                            {item.instagram_username && <div>@{item.instagram_username}</div>}
                                                            {!item.phone_number && !item.instagram_username && "-"}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.errors?.length > 0 ? (
                                                            <ul className="text-xs text-red-600 list-disc list-inside">
                                                                {item.errors.map((err: string, i: number) => (
                                                                    <li key={i}>{err}</li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {isImporting && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span>Mengimpor...</span>
                                            <span>{importProgress}%</span>
                                        </div>
                                        <Progress value={importProgress} className="h-2" />
                                    </div>
                                )}
                                {importPreviewData.error_count > 0 && (
                                    <Alert variant="destructive" className="mt-4">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>Error Validasi</AlertTitle>
                                        <AlertDescription>
                                            Terdapat {importPreviewData.error_count} baris tidak valid. Perbaiki file Excel dan upload kembali.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsImportModalOpen(false)} disabled={isImporting}>
                            Batal
                        </Button>
                        {importPreviewData && (
                            <>
                                <Button variant="ghost" onClick={() => { setImportFile(null); setImportPreviewData(null); }} disabled={isImporting}>
                                    Ganti File
                                </Button>
                                <Button 
                                    onClick={handleConfirmImport} 
                                    disabled={isImporting || importPreviewData.valid_count === 0 || importPreviewData.error_count > 0}
                                    className="min-w-[120px]"
                                >
                                    {isImporting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Mengimpor...
                                        </>
                                    ) : (
                                        `Impor (${importPreviewData.valid_count})`
                                    )}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Kode QR Tamu</DialogTitle>
                                <DialogDescription>
                                    Detail lengkap untuk {selectedGuest?.name}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex flex-col items-center justify-center p-4 gap-6">
                                <div className="bg-white p-4 border-2 border-primary rounded-xl shadow-sm">
                                    {selectedGuest?.qr_code && (
                                        <QRCodeSVG
                                            value={selectedGuest.qr_code}
                                            size={200}
                                            level="H"
                                            includeMargin={true}
                                        />
                                    )}
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-2xl font-bold tracking-widest text-primary">{selectedGuest?.qr_code}</p>
                                    <p className="text-lg font-medium">{selectedGuest?.name}</p>
                                    <Badge variant="outline">{selectedGuest?.category_name}</Badge>
                                </div>
                                
                                <div className="w-full grid grid-cols-2 gap-4 text-sm bg-muted/30 p-4 rounded-lg border">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status RSVP</p>
                                        <p className="font-semibold">{selectedGuest?.status_attending.toUpperCase()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Undangan</p>
                                        <p className="font-semibold">{selectedGuest?.status_sent.toUpperCase()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Check In</p>
                                        <p className="font-semibold">
                                            {selectedGuest?.check_in_at ? format(new Date(selectedGuest.check_in_at), 'HH:mm dd MMM') : '-'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Kontak</p>
                                        <p className="font-semibold truncate">{selectedGuest?.phone_number || selectedGuest?.instagram_username || '-'}</p>
                                    </div>
                                </div>

                                <Button className="w-full" variant="outline" onClick={() => window.print()}>
                                    Cetak Tiket Tamu
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Send Message Confirmation Dialog */}
                    <AlertDialog open={isSendMessageDialogOpen} onOpenChange={setIsSendMessageDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Kirim Undangan</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Kirim undangan ke <strong>{selectedGuest?.name}</strong> melalui {messageType === 'whatsapp' ? 'WhatsApp' : 'Instagram'}? 
                                    Tindakan ini akan menandai status undangan menjadi <strong>&quot;Terkirim&quot;</strong>.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => { setSelectedGuest(null); setMessageType(null); }}>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={handleConfirmSendMessage} disabled={updateStatusSent.isPending}>
                                    {updateStatusSent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Ya, Kirim & Tandai Terkirim
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Tamu</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Yakin ingin menghapus {selectedGuest?.name}? Anda dapat memulihkan tamu ini nanti dari tab Dihapus.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteGuest} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Hapus
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Restore Confirmation Dialog */}
                    <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Pulihkan Tamu</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Yakin ingin memulihkan {selectedGuest?.name}?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRestoreGuest}>
                                    Pulihkan
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </MainLayout>
            </ProtectedModule>
        </ProtectedRoute>
    );
}
