'use client'

import React, { useState } from 'react'
import { MainLayout } from '@/src/presentation/components/layout/main-layout'
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
  NotebookTabs
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/src/presentation/components/ui/dialog'
import { Label } from '@/src/presentation/components/ui/label'
import { Card, CardContent } from '@/src/presentation/components/ui/card'
import { Button } from '@/src/presentation/components/ui/button'
import { Input } from '@/src/presentation/components/ui/input'
import { Badge } from '@/src/presentation/components/ui/badge'
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

  const { data: listResponse, isLoading } = useKondangans({
      page: page,
      page_size: parseInt(pageSize),
      search: searchQuery,
      relation_id: filterRelation === 'all' ? undefined : parseInt(filterRelation),
      side: filterSide === 'all' ? undefined : filterSide,
  })

  const { data: stats } = useKondanganStats()

  const createMut = useCreateKondangan()
  const updateMut = useUpdateKondangan()
  const deleteMut = useDeleteKondangan()

  const [editingId, setEditingId] = useState<string | null>(null)

  const [isRelationDialogOpen, setIsRelationDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newRelation, setNewRelation] = useState('')

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
              onSuccess: () => setNewRelation('')
          })
      }
  }

  const handleDeleteRelation = (id: number) => {
      if(confirm('Yakin ingin menghapus relasi ini?')) {
          deleteRelMut.mutate(id, {
              onError: (error: any) => {
                  alert("Gagal menghapus relasi. Pastikan tidak ada data kondangan yang masih menggunakan relasi ini.");
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
      if(confirm('Yakin ingin menghapus catatan ini?')) {
          deleteMut.mutate(id)
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
    <MainLayout>
      <div className="space-y-6 pb-8">
        
        {/* Page Header */}
        <div className="mb-8">
            <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <NotebookTabs strokeWidth={1.5} className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Catatan Kondangan</h2>
                    <p className="text-sm text-muted-foreground">Kelola daftar pernikahan yang dihadiri beserta rincian pengeluaran</p>
                </div>
            </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/50 shadow-sm flex flex-col justify-center">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1 sm:space-y-2">
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total Catatan</p>
                            <p className="text-lg sm:text-2xl font-bold tracking-tight">{stats?.total_kondangan || 0}</p>
                            <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs">
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                    <Wallet className="h-3 w-3" /> {stats?.total_uang || 0} Uang
                                </span>
                                <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                                    <Gift className="h-3 w-3" /> {stats?.total_kado || 0} Kado
                                </span>
                            </div>
                        </div>
                        <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950/50">
                            <Users strokeWidth={1.5} className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm flex flex-col justify-center">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1 sm:space-y-2">
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Total Pengeluaran</p>
                            <p className="text-lg sm:text-2xl font-bold tracking-tight">{formatCurrency(stats?.total_pengeluaran || 0)}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Akumulasi keseluruhan</p>
                        </div>
                        <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/50">
                            <CreditCard strokeWidth={1.5} className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm flex flex-col justify-center">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1 sm:space-y-2">
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Rata-rata Pengeluaran</p>
                            <p className="text-lg sm:text-2xl font-bold tracking-tight">{formatCurrency(stats?.rata_rata || 0)}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Per satu kali pemberian</p>
                        </div>
                        <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
                            <Receipt strokeWidth={1.5} className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm flex flex-col justify-center">
                <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1 sm:space-y-2">
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">Pemberian Terbesar</p>
                            <p className="text-lg sm:text-2xl font-bold tracking-tight">{formatCurrency(Math.max(stats?.max_uang || 0, stats?.max_kado || 0))}</p>
                            <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Rekor tertinggi
                            </p>
                        </div>
                        <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/50">
                            <Gift strokeWidth={1.5} className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600 dark:text-rose-400" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Main Content Card (Matching guests/page.tsx style, no tabs, no checkbox) */}
        <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6">
                
                {/* Primary Filter Row */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex gap-2 flex-1">
                        <Select value={pageSize} onValueChange={setPageSize}>
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
                            </SelectContent>
                        </Select>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input 
                                placeholder="Cari pasangan, lokasi, atau relasi..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => setIsRelationDialogOpen(true)}>
                            <Settings2 className="mr-2 h-4 w-4" />
                            Atur Relasi
                        </Button>
                        <Button onClick={handleOpenCreate}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Catatan
                        </Button>
                    </div>
                </div>

                {/* Secondary (Custom) Filter Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Select value={filterRelation} onValueChange={setFilterRelation}>
                        <SelectTrigger>
                            <SelectValue placeholder="Semua Relasi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Relasi</SelectItem>
                            {relationsData.map(rel => (
                                <SelectItem key={rel.id} value={rel.id.toString()}>{rel.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filterSide} onValueChange={setFilterSide}>
                        <SelectTrigger>
                            <SelectValue placeholder="Semua Pihak" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Pihak</SelectItem>
                            <SelectItem value="pria">Pihak Pria</SelectItem>
                            <SelectItem value="wanita">Pihak Wanita</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table Container */}
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead><SortButton>Pasangan Pengantin</SortButton></TableHead>
                                <TableHead>Relasi</TableHead>
                                <TableHead>Pemberian</TableHead>
                                <TableHead className="text-right">Nominal</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Memuat data...</TableCell>
                                </TableRow>
                            ) : listResponse?.items?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Tidak ada catatan ditemukan</TableCell>
                                </TableRow>
                            ) : listResponse?.items?.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="font-semibold text-sm">{item.couple_name}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5 items-start">
                                            <Badge variant="secondary" className="text-[10px] font-medium">
                                                {item.relation}
                                            </Badge>
                                            <span className="text-[10px] text-muted-foreground px-1 uppercase tracking-wider font-semibold">
                                                PIHAK {item.side}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm">
                                            {item.gift_type === 'Uang' ? (
                                                <>
                                                    <Wallet className="h-4 w-4 text-emerald-500 shrink-0" />
                                                    <span>Uang</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Gift className="h-4 w-4 text-purple-500 shrink-0" />
                                                    <span className="truncate max-w-[150px]">{item.gift_name}</span>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {formatCurrency(item.nominal)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1 flex-wrap">
                                            <Button size="action" variant="soft-accent" title="Edit" onClick={() => handleEdit(item)}>
                                                <Edit className="h-4 w-4 mr-1" /> Edit
                                            </Button>
                                            <Button size="action" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" title="Hapus" onClick={() => handleDelete(item.id)}>
                                                <Trash2 className="h-4 w-4 mr-1" /> Hapus
                                            </Button>
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
                        Menampilkan {listResponse?.items?.length || 0} catatan
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Sebelumnya
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={!listResponse?.total_pages || page >= listResponse.total_pages}
                        >
                            Selanjutnya
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>

            </CardContent>
        </Card>

      </div>

      {/* Dialog Pengaturan Relasi */}
      <Dialog open={isRelationDialogOpen} onOpenChange={setIsRelationDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Pengaturan Relasi</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                  <div className="flex gap-2">
                      <Input 
                          placeholder="Tambah relasi baru..." 
                          value={newRelation} 
                          onChange={(e) => setNewRelation(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddRelation()}
                          className="flex-1"
                      />
                      <Button onClick={handleAddRelation} type="button" className="shrink-0">Tambah</Button>
                  </div>
                  <div className="rounded-md border p-4 space-y-2">
                      {relationsData.map(rel => (
                          <div key={rel.id} className="flex items-center justify-between py-2 border-b last:border-0 gap-2">
                              <span className="text-sm font-medium break-all line-clamp-2 flex-1">{rel.name}</span>
                              <Button variant="ghost" size="sm" className="text-destructive shrink-0" onClick={() => handleDeleteRelation(rel.id)}>
                                  <Trash2 className="h-4 w-4" />
                              </Button>
                          </div>
                      ))}
                      {relationsData.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">Belum ada relasi</p>
                      )}
                  </div>
              </div>
          </DialogContent>
      </Dialog>

      {/* Dialog Tambah Catatan */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Tambah Catatan Kondangan</DialogTitle>
                  <DialogDescription>Masukkan detail pemberian kondangan baru.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                  <div className="space-y-2">
                      <Label>Nama Pasangan / Penerima</Label>
                      <Input 
                          placeholder="Cth: Rizky & Bunga" 
                          value={formData.couple}
                          onChange={(e) => setFormData({...formData, couple: e.target.value})}
                      />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label>Relasi</Label>
                          <Select value={formData.relation} onValueChange={(v) => setFormData({...formData, relation: v})}>
                              <SelectTrigger>
                                  <SelectValue placeholder="Pilih Relasi" />
                              </SelectTrigger>
                              <SelectContent>
                                  {relationsData.map(rel => (
                                      <SelectItem key={rel.id} value={rel.id.toString()}>{rel.name}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="space-y-2">
                          <Label>Dari Pihak</Label>
                          <Select 
                              value={formData.side} 
                              onValueChange={(val) => setFormData({...formData, side: val})}
                          >
                              <SelectTrigger>
                                  <SelectValue placeholder="Pilih Pihak" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="Pria">Pihak Pria</SelectItem>
                                  <SelectItem value="Wanita">Pihak Wanita</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                  </div>
                  <div className="space-y-2">
                      <Label>Jenis Pemberian</Label>
                      <Select 
                          value={formData.giftType} 
                          onValueChange={(val) => setFormData({...formData, giftType: val})}
                      >
                          <SelectTrigger>
                              <SelectValue placeholder="Pilih Jenis" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Uang">Uang</SelectItem>
                              <SelectItem value="Kado">Kado / Barang</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  {formData.giftType === 'Kado' && (
                      <div className="space-y-2">
                          <Label>Nama Barang / Kado</Label>
                          <Input 
                              placeholder="Cth: Bed Cover Set" 
                              value={formData.giftName}
                              onChange={(e) => setFormData({...formData, giftName: e.target.value})}
                          />
                      </div>
                  )}
                  <div className="space-y-2">
                      <Label>Nominal / Estimasi Harga</Label>
                      <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">Rp</span>
                          <Input 
                              type="text"
                              placeholder="0" 
                              className="pl-9"
                              value={formData.nominal ? parseInt(formData.nominal).toLocaleString('id-ID') : ''}
                              onChange={(e) => {
                                  const numericVal = e.target.value.replace(/\D/g, '')
                                  setFormData({...formData, nominal: numericVal})
                              }}
                          />
                      </div>
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Batal</Button>
                  <Button onClick={handleSaveKondangan}>Simpan Catatan</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
