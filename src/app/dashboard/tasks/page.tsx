'use client';

import { useState, useMemo } from 'react';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, addDoc, serverTimestamp, where, getDocs } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListTodo, CheckCircle, Loader2, LinkIcon, Inbox } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Task, User, TaskSubmission } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { formatCurrency } from '@/lib/formatters';

function TaskSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    </CardHeader>
                    <CardFooter>
                         <Skeleton className="h-10 w-28" />
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

function EmptyTasks() {
    return (
        <div className="flex flex-col items-center justify-center text-center py-20 px-4">
            <Inbox className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Tasks Available</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
                There are no tasks available at the moment. Please check back later for opportunities to earn rewards.
            </p>
        </div>
    )
}


export default function TasksPage() {
    const firestore = useFirestore();
    const { user, userData } = useUser();
    const { toast } = useToast();
    
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [submissionLink, setSubmissionLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [submittedTasks, setSubmittedTasks] = useState<Set<string>>(new Set());

    const typedUserData = userData as User | null;

    const tasksQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'tasks'));
    }, [firestore]);
    
    const { data: tasks, loading } = useCollection<Task>(tasksQuery);

     // Fetch tasks this user has already submitted
    useEffect(() => {
        if (!firestore || !user) return;
        const fetchSubmitted = async () => {
            const submissionsQuery = query(
                collection(firestore, 'taskSubmissions'),
                where('userId', '==', user.uid)
            );
            const snapshot = await getDocs(submissionsQuery);
            const submittedIds = new Set(snapshot.docs.map(doc => doc.data().taskId));
            setSubmittedTasks(submittedIds);
        }
        fetchSubmitted();
    }, [firestore, user]);


    const handleSubmit = async () => {
        setIsLoading(true);
        if (!selectedTask || !user || !typedUserData || !submissionLink || !firestore) {
            toast({ variant: "destructive", title: "Error", description: "Missing required information."});
            setIsLoading(false);
            return;
        }

        const newSubmission: Omit<TaskSubmission, 'id'> = {
            taskId: selectedTask.id,
            taskTitle: selectedTask.title,
            userId: user.uid,
            username: typedUserData.username,
            userDisplayName: typedUserData.displayName,
            userEmail: typedUserData.email,
            submissionLink: submissionLink,
            status: 'pending',
            submittedAt: serverTimestamp(),
        };

        const submissionsRef = collection(firestore, `taskSubmissions`);
        addDoc(submissionsRef, newSubmission)
            .then(() => {
                toast({ title: "Submission Successful!", description: "Your task submission is now pending review."});
                setSubmittedTasks(prev => new Set(prev).add(selectedTask.id));
                setSelectedTask(null);
                setSubmissionLink('');
            })
            .catch(async (error) => {
                const permissionError = new FirestorePermissionError({
                    path: submissionsRef.path,
                    operation: 'create',
                    requestResourceData: newSubmission,
                });
                errorEmitter.emit('permission-error', permissionError);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit your task.' });
            })
            .finally(() => {
                setIsLoading(false);
            });
    }
    
    return (
        <div className="flex-1 space-y-6 p-4">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Complete Tasks, Earn Rewards</h2>
                <p className="text-muted-foreground mt-1">Finish simple tasks to get extra bonuses added to your balance.</p>
            </div>
            
            {loading ? <TaskSkeleton /> : (
                (!tasks || tasks.length === 0) ? <EmptyTasks /> : (
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {tasks.map(task => {
                            const isSubmitted = submittedTasks.has(task.id);
                            return (
                                <Card key={task.id} className="shadow-sm hover:shadow-primary/20 transition-shadow">
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-lg">{task.title}</CardTitle>
                                            <div className="font-bold text-lg text-green-500">{formatCurrency(task.reward)}</div>
                                        </div>
                                    </CardHeader>
                                    <CardFooter>
                                        <Button onClick={() => setSelectedTask(task)} disabled={isSubmitted}>
                                            {isSubmitted ? <CheckCircle className="mr-2 h-4 w-4" /> : <ListTodo className="mr-2 h-4 w-4" />}
                                            {isSubmitted ? 'Completed' : 'View Task'}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                )
            )}
            
            {selectedTask && (
                <Dialog open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{selectedTask.title}</DialogTitle>
                            <DialogDescription className="py-4 whitespace-pre-wrap">{selectedTask.description}</DialogDescription>
                        </DialogHeader>
                        <div className="py-2">
                            <Label htmlFor="submission-link">Proof of Completion (Link)</Label>
                            <div className="relative mt-2">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    id="submission-link"
                                    value={submissionLink}
                                    onChange={(e) => setSubmissionLink(e.target.value)}
                                    placeholder="https://your-submission-link.com" 
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedTask(null)}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={isLoading || !submissionLink}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit for Review
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

        </div>
    );
}
