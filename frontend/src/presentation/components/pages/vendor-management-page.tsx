'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
    Store, Plus, Pencil, Trash2, Check, CheckCircle2, X, Phone,
    Instagram, MapPin, FileText, ChevronRight, Star,
    Search, LayoutGrid, Table2, GripVertical,
    CreditCard, AlertCircle,
    ArrowUpDown, Eye, Crown, Info, MoreHorizontal, Settings2,
    Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/presentation/components/ui/card'
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
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/src/presentation/components/ui/dropdown-menu'
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow
} from '@/src/presentation/components/ui/table'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/src/presentation/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/presentation/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/src/presentation/components/ui/tooltip'
import { Separator } from '@/src/presentation/components/ui/separator'
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
    useSelectVendor,
    useDeselectVendor,
} from '@/src/application/hooks/use-vendor-query'
import { useAuthStore } from '@/src/infrastructure/stores/auth-store'

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
    const [searchQuery, setSearchQuery] = useState('')

    const { data: overview, isLoading, isError, refetch } = useVendorOverview(DEFAULT_EVENT_ID)

    const categories: VendorCategory[] = useMemo(() =>
        (overview?.categories || []).map(apiCategoryToUI),
        [overview]
    )

    useEffect(() => {
        if (categories.length > 0 && activeCategoryId === null) {
            setActiveCategoryId(categories[0].id)
        }
    }, [categories, activeCategoryId])

    // Dialog states
    const [showCategoryDialog, setShowCategoryDialog] = useState(false)
    const [showVendorDialog, setShowVendorDialog] = useState(false)
    const [showVendorDetailDialog, setShowVendorDetailDialog] = useState(false)
    // Edit states
    const [editingCategory, setEditingCategory] = useState<VendorCategory | null>(null)
    const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
    const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null)
    // Form states
    const [categoryName, setCategoryName] = useState('')
    const [categoryAttributes, setCategoryAttributes] = useState<VendorAttribute[]>([])
    const [newAttributeName, setNewAttributeName] = useState('')
    const [editingAttributeId, setEditingAttributeId] = useState<number | null>(null)
    const [editingAttributeName, setEditingAttributeName] = useState('')
    const [vendorForm, setVendorForm] = useState({
        name: '',
        contactPerson: '',
        phoneNumber: '',
        instagram: '',
        address: '',
        referencePrice: '',
        contractAmount: '',
        paymentStatus: 'unpaid' as 'unpaid' | 'partial' | 'paid',
        note: '',
        attributeValues: {} as Record<number, string>,
    })

    // Payment Dialog State
    const [showPaymentDialog, setShowPaymentDialog] = useState(false)
    const [selectedPaymentVendor, setSelectedPaymentVendor] = useState<Vendor | null>(null)
    const [isAddingPayment, setIsAddingPayment] = useState(false)
    const [paymentForm, setPaymentForm] = useState({ date: '', amount: '', note: '' })

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
    const selectVendor = useSelectVendor()
    const deselectVendor = useDeselectVendor()

    const activeCategory = useMemo(() => {
        if (categories.length === 0) return undefined
        return categories.find(c => c.id === activeCategoryId) || categories[0]
    }, [categories, activeCategoryId])

    const filteredVendors = useMemo(() => {
        if (!activeCategory) return []
        if (!searchQuery.trim()) return activeCategory.vendors
        const q = searchQuery.toLowerCase()
        return activeCategory.vendors.filter(v =>
            v.name.toLowerCase().includes(q) ||
            v.contactPerson.toLowerCase().includes(q) ||
            v.instagram.toLowerCase().includes(q)
        )
    }, [activeCategory, searchQuery])

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
            id: Date.now(),
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

    const handleSaveCategory = () => {
        if (!categoryName.trim()) return
        if (editingCategory) {
            updateCategory.mutate(
                { id: editingCategory.id, data: { name: categoryName.trim() }, eventId: DEFAULT_EVENT_ID },
                { onSuccess: () => {
                    const removedAttrIds = editingCategory.attributes
                        .filter(old => !categoryAttributes.find(a => a.id === old.id))
                    removedAttrIds.forEach(a => {
                        if (a.id > 0) deleteAttr.mutate({ id: a.id, eventId: DEFAULT_EVENT_ID })
                    })
                    categoryAttributes
                        .filter(a => a.id > 0)
                        .forEach(a => {
                            const oldAttr = editingCategory.attributes.find(o => o.id === a.id)
                            if (oldAttr && (oldAttr.name !== a.name || oldAttr.sortOrder !== a.sortOrder)) {
                                updateAttr.mutate({ id: a.id, data: { name: a.name, sort_order: a.sortOrder }, eventId: DEFAULT_EVENT_ID })
                            }
                        })
                    categoryAttributes
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
                    const newId = resp.id
                    categoryAttributes.forEach(a => {
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

    const handleDeleteCategory = (catId: number) => {
        deleteCategory.mutate({ id: catId, eventId: DEFAULT_EVENT_ID })
        if (activeCategoryId === catId) {
            const remaining = categories.filter(c => c.id !== catId)
            if (remaining.length > 0) setActiveCategoryId(remaining[0].id)
        }
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
            paymentStatus: 'unpaid',
            note: '',
            attributeValues: {},
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
                paymentStatus: vendor.paymentStatus,
                note: vendor.note,
                attributeValues: { ...vendor.attributeValues },
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
            })
            if (activeCategory.attributes.length > 0) {
                const attrValues: Record<number, string | null> = {}
                activeCategory.attributes.forEach(a => {
                    attrValues[a.id] = vendorForm.attributeValues[a.id] || null
                })
                updateAttrValues.mutate({
                    vendorId: editingVendor.id,
                    data: { values: attrValues },
                    eventId: DEFAULT_EVENT_ID,
                })
            }
        } else {
            const attrValues: Record<number, string | null> = {}
            activeCategory.attributes.forEach(a => {
                attrValues[a.id] = vendorForm.attributeValues[a.id] || null
            })
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
                    attribute_values: attrValues,
                },
                eventId: DEFAULT_EVENT_ID,
            })
        }
        setShowVendorDialog(false)
        resetVendorForm()
        setEditingVendor(null)
    }

    const handleDeleteVendor = (vendorId: string) => {
        deleteVendor.mutate({ id: vendorId, eventId: DEFAULT_EVENT_ID })
    }

    const handleSelectVendor = (vendorId: string) => {
        if (!activeCategory) return
        if (activeCategory.selectedVendorId === vendorId) {
            deselectVendor.mutate({ categoryId: activeCategory.id, eventId: DEFAULT_EVENT_ID })
        } else {
            selectVendor.mutate({ categoryId: activeCategory.id, vendorId, eventId: DEFAULT_EVENT_ID })
        }
    }

    const handleOpenPaymentDialog = (vendor: Vendor) => {
        setSelectedPaymentVendor(vendor)
        setIsAddingPayment(false)
        setPaymentForm({ date: '', amount: '', note: '' })
        setShowPaymentDialog(true)
    }

    const handleSavePayment = () => {
        if (!selectedPaymentVendor || !paymentForm.amount || !activeCategory) return

        const paymentAmount = parseInt(paymentForm.amount)
        const paymentDate = paymentForm.date || new Date().toISOString().split('T')[0]
        const paymentNote = paymentForm.note || null

        setSelectedPaymentVendor(prev => {
            if (!prev) return prev
            return {
                ...prev,
                payments: [...(prev.payments || []), {
                    id: `temp-${Date.now()}`,
                    date: paymentDate,
                    amount: paymentAmount,
                    note: paymentNote || '',
                }],
            }
        })

        setIsAddingPayment(false)
        setPaymentForm({ date: '', amount: '', note: '' })

        createPayment.mutate({
            vendorId: selectedPaymentVendor.id,
            data: {
                date: paymentDate,
                amount: paymentAmount,
                note: paymentNote,
            },
            eventId: DEFAULT_EVENT_ID,
        })
    }

    // ==================== SUMMARY STATS ====================

    const totalVendors = categories.reduce((sum, c) => sum + c.vendors.length, 0)
    const totalSelected = categories.filter(c => c.selectedVendorId).length
    const totalFullyPaid = categories.filter(c => {
        const selected = c.vendors.find(v => v.id === c.selectedVendorId)
        return selected?.paymentStatus === 'paid'
    }).length
    
    const totalBudget = categories.reduce((sum, c) => {
        const selected = c.vendors.find(v => v.id === c.selectedVendorId)
        return sum + (selected?.contractAmount || 0)
    }, 0)
    
    const totalPaid = categories.reduce((sum, c) => {
        const selected = c.vendors.find(v => v.id === c.selectedVendorId)
        if (!selected || !selected.payments) return sum
        return sum + selected.payments.reduce((s, p) => s + p.amount, 0)
    }, 0)

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
            <div className="space-y-6 pb-8">
                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            <Store strokeWidth={1.5} className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Vendor Management</h2>
                            <p className="text-sm text-muted-foreground">Kelola dan bandingkan vendor pernikahan Anda dari berbagai kategori</p>
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-border/50 shadow-sm flex flex-col justify-center">
                        <CardContent className="p-4 sm:p-5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1 sm:space-y-2">
                                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">Kategori Vendor</p>
                                    <p className="text-2xl sm:text-3xl font-bold tracking-tight">{categories.length}</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">Bidang jasa didata</p>
                                </div>
                                <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/50">
                                    <LayoutGrid strokeWidth={1.5} className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50 shadow-sm flex flex-col justify-center">
                        <CardContent className="p-4 sm:p-5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1 sm:space-y-2">
                                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">Kandidat Vendor</p>
                                    <p className="text-2xl sm:text-3xl font-bold tracking-tight">{totalVendors}</p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground">Vendor dievaluasi</p>
                                </div>
                                <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/50">
                                    <Store strokeWidth={1.5} className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50 shadow-sm flex flex-col justify-center">
                        <CardContent className="p-4 sm:p-5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1 sm:space-y-2">
                                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">Vendor Terpilih</p>
                                    <p className="text-2xl sm:text-3xl font-bold tracking-tight">{totalSelected}<span className="text-base sm:text-lg text-muted-foreground font-normal">/{categories.length}</span></p>
                                    <p className="text-[10px] sm:text-xs text-muted-foreground"><span className="text-emerald-600 font-medium">{totalFullyPaid} Lunas</span> dari {totalSelected} vendor</p>
                                </div>
                                <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                                    <Crown strokeWidth={1.5} className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-border/50 shadow-sm flex flex-col justify-center">
                        <CardContent className="p-4 sm:p-5">
                            <div className="flex items-start justify-between mb-2 sm:mb-3">
                                <div className="space-y-0.5 sm:space-y-1">
                                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total Tagihan (Deal)</p>
                                    <p className="text-lg sm:text-2xl font-bold tracking-tight">{formatCurrency(totalBudget)}</p>
                                </div>
                                <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50 shrink-0 ml-2">
                                    <CreditCard strokeWidth={1.5} className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                            <div className="space-y-1.5 mt-auto">
                                <div className="flex items-center justify-between text-[10px] sm:text-xs">
                                    <span className="text-muted-foreground">Telah Dibayar</span>
                                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid)}</span>
                                </div>
                                <Progress value={totalBudget > 0 ? (totalPaid / totalBudget) * 100 : 0} className="h-1.5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Category Tabs + Content */}
                <Card className="border-border/50 shadow-sm">
                    <CardHeader className="pb-0">
                        <CardTitle className="text-lg">Kategori Vendor</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {categories.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border-2 border-dashed border-border/60 bg-muted/10">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                                    <LayoutGrid strokeWidth={1.5} className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-base font-semibold mb-1">Belum ada kategori</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Buat kategori vendor pertama Anda, seperti Fotografer, Catering, atau Venue.
                                </p>
                                <Button size="sm" onClick={() => handleOpenCategoryDialog()}>
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    Kategori Baru
                                </Button>
                            </div>
                        ) : (
                            <Tabs
                                value={activeCategoryId?.toString() ?? categories[0]?.id.toString() ?? ''}
                                onValueChange={(val) => {
                                    setActiveCategoryId(Number(val))
                                    setSearchQuery('')
                                }}
                            >
                                <div className="flex items-center gap-2 mb-6">
                                    <TabsList className="flex h-auto flex-1 justify-start gap-2.5 bg-transparent p-1 overflow-x-auto flex-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                        {categories.map(cat => {
                                            const isActive = activeCategoryId === cat.id;
                                            return (
                                                <TabsTrigger 
                                                    key={cat.id} 
                                                    value={cat.id.toString()} 
                                                    className="relative shrink-0 rounded-full border border-border/40 bg-background px-4 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-sm transition-all hover:bg-accent hover:border-border"
                                                >
                                                    {cat.name}
                                                    {cat.selectedVendorId && (
                                                        <span className={cn(
                                                            "ml-1.5 flex h-2 w-2 rounded-full shadow-sm",
                                                            isActive ? "bg-primary-foreground" : "bg-primary"
                                                        )} />
                                                    )}
                                                    <span className={cn(
                                                        "ml-1.5 text-xs",
                                                        isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                                                    )}>({cat.vendors.length})</span>
                                                </TabsTrigger>
                                            )
                                        })}
                                    </TabsList>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => handleOpenCategoryDialog()}
                                        >
                                            <Plus className="h-4 w-4 mr-1.5" />
                                            Buat Kategori
                                        </Button>
                                        {(() => {
                                            const activeCat = categories.find(c => c.id === activeCategoryId) ?? categories[0];
                                            if (!activeCat) return null;
                                            return (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9">
                                                            <Settings2 className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44">
                                                        <DropdownMenuItem onClick={() => handleOpenCategoryDialog(activeCat)}>
                                                            <Pencil className="h-4 w-4 mr-2" />
                                                            Edit Kategori
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem 
                                                            onClick={() => handleDeleteCategory(activeCat.id)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Hapus Kategori
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {categories.map(cat => (
                                    <TabsContent key={cat.id} value={cat.id.toString()}>
                                        <CategoryContent
                                            category={cat}
                                            searchQuery={searchQuery}
                                            setSearchQuery={setSearchQuery}
                                            filteredVendors={filteredVendors}
                                            onEditCategory={() => handleOpenCategoryDialog(cat)}
                                            onAddVendor={() => handleOpenVendorDialog()}
                                            onEditVendor={(v) => handleOpenVendorDialog(v)}
                                            onDeleteVendor={(id) => handleDeleteVendor(id)}
                                            onSelectVendor={(id) => handleSelectVendor(id)}
                                            onViewVendor={(v) => {
                                                setViewingVendor(v)
                                                setShowVendorDetailDialog(true)
                                            }}
                                            onOpenPaymentDialog={handleOpenPaymentDialog}
                                        />
                                    </TabsContent>
                                ))}
                            </Tabs>
                        )}
                    </CardContent>
                </Card>

                {/* ==================== DIALOGS ==================== */}

                {/* Category Dialog — includes inline attribute management */}
                <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? 'Edit Kategori' : 'Kategori Baru'}</DialogTitle>
                            <DialogDescription>
                                {editingCategory
                                    ? 'Ubah nama kategori dan kelola atribut perbandingan.'
                                    : 'Buat kategori baru dan tentukan atribut untuk membandingkan vendor.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-5 py-2 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-1">
                            {/* Category Name */}
                            <div className="space-y-2">
                                <Label htmlFor="category-name">Nama Kategori</Label>
                                <Input
                                    id="category-name"
                                    placeholder="Contoh: Fotografer"
                                    value={categoryName}
                                    onChange={(e) => setCategoryName(e.target.value)}
                                />
                            </div>

                            {/* Attributes Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Atribut Perbandingan</Label>
                                    <span className="text-xs text-muted-foreground">{categoryAttributes.length} atribut</span>
                                </div>

                                {/* Add new attribute */}
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Contoh: Harga, Durasi, Include Album"
                                        value={newAttributeName}
                                        onChange={(e) => setNewAttributeName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategoryAttribute()}
                                        className="min-w-0"
                                    />
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={handleAddCategoryAttribute}
                                        disabled={!newAttributeName.trim()}
                                        className="shrink-0"
                                    >
                                        <Plus className="h-4 w-4 mr-1.5" />
                                        Tambah
                                    </Button>
                                </div>

                                {/* Attribute list */}
                                {categoryAttributes.length > 0 ? (
                                    <div className="space-y-2">
                                        {categoryAttributes
                                            .sort((a, b) => a.sortOrder - b.sortOrder)
                                            .map((attr, index) => (
                                                <div
                                                    key={attr.id}
                                                    className="flex items-center gap-2 rounded-lg border border-border/50 px-3 py-2 bg-card hover:bg-accent/30 transition-colors min-w-0"
                                                >
                                                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    {editingAttributeId === attr.id ? (
                                                        <>
                                                            <Input
                                                                className="h-8 text-sm flex-1 min-w-0"
                                                                value={editingAttributeName}
                                                                onChange={(e) => setEditingAttributeName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleSaveEditAttribute()
                                                                    if (e.key === 'Escape') handleCancelEditAttribute()
                                                                }}
                                                                autoFocus
                                                            />
                                                            <div className="flex items-center shrink-0">
                                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveEditAttribute} title="Simpan">
                                                                    <Check className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancelEditAttribute} title="Batal">
                                                                    <X className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="flex-1 text-sm font-medium truncate min-w-0">{attr.name}</span>
                                                            <div className="flex items-center gap-0.5 shrink-0">
                                                                <Button
                                                                    variant="ghost" size="icon" className="h-7 w-7"
                                                                    disabled={index === 0}
                                                                    onClick={() => handleMoveCategoryAttribute(attr.id, 'up')}
                                                                    title="Naik"
                                                                >
                                                                    <ArrowUpDown className="h-3.5 w-3.5 rotate-180" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost" size="icon" className="h-7 w-7"
                                                                    onClick={() => handleStartEditAttribute(attr)}
                                                                    title="Edit"
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost" size="icon"
                                                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                                                    onClick={() => handleRemoveCategoryAttribute(attr.id)}
                                                                    title="Hapus"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border/50 rounded-lg">
                                        Belum ada atribut. Tambahkan atribut seperti Harga, Durasi, dll.
                                    </p>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Batal</Button>
                            </DialogClose>
                            <Button onClick={handleSaveCategory} disabled={!categoryName.trim()}>
                                {editingCategory ? 'Simpan' : 'Buat Kategori'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Vendor Form Dialog */}
                <Dialog open={showVendorDialog} onOpenChange={setShowVendorDialog}>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Tambah Vendor'}</DialogTitle>
                            <DialogDescription>
                                {editingVendor
                                    ? `Edit data vendor "${editingVendor.name}" pada kategori ${activeCategory?.name}.`
                                    : `Tambahkan vendor baru ke kategori ${activeCategory?.name}.`}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-2 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-1">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Informasi Dasar</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="vendor-name">Nama Vendor *</Label>
                                        <Input
                                            id="vendor-name"
                                            placeholder="Nama bisnis vendor"
                                            value={vendorForm.name}
                                            onChange={(e) => setVendorForm(prev => ({ ...prev, name: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vendor-contact">Contact Person</Label>
                                        <Input
                                            id="vendor-contact"
                                            placeholder="Nama PIC"
                                            value={vendorForm.contactPerson}
                                            onChange={(e) => setVendorForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vendor-phone">No. Telepon / WhatsApp</Label>
                                        <Input
                                            id="vendor-phone"
                                            placeholder="628xxxxxxxxxx"
                                            value={vendorForm.phoneNumber}
                                            onChange={(e) => {
                                                const numericVal = e.target.value.replace(/\D/g, '')
                                                setVendorForm(prev => ({ ...prev, phoneNumber: numericVal }))
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vendor-ig">Username Instagram</Label>
                                        <Input
                                            id="vendor-ig"
                                            placeholder="Username tanpa @"
                                            value={vendorForm.instagram}
                                            onChange={(e) => setVendorForm(prev => ({ ...prev, instagram: e.target.value.replace(/@/g, '') }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vendor-address">Alamat</Label>
                                    <Textarea
                                        id="vendor-address"
                                        placeholder="Alamat lengkap vendor"
                                        value={vendorForm.address}
                                        onChange={(e) => setVendorForm(prev => ({ ...prev, address: e.target.value }))}
                                        rows={2}
                                    />
                                </div>
                            </div>

                            {/* Contract Info */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Kesepakatan Harga</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="vendor-reference-price">Harga Penawaran Awal</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                                            <Input
                                                id="vendor-reference-price"
                                                type="text"
                                                className="pl-9"
                                                placeholder="0"
                                                value={vendorForm.referencePrice ? parseInt(vendorForm.referencePrice).toLocaleString('id-ID') : ''}
                                                onChange={(e) => {
                                                    const numericVal = e.target.value.replace(/\D/g, '')
                                                    setVendorForm(prev => ({ ...prev, referencePrice: numericVal }))
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="vendor-amount">Harga Deal Akhir</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                                            <Input
                                                id="vendor-amount"
                                                type="text"
                                                className="pl-9"
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

                            {/* Comparison Attributes */}
                            {activeCategory && activeCategory.attributes.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Perbandingan Vendor</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {activeCategory.attributes
                                            .sort((a, b) => a.sortOrder - b.sortOrder)
                                            .map(attr => (
                                                <div key={attr.id} className="space-y-2">
                                                    <Label>{attr.name}</Label>
                                                    <Input
                                                        placeholder={`Isi ${attr.name.toLowerCase()}...`}
                                                        value={vendorForm.attributeValues[attr.id] || ''}
                                                        onChange={(e) => setVendorForm(prev => ({
                                                            ...prev,
                                                            attributeValues: { ...prev.attributeValues, [attr.id]: e.target.value }
                                                        }))}
                                                    />
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* Note */}
                            <div className="space-y-2">
                                <Label htmlFor="vendor-note">Catatan</Label>
                                <Textarea
                                    id="vendor-note"
                                    placeholder="Catatan tambahan tentang vendor ini..."
                                    value={vendorForm.note}
                                    onChange={(e) => setVendorForm(prev => ({ ...prev, note: e.target.value }))}
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Batal</Button>
                            </DialogClose>
                            <Button onClick={handleSaveVendor} disabled={!vendorForm.name.trim()}>
                                {editingVendor ? 'Simpan Perubahan' : 'Tambah Vendor'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Vendor Detail Dialog */}
                <Dialog open={showVendorDetailDialog} onOpenChange={setShowVendorDetailDialog}>
                    <DialogContent className="sm:max-w-2xl">
                        {viewingVendor && (
                            <>
                                <DialogHeader>
                                    <div className="flex items-center gap-2">
                                        <DialogTitle className="text-xl">{viewingVendor.name}</DialogTitle>
                                        {activeCategory?.selectedVendorId === viewingVendor.id && (
                                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800">
                                                <Crown className="h-3 w-3 mr-1" />
                                                Terpilih
                                            </Badge>
                                        )}
                                    </div>
                                    <DialogDescription>
                                        Detail informasi vendor pada kategori {activeCategory?.name}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-5 py-2 max-h-[60vh] overflow-y-auto overflow-x-hidden pr-1">
                                    {/* Contact Info */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Kontak</h4>
                                        <div className="space-y-2">
                                            {viewingVendor.contactPerson && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Star strokeWidth={1.5} className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <span>{viewingVendor.contactPerson}</span>
                                                </div>
                                            )}
                                            {viewingVendor.phoneNumber && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone strokeWidth={1.5} className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <span>{viewingVendor.phoneNumber}</span>
                                                </div>
                                            )}
                                            {viewingVendor.instagram && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Instagram strokeWidth={1.5} className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <span>{viewingVendor.instagram}</span>
                                                </div>
                                            )}
                                            {viewingVendor.address && (
                                                <div className="flex items-start gap-2 text-sm">
                                                    <MapPin strokeWidth={1.5} className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                                    <span>{viewingVendor.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contract */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Kesepakatan Harga</h4>
                                        <div className="flex flex-col gap-2">
                                            {viewingVendor.referencePrice && viewingVendor.contractAmount && viewingVendor.referencePrice !== viewingVendor.contractAmount && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground w-20">Pricelist:</span>
                                                    <span className="text-sm text-muted-foreground line-through decoration-muted-foreground/50">{formatCurrency(viewingVendor.referencePrice)}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground w-20">Deal:</span>
                                                    <CreditCard strokeWidth={1.5} className="h-4 w-4 text-primary" />
                                                    <span className="text-sm font-medium">{formatCurrency(viewingVendor.contractAmount ?? viewingVendor.referencePrice ?? null)}</span>
                                                </div>
                                                <PaymentStatusBadge status={viewingVendor.paymentStatus} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attributes */}
                                    {activeCategory && activeCategory.attributes.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Atribut</h4>
                                            <div className="rounded-lg border border-border/50 overflow-hidden">
                                                {activeCategory.attributes
                                                    .sort((a, b) => a.sortOrder - b.sortOrder)
                                                    .map((attr, i) => (
                                                        <div
                                                            key={attr.id}
                                                            className={cn(
                                                                'flex items-center justify-between px-4 py-2.5 text-sm',
                                                                i % 2 === 0 ? 'bg-card' : 'bg-accent/30'
                                                            )}
                                                        >
                                                            <span className="text-muted-foreground">{attr.name}</span>
                                                            <span className="font-medium">
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
                                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Catatan</h4>
                                            <p className="text-sm text-muted-foreground bg-accent/30 rounded-lg p-3">
                                                {viewingVendor.note}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Payment Management Dialog */}
                <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                    <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-6">
                        <DialogHeader className="mb-6">
                            <DialogTitle>Catatan Pembayaran</DialogTitle>
                            <DialogDescription>
                                Catat riwayat pembayaran untuk vendor {selectedPaymentVendor?.name}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedPaymentVendor && (
                            <div className="space-y-6">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                                        <p className="text-xs text-muted-foreground">Total Tagihan</p>
                                        <p className="font-semibold text-foreground">
                                            {formatCurrency(selectedPaymentVendor.contractAmount ?? selectedPaymentVendor.referencePrice ?? null)}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border bg-primary/5 p-3 space-y-1 border-primary/20">
                                        <p className="text-xs text-primary">Sisa Tagihan</p>
                                        <p className="font-semibold text-primary">
                                            {formatCurrency((selectedPaymentVendor.contractAmount ?? selectedPaymentVendor.referencePrice ?? 0) - (selectedPaymentVendor.payments?.reduce((s, p) => s + p.amount, 0) || 0))}
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                {/* Payment History Timeline */}
                                <div>
                                    <h4 className="text-sm font-semibold mb-4">Riwayat Pembayaran</h4>
                                    {selectedPaymentVendor.payments && selectedPaymentVendor.payments.length > 0 ? (
                                        <div className="space-y-0 relative">
                                            <div className="absolute left-1.5 top-2 bottom-2 w-px bg-border/50" />
                                            {[...selectedPaymentVendor.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((payment, i) => (
                                                <div key={payment.id} className="relative pl-6 pb-5 last:pb-0">
                                                    <div className="absolute left-[3px] top-1.5 h-2 w-2 rounded-full bg-primary ring-4 ring-background" />
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium">{formatCurrency(payment.amount)}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {new Date(payment.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                        {payment.note && (
                                                            <p className="text-xs text-muted-foreground">{payment.note}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
                                            Belum ada riwayat pembayaran.
                                        </div>
                                    )}
                                </div>

                                {/* Add Payment Form */}
                                <div className="pt-4 mt-6 border-t border-border/50">
                                    {isAddingPayment ? (
                                        <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
                                            <h4 className="text-sm font-semibold">Catat Pembayaran Baru</h4>
                                            <div className="space-y-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Nominal</Label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                                                        <Input 
                                                            type="text" 
                                                            className="pl-9"
                                                            placeholder="5.000.000" 
                                                            value={paymentForm.amount ? parseInt(paymentForm.amount).toLocaleString('id-ID') : ''}
                                                            onChange={(e) => {
                                                                const numericVal = e.target.value.replace(/\D/g, '')
                                                                setPaymentForm(prev => ({ ...prev, amount: numericVal }))
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Tanggal Pembayaran</Label>
                                                    <Input 
                                                        type="date" 
                                                        value={paymentForm.date}
                                                        onChange={(e) => setPaymentForm(prev => ({ ...prev, date: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-xs">Catatan / Keterangan</Label>
                                                    <Input 
                                                        placeholder="Contoh: DP Termin 1" 
                                                        value={paymentForm.note}
                                                        onChange={(e) => setPaymentForm(prev => ({ ...prev, note: e.target.value }))}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 pt-2">
                                                    <Button variant="outline" className="flex-1" onClick={() => setIsAddingPayment(false)}>Batal</Button>
                                                    <Button className="flex-1" onClick={handleSavePayment}>Simpan</Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <Button className="w-full" onClick={() => setIsAddingPayment(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Tambah Pembayaran Baru
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    )
}

// ==================== CATEGORY CONTENT ====================

interface CategoryContentProps {
    category: VendorCategory
    searchQuery: string
    setSearchQuery: (q: string) => void
    filteredVendors: Vendor[]
    onEditCategory: () => void
    onAddVendor: () => void
    onEditVendor: (v: Vendor) => void
    onDeleteVendor: (id: string) => void
    onSelectVendor: (id: string) => void
    onViewVendor: (v: Vendor) => void
    onOpenPaymentDialog: (v: Vendor) => void
}

function CategoryContent({
    category,
    searchQuery,
    setSearchQuery,
    filteredVendors,
    onEditCategory,
    onAddVendor,
    onEditVendor,
    onDeleteVendor,
    onSelectVendor,
    onViewVendor,
    onOpenPaymentDialog,
}: CategoryContentProps) {
    const selectedVendor = category.vendors.find(v => v.id === category.selectedVendorId)

    const totalPaid = selectedVendor?.payments?.reduce((sum, p) => sum + p.amount, 0) || 0
    const dealAmount = selectedVendor?.contractAmount ?? selectedVendor?.referencePrice ?? 0
    const progressPercent = dealAmount > 0 ? Math.min(100, Math.round((totalPaid / dealAmount) * 100)) : 0

    return (
        <div className="space-y-4">
            {/* Content Body */}

            {/* Selected Vendor Banner */}
            {selectedVendor && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 shrink-0">
                            <Check strokeWidth={2.5} className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-0.5">Vendor Terpilih</p>
                            <p className="text-sm font-semibold truncate">
                                {selectedVendor.name}
                            </p>
                        </div>
                    </div>
                    
                    {/* Payment Progress */}
                    {dealAmount > 0 && (
                        <div className="flex-1 min-w-[200px] max-w-sm space-y-1.5 mt-2 sm:mt-0">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-muted-foreground">Pembayaran</span>
                                <span className="font-semibold text-primary">{progressPercent}%</span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                            <p className="text-[10px] text-muted-foreground text-right">
                                {formatCurrency(totalPaid)} / {formatCurrency(dealAmount)}
                            </p>
                        </div>
                    )}

                    <div className="shrink-0 flex items-center justify-end sm:border-l sm:border-border/50 sm:pl-4 mt-3 sm:mt-0">
                        <Button 
                            variant={selectedVendor.paymentStatus === 'paid' ? "default" : "outline"} 
                            size="sm" 
                            onClick={() => onOpenPaymentDialog(selectedVendor)} 
                            className={`w-full sm:w-auto ${selectedVendor.paymentStatus === 'paid' ? 'bg-green-600 hover:bg-green-700 text-white border-transparent' : ''}`}
                        >
                            {selectedVendor.paymentStatus === 'paid' ? (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Sudah Lunas
                                </>
                            ) : (
                                <>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Catatan Pembayaran
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Unified Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-muted/30 p-2.5 rounded-lg border border-border/50">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari vendor di kategori ini..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-background"
                    />
                </div>
                <Button onClick={onAddVendor} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Vendor
                </Button>
            </div>

            {/* Content */}
            {filteredVendors.length === 0 ? (
                category.vendors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border-2 border-dashed border-border/60 bg-muted/10 hover:bg-muted/20 transition-colors">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                            <Store strokeWidth={1.5} className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-base font-semibold mb-1">Belum ada vendor</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Anda belum menambahkan kandidat vendor untuk kategori ini. Gunakan tombol di atas untuk memulai.
                        </p>
                        {category.attributes.length === 0 && (
                            <Button variant="outline" size="sm" onClick={onEditCategory} className="bg-background">
                                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                Atur Atribut Perbandingan
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl border-2 border-dashed border-border/60 bg-muted/10">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                            <Search strokeWidth={1.5} className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-base font-semibold mb-1">Tidak ditemukan</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Tidak ada vendor yang cocok dengan pencarian &quot;{searchQuery}&quot;.
                        </p>
                    </div>
                )
            ) : (
                <VendorCardGrid
                    vendors={filteredVendors}
                    category={category}
                    onEdit={onEditVendor}
                    onDelete={onDeleteVendor}
                    onSelect={onSelectVendor}
                    onView={onViewVendor}
                />
            )}
        </div>
    )
}

// ==================== VENDOR CARDS ====================

function VendorCardGrid({ vendors, category, onEdit, onDelete, onSelect, onView }: {
    vendors: Vendor[]
    category: VendorCategory
    onEdit: (v: Vendor) => void
    onDelete: (id: string) => void
    onSelect: (id: string) => void
    onView: (v: Vendor) => void
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map(vendor => {
                const isSelected = category.selectedVendorId === vendor.id
                return (
                    <Card
                        key={vendor.id}
                        className={cn(
                            'border-border/50 shadow-sm transition-all duration-200 hover:shadow-md relative group flex flex-col',
                            isSelected && 'ring-2 ring-primary border-primary'
                        )}
                    >
                        <CardContent className="p-4 flex-1 flex flex-col">
                            <div className="space-y-3 flex-1 flex flex-col">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-base truncate">{vendor.name}</h3>
                                        {vendor.contactPerson && (
                                            <p className="text-xs text-muted-foreground truncate">{vendor.contactPerson}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Info */}
                                <div className="space-y-1.5">
                                    {vendor.phoneNumber && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Phone strokeWidth={1.5} className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{vendor.phoneNumber}</span>
                                        </div>
                                    )}
                                    {vendor.instagram && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Instagram strokeWidth={1.5} className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{vendor.instagram}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Contract */}
                                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                                    <div className="flex flex-col">
                                        {vendor.referencePrice && vendor.contractAmount && vendor.referencePrice !== vendor.contractAmount && (
                                            <span className="text-[10px] text-muted-foreground line-through decoration-muted-foreground/50">
                                                {formatCurrency(vendor.referencePrice)}
                                            </span>
                                        )}
                                        <span className="text-sm font-semibold">
                                            {formatCurrency(vendor.contractAmount ?? vendor.referencePrice ?? null)}
                                        </span>
                                    </div>
                                    <PaymentStatusBadge status={vendor.paymentStatus} />
                                </div>

                                {/* Top Attributes Preview */}
                                {category.attributes.length > 0 && (
                                    <div className="space-y-1 pt-1">
                                        {category.attributes
                                            .sort((a, b) => a.sortOrder - b.sortOrder)
                                            .slice(0, 3)
                                            .map(attr => (
                                                <div key={attr.id} className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground truncate mr-2">{attr.name}</span>
                                                    <span className="font-medium text-right truncate max-w-[50%]">
                                                        {vendor.attributeValues[attr.id] || '-'}
                                                    </span>
                                                </div>
                                            ))}
                                        {category.attributes.length > 3 && (
                                            <p className="text-xs text-muted-foreground">+{category.attributes.length - 3} atribut lainnya</p>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 pt-2 mt-auto">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(vendor)}>
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Lihat Detail</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(vendor)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Edit</TooltipContent>
                                    </Tooltip>
                                    <div className="flex-1" />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>Hapus</TooltipContent>
                                            </Tooltip>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
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
                                <div className="pt-3 mt-1 border-t border-border/30">
                                    <Button
                                        variant={isSelected ? 'default' : 'outline'}
                                        className={cn(
                                            "w-full transition-all duration-300",
                                            isSelected ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm" : "hover:bg-accent hover:text-accent-foreground"
                                        )}
                                        onClick={() => onSelect(vendor.id)}
                                    >
                                        {isSelected ? "Vendor Pilihan" : "Pilih Vendor"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
