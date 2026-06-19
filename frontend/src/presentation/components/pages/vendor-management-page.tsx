'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
    Store, Plus, Pencil, Trash2, Check, CheckCircle2, X, Phone,
    Instagram, MapPin, ChevronRight, ChevronLeft, Star,
    Table2, GripVertical,
    CreditCard, AlertCircle,
    ArrowUpDown, Eye, Crown, User,
    Loader2, ListPlus
} from 'lucide-react'
import { toast } from 'react-toastify';
import { Button } from '@/src/presentation/components/ui/button'
import { Badge } from '@/src/presentation/components/ui/badge'
import { Input } from '@/src/presentation/components/ui/input'
import { Textarea } from '@/src/presentation/components/ui/textarea'
import { Label } from '@/src/presentation/components/ui/label'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter, DialogClose
} from '@/src/presentation/components/ui/dialog'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/src/presentation/components/ui/alert-dialog'
import { TooltipProvider } from '@/src/presentation/components/ui/tooltip'
import { Progress } from '@/src/presentation/components/ui/progress'
import { cn } from '@/src/lib/utils'
import {
    useVendorOverview,
    useCreateVendorCategory,
    useUpdateVendorCategory,
    useDeleteVendorCategory,
    useCreateAttribute,
    useUpdateAttribute,
    useDeleteAttribute,
    useCreateVendor,
    useUpdateVendor,
    useDeleteVendor,
    useUpdateVendorAttributeValues,
    useCreatePayment,
    useUpdatePayment,
    useDeletePayment,
    useSelectVendor,
    useDeselectVendor,
} from '@/src/application/hooks/use-vendor-query'

const DEFAULT_EVENT_ID = '00000000-0000-0000-0000-000000000001'

// ==================== TYPES ====================

interface VendorAttribute {
    id: number
    name: string
    sortOrder: number
}

interface VendorPayment {
    id: string
    date: string
    amount: number
    note: string
}

interface Vendor {
    id: string
    name: string
    contactPerson: string
    phoneNumber: string
    instagram: string
    address: string
    referencePrice?: number | null
    contractAmount: number | null
    paymentStatus: 'unpaid' | 'partial' | 'paid'
    note: string
    attributeValues: Record<number, string>
    payments?: VendorPayment[]
}

interface VendorCategory {
    id: number
    name: string
    selectedVendorId: string | null
    attributes: VendorAttribute[]
    vendors: Vendor[]
}

// ==================== API MAPPERS ====================

function apiAttributeToUI(attr: { id: number; name: string; sort_order: number }): VendorAttribute {
    return { id: attr.id, name: attr.name, sortOrder: attr.sort_order }
}

function apiPaymentToUI(p: { id: number; date: string; amount: number; note: string | null }): VendorPayment {
    return { id: String(p.id), date: p.date, amount: p.amount, note: p.note || '' }
}

function apiVendorToUI(v: {
    id: string; name: string; contact_person: string | null; phone_number: string | null;
    instagram: string | null; address: string | null; reference_price: number | null;
    contract_amount: number | null; payment_status: string; note: string | null;
    attribute_values: { attribute_id: number; value: string | null }[];
    payments: { id: number; date: string; amount: number; note: string | null }[];
}): Vendor {
    const av: Record<number, string> = {}
    if (v.attribute_values) {
        v.attribute_values.forEach(a => { if (a.attribute_id) av[a.attribute_id] = a.value || '' })
    }
    return {
        id: v.id,
        name: v.name,
        contactPerson: v.contact_person || '',
        phoneNumber: v.phone_number || '',
        instagram: v.instagram || '',
        address: v.address || '',
        referencePrice: v.reference_price,
        contractAmount: v.contract_amount,
        paymentStatus: (v.payment_status || 'unpaid') as 'unpaid' | 'partial' | 'paid',
        note: v.note || '',
        attributeValues: av,
        payments: (v.payments || []).map(apiPaymentToUI),
    }
}

function apiCategoryToUI(c: {
    id: number; name: string; selected_vendor_id: string | null;
    attributes: { id: number; name: string; sort_order: number }[];
    vendors: any[];
}): VendorCategory {
    return {
        id: c.id,
        name: c.name,
        selectedVendorId: c.selected_vendor_id,
        attributes: (c.attributes || []).map(apiAttributeToUI).sort((a, b) => a.sortOrder - b.sortOrder),
        vendors: (c.vendors || []).map(apiVendorToUI),
    }
}

// ==================== HELPER COMPONENTS ====================

function PaymentStatusBadge({ status }: { status: 'unpaid' | 'partial' | 'paid' }) {
    const config = {
        unpaid: { label: 'Belum Bayar', className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800' },
        partial: { label: 'Sebagian', className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800' },
        paid: { label: 'Lunas', className: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800' },
    }
    const c = config[status]
    return <Badge className={cn('text-xs font-medium', c.className)}>{c.label}</Badge>
}

function formatCurrency(amount: number | null): string {
    if (amount === null) return '-'
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

// ==================== MAIN COMPONENT ====================

export function VendorManagementPage() {
    const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null)

    const { data: overview, isLoading, isError, refetch } = useVendorOverview(DEFAULT_EVENT_ID)

    const categories: VendorCategory[] = useMemo(() =>
        (overview?.categories || []).map(apiCategoryToUI),
        [overview]
    )



    // Dialog states
    const [showCategoryDialog, setShowCategoryDialog] = useState(false)
    const [showVendorDialog, setShowVendorDialog] = useState(false)
    const [showAttributesDialog, setShowAttributesDialog] = useState(false)
    const [showVendorDetailDialog, setShowVendorDetailDialog] = useState(false)
    const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null)
    // Edit states
    const [editingCategory, setEditingCategory] = useState<VendorCategory | null>(null)
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
    const [evaluatingVendor, setEvaluatingVendor] = useState<Vendor | null>(null)
    const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null)
    // Form states
    const [categoryName, setCategoryName] = useState('')
    const [categoryAttributes, setCategoryAttributes] = useState<VendorAttribute[]>([])
    const [newAttributeName, setNewAttributeName] = useState('')
    const [editingAttributeId, setEditingAttributeId] = useState<number | null>(null)
    const [editingAttributeName, setEditingAttributeName] = useState('')
    const [draggedAttributeId, setDraggedAttributeId] = useState<number | null>(null)
    const [vendorForm, setVendorForm] = useState({
        name: '',
        contactPerson: '',
        phoneNumber: '',
        instagram: '',
        address: '',
        referencePrice: '',
        contractAmount: '',
        note: '',
    })
    const [attributesForm, setAttributesForm] = useState<Record<string, string>>({})
    
    // Payment Dialog State
    const [showPaymentDialog, setShowPaymentDialog] = useState(false)
    const [selectedPaymentVendor, setSelectedPaymentVendor] = useState<Vendor | null>(null)
    const [isAddingPayment, setIsAddingPayment] = useState(false)
    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
    const [deletePaymentId, setDeletePaymentId] = useState<string | null>(null)
    const [paymentForm, setPaymentForm] = useState({ date: '', amount: '', note: '' })
    
    // Category List Pagination State
    const [visibleCategoriesCount, setVisibleCategoriesCount] = useState(5)

    // Lock body scroll when custom modals are open
    useEffect(() => {
        if (showCategoryDialog || showVendorDialog || showAttributesDialog || showVendorDetailDialog || showPaymentDialog || deleteCategoryId || deletePaymentId) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'auto'
        }
        return () => {
            document.body.style.overflow = 'auto'
        }
    }, [showCategoryDialog, showVendorDialog, showAttributesDialog, showVendorDetailDialog, showPaymentDialog, deleteCategoryId, deletePaymentId])

    // API mutations
    const createCategory = useCreateVendorCategory()
    const updateCategory = useUpdateVendorCategory()
    const deleteCategory = useDeleteVendorCategory()
    const createAttr = useCreateAttribute()
    const updateAttr = useUpdateAttribute()
    const deleteAttr = useDeleteAttribute()
    const createVendor = useCreateVendor()
    const updateVendor = useUpdateVendor()
    const deleteVendor = useDeleteVendor()
    const updateAttrValues = useUpdateVendorAttributeValues()
    const createPayment = useCreatePayment()
    const updatePayment = useUpdatePayment()
    const deletePayment = useDeletePayment()
    const selectVendor = useSelectVendor()
    const deselectVendor = useDeselectVendor()

    const activeCategory = useMemo(() => {
        if (categories.length === 0) return undefined
        return categories.find(c => c.id === activeCategoryId) || categories[0]
    }, [categories, activeCategoryId])

    // ==================== CATEGORY HANDLERS ====================

    const handleOpenCategoryDialog = (cat?: VendorCategory) => {
        if (cat) {
            setEditingCategory(cat)
            setCategoryName(cat.name)
            setCategoryAttributes([...cat.attributes])
        } else {
            setEditingCategory(null)
            setCategoryName('')
            setCategoryAttributes([])
        }
        setNewAttributeName('')
        setEditingAttributeId(null)
        setEditingAttributeName('')
        setShowCategoryDialog(true)
    }

    const handleAddCategoryAttribute = () => {
        if (!newAttributeName.trim()) return
        const newAttr: VendorAttribute = {
            id: -Date.now(), // Gunakan ID negatif untuk menandai atribut baru (belum ada di DB)
            name: newAttributeName.trim(),
            sortOrder: categoryAttributes.length + 1,
        }
        setCategoryAttributes(prev => [...prev, newAttr])
        setNewAttributeName('')
    }

    const handleRemoveCategoryAttribute = (attrId: number) => {
        setCategoryAttributes(prev => prev.filter(a => a.id !== attrId))
    }

    const handleStartEditAttribute = (attr: VendorAttribute) => {
        setEditingAttributeId(attr.id)
        setEditingAttributeName(attr.name)
    }

    const handleSaveEditAttribute = () => {
        if (!editingAttributeName.trim() || editingAttributeId === null) return
        setCategoryAttributes(prev => prev.map(a =>
            a.id === editingAttributeId ? { ...a, name: editingAttributeName.trim() } : a
        ))
        setEditingAttributeId(null)
        setEditingAttributeName('')
    }

    const handleCancelEditAttribute = () => {
        setEditingAttributeId(null)
        setEditingAttributeName('')
    }

    const handleMoveCategoryAttribute = (attrId: number, direction: 'up' | 'down') => {
        const sorted = [...categoryAttributes].sort((a, b) => a.sortOrder - b.sortOrder)
        const index = sorted.findIndex(a => a.id === attrId)
        if ((direction === 'up' && index <= 0) || (direction === 'down' && index >= sorted.length - 1)) return

        const swapIndex = direction === 'up' ? index - 1 : index + 1
        const temp = sorted[index].sortOrder
        sorted[index] = { ...sorted[index], sortOrder: sorted[swapIndex].sortOrder }
        sorted[swapIndex] = { ...sorted[swapIndex], sortOrder: temp }
        setCategoryAttributes(sorted)
    }

    const handleDragStart = (e: React.DragEvent, id: number) => {
        setDraggedAttributeId(id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id.toString());
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    const handleDrop = (e: React.DragEvent, targetId: number) => {
        e.preventDefault();
        if (!draggedAttributeId || draggedAttributeId === targetId) {
            setDraggedAttributeId(null);
            return;
        }

        const draggedAttr = categoryAttributes.find(a => a.id === draggedAttributeId);
        const targetAttr = categoryAttributes.find(a => a.id === targetId);
        if (!draggedAttr || !targetAttr) return;

        const sorted = [...categoryAttributes].sort((a, b) => a.sortOrder - b.sortOrder);
        const draggedIndex = sorted.findIndex(a => a.id === draggedAttributeId);
        const targetIndex = sorted.findIndex(a => a.id === targetId);

        sorted.splice(draggedIndex, 1);
        sorted.splice(targetIndex, 0, draggedAttr);

        const updated = sorted.map((attr, index) => ({
            ...attr,
            sortOrder: index
        }));

        setCategoryAttributes(updated);
        setDraggedAttributeId(null);
    }

    const handleDragEnd = () => {
        setDraggedAttributeId(null);
    }

    const handleSaveCategory = () => {
        if (!categoryName.trim()) return
        
        // Auto-save pending new attribute text if user forgot to click "+"
        const finalAttributes = [...categoryAttributes]
        if (newAttributeName.trim()) {
            finalAttributes.push({
                id: -Date.now(),
                name: newAttributeName.trim(),
                sortOrder: categoryAttributes.length + 1,
            })
            setNewAttributeName('')
        }

        if (editingCategory) {
            updateCategory.mutate(
                { id: editingCategory.id, data: { name: categoryName.trim() }, eventId: DEFAULT_EVENT_ID },
                { onSuccess: () => {
                    toast.success('Kategori berhasil diperbarui!')
                    const removedAttrIds = editingCategory.attributes
                        .filter(old => !finalAttributes.find(a => a.id === old.id))
                    removedAttrIds.forEach(a => {
                        if (a.id > 0) deleteAttr.mutate({ id: a.id, eventId: DEFAULT_EVENT_ID })
                    })
                    finalAttributes
                        .filter(a => a.id > 0)
                        .forEach(a => {
                            const oldAttr = editingCategory.attributes.find(o => o.id === a.id)
                            if (oldAttr && (oldAttr.name !== a.name || oldAttr.sortOrder !== a.sortOrder)) {
                                updateAttr.mutate({ id: a.id, data: { name: a.name, sort_order: a.sortOrder }, eventId: DEFAULT_EVENT_ID })
                            }
                        })
                    finalAttributes
                        .filter(a => a.id < 0)
                        .forEach(a => {
                            createAttr.mutate({ categoryId: editingCategory.id, data: { name: a.name, sort_order: a.sortOrder }, eventId: DEFAULT_EVENT_ID })
                        })
                }}
            )
        } else {
            createCategory.mutate(
                { event_id: DEFAULT_EVENT_ID, name: categoryName.trim() },
                { onSuccess: (resp) => {
                    toast.success('Kategori berhasil ditambahkan!')
                    const newId = resp.id
                    finalAttributes.forEach(a => {
                        createAttr.mutate({ categoryId: newId, data: { name: a.name, sort_order: a.sortOrder }, eventId: DEFAULT_EVENT_ID })
                    })
                    setActiveCategoryId(newId)
                }}
            )
        }
        setShowCategoryDialog(false)
        setCategoryName('')
        setCategoryAttributes([])
        setEditingCategory(null)
    }

    const confirmDeleteCategory = () => {
        if (!deleteCategoryId) return;
        deleteCategory.mutate({ id: deleteCategoryId, eventId: DEFAULT_EVENT_ID }, {
            onSuccess: () => toast.error('Kategori berhasil dihapus!', { icon: '🗑️' })
        });
        if (activeCategoryId === deleteCategoryId) {
            const remaining = categories.filter(c => c.id !== deleteCategoryId)
            if (remaining.length > 0) setActiveCategoryId(remaining[0].id)
            else setActiveCategoryId(null)
        }
        setDeleteCategoryId(null);
    }

    // ==================== VENDOR HANDLERS ====================

    const resetVendorForm = () => {
        setVendorForm({
            name: '',
            contactPerson: '',
            phoneNumber: '',
            instagram: '',
            address: '',
            referencePrice: '',
            contractAmount: '',
            note: '',
        })
    }

    const handleOpenVendorDialog = (vendor?: Vendor) => {
        if (vendor) {
            setEditingVendor(vendor)
            setVendorForm({
                name: vendor.name,
                contactPerson: vendor.contactPerson,
                phoneNumber: vendor.phoneNumber,
                instagram: vendor.instagram,
                address: vendor.address,
                referencePrice: vendor.referencePrice?.toString() || '',
                contractAmount: vendor.contractAmount?.toString() || '',
                note: vendor.note,
            })
        } else {
            setEditingVendor(null)
            resetVendorForm()
        }
        setShowVendorDialog(true)
    }

    const handleSaveVendor = () => {
        if (!vendorForm.name.trim() || !activeCategory) return

        if (editingVendor) {
            updateVendor.mutate({
                id: editingVendor.id,
                data: {
                    name: vendorForm.name.trim(),
                    contact_person: vendorForm.contactPerson || null,
                    phone_number: vendorForm.phoneNumber || null,
                    instagram: vendorForm.instagram || null,
                    address: vendorForm.address || null,
                    reference_price: vendorForm.referencePrice ? Number(vendorForm.referencePrice) : null,
                    contract_amount: vendorForm.contractAmount ? Number(vendorForm.contractAmount) : null,
                    note: vendorForm.note || null,
                },
                eventId: DEFAULT_EVENT_ID,
            }, {
                onSuccess: () => toast.success('Vendor berhasil diperbarui!')
            })
        } else {
            createVendor.mutate({
                categoryId: activeCategory.id,
                data: {
                    name: vendorForm.name.trim(),
                    contact_person: vendorForm.contactPerson || null,
                    phone_number: vendorForm.phoneNumber || null,
                    instagram: vendorForm.instagram || null,
                    address: vendorForm.address || null,
                    reference_price: vendorForm.referencePrice ? Number(vendorForm.referencePrice) : null,
                    contract_amount: vendorForm.contractAmount ? Number(vendorForm.contractAmount) : null,
                    note: vendorForm.note || null,
                    attribute_values: {},
                },
                eventId: DEFAULT_EVENT_ID,
            }, {
                onSuccess: () => toast.success('Vendor berhasil ditambahkan!')
            })
        }
        setShowVendorDialog(false)
        resetVendorForm()
        setEditingVendor(null)
    }

    const handleDeleteVendor = (vendorId: string) => {
        deleteVendor.mutate({ id: vendorId, eventId: DEFAULT_EVENT_ID }, {
            onSuccess: () => toast.error('Vendor berhasil dihapus!', { icon: '🗑️' })
        })
    }

    const handleOpenAttributesDialog = (vendor: Vendor) => {
        setEvaluatingVendor(vendor)
        setAttributesForm({ ...vendor.attributeValues })
        setShowAttributesDialog(true)
    }

    const handleSaveAttributes = () => {
        if (!evaluatingVendor || !activeCategory) return
        const attrValues: Record<number, string | null> = {}
        activeCategory.attributes.forEach(a => {
            attrValues[a.id] = attributesForm[a.id] || null
        })
        updateAttrValues.mutate({
            vendorId: evaluatingVendor.id,
            data: { values: attrValues },
            eventId: DEFAULT_EVENT_ID,
        }, {
            onSuccess: () => {
                toast.success('Atribut berhasil diperbarui!')
                setShowAttributesDialog(false)
            }
        })
    }

    const handleSelectVendor = (vendorId: string) => {
        if (!activeCategory) return
        if (activeCategory.selectedVendorId === vendorId) {
            deselectVendor.mutate({ categoryId: activeCategory.id, eventId: DEFAULT_EVENT_ID }, {
                onSuccess: () => toast.error('Pilihan vendor dibatalkan!', { icon: '🗑️' }),
                onError: (err: any) => toast.error(err.message || 'Gagal membatalkan pilihan')
            })
        } else {
            selectVendor.mutate({ categoryId: activeCategory.id, vendorId, eventId: DEFAULT_EVENT_ID }, {
                onSuccess: () => toast.success('Vendor berhasil dipilih!'),
                onError: (err: any) => toast.error(err.message || 'Gagal memilih vendor')
            })
        }
    }

    const handleOpenPaymentDialog = (vendor: Vendor) => {
        setSelectedPaymentVendor(vendor)
        setIsAddingPayment(false)
        setEditingPaymentId(null)
        setPaymentForm({ date: '', amount: '', note: '' })
        setShowPaymentDialog(true)
    }

    const handleSavePayment = () => {
        if (!selectedPaymentVendor || !paymentForm.amount || !activeCategory) return

        const paymentAmount = parseInt(paymentForm.amount)
        const paymentDate = paymentForm.date || new Date().toISOString().split('T')[0]
        const paymentNote = paymentForm.note || null

        if (editingPaymentId) {
            const paymentIdNum = parseInt(editingPaymentId);
            if (!isNaN(paymentIdNum)) {
                updatePayment.mutate({
                    id: paymentIdNum,
                    data: {
                        date: paymentDate,
                        amount: paymentAmount,
                        note: paymentNote,
                    }
                }, {
                    onSuccess: () => toast.success('Pembayaran berhasil diperbarui!')
                })
            }
        } else {
            createPayment.mutate({
                vendorId: selectedPaymentVendor.id,
                data: {
                    date: paymentDate,
                    amount: paymentAmount,
                    note: paymentNote,
                },
                eventId: DEFAULT_EVENT_ID,
            }, {
                onSuccess: () => toast.success('Pembayaran berhasil ditambahkan!')
            })
        }
        setIsAddingPayment(false)
        setPaymentForm({ date: '', amount: '', note: '' })
    }

    const handleEditPayment = (payment: VendorPayment) => {
        setPaymentForm({
            date: payment.date,
            amount: payment.amount.toString(),
            note: payment.note || ''
        })
        setEditingPaymentId(payment.id)
        setIsAddingPayment(true)
    }

    const handleDeletePayment = (paymentId: string) => {
        setDeletePaymentId(paymentId);
    }

    const confirmDeletePayment = () => {
        if (!deletePaymentId) return;
        const paymentIdNum = parseInt(deletePaymentId);
        if (!isNaN(paymentIdNum)) {
            deletePayment.mutate(paymentIdNum, {
                onSuccess: () => toast.error('Pembayaran berhasil dihapus!', { icon: '🗑️' })
            })
        }
        setDeletePaymentId(null);
    }



    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Memuat data vendor...</p>
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <p className="text-sm text-muted-foreground">Gagal memuat data vendor.</p>
                    <Button variant="outline" size="sm" onClick={() => refetch()}>Coba Lagi</Button>
                </div>
            </div>
        )
    }

    // ==================== RENDER ====================

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-background text-foreground pb-32 relative font-sans transition-colors duration-300">
                {/* Header Kategori */}
                <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-primary/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] px-5 py-4 flex items-center justify-between mb-8 transition-all">
                    {activeCategoryId === null ? (
                        <Link
                            href="/admin"
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                    ) : (
                        <button
                            onClick={() => setActiveCategoryId(null)}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                    <h1 className="text-[18px] font-extrabold tracking-tight absolute left-1/2 -translate-x-1/2 text-foreground">
                        {activeCategoryId === null ? "Vendor" : categories.find(c => c.id === activeCategoryId)?.name || "Vendor"}
                    </h1>
                    <div className="w-10 h-10 shrink-0">
                    </div>
                </div>

                <div className="px-5 space-y-6">
                    {activeCategoryId === null ? (
                        <>
                            {categories.length === 0 ? (
                                <div className="w-full flex-1 flex flex-col items-center justify-center space-y-6 py-12">
                                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Store className="w-10 h-10 text-primary" />
                                    </div>
                                    <div className="text-center w-full px-4">
                                        <h2 className="text-[19px] font-bold tracking-tight mb-2 text-foreground">Belum ada kategori</h2>
                                        <p className="text-[13px] text-muted-foreground leading-snug">
                                            Buat kategori vendor pertama Anda seperti Fotografer, Catering, atau Venue.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {categories.slice(0, visibleCategoriesCount).map(cat => {
                                            const selectedVendor = cat.vendors.find(v => v.id === cat.selectedVendorId);
                                            const dealAmount = selectedVendor?.contractAmount ?? selectedVendor?.referencePrice ?? 0;
                                            const totalPaid = selectedVendor?.payments?.reduce((s, p) => s + p.amount, 0) || 0;
                                            const isPaid = selectedVendor?.paymentStatus === 'paid';

                                            let waLink = '';
                                            if (selectedVendor?.phoneNumber) {
                                                const waNumber = selectedVendor.phoneNumber.replace(/\D/g, '');
                                                if (waNumber) {
                                                    waLink = `https://wa.me/${waNumber.startsWith('0') ? '62' + waNumber.slice(1) : waNumber}`;
                                                }
                                            }

                                            return (
                                                <div 
                                                    key={cat.id}
                                                    onClick={() => {
                                                        setActiveCategoryId(cat.id);
                                                    }}
                                                    className="bg-card rounded-[24px] p-5 shadow-sm border border-border/50 relative overflow-hidden cursor-pointer active:scale-95 transition-all hover:border-primary/50 flex flex-col group"
                                                >
                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                                    </div>

                                                    {/* Header: Name and Badges */}
                                                    <div className="flex justify-between items-start mb-4 pr-6">
                                                        <div className="w-full">
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <h3 className="font-bold text-[16px] text-foreground tracking-tight">
                                                                    {cat.name}
                                                                </h3>
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5 mb-2.5">
                                                                    <span className="bg-primary/15 text-primary font-semibold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                                                                        {cat.vendors.length} Kandidat
                                                                    </span>
                                                                    <span className="text-muted-foreground/30">&bull;</span>
                                                                    <span
                                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                                                            isPaid
                                                                                ? "bg-green-500/10 text-green-600"
                                                                                : selectedVendor
                                                                                    ? "bg-amber-500/10 text-amber-600"
                                                                                    : "bg-secondary text-secondary-foreground"
                                                                        }`}
                                                                    >
                                                                        {isPaid
                                                                            ? "Lunas"
                                                                            : selectedVendor
                                                                                ? "Belum Lunas"
                                                                                : "Belum Deal"}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                                                                    <Table2 className="w-3.5 h-3.5" />
                                                                    {cat.attributes.length === 0 ? "Belum ada atribut perbandingan" : `${cat.attributes.length} Atribut Perbandingan`}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Content: Value box */}
                                                    {selectedVendor ? (
                                                        <div className="p-4 rounded-2xl flex flex-col bg-primary/5 border border-primary/10">
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                                    <CheckCircle2 className="w-5 h-5" />
                                                                </div>
                                                                <div className="flex-1 min-w-0 pt-0.5">
                                                                    <p className="text-[9px] font-medium uppercase tracking-wider text-primary/70 mb-1">Vendor Terpilih</p>
                                                                    <div className="font-semibold text-[15px] text-foreground leading-tight break-words pr-2">{selectedVendor.name}</div>
                                                                    {waLink && (
                                                                        <a 
                                                                            href={waLink} 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="inline-flex items-center gap-1.5 mt-2.5 text-[11px] font-bold text-green-700 dark:text-green-400 bg-green-500/15 hover:bg-green-500/25 px-2.5 py-1.5 rounded-md w-fit transition-all active:scale-95"
                                                                            title={`Hubungi ${selectedVendor.contactPerson || 'Vendor'}`}
                                                                        >
                                                                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                                                                            </svg>
                                                                            <span className="truncate">WhatsApp</span>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="mt-4 pt-3 border-t border-primary/10 flex flex-col gap-1.5">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                                                        Progres Pembayaran
                                                                    </p>
                                                                    <p className="font-bold text-[12px] text-foreground">
                                                                        {dealAmount > 0 ? Math.round((totalPaid / dealAmount) * 100) : 0}%
                                                                    </p>
                                                                </div>
                                                                <Progress value={dealAmount > 0 ? (totalPaid / dealAmount) * 100 : 0} className="h-1.5 bg-primary/10" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-3 pr-10">
                                                            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                                                                <AlertCircle className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-medium uppercase tracking-wider text-amber-600/70 mb-0.5">Status</p>
                                                                <div className="font-semibold text-[13px] text-amber-700">Belum ada vendor terpilih</div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Mobile App Style Actions Footer */}
                                                    <div className="grid grid-cols-3 mt-4 pt-3 border-t border-border/40 divide-x divide-border/40">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveCategoryId(cat.id);
                                                            }}
                                                            className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors active:bg-primary/10 rounded-l-md"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> Detail
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenCategoryDialog(cat);
                                                            }}
                                                            className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors active:bg-muted/30"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" /> Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteCategoryId(cat.id);
                                                            }}
                                                            className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-destructive transition-colors active:bg-destructive/10 rounded-r-md"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* Load More Button for Categories */}
                                    {visibleCategoriesCount < categories.length && (
                                        <div className="flex justify-center mt-6 mb-4">
                                            <button
                                                onClick={() => setVisibleCategoriesCount(prev => prev + 5)}
                                                className="px-6 py-2 bg-primary text-primary-foreground rounded-full text-[13px] font-medium shadow-sm border border-primary transition-opacity cursor-pointer active:scale-95"
                                            >
                                                Tampilkan Lainnya
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        (() => {
                            const activeCat = categories.find(c => c.id === activeCategoryId);
                            if (!activeCat) return null;
                            return (
                                <CategoryContent
                                    category={activeCat}
                                    onEditVendor={(v) => handleOpenVendorDialog(v)}
                                    onDeleteVendor={(id) => handleDeleteVendor(id)}
                                    onSelectVendor={(id) => handleSelectVendor(id)}
                                    onOpenAttributesDialog={handleOpenAttributesDialog}
                                    onViewVendor={(v) => {
                                        setViewingVendor(v)
                                        setShowVendorDetailDialog(true)
                                    }}
                                    onOpenPaymentDialog={handleOpenPaymentDialog}
                                />
                            );
                        })()
                    )}
                </div>

                {/* ==================== DIALOGS ==================== */}

                {/* Delete Category Confirmation */}
                <AlertDialog
                    open={!!deleteCategoryId}
                    onOpenChange={(open) => !open && setDeleteCategoryId(null)}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus kategori ini? Semua atribut di dalamnya juga akan terhapus. Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmDeleteCategory}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Hapus
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Category Dialog — includes inline attribute management */}
                {showCategoryDialog && (
                    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowCategoryDialog(false)}
                        ></div>
                        <div className="relative bg-background rounded-[2rem] w-full max-w-[500px] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85dvh] flex flex-col">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-5 shrink-0 relative">
                                <h2 className="text-[15px] font-bold w-full text-center">
                                    {editingCategory ? 'Edit Kategori' : 'Kategori Baru'}
                                </h2>
                                <button
                                    onClick={() => setShowCategoryDialog(false)}
                                    className="absolute right-0 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {/* Body */}
                            <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 space-y-5 no-scrollbar">
                                {/* Category Name */}
                                <div className="space-y-1.5">
                                    <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
                                        Nama Kategori
                                    </Label>
                                    <Input
                                        placeholder="Cth: Fotografer"
                                        value={categoryName}
                                        onChange={(e) => setCategoryName(e.target.value)}
                                        className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                                    />
                                </div>

                                {/* Attributes Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between pl-1">
                                        <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">
                                            Atribut Perbandingan
                                        </Label>
                                        <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{categoryAttributes.length} atribut</span>
                                    </div>

                                    {/* Add new attribute */}
                                    <div className="flex gap-2.5">
                                        <Input
                                            placeholder="Cth: Harga, Durasi"
                                            value={newAttributeName}
                                            onChange={(e) => setNewAttributeName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddCategoryAttribute()}
                                            className="min-w-0 h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddCategoryAttribute}
                                            disabled={!newAttributeName.trim()}
                                            className="shrink-0 h-11 px-4 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors rounded-xl text-[13px] font-bold flex items-center gap-1.5 shadow-sm"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span className="hidden sm:inline">Tambah</span>
                                        </button>
                                    </div>

                                    {/* Attribute list */}
                                    {categoryAttributes.length > 0 ? (
                                        <div className="space-y-2">
                                            {categoryAttributes
                                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                                .map((attr, index) => (
                                                    <div
                                                        key={attr.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, attr.id)}
                                                        onDragOver={handleDragOver}
                                                        onDrop={(e) => handleDrop(e, attr.id)}
                                                        onDragEnd={handleDragEnd}
                                                        className={cn(
                                                            "flex items-center gap-2 rounded-xl border border-border/50 px-3 py-2 transition-colors min-w-0 group",
                                                            draggedAttributeId === attr.id ? "opacity-40 bg-muted/30" : "bg-muted/10 hover:bg-muted/30",
                                                            "cursor-grab active:cursor-grabbing"
                                                        )}
                                                    >
                                                        <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 shrink-0 transition-colors" />
                                                        {editingAttributeId === attr.id ? (
                                                            <>
                                                                <Input
                                                                    className="h-8 text-[13px] flex-1 min-w-0 bg-background rounded-lg"
                                                                    value={editingAttributeName}
                                                                    onChange={(e) => setEditingAttributeName(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleSaveEditAttribute()
                                                                        if (e.key === 'Escape') handleCancelEditAttribute()
                                                                    }}
                                                                    autoFocus
                                                                />
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <button type="button" className="h-7 w-7 flex items-center justify-center rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors" onClick={handleSaveEditAttribute} title="Simpan">
                                                                        <Check className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <button type="button" className="h-7 w-7 flex items-center justify-center rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors" onClick={handleCancelEditAttribute} title="Batal">
                                                                        <X className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="flex-1 text-[13px] font-semibold truncate min-w-0">{attr.name}</span>
                                                                <div className="flex items-center shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                                        disabled={index === 0}
                                                                        onClick={() => handleMoveCategoryAttribute(attr.id, 'up')}
                                                                        title="Naik"
                                                                    >
                                                                        <ArrowUpDown className="h-3.5 w-3.5 rotate-180" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                                                        onClick={() => handleStartEditAttribute(attr)}
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                                        onClick={() => handleRemoveCategoryAttribute(attr.id)}
                                                                        title="Hapus"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="py-6 flex flex-col items-center justify-center text-center border border-dashed border-border/60 rounded-xl bg-muted/10">
                                            <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center mb-2">
                                                <ListPlus className="w-5 h-5 text-muted-foreground/60" />
                                            </div>
                                            <p className="text-[13px] font-medium text-foreground mb-1">Belum ada atribut</p>
                                            <p className="text-[11px] text-muted-foreground max-w-[200px]">Tambahkan atribut (Cth: Harga, Durasi) untuk perbandingan vendor.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Footer */}
                            <div className="pt-3 shrink-0 mt-3 flex flex-col gap-2.5 border-t border-border/40">
                                <button
                                    onClick={handleSaveCategory}
                                    disabled={!categoryName.trim()}
                                    className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-[14px] font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Vendor Form Dialog (Mobile App Bottom Sheet Style) */}
                {showVendorDialog && (
                    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowVendorDialog(false)}
                        ></div>
                        <div className="relative bg-background rounded-[2rem] w-full max-w-[500px] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85dvh] flex flex-col">
                            <div className="flex items-center justify-between mb-5 shrink-0 relative">
                                <h2 className="text-[15px] font-bold w-full text-center">
                                    {editingVendor ? 'Edit Vendor' : 'Tambah Vendor'}
                                </h2>
                                <button
                                    onClick={() => setShowVendorDialog(false)}
                                    className="absolute right-0 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 space-y-6 no-scrollbar">
                                {/* Basic Info */}
                                <div className="space-y-3">
                                    <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Informasi Dasar</Label>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[12px] pl-1 font-medium text-foreground/80">Nama Vendor *</Label>
                                            <Input
                                                placeholder="Nama bisnis vendor"
                                                value={vendorForm.name}
                                                onChange={(e) => setVendorForm(prev => ({ ...prev, name: e.target.value }))}
                                                className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-[12px] pl-1 font-medium text-foreground/80">Contact Person</Label>
                                                <Input
                                                    placeholder="Nama PIC"
                                                    value={vendorForm.contactPerson}
                                                    onChange={(e) => setVendorForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                                                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[12px] pl-1 font-medium text-foreground/80">No. WhatsApp</Label>
                                                <Input
                                                    placeholder="628..."
                                                    value={vendorForm.phoneNumber}
                                                    onChange={(e) => {
                                                        const numericVal = e.target.value.replace(/\D/g, '')
                                                        setVendorForm(prev => ({ ...prev, phoneNumber: numericVal }))
                                                    }}
                                                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[12px] pl-1 font-medium text-foreground/80">Username IG</Label>
                                            <Input
                                                placeholder="Tanpa @"
                                                value={vendorForm.instagram}
                                                onChange={(e) => setVendorForm(prev => ({ ...prev, instagram: e.target.value.replace(/@/g, '') }))}
                                                className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[12px] pl-1 font-medium text-foreground/80">Alamat</Label>
                                            <Textarea
                                                placeholder="Alamat lengkap vendor"
                                                value={vendorForm.address}
                                                onChange={(e) => setVendorForm(prev => ({ ...prev, address: e.target.value }))}
                                                className="rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none resize-none"
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contract Info */}
                                <div className="space-y-3">
                                    <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Kesepakatan Harga</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <Label className="text-[12px] pl-1 font-medium text-foreground/80">Harga Awal</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[13px] font-medium">Rp</span>
                                                <Input
                                                    type="text"
                                                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none pl-9"
                                                    placeholder="0"
                                                    value={vendorForm.referencePrice ? parseInt(vendorForm.referencePrice).toLocaleString('id-ID') : ''}
                                                    onChange={(e) => {
                                                        const numericVal = e.target.value.replace(/\D/g, '')
                                                        setVendorForm(prev => ({ ...prev, referencePrice: numericVal }))
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[12px] pl-1 font-medium text-foreground/80">Harga Deal</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[13px] font-medium">Rp</span>
                                                <Input
                                                    type="text"
                                                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none pl-9"
                                                    placeholder="0"
                                                    value={vendorForm.contractAmount ? parseInt(vendorForm.contractAmount).toLocaleString('id-ID') : ''}
                                                    onChange={(e) => {
                                                        const numericVal = e.target.value.replace(/\D/g, '')
                                                        setVendorForm(prev => ({ ...prev, contractAmount: numericVal }))
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Note */}
                                <div className="space-y-1.5">
                                    <Label className="text-[12px] pl-1 font-medium text-foreground/80">Catatan</Label>
                                    <Textarea
                                        placeholder="Catatan tambahan tentang vendor ini..."
                                        value={vendorForm.note}
                                        onChange={(e) => setVendorForm(prev => ({ ...prev, note: e.target.value }))}
                                        className="rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none resize-none"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-4 mt-2 shrink-0 border-t border-border/40">
                                <button
                                    onClick={handleSaveVendor}
                                    disabled={!vendorForm.name.trim()}
                                    className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50 transition-colors shadow-sm hover:bg-primary/90 flex items-center justify-center gap-2 text-[14px]"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Attributes Dialog (Mobile App Bottom Sheet Style) */}
                {showAttributesDialog && evaluatingVendor && activeCategory && (
                    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowAttributesDialog(false)}
                        ></div>
                        <div className="relative bg-background rounded-[2rem] w-full max-w-[500px] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85dvh] flex flex-col">
                            <div className="flex items-center justify-between mb-5 shrink-0 relative">
                                <h2 className="text-[15px] font-bold w-full text-center">
                                    Bandingkan Nilai
                                </h2>
                                <button
                                    onClick={() => setShowAttributesDialog(false)}
                                    className="absolute right-0 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 space-y-4 no-scrollbar">
                                <div className="text-center mb-6">
                                    <h3 className="font-bold text-lg text-foreground">{evaluatingVendor.name}</h3>
                                    <p className="text-xs text-muted-foreground mt-1 px-4">Isi nilai untuk setiap atribut perbandingan agar vendor ini bisa dinilai dengan vendor lain.</p>
                                </div>
                                <div className="space-y-4">
                                    {activeCategory.attributes
                                        .sort((a, b) => a.sortOrder - b.sortOrder)
                                        .map(attr => (
                                            <div key={attr.id} className="space-y-1.5 bg-muted/20 p-3 rounded-2xl border border-border/50">
                                                <Label className="text-[13px] font-bold text-foreground pl-1 block mb-1">{attr.name}</Label>
                                                <Input
                                                    placeholder={`Ketik nilai / spek / fasilitas...`}
                                                    value={attributesForm[attr.id] || ''}
                                                    onChange={(e) => setAttributesForm(prev => ({
                                                        ...prev,
                                                        [attr.id]: e.target.value
                                                    }))}
                                                    className="h-11 rounded-xl bg-background border-border/60 text-[13px] focus-visible:ring-primary shadow-sm"
                                                />
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="pt-4 mt-2 shrink-0 border-t border-border/40">
                                <button
                                    onClick={handleSaveAttributes}
                                    className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl transition-colors shadow-sm hover:bg-primary/90 flex items-center justify-center gap-2 text-[14px]"
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Vendor Detail Dialog (Mobile App Bottom Sheet Style) */}
                {showVendorDetailDialog && viewingVendor && (
                    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                            onClick={() => setShowVendorDetailDialog(false)}
                        ></div>
                        <div className="relative bg-background rounded-[2rem] w-full max-w-[500px] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85dvh] flex flex-col">
                            <div className="flex items-center justify-between mb-5 shrink-0 relative">
                                <h2 className="text-[15px] font-bold w-full text-center">
                                    Detail Vendor
                                </h2>
                                <button
                                    onClick={() => setShowVendorDetailDialog(false)}
                                    className="absolute right-0 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 space-y-6 no-scrollbar">
                                <div className="space-y-1 mb-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-xl text-foreground tracking-tight">{viewingVendor.name}</h3>
                                        {activeCategory?.selectedVendorId === viewingVendor.id && (
                                            <span className="shrink-0 bg-primary/15 text-primary font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                                                Terpilih
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Detail informasi vendor pada kategori {activeCategory?.name}</p>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-3">
                                    <div className="bg-muted/10 rounded-2xl p-4 border border-border/40">
                                        <div className="grid grid-cols-2 gap-4">
                                            {viewingVendor.contactPerson && (
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Contact Person</p>
                                                    <p className="text-[13px] font-medium text-foreground">{viewingVendor.contactPerson}</p>
                                                </div>
                                            )}
                                            {viewingVendor.phoneNumber && (
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">WhatsApp</p>
                                                    <a href={`https://wa.me/${viewingVendor.phoneNumber}`} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-emerald-600 hover:underline">
                                                        {viewingVendor.phoneNumber}
                                                    </a>
                                                </div>
                                            )}
                                            {viewingVendor.instagram && (
                                                <div>
                                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Instagram</p>
                                                    <a href={`https://instagram.com/${viewingVendor.instagram}`} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-foreground hover:underline">
                                                        @{viewingVendor.instagram}
                                                    </a>
                                                </div>
                                            )}
                                            {viewingVendor.address && (
                                                <div className="col-span-2 pt-2 border-t border-border/30 mt-1">
                                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Alamat</p>
                                                    <p className="text-[13px] leading-relaxed text-foreground">{viewingVendor.address}</p>
                                                </div>
                                            )}
                                            {!viewingVendor.contactPerson && !viewingVendor.phoneNumber && !viewingVendor.instagram && !viewingVendor.address && (
                                                <p className="text-xs text-muted-foreground italic col-span-2">Belum ada informasi kontak.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Contract Info */}
                                <div className="space-y-3">
                                    <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Harga & Status</Label>
                                    <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex items-center justify-between">
                                        <div>
                                            {viewingVendor.referencePrice && viewingVendor.contractAmount && viewingVendor.referencePrice !== viewingVendor.contractAmount && (
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Harga Awal:</span>
                                                    <span className="text-[11px] font-medium text-muted-foreground line-through decoration-muted-foreground/50">{formatCurrency(viewingVendor.referencePrice)}</span>
                                                </div>
                                            )}
                                            <p className="text-[16px] font-black text-foreground tracking-tight">{formatCurrency(viewingVendor.contractAmount ?? viewingVendor.referencePrice ?? null)}</p>
                                        </div>
                                        <PaymentStatusBadge status={viewingVendor.paymentStatus} />
                                    </div>
                                </div>

                                {/* Attributes */}
                                {activeCategory && activeCategory.attributes.length > 0 && (
                                    <div className="space-y-3">
                                        <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Nilai Perbandingan</Label>
                                        <div className="rounded-2xl border border-border/40 overflow-hidden divide-y divide-border/40">
                                            {activeCategory.attributes
                                                .sort((a, b) => a.sortOrder - b.sortOrder)
                                                .map((attr) => (
                                                    <div key={attr.id} className="flex justify-between px-4 py-3 bg-muted/10">
                                                        <span className="text-[13px] text-muted-foreground font-medium">{attr.name}</span>
                                                        <span className="text-[13px] font-bold text-foreground text-right max-w-[60%] whitespace-pre-wrap break-words">
                                                            {viewingVendor.attributeValues[attr.id] || '-'}
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Note */}
                                {viewingVendor.note && (
                                    <div className="space-y-3">
                                        <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Catatan Tambahan</Label>
                                        <div className="text-[13px] text-muted-foreground bg-muted/10 border border-border/40 rounded-2xl p-4 leading-relaxed whitespace-pre-wrap">
                                            {viewingVendor.note}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Management Dialog */}
                <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                    <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-[500px] bottom-4 sm:bottom-auto mx-auto rounded-[24px] sm:rounded-[24px] max-h-[85vh] overflow-y-auto">
                        <DialogHeader className="mb-6">
                            <DialogTitle className="text-[19px] font-bold tracking-tight">Catatan Pembayaran</DialogTitle>
                            <DialogDescription className="text-[13px] text-muted-foreground/80">
                                {selectedPaymentVendor?.name}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedPaymentVendor && (
                            <div className="space-y-8">
                                {/* Wallet Style Summary Card */}
                                <div className="rounded-[20px] bg-primary/10 p-5 border border-primary/20 relative overflow-hidden">
                                    <div className="relative z-10 space-y-5">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">Sisa Tagihan</p>
                                                <p className="text-[28px] font-black text-foreground tracking-tight leading-none">
                                                    {formatCurrency((selectedPaymentVendor.contractAmount ?? selectedPaymentVendor.referencePrice ?? 0) - (selectedPaymentVendor.payments?.reduce((s, p) => s + p.amount, 0) || 0))}
                                                </p>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                                <CreditCard className="w-5 h-5 text-primary" />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-primary/15 pt-4">
                                            <span className="text-[12px] font-semibold text-muted-foreground">Total Tagihan</span>
                                            <span className="text-[14px] font-bold text-foreground">
                                                {formatCurrency(selectedPaymentVendor.contractAmount ?? selectedPaymentVendor.referencePrice ?? null)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment History Timeline */}
                                <div>
                                    <h4 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-5">Riwayat Transaksi</h4>
                                    {selectedPaymentVendor.payments && selectedPaymentVendor.payments.length > 0 ? (
                                        <div className="space-y-0 relative ml-2">
                                            <div className="absolute left-[7px] top-3 bottom-3 w-[2px] bg-border/60" />
                                            {[...selectedPaymentVendor.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(payment => (
                                                <div key={payment.id} className="relative pl-8 pb-6 last:pb-0">
                                                    <div className="absolute left-0 top-1.5 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center ring-4 ring-background">
                                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                                    </div>
                                                    <div className="flex flex-col gap-1 bg-muted/30 p-4 rounded-2xl border border-border/50 group">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="space-y-1">
                                                                <span className="block text-[15px] font-bold text-foreground leading-none">{formatCurrency(payment.amount)}</span>
                                                                <span className="block text-[11px] text-muted-foreground font-medium">
                                                                    {new Date(payment.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                                <button 
                                                                    onClick={() => handleEditPayment(payment)}
                                                                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeletePayment(payment.id)}
                                                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                                                    title="Hapus"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        {payment.note && (
                                                            <p className="text-[13px] text-muted-foreground mt-2 pt-2 border-t border-border/50">{payment.note}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 px-4 text-[13px] text-muted-foreground border-2 border-dashed border-border/60 rounded-[20px] bg-muted/10">
                                            Belum ada riwayat pembayaran.
                                        </div>
                                    )}
                                </div>

                                {/* Add Payment Form */}
                                {isAddingPayment ? (
                                    <div className="rounded-[20px] border border-border/60 bg-muted/10 p-5 mt-6 mb-4">
                                        <h4 className="text-[15px] font-bold mb-4">{editingPaymentId ? "Edit Pembayaran" : "Catat Pembayaran Baru"}</h4>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-[12px] font-bold text-muted-foreground">Nominal (Rp)</Label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-bold text-[15px]">Rp</span>
                                                    <Input 
                                                        type="text" 
                                                        className="pl-11 h-12 text-[16px] font-bold rounded-xl bg-background border-border/50 focus-visible:ring-primary"
                                                        placeholder="0" 
                                                        value={paymentForm.amount ? parseInt(paymentForm.amount).toLocaleString('id-ID') : ''}
                                                        onChange={(e) => {
                                                            const numericVal = e.target.value.replace(/\D/g, '')
                                                            setPaymentForm(prev => ({ ...prev, amount: numericVal }))
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[12px] font-bold text-muted-foreground">Tanggal</Label>
                                                <Input 
                                                    type="date" 
                                                    className="h-12 rounded-xl bg-background border-border/50 focus-visible:ring-primary"
                                                    value={paymentForm.date}
                                                    onChange={(e) => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[12px] font-bold text-muted-foreground">Catatan / Keterangan</Label>
                                                <Input 
                                                    className="h-12 rounded-xl bg-background border-border/50 focus-visible:ring-primary"
                                                    placeholder="Contoh: DP Termin 1" 
                                                    value={paymentForm.note}
                                                    onChange={(e) => setPaymentForm(prev => ({ ...prev, note: e.target.value }))}
                                                />
                                            </div>
                                            <div className="flex items-center gap-3 pt-3">
                                                <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => { setIsAddingPayment(false); setEditingPaymentId(null); setPaymentForm({ date: '', amount: '', note: '' }) }}>Batal</Button>
                                                <Button className="flex-1 h-12 rounded-xl font-bold" onClick={handleSavePayment}>Simpan</Button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pt-2">
                                        <Button 
                                            className="w-full h-12 rounded-xl font-bold text-[14px]" 
                                            onClick={() => setIsAddingPayment(true)}
                                        >
                                            <Plus className="h-5 w-5 mr-2" />
                                            Catat Pembayaran Baru
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Delete Payment AlertDialog */}
                        <AlertDialog
                            open={!!deletePaymentId}
                            onOpenChange={(open) => !open && setDeletePaymentId(null)}
                        >
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Catatan Pembayaran?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Apakah Anda yakin ingin menghapus catatan pembayaran ini? Tindakan ini tidak dapat dibatalkan.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={confirmDeletePayment}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Hapus
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DialogContent>
                </Dialog>

                {/* FAB (Floating Action Button) */}
                <button 
                    onClick={() => activeCategoryId ? handleOpenVendorDialog() : handleOpenCategoryDialog()}
                    className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 hover:-translate-y-1 transition-all active:scale-95"
                    title={activeCategoryId ? "Tambah Vendor" : "Kategori Baru"}
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>
        </TooltipProvider>
    )
}

// ==================== CATEGORY CONTENT ====================

interface CategoryContentProps {
    category: VendorCategory
    onEditVendor: (v: Vendor) => void
    onDeleteVendor: (id: string) => void
    onSelectVendor: (id: string) => void
    onViewVendor: (v: Vendor) => void
    onOpenPaymentDialog: (v: Vendor) => void
    onOpenAttributesDialog: (v: Vendor) => void
}

function CategoryContent({
    category,
    onEditVendor,
    onDeleteVendor,
    onSelectVendor,
    onViewVendor,
    onOpenPaymentDialog,
    onOpenAttributesDialog,
}: CategoryContentProps) {
    const selectedVendor = category.vendors.find(v => v.id === category.selectedVendorId)

    const totalPaid = selectedVendor?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0
    const dealAmount = selectedVendor?.contractAmount ?? selectedVendor?.referencePrice ?? 0
    const progressPercent = dealAmount > 0 ? Math.min(100, Math.round((totalPaid / dealAmount) * 100)) : 0

    const [visibleVendorsCount, setVisibleVendorsCount] = useState(6)
    const vendorsToDisplay = category.vendors.slice(0, visibleVendorsCount)
    const hasMore = visibleVendorsCount < category.vendors.length

    return (
        <div className="space-y-4">
            {/* Content Body */}

            {/* Selected Vendor Banner */}
            {selectedVendor && (
                <div className="relative rounded-[24px] border border-primary/20 bg-primary/10 overflow-hidden">
                    <div className="flex flex-col gap-4 p-4">
                        {/* Top row: name + progress */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 shrink-0">
                                <Check strokeWidth={3} className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Vendor Terpilih</p>
                                <p className="text-[16px] font-bold truncate text-foreground tracking-tight leading-tight">
                                    {selectedVendor.name}
                                </p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[18px] font-bold text-foreground leading-none">{progressPercent}%</p>
                                <p className="text-[10px] text-foreground/60 mt-0.5">terbayar</p>
                            </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="space-y-1.5">
                            <Progress value={progressPercent} className="h-2 bg-primary/20 rounded-full" />
                            <p className="text-[11px] text-foreground/60">
                                <span className="font-semibold text-foreground">{formatCurrency(totalPaid)}</span> / {formatCurrency(dealAmount)}
                            </p>
                        </div>

                        {/* Payment Button */}
                        <button 
                            onClick={() => onOpenPaymentDialog(selectedVendor)} 
                            className="w-full h-10 flex items-center justify-center gap-2 rounded-[14px] bg-primary/15 hover:bg-primary/25 text-[13px] font-bold text-primary transition-colors active:scale-[0.98]"
                        >
                            {selectedVendor.paymentStatus === 'paid' ? (
                                <><CheckCircle2 className="h-4 w-4" /> Sudah Lunas</>
                            ) : (
                                <><CreditCard className="h-4 w-4" /> Catatan Pembayaran</>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Separator between selected vendor and vendor list */}
            {selectedVendor && category.vendors.length > 0 && (
                <hr className="border-border/40" />
            )}

            {/* Content */}
            {category.vendors.length === 0 ? (
                <div className="w-full flex-1 flex flex-col items-center justify-center space-y-6 py-12">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                        <Store className="w-10 h-10 text-primary" />
                    </div>
                    <div className="text-center w-full px-4">
                        <h2 className="text-[19px] font-bold tracking-tight mb-2 text-foreground">Belum ada vendor</h2>
                        <p className="text-[13px] text-muted-foreground leading-snug">
                            Anda belum menambahkan kandidat vendor untuk kategori ini.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Comparison Table */}
                    {category.vendors.length >= 1 && (
                        <VendorComparisonTable category={category} onSelect={onSelectVendor} />
                    )}

                    {/* 1 Vendor Warning */}
                    {category.vendors.length === 1 && (
                        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-[20px] border border-dashed border-border/80 p-4 bg-transparent">
                            <div className="flex items-start gap-3">
                                <div className="bg-muted/50 p-2 rounded-full shrink-0 mt-0.5">
                                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <h4 className="text-[13px] font-bold text-foreground mb-1">Kandidat Masih Tunggal</h4>
                                    <p className="text-[12px] text-muted-foreground leading-snug">
                                        Baru ada 1 vendor di kategori ini. Sebaiknya tambahkan minimal satu kandidat lain agar Anda dapat membandingkan harga dan layanan. Namun Anda tetap dapat memilih vendor ini.
                                    </p>
                                </div>
                            </div>
                            {category.selectedVendorId !== category.vendors[0].id && (
                                <Button 
                                    type="button"
                                    size="sm" 
                                    className="shrink-0 w-full sm:w-auto"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        onSelectVendor(category.vendors[0].id);
                                    }}
                                >
                                    Pilih Vendor Ini
                                </Button>
                            )}
                        </div>
                    )}

                    <VendorCardGrid
                        vendors={vendorsToDisplay}
                        category={category}
                        onEdit={onEditVendor}
                        onDelete={onDeleteVendor}
                        onSelect={onSelectVendor}
                        onView={onViewVendor}
                        onOpenAttributesDialog={onOpenAttributesDialog}
                    />
                    
                    {hasMore && (
                        <div className="flex justify-center pt-2 pb-6">
                            <Button 
                                variant="outline" 
                                className="rounded-full px-6 bg-background border-border/50 text-[13px] font-bold"
                                onClick={() => setVisibleVendorsCount(prev => prev + 6)}
                            >
                                Load More
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ==================== COMPARISON TABLE ====================

function VendorComparisonTable({ category, onSelect }: { category: VendorCategory; onSelect: (id: string) => void }) {
    const [isOpen, setIsOpen] = useState(false)
    const vendors = category.vendors
    const sortedAttrs = [...category.attributes].sort((a, b) => a.sortOrder - b.sortOrder)

    if (vendors.length === 0) return null

    return (
        <div className="rounded-[24px] border border-border/50 bg-card shadow-sm overflow-hidden">
            {/* Toggle Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/20 transition-colors active:bg-muted/30"
            >
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                        <ListPlus className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-[14px] font-bold text-foreground">
                            {vendors.length === 1 ? "Detail Atribut" : "Bandingkan Atribut"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{vendors.length} vendor · {sortedAttrs.length + 3} poin penilaian</p>
                    </div>
                </div>
                <ChevronRight className={cn("w-5 h-5 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
            </button>

            {/* List Content */}
            {isOpen && (
                <div className="border-t border-border/40 divide-y divide-border/40">
                    
                    {/* Harga Referensi */}
                    <div className="p-4 bg-muted/5">
                        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Harga Referensi</h4>
                        <div className="flex flex-col gap-2.5">
                            {vendors.map(v => (
                                <div key={`ref-${v.id}`} className="flex justify-between items-center text-[13px]">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-foreground">{v.name}</span>
                                        {category.selectedVendorId === v.id && (
                                            <span className="text-[8px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Terpilih</span>
                                        )}
                                    </div>
                                    <span className="font-medium text-muted-foreground">
                                        {v.referencePrice ? formatCurrency(v.referencePrice) : "-"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Harga Deal */}
                    <div className="p-4">
                        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Harga Deal (Kontrak)</h4>
                        <div className="flex flex-col gap-2.5">
                            {vendors.map(v => (
                                <div key={`deal-${v.id}`} className="flex justify-between items-center text-[13px]">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-foreground">{v.name}</span>
                                        {category.selectedVendorId === v.id && (
                                            <span className="text-[8px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Terpilih</span>
                                        )}
                                    </div>
                                    <span className="font-bold text-foreground">
                                        {v.contractAmount ? formatCurrency(v.contractAmount) : <span className="text-muted-foreground font-medium">-</span>}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status Pembayaran (Removed) */}

                    {/* Custom Attributes */}
                    {sortedAttrs.map((attr, idx) => (
                        <div key={`attr-${attr.id}`} className={cn("p-4", idx % 2 === 0 ? "bg-muted/5" : "bg-card")}>
                            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">{attr.name}</h4>
                            <div className="flex flex-col gap-2.5">
                                {vendors.map(v => (
                                    <div key={`attr-val-${v.id}`} className="flex justify-between items-center text-[13px]">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-foreground">{v.name}</span>
                                            {category.selectedVendorId === v.id && (
                                                <span className="text-[8px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Terpilih</span>
                                            )}
                                        </div>
                                        <span className="font-medium text-foreground text-right max-w-[60%]">
                                            {v.attributeValues[attr.id] || <span className="text-muted-foreground">-</span>}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    {/* Pilih Vendor Action Redesign */}
                    <div className="p-5 bg-background border-t-2 border-border/30">
                        <h4 className="text-[13px] font-bold text-foreground mb-4 text-center">Sudah mantap dengan pilihan Anda?</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {vendors.map(v => {
                                const isSelected = category.selectedVendorId === v.id;
                                return (
                                    <button
                                        key={`select-${v.id}`}
                                        onClick={() => onSelect(v.id)}
                                        className={cn(
                                            "relative flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98]",
                                            isSelected 
                                                ? "border-primary bg-primary/5 text-primary shadow-sm" 
                                                : "border-border/50 bg-card hover:border-primary/40 text-foreground hover:bg-muted/30"
                                        )}
                                    >
                                        {isSelected && (
                                            <div className="absolute -top-2.5 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md animate-in zoom-in duration-200">
                                                <Check className="w-3.5 h-3.5" />
                                            </div>
                                        )}
                                        <span className={cn(
                                            "font-bold text-[13px] truncate w-full text-center transition-colors",
                                            isSelected ? "text-primary" : "text-foreground"
                                        )}>
                                            {v.name}
                                        </span>
                                        <span className={cn(
                                            "text-[10px] font-bold uppercase tracking-wider mt-1 transition-colors", 
                                            isSelected ? "text-primary/70" : "text-muted-foreground"
                                        )}>
                                            {isSelected ? "Terpilih" : "Pilih Vendor"}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                </div>
            )}
        </div>
    )
}

// ==================== VENDOR CARDS ====================

function VendorCardGrid({ vendors, category, onEdit, onDelete, onSelect, onView, onOpenAttributesDialog }: {
    vendors: Vendor[]
    category: VendorCategory
    onEdit: (vendor: Vendor) => void
    onDelete: (vendorId: string) => void
    onSelect: (vendorId: string) => void
    onView: (vendor: Vendor) => void
    onOpenAttributesDialog: (vendor: Vendor) => void
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {vendors.map(vendor => {
                const isSelected = category.selectedVendorId === vendor.id
                const hasMissingAttributes = category.attributes.length > 0 && 
                    category.attributes.some(attr => !vendor.attributeValues?.[attr.id]?.trim());

                return (
                    <div
                        key={vendor.id}
                        onClick={() => onView(vendor)}
                        className={cn(
                            'bg-card rounded-[24px] p-5 shadow-sm border relative overflow-hidden transition-all duration-200 cursor-pointer group',
                            isSelected ? 'ring-1 ring-primary border-primary' : 'border-border/50 hover:border-primary/40 hover:shadow-md'
                        )}
                    >
                        {/* Header: Name + Badges + Price */}
                        <div className="flex justify-between items-start mb-5">
                            <div className="pr-3 flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-[16px] text-foreground tracking-tight leading-tight truncate">
                                        {vendor.name}
                                    </h3>
                                    {isSelected && (
                                        <span className="shrink-0 bg-primary/15 text-primary font-bold px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider">
                                            Terpilih
                                        </span>
                                    )}
                                </div>
                                <p className="text-[12px] text-muted-foreground font-medium mb-2.5">PIC: {vendor.contactPerson || "-"}</p>
                                <div className="flex items-center gap-2 mb-1 w-full mt-2">
                                    {vendor.phoneNumber && (
                                        <a href={`https://wa.me/${vendor.phoneNumber}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-1.5 text-[11px] font-bold text-green-700 dark:text-green-400 bg-green-500/15 hover:bg-green-500/25 px-2 py-1.5 rounded-md transition-all active:scale-95" onClick={e => e.stopPropagation()}>
                                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                                            </svg>
                                            <span className="truncate">WhatsApp</span>
                                        </a>
                                    )}
                                    {vendor.instagram && (
                                        <a href={`https://instagram.com/${vendor.instagram}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-1.5 text-[11px] font-bold text-pink-700 dark:text-pink-400 bg-pink-500/15 hover:bg-pink-500/25 px-2 py-1.5 rounded-md transition-all active:scale-95" onClick={e => e.stopPropagation()}>
                                            <Instagram className="w-3.5 h-3.5 shrink-0" />
                                            <span className="truncate">Instagram</span>
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Harga</p>
                                <div className="font-black text-[15px] text-primary">
                                    {formatCurrency(vendor.contractAmount ?? vendor.referencePrice ?? null)}
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer (Mobile App Style) */}
                        <div className="grid grid-cols-3 mt-auto pt-3 border-t border-border/40 divide-x divide-border/40 relative z-10">
                            <button
                                onClick={(e) => { e.stopPropagation(); onOpenAttributesDialog(vendor); }}
                                className={cn(
                                    "flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium transition-colors rounded-l-md active:bg-muted/30",
                                    hasMissingAttributes 
                                        ? "text-amber-600 hover:text-amber-700" 
                                        : "text-muted-foreground hover:text-primary"
                                )}
                            >
                                <div className="relative">
                                    <ListPlus className="w-3.5 h-3.5" />
                                    {hasMissingAttributes && (
                                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full border border-background"></span>
                                    )}
                                </div>
                                Nilai
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(vendor); }}
                                className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-primary transition-colors active:bg-muted/30"
                            >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                            </button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <button 
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-medium text-muted-foreground hover:text-destructive transition-colors active:bg-muted/30 rounded-r-md"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                                    </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Hapus Vendor</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Apakah Anda yakin ingin menghapus vendor &ldquo;{vendor.name}&rdquo;? Tindakan ini tidak dapat dibatalkan.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Batal</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => onDelete(vendor.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Hapus
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
