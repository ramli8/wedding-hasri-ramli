'use client';

import { useState, useEffect } from 'react';
import { DemoMainLayout } from '@/src/lib/demo/demo-main-layout';
import { useDemoContext } from '@/src/lib/demo/demo-context';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/presentation/components/ui/tabs';
import { Search, UserPlus, Edit, Trash2, Shield, Loader2, ChevronLeft, ChevronRight, Power, ArrowUpDown, RotateCcw, Users, UserX } from 'lucide-react';
import type { Role } from '@/src/domain/services/rbac.service';
import type { UserListParams, UserListResponse } from '@/src/domain/services/user.service';
import type { User } from '@/src/domain/services/auth.service';

export default function DemoUsersPage() {
    const { userService, rbacService } = useDemoContext();
    const [activeTab, setActiveTab] = useState('active');

    // Query params state
    const [queryParams, setQueryParams] = useState<UserListParams>({
        page: 1,
        page_size: 10,
        search: '',
        sort_by: 'created_at',
        sort_dir: 'desc',
    });

    const [deletedQueryParams, setDeletedQueryParams] = useState<UserListParams>({
        page: 1,
        page_size: 10,
        search: '',
    });

    const [searchInput, setSearchInput] = useState('');
    const [deletedSearchInput, setDeletedSearchInput] = useState('');
    const [roles, setRoles] = useState<Role[]>([]);
    const [error, setError] = useState('');

    // Data state
    const [usersData, setUsersData] = useState<UserListResponse | null>(null);
    const [deletedUsersData, setDeletedUsersData] = useState<UserListResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingDeleted, setIsLoadingDeleted] = useState(true);

    // Dialog states
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedRoles, setSelectedRoles] = useState<number[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });

    // Load data
    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const data = await userService.listUsers(queryParams);
            setUsersData(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const loadDeletedUsers = async () => {
        setIsLoadingDeleted(true);
        try {
            const data = await userService.listDeletedUsers(deletedQueryParams);
            setDeletedUsersData(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load deleted users');
        } finally {
            setIsLoadingDeleted(false);
        }
    };

    useEffect(() => {
        rbacService.getAllRoles().then(setRoles).catch(console.error);
    }, []);

    useEffect(() => { loadUsers(); }, [queryParams]);
    useEffect(() => { loadDeletedUsers(); }, [deletedQueryParams]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            setQueryParams(prev => ({ ...prev, page: 1, search: searchInput }));
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDeletedQueryParams(prev => ({ ...prev, page: 1, search: deletedSearchInput }));
        }, 300);
        return () => clearTimeout(timer);
    }, [deletedSearchInput]);

    const handleCreateUser = async () => {
        try {
            setIsSubmitting(true);
            await userService.createUser({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role_ids: selectedRoles,
            });
            setIsCreateDialogOpen(false);
            resetForm();
            loadUsers();
        } catch (err: any) {
            setError(err.message || 'Failed to create user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;
        try {
            setIsSubmitting(true);
            await userService.updateUser(selectedUser.id, {
                name: formData.name,
                email: formData.email,
                role_ids: selectedRoles,
            });
            setIsEditDialogOpen(false);
            resetForm();
            loadUsers();
        } catch (err: any) {
            setError(err.message || 'Failed to update user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;
        try {
            setIsSubmitting(true);
            await userService.deleteUser(selectedUser.id);
            setIsDeleteDialogOpen(false);
            setSelectedUser(null);
            loadUsers();
            loadDeletedUsers();
        } catch (err: any) {
            setError(err.message || 'Failed to delete user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRestoreUser = async () => {
        if (!selectedUser) return;
        try {
            setIsSubmitting(true);
            await userService.restoreUser(selectedUser.id);
            setIsRestoreDialogOpen(false);
            setSelectedUser(null);
            loadUsers();
            loadDeletedUsers();
        } catch (err: any) {
            setError(err.message || 'Failed to restore user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleStatus = async (user: User) => {
        try {
            await userService.toggleUserStatus(user.id);
            loadUsers();
        } catch (err: any) {
            setError(err.message || 'Failed to toggle user status');
        }
    };

    const handleAssignRoles = async () => {
        if (!selectedUser) return;
        try {
            setIsSubmitting(true);
            await userService.updateUser(selectedUser.id, { role_ids: selectedRoles });
            setIsRoleDialogOpen(false);
            setSelectedUser(null);
            setSelectedRoles([]);
            loadUsers();
        } catch (err: any) {
            setError(err.message || 'Failed to assign roles');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', password: '' });
        setSelectedRoles([]);
        setSelectedUser(null);
        setError('');
    };

    const openEditDialog = (user: User) => {
        setSelectedUser(user);
        setFormData({ name: user.name, email: user.email, password: '' });
        const userRoleIds = roles
            .filter(role => user.roles?.includes(role.name))
            .map(role => role.id);
        setSelectedRoles(userRoleIds);
        setIsEditDialogOpen(true);
    };

    const openRoleDialog = (user: User) => {
        setSelectedUser(user);
        const userRoleIds = roles
            .filter(role => user.roles?.includes(role.name))
            .map(role => role.id);
        setSelectedRoles(userRoleIds);
        setIsRoleDialogOpen(true);
    };

    const handleSort = (field: string) => {
        setQueryParams(prev => ({
            ...prev,
            sort_by: field,
            sort_dir: prev.sort_by === field && prev.sort_dir === 'asc' ? 'desc' : 'asc',
        }));
    };

    const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
        <button
            className="flex items-center gap-1 hover:text-foreground"
            onClick={() => handleSort(field)}
        >
            {children}
            <ArrowUpDown className="h-3 w-3" />
        </button>
    );

    return (
        <DemoMainLayout>
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">User Management</CardTitle>
                    <CardDescription>
                        Manage users, assign roles, and control access
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
                                Active Users
                                {usersData?.total ? <Badge variant="secondary">{usersData.total}</Badge> : null}
                            </TabsTrigger>
                            <TabsTrigger value="deleted" className="flex items-center gap-2">
                                <UserX className="h-4 w-4" />
                                Deleted Users
                                {deletedUsersData?.total ? <Badge variant="secondary">{deletedUsersData.total}</Badge> : null}
                            </TabsTrigger>
                        </TabsList>

                        {/* Active Users Tab */}
                        <TabsContent value="active">
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        placeholder="Search users..."
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select
                                    value={queryParams.is_active === undefined ? 'all' : queryParams.is_active.toString()}
                                    onValueChange={(value) =>
                                        setQueryParams(prev => ({
                                            ...prev,
                                            page: 1,
                                            is_active: value === 'all' ? undefined : value === 'true',
                                        }))
                                    }
                                >
                                    <SelectTrigger className="w-[150px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add User
                                </Button>
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center items-center h-64">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : !usersData?.items?.length ? (
                                <div className="text-center py-12">
                                    <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                                    <p className="text-muted-foreground">
                                        {queryParams.search ? 'Try a different search term' : 'Add your first user to get started'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead><SortButton field="name">Name</SortButton></TableHead>
                                                    <TableHead><SortButton field="email">Email</SortButton></TableHead>
                                                    <TableHead>Roles</TableHead>
                                                    <TableHead><SortButton field="is_active">Status</SortButton></TableHead>
                                                    <TableHead>OAuth</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {usersData.items.map((user) => (
                                                    <TableRow key={user.id}>
                                                        <TableCell className="font-medium">{user.name}</TableCell>
                                                        <TableCell>{user.email}</TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-1 flex-wrap">
                                                                {user.roles && user.roles.length > 0 ? (
                                                                    user.roles.map((role, idx) => (
                                                                        <Badge key={idx} variant="secondary">{role}</Badge>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-muted-foreground text-sm">No roles</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={user.is_active ? 'default' : 'destructive'}>
                                                                {user.is_active ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {user.is_oauth && user.oauth_provider ? (
                                                                <Badge variant="outline">{user.oauth_provider}</Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground text-sm">Email</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button size="sm" variant="outline" onClick={() => openRoleDialog(user)} title="Assign Roles">
                                                                    <Shield className="h-4 w-4" />
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={() => handleToggleStatus(user)} title={user.is_active ? 'Deactivate' : 'Activate'}>
                                                                    <Power className="h-4 w-4" />
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={() => openEditDialog(user)} title="Edit">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={() => { setSelectedUser(user); setIsDeleteDialogOpen(true); }} title="Delete">
                                                                    <Trash2 className="h-4 w-4" />
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
                                            Showing {((queryParams.page || 1) - 1) * (queryParams.page_size || 10) + 1} to{' '}
                                            {Math.min((queryParams.page || 1) * (queryParams.page_size || 10), usersData.total)} of{' '}
                                            {usersData.total} users
                                        </p>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" disabled={(queryParams.page || 1) === 1}
                                                onClick={() => setQueryParams(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}>
                                                <ChevronLeft className="h-4 w-4" /> Previous
                                            </Button>
                                            <Button variant="outline" size="sm" disabled={(queryParams.page || 1) >= usersData.total_pages}
                                                onClick={() => setQueryParams(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}>
                                                Next <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </TabsContent>

                        {/* Deleted Users Tab */}
                        <TabsContent value="deleted">
                            <div className="flex flex-col md:flex-row gap-4 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        placeholder="Search deleted users..."
                                        value={deletedSearchInput}
                                        onChange={(e) => setDeletedSearchInput(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            {isLoadingDeleted ? (
                                <div className="flex justify-center items-center h-64">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : !deletedUsersData?.items?.length ? (
                                <div className="text-center py-12">
                                    <UserX className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Deleted Users</h3>
                                    <p className="text-muted-foreground">
                                        Deleted users will appear here for restoration
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="border rounded-lg overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>OAuth</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {deletedUsersData.items.map((user) => (
                                                    <TableRow key={user.id}>
                                                        <TableCell className="font-medium">{user.name}</TableCell>
                                                        <TableCell>{user.email}</TableCell>
                                                        <TableCell>
                                                            {user.is_oauth && user.oauth_provider ? (
                                                                <Badge variant="outline">{user.oauth_provider}</Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground text-sm">Email</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button size="sm" variant="outline"
                                                                onClick={() => { setSelectedUser(user); setIsRestoreDialogOpen(true); }}
                                                                title="Restore User">
                                                                <RotateCcw className="h-4 w-4 mr-1" /> Restore
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {((deletedQueryParams.page || 1) - 1) * (deletedQueryParams.page_size || 10) + 1} to{' '}
                                            {Math.min((deletedQueryParams.page || 1) * (deletedQueryParams.page_size || 10), deletedUsersData.total)} of{' '}
                                            {deletedUsersData.total} deleted users
                                        </p>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" disabled={(deletedQueryParams.page || 1) === 1}
                                                onClick={() => setDeletedQueryParams(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}>
                                                <ChevronLeft className="h-4 w-4" /> Previous
                                            </Button>
                                            <Button variant="outline" size="sm" disabled={(deletedQueryParams.page || 1) >= deletedUsersData.total_pages}
                                                onClick={() => setDeletedQueryParams(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}>
                                                Next <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Create User Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create User</DialogTitle>
                        <DialogDescription>Add a new user to the system</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Full name" />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} placeholder="email@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <Input type="password" value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} placeholder="Minimum 8 characters" />
                        </div>
                        <div className="space-y-2">
                            <Label>Roles</Label>
                            <div className="space-y-2">
                                {roles.map((role) => (
                                    <div key={role.id} className="flex items-center space-x-2">
                                        <input type="checkbox" id={`create-role-${role.id}`}
                                            checked={selectedRoles.includes(role.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedRoles([...selectedRoles, role.id]);
                                                else setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                                            }}
                                            className="h-4 w-4 rounded border-gray-300" />
                                        <Label htmlFor={`create-role-${role.id}`} className="cursor-pointer">{role.name}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateUser} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>Update user information</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                            <Label>Roles</Label>
                            <div className="space-y-2">
                                {roles.map((role) => (
                                    <div key={role.id} className="flex items-center space-x-2">
                                        <input type="checkbox" id={`edit-role-${role.id}`}
                                            checked={selectedRoles.includes(role.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedRoles([...selectedRoles, role.id]);
                                                else setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                                            }}
                                            className="h-4 w-4 rounded border-gray-300" />
                                        <Label htmlFor={`edit-role-${role.id}`} className="cursor-pointer">{role.name}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateUser} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Assign Roles Dialog */}
            <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Roles</DialogTitle>
                        <DialogDescription>Assign roles to {selectedUser?.name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            {roles.map((role) => (
                                <div key={role.id} className="flex items-center space-x-2">
                                    <input type="checkbox" id={`role-${role.id}`}
                                        checked={selectedRoles.includes(role.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedRoles([...selectedRoles, role.id]);
                                            else setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                                        }}
                                        className="h-4 w-4 rounded border-gray-300" />
                                    <Label htmlFor={`role-${role.id}`} className="cursor-pointer">
                                        {role.name}
                                        {role.description && <span className="text-muted-foreground text-sm ml-2">- {role.description}</span>}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleAssignRoles} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Assign Roles
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete {selectedUser?.name}? You can restore this user later from the Deleted Users tab.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Restore Confirmation */}
            <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restore User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to restore {selectedUser?.name}? The user will be able to log in again.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRestoreUser}>
                            Restore
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DemoMainLayout>
    );
}
