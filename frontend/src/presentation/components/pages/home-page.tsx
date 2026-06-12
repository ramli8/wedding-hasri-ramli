'use client'

import Link from 'next/link'
import {
  Users, UserPlus, ScanQrCode, UserCheck, Heart,
  CalendarCheck, TrendingUp, ArrowRight, Gift,
} from 'lucide-react'
import { useGuests, useGuestCategories } from '@/src/application/hooks/use-guest-query'
import { Card, CardContent } from '@/src/presentation/components/ui/card'
import { Button } from '@/src/presentation/components/ui/button'

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ElementType
  description?: string
  trend?: string
}

function StatCard({ title, value, icon: Icon, description, trend }: StatCardProps) {
  return (
    <Card className="border-border/50 shadow-sm transition-all duration-200 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
            <Icon strokeWidth={1.5} className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-xs text-green-600">
            <TrendingUp strokeWidth={1.5} className="h-3 w-3" />
            <span>{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface QuickActionProps {
  title: string
  description: string
  href: string
  icon: React.ElementType
  variant?: 'default' | 'outline'
}

function QuickAction({ title, description, href, icon: Icon, variant = 'outline' }: QuickActionProps) {
  return (
    <Link href={href}>
      <Card className={`border-border/50 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer ${variant === 'default' ? 'bg-primary/5 border-primary/20' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${variant === 'default' ? 'bg-primary text-primary-foreground' : 'bg-primary/10'}`}>
              <Icon strokeWidth={1.5} className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground truncate">{description}</p>
            </div>
            <ArrowRight strokeWidth={1.5} className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function HomePage() {
  const { data: allGuests } = useGuests({ page: 1, page_size: 1 })
  const { data: checkedInGuests } = useGuests({ page: 1, page_size: 1, is_checked_in: true })
  const { data: goingGuests } = useGuests({ page: 1, page_size: 1, status_attending: 'going' })
  const { data: categories } = useGuestCategories({ page_size: 100 })

  const totalGuests = allGuests?.total ?? 0
  const totalCheckedIn = checkedInGuests?.total ?? 0
  const totalGoing = goingGuests?.total ?? 0
  const totalPending = totalGuests - totalGoing
  const totalCategories = categories?.total ?? 0

  const stats = [
    {
      title: 'Total Tamu',
      value: totalGuests,
      icon: Users,
      description: 'Tamu terdaftar',
    },
    {
      title: 'Check In',
      value: totalCheckedIn,
      icon: UserCheck,
      description: 'Sudah hadir',
    },
    {
      title: 'Konfirmasi',
      value: totalGoing,
      icon: CalendarCheck,
      description: 'Akan hadir',
    },
    {
      title: 'Kategori',
      value: totalCategories,
      icon: Gift,
      description: 'Grup tamu',
    },
  ]

  const quickActions = [
    {
      title: 'Tambah Tamu Baru',
      description: 'Daftarkan tamu ke daftar undangan',
      href: '/admin/guests',
      icon: UserPlus,
      variant: 'default' as const,
    },
    {
      title: 'Lihat Semua Tamu',
      description: 'Kelola dan cari daftar tamu',
      href: '/admin/guests',
      icon: Users,
    },
    {
      title: 'Check-In QR',
      description: 'Pindai kode QR untuk kehadiran',
      href: '/admin/guest-checkin',
      icon: ScanQrCode,
    },

  ]

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Heart strokeWidth={1.5} className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Pernikahan</h1>
        </div>
        <p className="text-muted-foreground">
          Ringkasan manajemen tamu pernikahan Anda
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Aksi Cepat</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <QuickAction key={action.title} {...action} />
          ))}
        </div>
      </section>

      {/* Info Section */}
      <Card className="border-border/50 bg-primary/5 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 shrink-0">
              <Heart strokeWidth={1.5} className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg">Pernikahan Hasri & Ramli</h3>
              <p className="text-sm text-muted-foreground">
                Kelola daftar tamu, lacak RSVP, dan permudah check-in — semua dalam satu tempat.
              </p>
            </div>
            <Button variant="outline" asChild className="shrink-0">
              <Link href="/admin/guests">
                Buka Daftar Tamu
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
