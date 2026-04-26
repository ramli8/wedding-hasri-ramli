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
import { Alert, AlertDescription } from '@/src/presentation/components/ui/alert';
import { Textarea } from '@/src/presentation/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/presentation/components/ui/tabs';
import { Checkbox } from '@/src/presentation/components/ui/checkbox';
import { Search, UserPlus, Edit, Trash2, Loader2, ChevronLeft, ChevronRight, QrCode, RotateCcw, Users, UserX, User, ArrowUpDown, Instagram } from 'lucide-react';
import { useGuests, useCreateGuest, useUpdateGuest, useDeleteGuest, useGuestCategories, useDeletedGuests, useRestoreGuest, useUpdateGuestStatusSent } from '@/src/application/hooks/use-guest-query';
import { Guest, GuestListParams } from '@/src/domain/services/guest.service';
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
            setError('At least one of phone number or instagram username must be filled');
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
            toast.success('Guest created successfully');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create guest');
        }
    };

    const handleUpdateGuest = async () => {
        if (!selectedGuest) return;

        // Validation: either phone or instagram must be filled
        if (!formData.phone_number && !formData.instagram_username) {
            setError('At least one of phone number or instagram username must be filled');
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
            toast.success('Guest updated successfully');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update guest');
        }
    };

    const handleDeleteGuest = async () => {
        if (!selectedGuest) return;
        try {
            await deleteGuest.mutateAsync(selectedGuest.id);
            setIsDeleteDialogOpen(false);
            setSelectedGuest(null);
            toast.success('Guest deleted successfully');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to delete guest');
        }
    };

    const handleRestoreGuest = async () => {
        if (!selectedGuest) return;
        try {
            await restoreGuest.mutateAsync(selectedGuest.id);
            setIsRestoreDialogOpen(false);
            setSelectedGuest(null);
            toast.success('Guest restored successfully');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to restore guest');
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
            toast.success('Invitation status updated to Sent');
        } catch (err: any) {
            toast.error('Failed to update invitation status');
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
            case 'going': return <Badge variant="default">Going</Badge>;
            case 'not_going': return <Badge variant="destructive">Not Going</Badge>;
            case 'sent': return <Badge variant="default">Sent</Badge>;
            default: return <Badge variant="secondary">{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold">Guest Management</CardTitle>
                            <CardDescription>
                                Manage your wedding guests, RSVP status, and invitations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="mb-4">
                                    <TabsTrigger value="active" className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Active Guests
                                        {guestsData?.total ? <Badge variant="secondary">{guestsData.total}</Badge> : null}
                                    </TabsTrigger>
                                    <TabsTrigger value="deleted" className="flex items-center gap-2">
                                        <UserX className="h-4 w-4" />
                                        Deleted Guests
                                        {deletedGuestsData?.total ? <Badge variant="secondary">{deletedGuestsData.total}</Badge> : null}
                                    </TabsTrigger>
                                </TabsList>

                                {/* Active Guests Tab */}
                                <TabsContent value="active">
                                    {/* Primary Filter Row */}
                                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                            <Input
                                                placeholder="Search by name or QR code..."
                                                value={searchInput}
                                                onChange={(e) => setSearchInput(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            {selectedGuestIds.length > 0 && (
                                                <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                                                    <Whatsapp className="mr-2 h-4 w-4" />
                                                    Blast ({selectedGuestIds.length})
                                                </Button>
                                            )}
                                            <ProtectedFeature permission="guests.create">
                                                <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Add Guest
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
                                                <SelectValue placeholder="All Categories" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Categories</SelectItem>
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
                                                <SelectValue placeholder="All RSVP Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All RSVP Status</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="going">Going</SelectItem>
                                                <SelectItem value="not_going">Not Going</SelectItem>
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
                                                <SelectValue placeholder="All Invitation Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Invitation Status</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="sent">Sent</SelectItem>
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
                                                <SelectValue placeholder="All Check-in Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Check-in Status</SelectItem>
                                                <SelectItem value="true">Checked In</SelectItem>
                                                <SelectItem value="false">Not Checked In</SelectItem>
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
                                            <h3 className="text-lg font-semibold mb-2">No Guests Found</h3>
                                            <p className="text-muted-foreground">
                                                {queryParams.search ? 'Try a different search term' : 'Add your first guest to get started'}
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
                                                            <TableHead><SortButton field="name">Name</SortButton></TableHead>
                                                            <TableHead>Category</TableHead>
                                                            <TableHead>Phone / Instagram</TableHead>
                                                            <TableHead>RSVP & Invitation</TableHead>
                                                            <TableHead>Check-in At</TableHead>
                                                            <TableHead className="text-right">Actions</TableHead>
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
                                                                    <div className="text-xs space-y-1">
                                                                        {guest.phone_number && <div className="flex items-center gap-1"><Whatsapp className="h-3 w-3 text-muted-foreground" /> {guest.phone_number}</div>}
                                                                        {guest.instagram_username && <div className="flex items-center gap-1"><Instagram className="h-3 w-3 text-muted-foreground" /> @{guest.instagram_username}</div>}
                                                                        {!guest.phone_number && !guest.instagram_username && <span className="text-muted-foreground italic">None</span>}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="flex flex-col gap-1.5 text-[10px]">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-muted-foreground w-12">RSVP:</span>
                                                                            {getStatusBadge(guest.status_attending)}
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-muted-foreground w-12">Invite:</span>
                                                                            {getStatusBadge(guest.status_sent)}
                                                                        </div>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    {guest.check_in_at ? (
                                                                        <div className="text-xs">
                                                                            <Badge variant="outline">
                                                                                {format(new Date(guest.check_in_at), 'HH:mm')}
                                                                            </Badge>
                                                                            <div className="text-[10px] text-muted-foreground mt-1">
                                                                                {format(new Date(guest.check_in_at), 'dd MMM')}
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-muted-foreground text-xs italic">Not yet</span>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end gap-1">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => { setSelectedGuest(guest); setIsQRDialogOpen(true); }}
                                                                            title="Detail"
                                                                        >
                                                                            <QrCode className="h-4 w-4" />
                                                                        </Button>
                                                                        <ProtectedFeature permission="guests.send_message">
                                                                            {guest.phone_number && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    title="WA Message"
                                                                                    onClick={() => {
                                                                                        setSelectedGuest(guest);
                                                                                        setMessageType('whatsapp');
                                                                                        setIsSendMessageDialogOpen(true);
                                                                                    }}
                                                                                >
                                                                                    <Whatsapp className="h-4 w-4" />
                                                                                </Button>
                                                                            )}
                                                                            {guest.instagram_username && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    variant="outline"
                                                                                    title="Instagram"
                                                                                    onClick={() => {
                                                                                        setSelectedGuest(guest);
                                                                                        setMessageType('instagram');
                                                                                        setIsSendMessageDialogOpen(true);
                                                                                    }}
                                                                                >
                                                                                    <Instagram className="h-4 w-4" />
                                                                                </Button>
                                                                            )}
                                                                        </ProtectedFeature>
                                                                        <ProtectedFeature permission="guests.update">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => openEditDialog(guest)}
                                                                                title="Edit"
                                                                            >
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                        </ProtectedFeature>
                                                                        <ProtectedFeature permission="guests.delete">
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() => {
                                                                                    setSelectedGuest(guest);
                                                                                    setIsDeleteDialogOpen(true);
                                                                                }}
                                                                                title="Delete"
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
                                                    {Math.min((queryParams.page || 1) * (queryParams.page_size || 10), guestsData.total)} of{' '}
                                                    {guestsData.total} guests
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
                                                        disabled={(queryParams.page || 1) >= guestsData.total_pages}
                                                        onClick={() => setQueryParams(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                                                    >
                                                        Next
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
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                            <Input
                                                placeholder="Search deleted guests..."
                                                value={deletedSearchInput}
                                                onChange={(e) => setDeletedSearchInput(e.target.value)}
                                                className="pl-10"
                                            />
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
                                            <h3 className="text-lg font-semibold mb-2">No Deleted Guests</h3>
                                            <p className="text-muted-foreground">
                                                Deleted guests will appear here for restoration
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="border rounded-lg overflow-hidden">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Name</TableHead>
                                                            <TableHead>Category</TableHead>
                                                            <TableHead className="text-right">Actions</TableHead>
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
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => {
                                                                                setSelectedGuest(guest);
                                                                                setIsRestoreDialogOpen(true);
                                                                            }}
                                                                        >
                                                                            <RotateCcw className="h-4 w-4 mr-1" />
                                                                            Restore
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
                                                    Showing {((deletedQueryParams.page || 1) - 1) * (deletedQueryParams.page_size || 10) + 1} to{' '}
                                                    {Math.min((deletedQueryParams.page || 1) * (deletedQueryParams.page_size || 10), deletedGuestsData.total)} of{' '}
                                                    {deletedGuestsData.total} deleted guests
                                                </p>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={(deletedQueryParams.page || 1) === 1}
                                                        onClick={() => setDeletedQueryParams(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                        Previous
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={(deletedQueryParams.page || 1) >= deletedGuestsData.total_pages}
                                                        onClick={() => setDeletedQueryParams(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                                                    >
                                                        Next
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
                                <DialogTitle>Create Guest</DialogTitle>
                                <DialogDescription>Add a new guest to the wedding list</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Full name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select
                                        value={formData.guest_category_id?.toString()}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, guest_category_id: parseInt(value) }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
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
                                        <Label>Phone Number</Label>
                                        <Input
                                            value={formData.phone_number}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                                            placeholder="e.g. 628123456789"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Instagram Username</Label>
                                        <Input
                                            value={formData.instagram_username}
                                            onChange={(e) => setFormData(prev => ({ ...prev, instagram_username: e.target.value }))}
                                            placeholder="Username without @"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic">* Minimal salah satu diisi (No. HP atau Instagram)</p>
                                <div className="space-y-2">
                                    <Label>Address</Label>
                                    <Textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Note</Label>
                                    <Textarea
                                        value={formData.note}
                                        onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateGuest} disabled={createGuest.isPending}>
                                    {createGuest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Edit Guest Dialog */}
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Edit Guest</DialogTitle>
                                <DialogDescription>Update guest information</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select
                                        value={formData.guest_category_id?.toString()}
                                        onValueChange={(value) => setFormData(prev => ({ ...prev, guest_category_id: parseInt(value) }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
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
                                        <Label>Phone Number</Label>
                                        <Input
                                            value={formData.phone_number}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Instagram Username</Label>
                                        <Input
                                            value={formData.instagram_username}
                                            onChange={(e) => setFormData(prev => ({ ...prev, instagram_username: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Address</Label>
                                    <Textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Note</Label>
                                    <Textarea
                                        value={formData.note}
                                        onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleUpdateGuest} disabled={updateGuest.isPending}>
                                    {updateGuest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* QR Code & Detail Dialog */}
                    <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Guest Detail & QR Code</DialogTitle>
                                <DialogDescription>
                                    Full detail for {selectedGuest?.name}
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
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">RSVP Status</p>
                                        <p className="font-semibold">{selectedGuest?.status_attending.toUpperCase()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Invitation</p>
                                        <p className="font-semibold">{selectedGuest?.status_sent.toUpperCase()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Check-in</p>
                                        <p className="font-semibold">
                                            {selectedGuest?.check_in_at ? format(new Date(selectedGuest.check_in_at), 'HH:mm dd MMM') : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Contact</p>
                                        <p className="font-semibold truncate">{selectedGuest?.phone_number || selectedGuest?.instagram_username || '-'}</p>
                                    </div>
                                </div>

                                <Button className="w-full" variant="outline" onClick={() => window.print()}>
                                    Print Guest Pass
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Send Message Confirmation Dialog */}
                    <AlertDialog open={isSendMessageDialogOpen} onOpenChange={setIsSendMessageDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Send Invitation</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to send the invitation to <strong>{selectedGuest?.name}</strong> via {messageType === 'whatsapp' ? 'WhatsApp' : 'Instagram'}? 
                                    This will also mark their invitation status as <strong>"Sent"</strong>.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => { setSelectedGuest(null); setMessageType(null); }}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleConfirmSendMessage} disabled={updateStatusSent.isPending}>
                                    {updateStatusSent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Yes, Send & Mark as Sent
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Guest</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete {selectedGuest?.name}? You can restore this guest later from the Deleted Guests tab.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteGuest} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Restore Confirmation Dialog */}
                    <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Restore Guest</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to restore {selectedGuest?.name}?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleRestoreGuest}>
                                    Restore
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </MainLayout>
            </ProtectedModule>
        </ProtectedRoute>
    );
}
