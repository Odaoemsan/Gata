
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, addDoc, updateDoc, deleteDoc, doc, runTransaction, writeBatch, serverTimestamp, where, getDocs, increment } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Loader2, ListTodo, Check, X, User as UserIcon, LinkIcon, Inbox } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Task, TaskSubmission } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const taskSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  reward: z.coerce.number().positive("Reward must be a positive number."),
});

function formatDate(timestamp: any) {
    if (!timestamp) return 'N/A';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000 || timestamp);
    if(isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}


function ManageTasks() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const tasksQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'tasks'));
    }, [firestore]);
    
    const { data: tasks, loading } = useCollection<Task>(tasksQuery);

    const form = useForm<z.infer<typeof taskSchema>>({
        resolver: zodResolver(taskSchema),
        defaultValues: { title: '', description: '', reward: '' as any }
    });

    const openDialogForEdit = (task: Task) => {
        setSelectedTask(task);
        form.reset(task);
        setDialogOpen(true);
    };

    const openDialogForNew = () => {
        setSelectedTask(null);
        form.reset({ title: '', description: '', reward: '' as any });
        setDialogOpen(true);
    };

    const handleDelete = async (taskId: string) => {
        if (!firestore || !confirm('Are you sure you want to delete this task?')) return;
        
        setIsLoading(true);
        try {
            await deleteDoc(doc(firestore, 'tasks', taskId));
            toast({ title: "Success", description: "Task deleted successfully." });
        } catch (error) {
            console.error("Error deleting task: ", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to delete task." });
        } finally {
            setIsLoading(false);
        }
    };
    
    async function onSubmit(values: z.infer<typeof taskSchema>) {
        if (!firestore) return;
        setIsLoading(true);

        try {
            if (selectedTask) {
                const taskRef = doc(firestore, 'tasks', selectedTask.id);
                await updateDoc(taskRef, values);
                toast({ title: "Success", description: "Task updated successfully." });
            } else {
                await addDoc(collection(firestore, 'tasks'), { ...values, createdAt: serverTimestamp() });
                toast({ title: "Success", description: "New task created." });
            }
            setDialogOpen(false);
        } catch (error) {
            console.error("Error saving task: ", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to save task." });
        } finally {
            setIsLoading(false);
        }
    }
    
     return (
        <div className="space-y-4">
             <div className="flex items-center justify-between">
                <p className="text-muted-foreground">Create and manage tasks for users to complete.</p>
                <Button onClick={openDialogForNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Task
                </Button>
            </div>
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Reward</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                            {!loading && tasks?.map(task => (
                                <TableRow key={task.id}>
                                    <TableCell className="font-medium">{task.title}</TableCell>
                                    <TableCell>${task.reward.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openDialogForEdit(task)}><Edit className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(task.id)} disabled={isLoading}><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!loading && tasks?.length === 0 && (
                                <TableRow><TableCell colSpan={3} className="h-24 text-center">No tasks found. Create one!</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem><FormLabel>Task Title</FormLabel><FormControl><Input placeholder="e.g., Share on Facebook" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Detailed instructions for the user..." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="reward" render={({ field }) => (
                                <FormItem><FormLabel>Reward ($)</FormLabel><FormControl><Input type="number" placeholder="e.g., 5" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {selectedTask ? 'Save Changes' : 'Create Task'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ReviewSubmissions() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchSubmissions = useCallback(async () => {
        if (!firestore) return;
        setLoading(true);
        try {
            const submissionsQuery = query(collection(firestore, 'taskSubmissions'), where('status', '==', 'pending'));
            const snapshot = await getDocs(submissionsQuery);
            const pendingSubmissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskSubmission));
            setSubmissions(pendingSubmissions);
        } catch (error) {
            console.error("Error fetching submissions:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch submissions." });
        } finally {
            setLoading(false);
        }
    }, [firestore, toast]);
    
    useEffect(() => { 
        fetchSubmissions(); 
    }, [fetchSubmissions]);

    const handleApproval = async (submission: TaskSubmission, approved: boolean) => {
        if (!firestore) return;
        setProcessingId(submission.id);

        const submissionRef = doc(firestore, 'taskSubmissions', submission.id);
        const userRef = doc(firestore, 'users', submission.userId);
        
        try {
            await runTransaction(firestore, async (transaction) => {
                const taskRef = doc(firestore, 'tasks', submission.taskId);
                const taskDoc = await transaction.get(taskRef);
                
                if (!taskDoc.exists() && approved) {
                    throw new Error("Task not found!");
                }
                const task = taskDoc.data() as Task;

                if (approved) {
                    // 1. Add reward to user's balance
                    transaction.update(userRef, { balance: increment(task.reward) });
                    
                    // 2. Create a transaction record for the reward
                    const newTransactionRef = doc(collection(firestore, `users/${submission.userId}/transactions`));
                    transaction.set(newTransactionRef, {
                        type: 'task_reward',
                        amount: task.reward,
                        date: serverTimestamp(),
                        status: 'completed',
                        userId: submission.userId,
                        userDisplayName: submission.userDisplayName,
                        userEmail: submission.userEmail,
                    });
                }
                
                // 3. Update the submission status
                transaction.update(submissionRef, { status: approved ? 'approved' : 'rejected' });
            });

            toast({ title: 'Success', description: `Submission has been ${approved ? 'approved' : 'rejected'}.` });
            fetchSubmissions(); // Refresh the list
        } catch (error) {
            console.error("Error processing submission:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to process submission.' });
        } finally {
            setProcessingId(null);
        }
    }
    
    return (
        <div className="space-y-4">
             {loading ? (
                <div className="space-y-4">
                    {[...Array(2)].map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-5 w-full" /></CardContent><CardFooter><Skeleton className="h-10 w-24" /></CardFooter></Card>)}
                </div>
            ) : submissions.length > 0 ? (
                submissions.map(sub => (
                    <Card key={sub.id}>
                        <CardHeader>
                            <CardTitle className="text-lg">{sub.taskTitle}</CardTitle>
                            <CardDescription>Submitted by {sub.userDisplayName} ({sub.userEmail}) on {formatDate(sub.submittedAt)}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <a href={sub.submissionLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary underline">
                                <LinkIcon size={16}/> <span>{sub.submissionLink}</span>
                             </a>
                        </CardContent>
                         <CardFooter className="gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => handleApproval(sub, false)} disabled={processingId === sub.id}>
                                {processingId === sub.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-1 h-4 w-4"/>}
                                 Reject
                            </Button>
                            <Button size="sm" onClick={() => handleApproval(sub, true)} disabled={processingId === sub.id}>
                                {processingId === sub.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4"/>}
                                Approve
                            </Button>
                        </CardFooter>
                    </Card>
                ))
            ) : (
                 <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg text-center p-4">
                    <Inbox className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">No pending submissions to review.</p>
                    <p className="text-sm text-muted-foreground">When users complete tasks, their submissions will appear here.</p>
                </div>
            )}
        </div>
    )
}


export default function ManageTasksPage() {
    const firestore = useFirestore();
    const submissionsQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'taskSubmissions'), where('status', '==', 'pending'));
    }, [firestore]);
    const { data: submissions, loading } = useCollection(submissionsQuery);
    const pendingCount = submissions?.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manage Tasks</h2>
          <p className="text-muted-foreground">
            Create new tasks and review user submissions.
          </p>
        </div>
      </div>
       <Tabs defaultValue="manage">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manage">Manage Tasks</TabsTrigger>
                <TabsTrigger value="review">Review Submissions <Badge className="ml-2">{loading ? <Loader2 className="h-3 w-3 animate-spin"/> : pendingCount}</Badge></TabsTrigger>
            </TabsList>
            <TabsContent value="manage" className="mt-4">
               <ManageTasks />
            </TabsContent>
            <TabsContent value="review" className="mt-4">
               <ReviewSubmissions />
            </TabsContent>
        </Tabs>
    </div>
  );
}

    

    