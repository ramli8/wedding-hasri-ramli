'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  HeartHandshake, 
  Plus, 
  Gift, 
  Wallet, 
  Search,
  Users,
  TrendingUp,
  Receipt,
  CreditCard,
  Building2,
  Calendar,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Edit,
  Trash2,
  QrCode,
  Settings2,
  NotebookTabs,
  CalendarHeart,
  LogOut,
  Grid,
  X,
  Settings,
  Pencil,
  Inbox,
  Check,
  Banknote
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/src/presentation/components/ui/dialog'
import { Label } from '@/src/presentation/components/ui/label'
import { Card, CardContent } from '@/src/presentation/components/ui/card'
import { Button } from '@/src/presentation/components/ui/button'
import { Input } from '@/src/presentation/components/ui/input'
import { Badge } from '@/src/presentation/components/ui/badge'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/presentation/components/ui/alert-dialog"
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from '@/src/presentation/components/ui/table'
import { Progress } from '@/src/presentation/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/src/presentation/components/ui/select'
import {
  useKondangans,
  useKondanganStats,
  useCreateKondangan,
  useUpdateKondangan,
  useDeleteKondangan,
  useKondanganRelations,
  useCreateKondanganRelation,
  useDeleteKondanganRelation
} from '@/src/application/hooks/use-kondangan-query'

export default function CatatanKondanganPage() {
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize, setPageSize] = useState('10')
  const [filterRelation, setFilterRelation] = useState('all')
  const [filterSide, setFilterSide] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const { data: listResponse, isLoading } = useKondangans({
      page: page,
      page_size: parseInt(pageSize),
      search: searchQuery,
      relation_id: filterRelation === 'all' ? undefined : parseInt(filterRelation),
      side: filterSide === 'all' ? undefined : filterSide,
      sort_by: sortBy,
      sort_dir: sortDir,
  })

  const { data: stats } = useKondanganStats()

  const createMut = useCreateKondangan()
  const updateMut = useUpdateKondangan()
  const deleteMut = useDeleteKondangan()

  const [editingId, setEditingId] = useState<string | null>(null)

  const [isRelationDialogOpen, setIsRelationDialogOpen] = useState(false)
  const [modalType, setModalType] = useState<'filter' | 'sort' | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newRelation, setNewRelation] = useState('')
  const [deleteRelationId, setDeleteRelationId] = useState<number | null>(null)
  const [deleteKondanganId, setDeleteKondanganId] = useState<string | null>(null)

  const { data: relationsData = [] } = useKondanganRelations()
  const createRelMut = useCreateKondanganRelation()
  const deleteRelMut = useDeleteKondanganRelation()

  const [formData, setFormData] = useState({
      couple: '',
      relation: '',
      side: 'Pria',
      giftType: 'Uang',
      giftName: '',
      nominal: ''
  })

  const handleAddRelation = () => {
      if (newRelation.trim()) {
          createRelMut.mutate(newRelation.trim(), {
              onSuccess: () => {
                  setNewRelation('')
                  toast.success('Relasi berhasil ditambahkan')
              }
          })
      }
  }

  const handleDeleteRelation = (id: number) => {
      setDeleteRelationId(id);
  }

  const confirmDeleteRelation = () => {
      if (deleteRelationId) {
          deleteRelMut.mutate(deleteRelationId, {
              onSuccess: () => {
                  toast.success('Relasi berhasil dihapus')
                  setDeleteRelationId(null)
              },
              onError: (error: any) => {
                  toast.error("Gagal menghapus relasi. Pastikan tidak ada data yang menggunakannya.")
                  setDeleteRelationId(null)
              }
          })
      }
  }

  const handleSaveKondangan = () => {
      const payload = {
          couple_name: formData.couple,
          relation_id: parseInt(formData.relation),
          side: formData.side,
          gift_type: formData.giftType,
          gift_name: formData.giftType === 'Kado' ? formData.giftName : null,
          nominal: formData.nominal ? parseFloat(formData.nominal) : null,
      }
      if (editingId) {
          updateMut.mutate({ id: editingId, data: payload }, {
              onSuccess: () => {
                  setIsCreateDialogOpen(false)
                  setEditingId(null)
                  setFormData({ couple: '', relation: '', side: 'Pria', giftType: 'Uang', giftName: '', nominal: '' })
              }
          })
      } else {
          createMut.mutate(payload, {
              onSuccess: () => {
                  setIsCreateDialogOpen(false)
                  setFormData({ couple: '', relation: '', side: 'Pria', giftType: 'Uang', giftName: '', nominal: '' })
              }
          })
      }
  }

  const handleDelete = (id: string) => {
      setDeleteKondanganId(id);
  }

  const confirmDeleteKondangan = () => {
      if (deleteKondanganId) {
          deleteMut.mutate(deleteKondanganId, {
              onSuccess: () => {
                  toast.success('Catatan berhasil dihapus')
                  setDeleteKondanganId(null)
              }
          })
      }
  }

  const handleEdit = (item: any) => {
      setEditingId(item.id)
      setFormData({
          couple: item.couple_name,
          relation: item.relation_id.toString(),
          side: item.side,
          giftType: item.gift_type,
          giftName: item.gift_name || '',
          nominal: item.nominal ? item.nominal.toString() : ''
      })
      setIsCreateDialogOpen(true)
  }

  const handleOpenCreate = () => {
      setEditingId(null)
      setFormData({ couple: '', relation: '', side: 'Pria', giftType: 'Uang', giftName: '', nominal: '' })
      setIsCreateDialogOpen(true)
  }

  const formatCurrency = (amount: number | null): string => {
    if (amount === null || isNaN(amount)) return '-'
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const SortButton = ({ children }: { children: React.ReactNode }) => {
    return (
        <button className="flex items-center gap-1 hover:text-foreground">
            {children}
            <ArrowUpDown className="h-3 w-3" />
        </button>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 relative font-sans transition-colors duration-300">
        
        {/* Header Area */}
        <div className="px-6 pt-12 pb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href="/admin" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div className="flex items-center">
                    <h1 className="text-lg font-semibold tracking-tight">Kondangan</h1>
                </div>
            </div>
            <div className="flex items-center gap-1">
                <button onClick={() => setIsRelationDialogOpen(true)} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground">
                    <Settings className="w-5 h-5" />
                </button>
                <button onClick={handleOpenCreate} className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors text-primary">
                    <Plus className="w-6 h-6" />
                </button>
            </div>
        </div>

        <div className="px-6">
            {/* Search and Filters */}
            <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input 
                        placeholder="Cari nama pasangan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 rounded-full bg-card border-border/60 shadow-sm h-11 text-[13.5px] focus-visible:ring-primary"
                    />
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setModalType('sort')} 
                        className={`flex items-center justify-center w-11 h-11 rounded-full shadow-sm transition-colors border ${sortBy !== 'created_at' || sortDir !== 'desc' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/60 text-muted-foreground hover:text-foreground'}`}
                    >
                        <ArrowUpDown className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setModalType('filter')} 
                        className={`flex items-center justify-center w-11 h-11 rounded-full shadow-sm transition-colors border ${filterRelation !== 'all' || filterSide !== 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border/60 text-muted-foreground hover:text-foreground'}`}
                    >
                        <Settings2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Card List */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-10 text-muted-foreground">Memuat data...</div>
                ) : listResponse?.items?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <Inbox className="w-8 h-8 text-muted-foreground opacity-50" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">Kosong</h3>
                        <p className="text-sm text-muted-foreground">Tidak ada catatan ditemukan.</p>
                    </div>
                ) : listResponse?.items?.map((item) => (
                    <div key={item.id} className="bg-card rounded-[24px] p-5 shadow-sm border border-border/50 relative overflow-hidden group">
                        
                        {/* Header: Name and Action buttons */}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-semibold text-[15px] mb-1.5">{item.couple_name}</h3>
                                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                                    <span className="bg-muted px-1.5 py-0.5 rounded text-foreground/80">{item.relation}</span>
                                    <span>&bull;</span>
                                    <span>Pihak {item.side}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-0.5 bg-muted/40 rounded-full p-1 border border-border/50">
                                <button onClick={() => handleEdit(item)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-full hover:bg-background hover:shadow-sm">
                                    <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-background hover:shadow-sm">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {/* Content: Value box */}
                        <div className={`p-4 rounded-2xl flex items-center justify-between ${item.gift_type === 'Uang' ? 'bg-primary/5 border border-primary/10' : 'bg-purple-500/5 border border-purple-500/10'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.gift_type === 'Uang' ? 'bg-primary/10 text-primary' : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'}`}>
                                    {item.gift_type === 'Uang' ? <Banknote className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className={`text-[9px] font-medium uppercase tracking-wider mb-0.5 ${item.gift_type === 'Uang' ? 'text-primary/70' : 'text-purple-600/70 dark:text-purple-400/70'}`}>
                                        {item.gift_type === 'Uang' ? 'Uang' : 'Kado Barang'}
                                    </p>
                                    <div className="font-semibold text-[15px]">
                                        {item.gift_type === 'Uang' ? formatCurrency(item.nominal) : item.gift_name}
                                    </div>
                                </div>
                            </div>
                            {item.gift_type === 'Kado' && item.nominal ? (
                                <div className="text-right">
                                    <p className="text-[9px] font-medium text-muted-foreground mb-0.5 uppercase tracking-wider">Estimasi</p>
                                    <p className="font-medium text-xs text-foreground">{formatCurrency(item.nominal)}</p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Pagination / Load More (Simple for mobile) */}
            {Number(listResponse?.total_pages) > 1 && (
                <div className="flex justify-between items-center mt-6 mb-10">
                    <button 
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 bg-card rounded-full text-[13px] font-medium disabled:opacity-50 shadow-sm border border-border/50"
                    >
                        Sebelumnya
                    </button>
                    <span className="text-[13px] font-medium text-muted-foreground">{page} / {listResponse.total_pages}</span>
                    <button 
                        onClick={() => setPage(page + 1)}
                        disabled={page >= listResponse.total_pages}
                        className="px-4 py-2 bg-card rounded-full text-[13px] font-medium disabled:opacity-50 shadow-sm border border-border/50"
                    >
                        Selanjutnya
                    </button>
                </div>
            )}
        </div>



        {/* Filter & Sort Modals (Floating Match Image Design) */}
        {modalType && (
            <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setModalType(null)}></div>
                <div className="relative bg-background rounded-[2rem] w-full max-w-[400px] p-6 pb-8 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85vh] flex flex-col">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6 shrink-0 relative">
                        {modalType === 'filter' && (
                            <button 
                                onClick={() => { setFilterRelation('all'); setFilterSide('all'); }} 
                                className="absolute left-0 text-destructive font-semibold text-sm"
                            >
                                Reset
                            </button>
                        )}
                        <h2 className="text-base font-bold w-full text-center">
                            {modalType === 'filter' ? 'Filter' : 'Urutkan'}
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-4 space-y-6 no-scrollbar">
                        {modalType === 'filter' && (
                            <>
                                {/* Pihak */}
                                <div>
                                    <h3 className="font-semibold text-sm mb-3">Pihak</h3>
                                    <div className="flex flex-wrap gap-2.5">
                                        {[
                                            { id: 'all', label: 'Semua' },
                                            { id: 'Pria', label: 'Pria' },
                                            { id: 'Wanita', label: 'Wanita' }
                                        ].map((opt) => {
                                            const isSelected = filterSide === opt.id;
                                            return (
                                                <button 
                                                    key={opt.id}
                                                    onClick={() => setFilterSide(opt.id)}
                                                    className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors border ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:bg-muted/50'} flex items-center gap-1.5`}
                                                >
                                                    {opt.label}
                                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Relasi Filter */}
                                <div>
                                    <h3 className="font-semibold text-sm mb-3">Relasi</h3>
                                    <div className="flex flex-wrap gap-2.5">
                                        <button 
                                            onClick={() => setFilterRelation('all')}
                                            className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors border ${filterRelation === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:bg-muted/50'} flex items-center gap-1.5`}
                                        >
                                            Semua
                                            {filterRelation === 'all' && <Check className="w-3.5 h-3.5" />}
                                        </button>
                                        {relationsData.map(rel => {
                                            const isSelected = filterRelation === rel.id.toString();
                                            return (
                                                <button 
                                                    key={rel.id}
                                                    onClick={() => setFilterRelation(rel.id.toString())}
                                                    className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors border ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border hover:bg-muted/50'} flex items-center gap-1.5`}
                                                >
                                                    {rel.name}
                                                    {isSelected && <Check className="w-3.5 h-3.5" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                        
                        {modalType === 'sort' && (
                            <div className="space-y-0.5">
                                {[
                                    { id: 'Terbaru', field: 'created_at', dir: 'desc' },
                                    { id: 'Terlama', field: 'created_at', dir: 'asc' },
                                    { id: 'Nominal: Tertinggi ke Terendah', field: 'nominal', dir: 'desc' },
                                    { id: 'Nominal: Terendah ke Tertinggi', field: 'nominal', dir: 'asc' }
                                ].map((opt) => {
                                    const isSelected = sortBy === opt.field && sortDir === opt.dir;
                                    return (
                                        <button 
                                            key={opt.id}
                                            onClick={() => { setSortBy(opt.field); setSortDir(opt.dir as 'asc'|'desc'); }}
                                            className="w-full flex items-center justify-between py-3 bg-transparent transition-colors text-left"
                                        >
                                            <span className={`text-[13.5px] ${isSelected ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>{opt.id}</span>
                                            <div className={`w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center ${isSelected ? 'border-primary' : 'border-border'}`}>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-primary"></div>}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                        
                    </div>
                    
                    <div className="pt-3 shrink-0 mt-3 flex flex-col gap-2.5">
                        <button 
                            onClick={() => setModalType(null)} 
                            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors"
                        >
                            {modalType === 'filter' ? `Terapkan (${(filterSide !== 'all' ? 1 : 0) + (filterRelation !== 'all' ? 1 : 0)})` : 'Terapkan'}
                        </button>
                    </div>
                </div>
            </div>
        )}

      {/* Relation Settings Modal (Floating Match Image Design) */}
        {isRelationDialogOpen && (
            <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsRelationDialogOpen(false)}></div>
                <div className="relative bg-background rounded-[2rem] w-full max-w-[400px] p-6 pb-8 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
                    
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold">Daftar Relasi</h2>
                        <button onClick={() => setIsRelationDialogOpen(false)} className="p-2 -mr-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[13px] text-muted-foreground mb-5 leading-relaxed">Kelola daftar relasi untuk mempermudah pencatatan.</p>

                    {/* Input Tambah Relasi */}
                    <div className="flex gap-2.5 mb-5">
                        <div className="relative flex-1">
                            <Input
                                placeholder="Ketik nama relasi baru..."
                                value={newRelation}
                                onChange={(e) => setNewRelation(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddRelation();
                                    }
                                }}
                                className="pl-4 h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary shadow-none text-[13.5px]"
                            />
                        </div>
                        <button 
                            onClick={handleAddRelation} 
                            disabled={createRelMut.isPending || !newRelation.trim()} 
                            className="h-11 px-4 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50 transition-colors shadow-sm hover:bg-primary/90 flex items-center gap-2 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Tambah</span>
                        </button>
                    </div>

                    {/* Daftar Relasi */}
                    <div className="overflow-y-auto max-h-[45vh] pr-2 -mr-2">
                        <div className="flex flex-col rounded-2xl bg-muted/30 overflow-hidden border border-border/50">
                            {relationsData.map((rel, i) => (
                                <div key={rel.id} className={`flex items-center justify-between p-3.5 ${i !== 0 ? 'border-t border-border/50' : ''}`}>
                                    <span className="font-semibold text-[13.5px]">{rel.name}</span>
                                    <button
                                        onClick={() => handleDeleteRelation(rel.id)}
                                        disabled={deleteRelMut.isPending}
                                        className="p-1.5 -mr-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors disabled:opacity-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {relationsData.length === 0 && (
                                <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
                                    <Inbox className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-[13px] font-medium">Belum ada relasi tersimpan.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}

      {/* Modal Tambah/Edit Catatan (Mobile App Bottom Sheet Style) */}
        {isCreateDialogOpen && (
            <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setIsCreateDialogOpen(false)}></div>
                <div className="relative bg-background rounded-[2rem] w-full max-w-[400px] p-6 pb-6 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85vh] flex flex-col">
                    
                    <div className="flex items-center justify-between mb-5 shrink-0 relative">
                        <h2 className="text-[15px] font-bold w-full text-center">
                            {editingId ? 'Edit Catatan' : 'Tambah Catatan'}
                        </h2>
                        <button onClick={() => setIsCreateDialogOpen(false)} className="absolute right-0 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 space-y-4 no-scrollbar">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Nama Pasangan</Label>
                            <Input 
                                placeholder="Cth: Rizky & Bunga" 
                                value={formData.couple}
                                onChange={(e) => setFormData({...formData, couple: e.target.value})}
                                className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Relasi</Label>
                                <Select value={formData.relation} onValueChange={(v) => setFormData({...formData, relation: v})}>
                                    <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus:ring-primary shadow-none">
                                        <SelectValue placeholder="Pilih..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl">
                                        {relationsData.map(rel => (
                                            <SelectItem key={rel.id} value={rel.id.toString()}>{rel.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2.5">
                                <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Dari Pihak</Label>
                                <div className="flex bg-muted/40 p-1 rounded-xl h-11">
                                    <button 
                                        onClick={() => setFormData({...formData, side: 'Pria'})}
                                        className={`flex-1 flex items-center justify-center text-[13px] font-semibold rounded-lg transition-all ${formData.side === 'Pria' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Pria
                                    </button>
                                    <button 
                                        onClick={() => setFormData({...formData, side: 'Wanita'})}
                                        className={`flex-1 flex items-center justify-center text-[13px] font-semibold rounded-lg transition-all ${formData.side === 'Wanita' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Wanita
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Jenis Pemberian</Label>
                            <div className="flex bg-muted/40 p-1 rounded-xl h-11">
                                <button 
                                    onClick={() => setFormData({...formData, giftType: 'Uang'})}
                                    className={`flex-1 flex items-center justify-center text-[13px] font-semibold rounded-lg transition-all ${formData.giftType === 'Uang' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Uang Tunai
                                </button>
                                <button 
                                    onClick={() => setFormData({...formData, giftType: 'Kado'})}
                                    className={`flex-1 flex items-center justify-center text-[13px] font-semibold rounded-lg transition-all ${formData.giftType === 'Kado' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    Kado Barang
                                </button>
                            </div>
                        </div>
                        {formData.giftType === 'Kado' && (
                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Nama Barang / Kado</Label>
                                <Input 
                                    placeholder="Cth: Bed Cover Set" 
                                    value={formData.giftName}
                                    onChange={(e) => setFormData({...formData, giftName: e.target.value})}
                                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                                />
                            </div>
                        )}
                        <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">Nominal / Estimasi Harga</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-[13px] font-bold pointer-events-none">Rp</span>
                                <Input 
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="0" 
                                    className="pl-10 h-12 rounded-xl bg-muted/20 border-border/60 text-[15px] font-semibold focus-visible:ring-primary shadow-none"
                                    value={formData.nominal ? parseInt(formData.nominal).toLocaleString('id-ID') : ''}
                                    onChange={(e) => {
                                        const numericVal = e.target.value.replace(/\D/g, '')
                                        setFormData({...formData, nominal: numericVal})
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-2 shrink-0 mt-2 mb-1">
                        <button 
                            onClick={handleSaveKondangan} 
                            disabled={createMut.isPending || updateMut.isPending}
                            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-[14px] font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {editingId ? 'Simpan Perubahan' : 'Simpan Catatan'}
                        </button>
                    </div>
                </div>
            </div>
        )}

      {/* Delete Relation Confirmation */}
      <AlertDialog open={!!deleteRelationId} onOpenChange={(open) => !open && setDeleteRelationId(null)}>
        <AlertDialogContent className="w-[90vw] max-w-[400px] rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Relasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Relasi ini akan dihapus secara permanen. Pastikan tidak ada catatan kondangan yang masih menggunakan relasi ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteRelation} className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Kondangan Confirmation */}
      <AlertDialog open={!!deleteKondanganId} onOpenChange={(open) => !open && setDeleteKondanganId(null)}>
        <AlertDialogContent className="w-[90vw] max-w-[400px] rounded-[24px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Catatan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus catatan kondangan ini? Data akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteKondangan} className="rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  )
}
