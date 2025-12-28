
'use client';

import { useState, useMemo } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, updateDoc, doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Loader2, Search, Award } from 'lucide-react';
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
import { formatCurrency } from '@/lib/formatters';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';


const userSchema = z.object({
  displayName: z.string().min(2, "Full name is required."),
  username: z.string().min(3, "Username is required."),
  balance: z.coerce.number().min(0, "Balance cannot be negative."),
});

export default function ManageUsersPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const usersQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'));
    }, [firestore]);
    
    const { data: users, loading } = useCollection<User>(usersQuery);

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(user => 
            user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    const form = useForm<z.infer<typeof userSchema>>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            displayName: '',
            username: '',
            balance: 0,
        }
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

        const userRef = doc(firestore, 'users', selectedUser.id);
        updateDoc(userRef, values)
            .then(() => {
                toast({ title: "Success", description: "User profile updated successfully." });
                setDialogOpen(false);
            })
            .catch(async (error) => {
                const permissionError = new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'update',
                    requestResourceData: values,
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: "destructive", title: "Error", description: "Failed to update user profile." });
            })
            .finally(() => {
                setIsLoading(false);
            });
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Manage Users</h2>
                    <p className="text-muted-foreground">
                        View, search, and edit user profiles.
                    </p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name, email, or username..."
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
                                <TableHead className="hidden md:table-cell">Details</TableHead>
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
                                                <div className="font-mono text-xs text-muted-foreground">{user.username}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-xs space-y-1">
                                        <div><Badge variant="outline">{formatCurrency(user.balance)}</Badge></div>
                                        <div>
                                            {user.rankName ? 
                                                <Badge variant="secondary"><Award className="mr-1 h-3 w-3"/>{user.rankName}</Badge> :
                                                <Badge variant="outline">No Rank</Badge>
                                            }
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openDialogForEdit(user)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                             {!loading && filteredUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
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
