
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, updateDoc, doc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Loader2, Search, ShieldCheck, ShieldOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { cn } from '@/lib/utils';
import { useFirebaseApp } from '@/firebase/provider';

function formatCurrency(amount: number) {
    if (typeof amount !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

const userSchema = z.object({
  displayName: z.string().min(2, "Full name is required."),
  username: z.string().min(3, "Username is required."),
  balance: z.coerce.number().min(0, "Balance cannot be negative."),
});

export default function ManageUsersPage() {
    const firestore = useFirestore();
    const firebaseApp = useFirebaseApp();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isClaimProcessing, setIsClaimProcessing] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [usersWithClaims, setUsersWithClaims] = useState<any[]>([]);

    const usersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'));
    }, [firestore]);
    
    const { data: users, loading } = useCollection<User>(usersQuery);
    
    const setAdminClaim = httpsCallable(getFunctions(firebaseApp), 'setAdminClaim');

    useEffect(() => {
        if (users) {
            const fetchClaims = async () => {
                const listUsers = httpsCallable(getFunctions(firebaseApp), 'listUsers');
                try {
                    const result:any = await listUsers({ uids: users.map(u => u.id) });
                    const claimsMap = new Map(result.data.users.map((u: any) => [u.uid, u.customClaims]));
                    const enrichedUsers = users.map(user => ({
                        ...user,
                        isAdmin: claimsMap.get(user.id)?.admin === true
                    }));
                    setUsersWithClaims(enrichedUsers);
                } catch (error) {
                    console.error("Error fetching user claims:", error);
                    setUsersWithClaims(users.map(u => ({...u, isAdmin: false})));
                }
            };
            fetchClaims();
        }
    }, [users, firebaseApp]);


    const handleClaimToggle = async (user: User, makeAdmin: boolean) => {
        if (!confirm(`Are you sure you want to ${makeAdmin ? 'grant' : 'revoke'} admin privileges for ${user.displayName}?`)) {
            return;
        }
        setIsClaimProcessing(user.id);
        try {
            await setAdminClaim({ uid: user.id, admin: makeAdmin });
            toast({
                title: 'Success',
                description: `Admin privileges ${makeAdmin ? 'granted to' : 'revoked from'} ${user.displayName}.`,
            });
             setUsersWithClaims(prev => prev.map(u => u.id === user.id ? { ...u, isAdmin: makeAdmin } : u));
        } catch (error) {
            console.error('Error updating claims:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update admin privileges.',
            });
        } finally {
            setIsClaimProcessing(null);
        }
    };

    const filteredUsers = useMemo(() => {
        if (!usersWithClaims) return [];
        return usersWithClaims.filter(user => 
            user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [usersWithClaims, searchTerm]);

    const form = useForm<z.infer<typeof userSchema>>({
        resolver: zodResolver(userSchema),
    });

    const openDialogForEdit = (user: User) => {
        setSelectedUser(user);
        form.reset({
            displayName: user.displayName,
            username: user.username,
            balance: user.balance,
        });
        setDialogOpen(true);
    };
    
    async function onSubmit(values: z.infer<typeof userSchema>) {
        if (!firestore || !selectedUser) return;
        setIsLoading(true);

        try {
            const userRef = doc(firestore, 'users', selectedUser.id);
            await updateDoc(userRef, values);
            toast({ title: "Success", description: "User profile updated successfully." });
            setDialogOpen(false);
        } catch (error) {
            console.error("Error updating user: ", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to update user profile." });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Manage Users</h2>
                    <p className="text-muted-foreground">
                        View, search, and edit user profiles and permissions.
                    </p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name, email, or ID..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>All Users ({filteredUsers.length})</CardTitle>
                    <CardDescription>A list of all registered users in the system.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead className="hidden md:table-cell">Username</TableHead>
                                <TableHead className="hidden md:table-cell">Admin Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Skeleton className="h-10 w-10 rounded-full" />
                                                <div className="space-y-1">
                                                    <Skeleton className="h-4 w-24" />
                                                    <Skeleton className="h-3 w-32" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-20" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            )}
                            {!loading && filteredUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarFallback>{user.displayName?.[0] ?? 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{user.displayName}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                                <Badge variant="outline" className="mt-1 md:hidden">{formatCurrency(user.balance)}</Badge>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell font-mono text-xs">{user.username}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <Badge variant={user.isAdmin ? 'default' : 'outline'} className={cn(user.isAdmin && 'bg-green-600')}>
                                            {user.isAdmin ? 'Admin' : 'User'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                         {isClaimProcessing === user.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                                        ) : (
                                            user.isAdmin ? (
                                                <Button variant="ghost" size="icon" onClick={() => handleClaimToggle(user, false)} title="Revoke Admin">
                                                    <ShieldOff className="h-4 w-4 text-destructive" />
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="icon" onClick={() => handleClaimToggle(user, true)} title="Make Admin">
                                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                                </Button>
                                            )
                                        )}
                                        <Button variant="ghost" size="icon" onClick={() => openDialogForEdit(user)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {!loading && filteredUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User: {selectedUser?.displayName}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <FormField control={form.control} name="displayName" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="username" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="balance" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Balance ($)</FormLabel>
                                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </DialogClose>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
