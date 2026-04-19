'use client';

import { useState } from 'react';
import { DemoMainLayout } from '@/src/lib/demo/demo-main-layout';
import { useDemoContext } from '@/src/lib/demo/demo-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/presentation/components/ui/card';
import { Separator } from '@/src/presentation/components/ui/separator';
import { Button } from '@/src/presentation/components/ui/button';
import { Input } from '@/src/presentation/components/ui/input';
import { Label } from '@/src/presentation/components/ui/label';
import { Loader2, User, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function DemoProfilePage() {
    const { user, authService } = useDemoContext();

    const [name, setName] = useState(user.name);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Password form
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const getUserInitials = () => {
        if (!user?.name) return 'U';
        const names = user.name.split(' ');
        if (names.length >= 2) return `${names[0][0]}${names[1][0]}`.toUpperCase();
        return user.name.substring(0, 2).toUpperCase();
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || name.trim().length < 2) {
            toast.error('Name must be at least 2 characters');
            return;
        }
        try {
            setIsSubmitting(true);
            await authService.updateProfile({ name: name.trim() });
            toast.success('Profile updated successfully! (demo)');
        } catch {
            toast.error('Failed to update profile');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        try {
            setIsChangingPassword(true);
            await authService.changePassword({ old_password: oldPassword, new_password: newPassword });
            toast.success('Password changed successfully! (demo)');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch {
            toast.error('Failed to change password');
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <DemoMainLayout>
            <div className="space-y-6 pb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                    <p className="text-muted-foreground mt-2">Manage your account information and security settings</p>
                </div>

                <Separator />

                {/* User Info Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold">
                                {getUserInitials()}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">{user.name}</h2>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Forms Grid */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Profile Info Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" /> Profile Information
                            </CardTitle>
                            <CardDescription>Update your personal information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={user.email} disabled className="bg-muted cursor-not-allowed" />
                                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required minLength={2} disabled={isSubmitting} />
                                </div>
                                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update Profile
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Change Password Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="h-5 w-5" /> Change Password
                            </CardTitle>
                            <CardDescription>Update your password for security</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="old-password">Current Password</Label>
                                    <Input id="old-password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Enter current password" required disabled={isChangingPassword} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New Password</Label>
                                    <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" required minLength={8} disabled={isChangingPassword} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm Password</Label>
                                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" required disabled={isChangingPassword} />
                                </div>
                                <Button type="submit" disabled={isChangingPassword} className="w-full sm:w-auto">
                                    {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Change Password
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DemoMainLayout>
    );
}
