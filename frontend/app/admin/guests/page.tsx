"use client";

import { useState, useEffect } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Filter,
  ArrowDownUp,
  ArrowUpDown,
  Plus,
  Check,
  Settings,
  Settings2,
  X,
  Inbox,
  BookHeart,
  Send,
  ArchiveRestore,
} from "lucide-react";

import { MainLayout } from "@/src/presentation/components/layout/main-layout";
import { ProtectedRoute } from "@/src/presentation/components/layout/protected-route";
import {
  ProtectedModule,
  ProtectedFeature,
} from "@/src/presentation/components/layout/protected-feature";
import { Button } from "@/src/presentation/components/ui/button";
import { Input } from "@/src/presentation/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/presentation/components/ui/table";
import { Badge } from "@/src/presentation/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/presentation/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/presentation/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/presentation/components/ui/alert-dialog";
import { Label } from "@/src/presentation/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/presentation/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/src/presentation/components/ui/alert";
import { Textarea } from "@/src/presentation/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/presentation/components/ui/tabs";
import { Checkbox } from "@/src/presentation/components/ui/checkbox";
import {
  Search,
  UserPlus,
  Edit,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  QrCode,
  RotateCcw,
  Users,
  UserX,
  User,
  Instagram,
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  UserRound,
} from "lucide-react";
import {
  useGuests,
  useCreateGuest,
  useUpdateGuest,
  useDeleteGuest,
  useGuestCategories,
  useDeletedGuests,
  useRestoreGuest,
  useUpdateGuestStatusSent,
  usePreviewImport,
  useExecuteImport,
  useCreateGuestCategory,
  useUpdateGuestCategory,
  useDeleteGuestCategory,
} from "@/src/application/hooks/use-guest-query";
import {
  guestService,
  Guest,
  GuestListParams,
} from "@/src/domain/services/guest.service";
import { Progress } from "@/src/presentation/components/ui/progress";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { QRCodeSVG } from "qrcode.react";

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
  const router = useRouter();
  const [modalType, setModalType] = useState<"filter" | "sort" | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("active");
  const [selectedGuestIds, setSelectedGuestIds] = useState<string[]>([]);

  // Query params state
  const [queryParams, setQueryParams] = useState<GuestListParams>({
    page: 1,
    page_size: 10,
    search: "",
    category_id: undefined,
    status_attending: undefined,
    status_sent: undefined,
    is_checked_in: undefined,
    sort_by: "created_at",
    sort_dir: "desc",
  });

  const [deletedQueryParams, setDeletedQueryParams] = useState<GuestListParams>(
    {
      page: 1,
      page_size: 10,
      search: "",
      sort_by: "created_at",
      sort_dir: "desc",
    },
  );

  const [searchInput, setSearchInput] = useState("");
  const [deletedSearchInput, setDeletedSearchInput] = useState("");
  const [error, setError] = useState("");

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [isSendMessageDialogOpen, setIsSendMessageDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [messageType, setMessageType] = useState<
    "whatsapp" | "instagram" | null
  >(null);

  // Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreviewData, setImportPreviewData] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    guest_category_id: 0,
    phone_number: "",
    instagram_username: "",
    address: "",
    note: "",
    status_attending: "pending",
    status_sent: "pending",
  });

  // API hooks
  const { data: guestsData, isLoading, isFetching } = useGuests(queryParams);
  const { data: deletedGuestsData, isLoading: isLoadingDeleted, isFetching: isFetchingDeleted } =
    useDeletedGuests(deletedQueryParams);
  const { data: categoriesData } = useGuestCategories({ page_size: 100 });

  const createCategory = useCreateGuestCategory();
  const updateCategory = useUpdateGuestCategory();
  const deleteCategory = useDeleteGuestCategory();

  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [categoryName, setCategoryName] = useState("");
  const [deleteCategoryItem, setDeleteCategoryItem] = useState<any>(null);

  // Prevent body scroll when custom modals are open
  useEffect(() => {
    if (
      modalType || 
      isCategoryModalOpen || 
      isCreateDialogOpen || 
      isEditDialogOpen || 
      isImportModalOpen || 
      isQRDialogOpen
    ) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [
    modalType, 
    isCategoryModalOpen, 
    isCreateDialogOpen, 
    isEditDialogOpen, 
    isImportModalOpen, 
    isQRDialogOpen
  ]);

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
      setQueryParams((prev) => ({ ...prev, page: 1, search: searchInput }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Debounced search for deleted guests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDeletedQueryParams((prev) => ({
        ...prev,
        page: 1,
        search: deletedSearchInput,
      }));
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
      setError("Minimal salah satu No. HP atau Instagram harus diisi");
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
      toast.success("Tamu berhasil ditambahkan");
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menambah tamu");
    }
  };

  const handleUpdateGuest = async () => {
    if (!selectedGuest) return;

    // Validation: either phone or instagram must be filled
    if (!formData.phone_number && !formData.instagram_username) {
      setError("Minimal salah satu No. HP atau Instagram harus diisi");
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
      toast.success("Tamu berhasil diperbarui");
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memperbarui tamu");
    }
  };

  const handleDeleteGuest = async () => {
    if (!selectedGuest) return;
    try {
      await deleteGuest.mutateAsync(selectedGuest.id);
      setIsDeleteDialogOpen(false);
      setSelectedGuest(null);
      toast.error("Tamu berhasil dihapus", { icon: "🗑️" });
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menghapus tamu");
    }
  };

  const handleRestoreGuest = async () => {
    if (!selectedGuest) return;
    try {
      await restoreGuest.mutateAsync(selectedGuest.id);
      setIsRestoreDialogOpen(false);
      setSelectedGuest(null);
      toast.success("Tamu berhasil dipulihkan");
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal memulihkan tamu");
    }
  };

  const handleConfirmSendMessage = async () => {
    if (!selectedGuest || !messageType) return;

    const url =
      messageType === "whatsapp"
        ? `https://wa.me/${selectedGuest.phone_number}`
        : `https://instagram.com/${selectedGuest.instagram_username}`;

    window.open(url, "_blank");

    try {
      await updateStatusSent.mutateAsync({
        id: selectedGuest.id,
        status: "sent",
      });
      setIsSendMessageDialogOpen(false);
      setSelectedGuest(null);
      setMessageType(null);
      toast.success("Status undangan berhasil diperbarui menjadi Terkirim");
    } catch {
      toast.error("Gagal memperbarui status undangan");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      guest_category_id: categoriesData?.items[0]?.id || 0,
      phone_number: "",
      instagram_username: "",
      address: "",
      note: "",
      status_attending: "pending",
      status_sent: "pending",
    });
    setSelectedGuest(null);
    setError("");
  };

  const handleExport = async () => {
    try {
      const blob = await guestService.exportGuests();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `guests_export_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Tamu berhasil diekspor");
    } catch {
      toast.error("Gagal mengekspor tamu");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await guestService.getTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "guests_import_template.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast.error("Gagal mengunduh template");
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
      toast.error(
        err.response?.data?.message || "Gagal melihat pratinjau file",
      );
    }
  };

  const handleConfirmImport = async () => {
    if (!importPreviewData) return;

    const validItems = importPreviewData.items.filter(
      (item: any) => item.is_valid,
    );
    if (validItems.length === 0) {
      toast.error("Tidak ada item valid untuk diimpor");
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
        await executeImport.mutateAsync(
          chunk.map((item: any) => ({
            name: item.name,
            guest_category_id: item.guest_category_id,
            phone_number: item.phone_number,
            instagram_username: item.instagram_username,
            address: item.address,
            note: item.note,
          })),
        );

        processedCount += chunk.length;
        setImportProgress(Math.round((processedCount / totalItems) * 100));
      }

      toast.success(`Berhasil mengimpor ${processedCount} tamu`);
      setIsImportModalOpen(false);
      resetImportState();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Gagal mengimpor tamu");
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
    if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
      setImportFile(file);
    } else {
      toast.error("Unggah file Excel yang valid (.xlsx atau .xls)");
    }
  };

  const openEditDialog = (guest: Guest) => {
    setSelectedGuest(guest);
    setFormData({
      name: guest.name,
      guest_category_id: guest.guest_category_id,
      phone_number: guest.phone_number || "",
      instagram_username: guest.instagram_username || "",
      address: guest.address || "",
      note: guest.note || "",
      status_attending: guest.status_attending,
      status_sent: guest.status_sent,
    });
    setIsEditDialogOpen(true);
  };

  const handleSort = (field: string) => {
    if (field !== "name") return;
    setQueryParams((prev) => ({
      ...prev,
      sort_by: field,
      sort_dir:
        prev.sort_by === field && prev.sort_dir === "asc" ? "desc" : "asc",
    }));
  };

  const SortButton = ({
    field,
    children,
  }: {
    field: string;
    children: React.ReactNode;
  }) => {
    const isActive = queryParams.sort_by === field;
    return (
      <button
        className={`flex items-center gap-1 hover:text-foreground ${isActive ? "text-foreground font-bold" : ""}`}
        onClick={() => handleSort(field)}
      >
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "going":
        return <Badge variant="default">Hadir</Badge>;
      case "not_going":
        return <Badge variant="destructive">Tidak Hadir</Badge>;
      case "pending":
        return <Badge variant="secondary">Menunggu</Badge>;
      case "sent":
        return <Badge variant="default">Terkirim</Badge>;
      case "not_sent":
        return <Badge variant="secondary">Belum Dikirim</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const toggleSelectGuest = (id: string) => {
    setSelectedGuestIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedGuestIds.length === guestsData?.items.length) {
      setSelectedGuestIds([]);
    } else {
      setSelectedGuestIds(guestsData?.items.map((g) => g.id) || []);
    }
  };

  const allItems =
    activeTab === "active"
      ? guestsData?.items || []
      : deletedGuestsData?.items || [];
  const hasNextPage =
    activeTab === "active"
      ? guestsData &&
        queryParams.page! * queryParams.page_size! < guestsData.total
      : deletedGuestsData &&
        deletedQueryParams.page! * deletedQueryParams.page_size! <
          deletedGuestsData.total;

  const fetchNextPage = () => {
    if (activeTab === "active") {
      setQueryParams((prev) => ({ ...prev, page_size: (prev.page_size || 10) + 10 }));
    } else {
      setDeletedQueryParams((prev) => ({
        ...prev,
        page_size: (prev.page_size || 10) + 10,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 relative font-sans transition-colors duration-300">
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-primary/10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] px-5 py-4 flex items-center justify-between mb-8 transition-all">
        <Link 
            href="/admin"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
        >
            <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-[18px] font-extrabold tracking-tight absolute left-1/2 -translate-x-1/2 text-foreground">
            Buku Tamu
        </h1>
        <div className="w-10 shrink-0" />
      </div>

      <div className="px-5">
        {/* Search and Filters */}
        <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Cari nama tamu..."
                value={
                  activeTab === "active" ? searchInput : deletedSearchInput
                }
                onChange={(e) =>
                  activeTab === "active"
                    ? setSearchInput(e.target.value)
                    : setDeletedSearchInput(e.target.value)
                }
                className="pl-11 rounded-full bg-card border-border/60 shadow-sm h-11 text-[13.5px] focus-visible:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setModalType("sort")}
                className={`flex items-center justify-center w-11 h-11 rounded-full shadow-sm transition-colors border ${
                  queryParams.sort_by
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => setModalType("filter")}
                className={`flex items-center justify-center w-11 h-11 rounded-full shadow-sm transition-colors border ${
                  queryParams.category_id ||
                  queryParams.status_attending ||
                  queryParams.status_sent ||
                  activeTab === "deleted"
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
            Semua Tamu (
            {isLoading || isLoadingDeleted 
              ? "..." 
              : activeTab === "active"
                ? guestsData?.total || 0
                : deletedGuestsData?.total || 0}
            )
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="text-[12px] font-bold text-primary flex items-center gap-1.5 hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              Impor
            </button>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="text-[12px] font-bold text-primary flex items-center gap-1.5 hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95"
            >
              <Settings className="w-3.5 h-3.5" />
              Atur Kategori
            </button>
          </div>
        </div>

        {/* Card List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {isLoading || isLoadingDeleted ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary/50" />
              <p className="text-[13px]">Mengambil data tamu...</p>
            </div>
          ) : allItems.length === 0 ? (
            <div className="col-span-full w-full flex-1 flex flex-col items-center justify-center space-y-6 py-12">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <BookHeart className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center w-full px-4">
                <h2 className="text-[19px] font-bold tracking-tight mb-2 text-foreground">Belum ada tamu</h2>
                <p className="text-[13px] text-muted-foreground leading-snug">
                  {searchInput || deletedSearchInput
                    ? "Tidak ada tamu yang cocok dengan pencarian"
                    : "Mulai tambahkan tamu undangan Anda"}
                </p>
              </div>
            </div>
          ) : (
            allItems.map((guest) => (
              <div
                key={guest.id}
                className="bg-card rounded-[24px] p-4 shadow-sm border border-border/50 relative overflow-hidden"
              >
                {/* Header: Category and Name */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-[15px] text-foreground tracking-tight leading-none">
                          {guest.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                          {guest.category_name}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        guest.status_attending === "going"
                          ? "bg-green-500/10 text-green-600"
                          : guest.status_attending === "not_going"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {guest.status_attending === "going"
                        ? "Hadir"
                        : guest.status_attending === "not_going"
                          ? "Absen"
                          : "Menunggu"}
                    </span>
                  </div>
                </div>

                {/* Body: Contact and Undangan Status in styled boxes */}
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="bg-muted/30 p-3 rounded-2xl border border-border/30">
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Kontak
                    </p>
                    <div className="flex items-center">
                      {guest.phone_number ? (
                        <a
                          href={`https://wa.me/${guest.phone_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[13px] text-emerald-600 font-semibold active:scale-95 transition-transform hover:opacity-80 truncate"
                        >
                          <Whatsapp className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{guest.phone_number}</span>
                        </a>
                      ) : guest.instagram_username ? (
                        <a
                          href={`https://instagram.com/${guest.instagram_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[13px] text-pink-600 font-semibold active:scale-95 transition-transform hover:opacity-80 truncate"
                        >
                          <Instagram className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">@{guest.instagram_username}</span>
                        </a>
                      ) : (
                        <span className="text-[13px] text-muted-foreground font-medium">
                          -
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded-2xl border ${
                      guest.status_sent === "sent"
                        ? "bg-primary/5 border-primary/10"
                        : "bg-muted/30 border-border/30"
                    }`}
                  >
                    <p
                      className={`text-[9px] font-semibold uppercase tracking-wider mb-1 ${
                        guest.status_sent === "sent"
                          ? "text-primary/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      Undangan
                    </p>
                    <div
                      className={`text-[13px] font-bold ${
                        guest.status_sent === "sent"
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {guest.status_sent === "sent"
                        ? "Terkirim"
                        : "Belum Dikirim"}
                    </div>
                  </div>
                </div>

                {/* Mobile App Style Actions Footer */}
                <div className="grid grid-cols-4 mt-4 pt-3 border-t border-border/40 divide-x divide-border/40">
                  <button
                    onClick={() => {
                      setSelectedGuest(guest);
                      setIsQRDialogOpen(true);
                    }}
                    className="flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors active:bg-muted/30"
                  >
                    <QrCode className="w-4 h-4 mb-0.5" /> QR
                  </button>

                  {guest.phone_number || guest.instagram_username ? (
                    <button
                      onClick={() => {
                        setSelectedGuest(guest);
                        setMessageType(
                          guest.phone_number ? "whatsapp" : "instagram",
                        );
                        setIsSendMessageDialogOpen(true);
                      }}
                      className="flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors active:bg-muted/30"
                    >
                      <div className="flex justify-center items-center h-4 mb-0.5">
                        {guest.phone_number ? (
                          <Whatsapp className="w-4 h-4" />
                        ) : (
                          <Instagram className="w-4 h-4" />
                        )}
                      </div>
                      Kirim
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium text-muted-foreground/30 cursor-not-allowed"
                    >
                      <div className="flex justify-center items-center h-4 mb-0.5">
                        <Whatsapp className="w-4 h-4" />
                      </div>
                      Kirim
                    </button>
                  )}

                  <button
                    onClick={() => openEditDialog(guest)}
                    className="flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors active:bg-muted/30"
                  >
                    <Edit className="w-4 h-4 mb-0.5" /> Edit
                  </button>

                  {activeTab === "active" ? (
                    <button
                      onClick={() => {
                        setSelectedGuest(guest);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium text-muted-foreground hover:text-destructive transition-colors active:bg-muted/30"
                    >
                      <Trash2 className="w-4 h-4 mb-0.5" /> Hapus
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedGuest(guest);
                        setIsRestoreDialogOpen(true);
                      }}
                      className="flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium text-green-600 hover:text-green-700 transition-colors active:bg-green-600/10"
                    >
                      <RotateCcw className="w-4 h-4 mb-0.5" /> Pulihkan
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {hasNextPage && (
          <div className="flex justify-center mt-6 mb-10">
            <button
              onClick={fetchNextPage}
              disabled={isFetching || isFetchingDeleted}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-full text-[13px] font-medium disabled:opacity-50 shadow-sm transition-opacity cursor-pointer active:scale-95"
            >
              {isFetching || isFetchingDeleted
                ? "Memuat..."
                : "Tampilkan Lainnya"}
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {activeTab === "active" && (
        <button
          onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }}
          className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-40 flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-md active:scale-95 cursor-pointer hover:shadow-lg transition-all hover:bg-primary/90"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Filter & Sort Modals */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setModalType(null)}
          ></div>
          <div className="relative bg-background rounded-[2rem] w-full max-w-[400px] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between mb-6 shrink-0 relative">
              {modalType === "filter" && (
                <button
                  onClick={() => {
                    setQueryParams((prev) => ({
                      ...prev,
                      page: 1,
                      category_id: undefined,
                      status_attending: undefined,
                      status_sent: undefined,
                      is_checked_in: undefined,
                    }));
                  }}
                  className="absolute left-0 text-destructive font-semibold text-[13px] cursor-pointer"
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
                  <div>
                    <h3 className="font-semibold text-sm mb-3">Status Data</h3>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() => setActiveTab("active")}
                        className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors border ${
                          activeTab === "active"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-muted-foreground border-border hover:bg-muted/50"
                        } flex items-center gap-1.5 cursor-pointer`}
                      >
                        Aktif {guestsData?.total ? `(${guestsData.total})` : ""}
                        {activeTab === "active" && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => setActiveTab("deleted")}
                        className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors border ${
                          activeTab === "deleted"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-muted-foreground border-border hover:bg-muted/50"
                        } flex items-center gap-1.5 cursor-pointer`}
                      >
                        Dihapus {deletedGuestsData?.total ? `(${deletedGuestsData.total})` : ""}
                        {activeTab === "deleted" && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-3">Kategori</h3>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() =>
                          setQueryParams((p) => ({
                            ...p,
                            page: 1,
                            category_id: undefined,
                          }))
                        }
                        className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors border ${
                          !queryParams.category_id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-transparent text-muted-foreground border-border hover:bg-muted/50"
                        } flex items-center gap-1.5 cursor-pointer`}
                      >
                        Semua
                        {!queryParams.category_id && (
                          <Check className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {categoriesData?.items.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() =>
                            setQueryParams((p) => ({
                              ...p,
                              page: 1,
                              category_id: cat.id,
                            }))
                          }
                          className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors border ${
                            queryParams.category_id === cat.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-transparent text-muted-foreground border-border hover:bg-muted/50"
                          } flex items-center gap-1.5 cursor-pointer`}
                        >
                          {cat.name}
                          {queryParams.category_id === cat.id && (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-3">
                      Status Undangan
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        { id: undefined, label: "Semua" },
                        { id: "sent", label: "Terkirim" },
                        { id: "pending", label: "Belum" },
                      ].map((opt) => (
                        <button
                          key={opt.id || "all"}
                          onClick={() =>
                            setQueryParams((p) => ({
                              ...p,
                              page: 1,
                              status_sent: opt.id as any,
                            }))
                          }
                          className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors border ${
                            queryParams.status_sent === opt.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-transparent text-muted-foreground border-border hover:bg-muted/50"
                          } flex items-center gap-1.5 cursor-pointer`}
                        >
                          {opt.label}
                          {queryParams.status_sent === opt.id && (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-3">Status RSVP</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        { id: undefined, label: "Semua" },
                        { id: "going", label: "Hadir" },
                        { id: "not_going", label: "Tidak Hadir" },
                        { id: "pending", label: "Menunggu" },
                      ].map((opt) => (
                        <button
                          key={opt.id || "all"}
                          onClick={() =>
                            setQueryParams((p) => ({
                              ...p,
                              page: 1,
                              status_attending: opt.id as any,
                            }))
                          }
                          className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors border ${
                            queryParams.status_attending === opt.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-transparent text-muted-foreground border-border hover:bg-muted/50"
                          } flex items-center gap-1.5 cursor-pointer`}
                        >
                          {opt.label}
                          {queryParams.status_attending === opt.id && (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {modalType === "sort" && (
                <div className="space-y-0.5">
                  {[
                    { id: "Terbaru", field: "created_at", dir: "desc" },
                    { id: "Terlama", field: "created_at", dir: "asc" },
                    { id: "Nama A-Z", field: "name", dir: "asc" },
                    { id: "Nama Z-A", field: "name", dir: "desc" },
                  ].map((opt) => {
                    const isSelected =
                      queryParams.sort_by === opt.field &&
                      queryParams.sort_dir === opt.dir;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setQueryParams((p) => ({
                            ...p,
                            page: 1,
                            sort_by: opt.field,
                            sort_dir: opt.dir as "asc" | "desc",
                          }));
                          setModalType(null);
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
                  ? `Terapkan (${
                      (queryParams.category_id ? 1 : 0) +
                      (queryParams.status_sent ? 1 : 0) +
                      (queryParams.status_attending ? 1 : 0) +
                      (activeTab === "deleted" ? 1 : 0)
                    })`
                  : "Terapkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah/Edit Tamu (Mobile App Bottom Sheet Style) */}
      {(isCreateDialogOpen || isEditDialogOpen) && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
            }}
          ></div>
          <div className="relative bg-background rounded-[2rem] w-full max-w-[400px] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between mb-5 shrink-0 relative">
              <h2 className="text-[15px] font-bold w-full text-center">
                {isEditDialogOpen ? "Edit Tamu" : "Tambah Tamu"}
              </h2>
              <button
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                }}
                className="absolute right-0 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 space-y-4 no-scrollbar">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-[13px] rounded-xl font-medium border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
                  Nama Tamu
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  onFocus={(e) => {
                    if (isEditDialogOpen) {
                      const val = e.target.value;
                      e.target.setSelectionRange(val.length, val.length);
                      setTimeout(() => {
                        e.target.setSelectionRange(val.length, val.length);
                      }, 0);
                    }
                  }}
                  placeholder="Nama lengkap"
                  className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
                  Kategori
                </Label>
                <Select
                  value={formData.guest_category_id?.toString()}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      guest_category_id: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus:ring-primary shadow-none">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categoriesData?.items.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
                    No. HP
                  </Label>
                  <Input
                    value={formData.phone_number}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone_number: e.target.value,
                      }))
                    }
                    placeholder="cth. 628123456789"
                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
                    Instagram
                  </Label>
                  <Input
                    value={formData.instagram_username}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        instagram_username: e.target.value,
                      }))
                    }
                    placeholder="Tanpa @"
                    className="h-11 rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none"
                  />
                </div>
              </div>

              <p className="text-[10.5px] text-muted-foreground italic px-1">
                * Minimal salah satu No. HP atau Instagram harus diisi
              </p>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
                  Alamat
                </Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, address: e.target.value }))
                  }
                  className="min-h-[80px] rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider pl-1">
                  Catatan
                </Label>
                <Textarea
                  value={formData.note}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, note: e.target.value }))
                  }
                  className="min-h-[80px] rounded-xl bg-muted/20 border-border/60 text-[13px] focus-visible:ring-primary shadow-none resize-none"
                />
              </div>
            </div>

            <div className="pt-3 shrink-0 mt-3 flex flex-col gap-2.5 border-t border-border/40">
              <button
                onClick={isEditDialogOpen ? handleUpdateGuest : handleCreateGuest}
                disabled={isEditDialogOpen ? updateGuest.isPending : createGuest.isPending}
                className="w-full flex items-center justify-center h-12 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {/* Unified submit button label */}
                {(isEditDialogOpen ? updateGuest.isPending : createGuest.isPending) ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code & Detail Dialog */}
      {/* Import Modal (Mobile App Bottom Sheet Style) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => {
              if (!isImporting) {
                setIsImportModalOpen(false);
                resetImportState();
              }
            }}
          ></div>
          <div className="relative bg-background rounded-[2rem] w-full max-w-[800px] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between mb-5 shrink-0 relative">
              <h2 className="text-[17px] font-bold w-full text-center tracking-tight">
                Impor Tamu
              </h2>
              <button
                onClick={() => {
                  if (!isImporting) {
                    setIsImportModalOpen(false);
                    resetImportState();
                  }
                }}
                className="absolute right-0 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 py-1 flex-1 overflow-hidden no-scrollbar">
              <div className="flex justify-between items-center bg-muted/30 p-4 rounded-2xl border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold">Template Excel</p>
                    <p className="text-[11px] text-muted-foreground">Unduh format yang sesuai</p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center justify-center h-9 px-3.5 bg-primary/10 text-primary rounded-xl text-[12px] font-bold hover:bg-primary/20 transition-colors cursor-pointer active:scale-95 shrink-0"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Unduh
                </button>
              </div>

              {!importPreviewData ? (
                <div
                  className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-2xl p-8 lg:p-12 transition-colors hover:bg-muted/30 min-h-[250px]"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {previewImport.isPending ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
                      <p className="text-[13px] font-medium text-muted-foreground">Menganalisis file...</p>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-muted/50 rounded-2xl mb-4 pointer-events-none">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      </div>
                      {importFile ? (
                        <div className="text-center w-full max-w-[250px]">
                          <p className="text-[14px] font-bold text-primary mb-1 truncate">
                            {importFile.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground mb-5 font-medium tracking-wide uppercase">
                            {(importFile.size / 1024).toFixed(2)} KB
                          </p>
                          <div className="flex gap-2 justify-center w-full">
                            <button 
                              className="flex-1 h-10 bg-primary text-primary-foreground rounded-xl text-[12px] font-bold active:scale-95 transition-transform cursor-pointer"
                              onClick={handleAnalyzeFile}
                            >
                              Analisis File
                            </button>
                            <button
                              className="px-4 h-10 bg-muted text-foreground rounded-xl text-[12px] font-bold active:scale-95 transition-transform cursor-pointer"
                              onClick={() => setImportFile(null)}
                            >
                              Ganti
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-[13px] text-muted-foreground mb-5 text-center max-w-[250px] leading-relaxed">
                            Seret dan letakkan file Excel di sini, atau klik tombol di bawah
                          </p>
                          <Input
                            type="file"
                            accept=".xlsx, .xls"
                            className="hidden"
                            id="excel-upload"
                            onChange={handleFileChange}
                            onClick={(e) =>
                              ((e.target as HTMLInputElement).value = "")
                            }
                          />
                          <button 
                            className="h-10 px-6 bg-primary text-primary-foreground rounded-xl text-[13px] font-bold active:scale-95 transition-transform cursor-pointer"
                            onClick={() => document.getElementById("excel-upload")?.click()}
                          >
                            Pilih File
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                      <div className="text-[10px] uppercase font-bold text-blue-600/70 mb-1">Total Baris</div>
                      <div className="text-xl font-black text-blue-700">{importPreviewData.total}</div>
                    </div>
                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                      <div className="text-[10px] uppercase font-bold text-emerald-600/70 mb-1">Valid</div>
                      <div className="text-xl font-black text-emerald-700">{importPreviewData.valid_count}</div>
                    </div>
                    <div className="p-4 bg-destructive/10 rounded-2xl border border-destructive/20">
                      <div className="text-[10px] uppercase font-bold text-destructive/70 mb-1">Tidak Valid</div>
                      <div className="text-xl font-black text-destructive">{importPreviewData.error_count}</div>
                    </div>
                  </div>

                  <div className="border border-border/50 rounded-2xl overflow-auto flex-1 no-scrollbar bg-card relative">
                    <Table>
                      <TableHeader className="sticky top-0 bg-muted z-10 border-b border-border/50">
                        <TableRow className="hover:bg-transparent border-0">
                          <TableHead className="text-[11px] uppercase tracking-wider font-bold h-10">Status</TableHead>
                          <TableHead className="text-[11px] uppercase tracking-wider font-bold h-10">Nama</TableHead>
                          <TableHead className="text-[11px] uppercase tracking-wider font-bold h-10">Kategori</TableHead>
                          <TableHead className="text-[11px] uppercase tracking-wider font-bold h-10">Kontak</TableHead>
                          <TableHead className="text-[11px] uppercase tracking-wider font-bold h-10">Info</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importPreviewData.items.map((item: any, idx: number) => (
                          <TableRow
                            key={idx}
                            className={`border-b border-border/40 hover:bg-muted/30 ${!item.is_valid ? "bg-destructive/5" : ""}`}
                          >
                            <TableCell className="py-2.5">
                              {item.is_valid ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600">Valid</span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-destructive/10 text-destructive">Error</span>
                              )}
                            </TableCell>
                            <TableCell className="py-2.5 font-semibold text-[13px]">
                              {item.name || "-"}
                            </TableCell>
                            <TableCell className="py-2.5 text-[12px] text-muted-foreground font-medium">
                              {item.category_name || `ID: ${item.guest_category_id}`}
                            </TableCell>
                            <TableCell className="py-2.5">
                              <div className="flex flex-col gap-1">
                                {item.phone_number && (
                                  <div className="flex items-center gap-1.5 text-foreground">
                                    <Whatsapp className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-[11px] font-semibold">{item.phone_number}</span>
                                  </div>
                                )}
                                {item.instagram_username && (
                                  <div className="flex items-center gap-1.5 text-foreground">
                                    <Instagram className="w-3.5 h-3.5 text-pink-500" />
                                    <span className="text-[11px] font-semibold">@{item.instagram_username}</span>
                                  </div>
                                )}
                                {!item.phone_number && !item.instagram_username && (
                                  <span className="text-[12px] font-medium text-muted-foreground">-</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-2.5">
                              {item.errors?.length > 0 ? (
                                <div className="text-[11px] text-destructive font-medium leading-tight max-w-[200px]">
                                  {item.errors.map((err: string, i: number) => (
                                    <div key={i}>• {err}</div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[12px] text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {isImporting && (
                    <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                      <div className="flex justify-between text-[11px] font-bold uppercase mb-2">
                        <span>Mengimpor Data...</span>
                        <span className="text-primary">{importProgress}%</span>
                      </div>
                      <Progress value={importProgress} className="h-1.5" />
                    </div>
                  )}
                  {importPreviewData.error_count > 0 && !isImporting && (
                    <div className="bg-destructive/10 p-3 rounded-xl border border-destructive/20 flex items-start gap-3">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[12px] font-bold text-destructive">Terdapat Data Tidak Valid</p>
                        <p className="text-[11px] text-destructive/80 mt-0.5">Ada {importPreviewData.error_count} baris yang error. Silakan perbaiki file Excel Anda dan coba lagi.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 shrink-0 mt-3 flex gap-2 border-t border-border/40">
              {importPreviewData ? (
                <>
                  <button
                    onClick={() => {
                      setImportFile(null);
                      setImportPreviewData(null);
                    }}
                    disabled={isImporting}
                    className="flex-1 h-12 bg-muted text-foreground rounded-xl text-[13px] font-bold hover:bg-muted/80 transition-colors disabled:opacity-50 active:scale-95 cursor-pointer"
                  >
                    Ganti File
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={
                      isImporting ||
                      importPreviewData.valid_count === 0 ||
                      importPreviewData.error_count > 0
                    }
                    className="flex-1 h-12 bg-primary text-primary-foreground rounded-xl text-[13px] font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mengimpor...
                      </>
                    ) : (
                      `Simpan (${importPreviewData.valid_count})`
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="w-full h-12 bg-muted text-foreground rounded-xl text-[13px] font-bold hover:bg-muted/80 transition-colors active:scale-95 cursor-pointer"
                >
                  Batal
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Code & Detail Modal (Mobile App Bottom Sheet Style) */}
      {isQRDialogOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsQRDialogOpen(false)}
          ></div>
          <div className="relative bg-background rounded-[2rem] w-full max-w-[400px] p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)] max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between mb-5 shrink-0 relative">
              <h2 className="text-[15px] font-bold w-full text-center">
                Kode QR Tamu
              </h2>
              <button
                onClick={() => setIsQRDialogOpen(false)}
                className="absolute right-0 p-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-4 pt-1 px-1 -mx-1 flex flex-col items-center gap-6 no-scrollbar">
              <div className="bg-white p-4 border-2 border-primary rounded-2xl shadow-sm">
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
                <p className="text-2xl font-bold tracking-widest text-primary">
                  {selectedGuest?.qr_code}
                </p>
                <p className="text-[15px] font-bold">{selectedGuest?.name}</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                  {selectedGuest?.category_name}
                </span>
              </div>

              <div className="w-full grid grid-cols-2 gap-3 text-sm bg-muted/30 p-4 rounded-2xl border border-border/50">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Status RSVP
                  </p>
                  <p className="text-[13px] font-semibold">
                    {selectedGuest?.status_attending.toUpperCase()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Undangan
                  </p>
                  <p className="text-[13px] font-semibold">
                    {selectedGuest?.status_sent.toUpperCase()}
                  </p>
                </div>
                <div className="space-y-1.5 col-span-2 pt-1 border-t border-border/40 mt-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Kontak
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {selectedGuest?.phone_number && (
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Whatsapp className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[13px] font-semibold">{selectedGuest.phone_number}</span>
                      </div>
                    )}
                    {selectedGuest?.instagram_username && (
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Instagram className="w-3.5 h-3.5 text-pink-500" />
                        <span className="text-[13px] font-semibold">@{selectedGuest.instagram_username}</span>
                      </div>
                    )}
                    {!selectedGuest?.phone_number && !selectedGuest?.instagram_username && (
                      <span className="text-[13px] font-semibold text-muted-foreground">-</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 shrink-0 mt-3 flex flex-col gap-2.5 border-t border-border/40">
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center h-12 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors cursor-pointer active:scale-95"
              >
                Cetak Tiket Tamu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Confirmation Dialog */}
      <AlertDialog
        open={isSendMessageDialogOpen}
        onOpenChange={setIsSendMessageDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kirim Undangan</AlertDialogTitle>
            <AlertDialogDescription>
              Kirim undangan ke <strong>{selectedGuest?.name}</strong> melalui{" "}
              {messageType === "whatsapp" ? "WhatsApp" : "Instagram"}? Tindakan
              ini akan menandai status undangan menjadi{" "}
              <strong>&quot;Terkirim&quot;</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSelectedGuest(null);
                setMessageType(null);
              }}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSendMessage}
              disabled={updateStatusSent.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {updateStatusSent.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Ya, Kirim & Tandai Terkirim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tamu</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus {selectedGuest?.name}? Anda dapat memulihkan
              tamu ini nanti dari tab Dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGuest}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog
        open={isRestoreDialogOpen}
        onOpenChange={setIsRestoreDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pulihkan Tamu</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin memulihkan {selectedGuest?.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestoreGuest}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Pulihkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Management Modal (Floating Match Image Design) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setIsCategoryModalOpen(false);
              setEditingCategory(null);
              setCategoryName("");
            }}
          ></div>
          <div className="relative bg-background rounded-[2rem] w-full max-w-[400px] p-6 pb-8 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Daftar Kategori</h2>
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategory(null);
                  setCategoryName("");
                }}
                className="p-2 -mr-2 bg-muted/50 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[13px] text-muted-foreground mb-5 leading-relaxed">
              Kelola kategori tamu untuk mempermudah organisasi undangan Anda.
            </p>

            {/* Input Tambah Kategori */}
            <div className="flex gap-2.5 mb-5">
              <div className="relative flex-1">
                <Input
                  placeholder={
                    editingCategory
                      ? "Ubah nama kategori..."
                      : "Ketik kategori baru..."
                  }
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && categoryName.trim()) {
                      e.preventDefault();
                      // Handle enter
                      try {
                        if (editingCategory) {
                          await updateCategory.mutateAsync({
                            id: editingCategory.id,
                            data: {
                              name: categoryName,
                              start_time: editingCategory.start_time || null,
                              end_time: editingCategory.end_time || null,
                            },
                          });
                          setEditingCategory(null);
                        } else {
                          await createCategory.mutateAsync({
                            name: categoryName,
                            start_time: null,
                            end_time: null,
                          });
                        }
                        setCategoryName("");
                        toast.success("Kategori berhasil disimpan");
                      } catch (err) {}
                    }
                  }}
                  className="pl-4 h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary shadow-none text-[13.5px]"
                />
              </div>
              <button
                onClick={async () => {
                  if (!categoryName.trim()) return;
                  try {
                    if (editingCategory) {
                      await updateCategory.mutateAsync({
                        id: editingCategory.id,
                        data: {
                          name: categoryName,
                          start_time: editingCategory.start_time || null,
                          end_time: editingCategory.end_time || null,
                        },
                      });
                      setEditingCategory(null);
                    } else {
                      await createCategory.mutateAsync({
                        name: categoryName,
                        start_time: null,
                        end_time: null,
                      });
                    }
                    setCategoryName("");
                    toast.success("Kategori berhasil disimpan");
                  } catch (err) {
                    toast.error("Gagal menyimpan kategori");
                  }
                }}
                disabled={
                  createCategory.isPending ||
                  updateCategory.isPending ||
                  !categoryName.trim()
                }
                className="h-11 px-4 bg-primary text-primary-foreground font-bold rounded-xl disabled:opacity-50 transition-colors shadow-sm hover:bg-primary/90 flex items-center gap-2 text-sm"
              >
                {editingCategory ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {editingCategory ? "Simpan" : "Tambah"}
                </span>
              </button>
            </div>

            {/* Daftar Kategori */}
            <div className="overflow-y-auto max-h-[45vh] pr-2 -mr-2">
              <div className="flex flex-col rounded-2xl bg-muted/30 overflow-hidden border border-border/50">
                {categoriesData?.items.map((cat, i) => (
                  <div
                    key={cat.id}
                    className={`flex items-center justify-between p-3.5 ${
                      i !== 0 ? "border-t border-border/50" : ""
                    }`}
                  >
                    <span className="font-semibold text-[13.5px]">
                      {cat.name}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setCategoryName(cat.name);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteCategoryItem(cat)}
                        disabled={deleteCategory.isPending}
                        className="p-1.5 -mr-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {(!categoriesData?.items ||
                  categoriesData.items.length === 0) && (
                  <div className="w-full flex-1 flex flex-col items-center justify-center space-y-4 py-8">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <BookHeart className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center w-full px-4">
                      <h3 className="text-[15px] font-bold tracking-tight mb-1 text-foreground">Belum ada kategori</h3>
                      <p className="text-[13px] text-muted-foreground leading-snug">
                        Mulai ketik nama kategori baru di bawah ini.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteCategoryItem}
        onOpenChange={(open) => !open && setDeleteCategoryItem(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus kategori <strong>{deleteCategoryItem?.name}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteCategoryItem) {
                  try {
                    await deleteCategory.mutateAsync(deleteCategoryItem.id);
                    toast.error("Kategori dihapus", { icon: "🗑️" });
                  } catch (err) {
                    toast.error("Gagal menghapus kategori");
                  }
                  setDeleteCategoryItem(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
