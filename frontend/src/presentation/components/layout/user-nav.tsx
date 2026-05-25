'use client'

import { useState } from 'react'
import { User, LogOut, AlertTriangle, ChevronDown } from 'lucide-react'
import { useAuth } from '@/src/application/hooks/use-auth'
import { useDemoRoute } from '@/src/lib/demo/use-demo-route'
import { Button } from '@/src/presentation/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/src/presentation/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/src/presentation/components/ui/dialog'
import Link from 'next/link'

export function UserNav() {
    const { user, logout } = useAuth()
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
    const { getRoute } = useDemoRoute()

    // Get user initials for avatar
    const getUserInitials = () => {
        if (!user?.name) return 'U'
        const names = user.name.split(' ')
        if (names.length >= 2) {
            return `${names[0][0]}${names[1][0]}`.toUpperCase()
        }
        return user.name.substring(0, 2).toUpperCase()
    }

    const handleLogout = () => {
        setIsLogoutModalOpen(true)
    }

    const confirmLogout = () => {
        logout()
        setIsLogoutModalOpen(false)
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 rounded-full pl-2 pr-3 py-1.5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                            {getUserInitials()}
                        </div>
                        <div className="hidden md:flex items-center gap-1">
                            <span className="truncate text-sm font-medium text-foreground max-w-[120px]">
                                {user?.name || 'Nama Pengguna'}
                            </span>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-2">
                    <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                            {user?.name && (
                                <p className="font-medium text-sm">{user.name}</p>
                            )}
                            {user?.email && (
                                <p className="w-[200px] truncate text-xs text-muted-foreground">
                                    {user.email}
                                </p>
                            )}
                        </div>
                    </div>
                    <DropdownMenuItem asChild>
                        <Link href={getRoute("/settings/profile")} className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profil</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer text-destructive focus:text-destructive"
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Keluar</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Logout Confirmation Modal */}
            <Dialog open={isLogoutModalOpen} onOpenChange={setIsLogoutModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10">
                            <AlertTriangle className="w-6 h-6 text-destructive" />
                        </div>
                        <DialogTitle className="text-center text-xl">
                                    Konfirmasi Keluar
                                
                        </DialogTitle>
                        <DialogDescription className="text-center">
                            Apakah Anda yakin ingin keluar dari aplikasi?
                            <br />
                            <span className="text-sm text-muted-foreground mt-2 block">
                                Anda perlu masuk kembali untuk mengakses aplikasi.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsLogoutModalOpen(false)}
                            className="w-full sm:w-auto"
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmLogout}
                            className="w-full sm:w-auto"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Ya, Logout
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
