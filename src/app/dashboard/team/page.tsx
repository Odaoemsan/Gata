'use client';

import { useUser, useFirestore, useCollection } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Users, Share2, Award, Check, Loader2, DollarSign, ListTodo, CheckCircle, Inbox, Link as LinkIcon } from 'lucide-react';
import type { User, Rank, Task, TaskSubmission } from '@/lib/types';
import { useMemo, useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { formatCurrency } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

function TeamAndRanks() {
    const { userData, user, loading: userLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const typedUserData = userData as User | null;

    const teamQuery = useMemo(() => {
        if (!firestore || !typedUserData?.referralCode) return null;
        return query(collection(firestore, 'users'), where('referredBy', '==', typedUserData.referralCode));
    }, [firestore, typedUserData?.referralCode]);

    const { data: teamMembers, loading: teamLoading } = useCollection<User>(teamQuery);

    const ranksQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'ranks'));
    }, [firestore]);
    const { data: ranks, loading: ranksLoading } = useCollection<Rank>(ranksQuery);

    const teamTotalDeposits = useMemo(() => {
        if (!teamMembers) return 0;
        return teamMembers.reduce((acc, member) => acc + (member.totalDeposits || 0), 0);
    }, [teamMembers]);

    const handleCopy = () => {
        if (!typedUserData?.referralCode) return;
        navigator.clipboard.writeText(typedUserData.referralCode);
        toast({
            title: 'Copied!',
            description: 'Referral code copied to clipboard.',
        });
    };

    const handleRankCheck = () => {
        if (!ranks || ranksLoading || teamLoading) return;
        
        const currentRank = ranks.slice().reverse().find(rank => teamTotalDeposits >= rank.requiredInvestment);

        if (currentRank) {
             toast({
                title: 'Rank Status',
                description: `You currently qualify for the ${currentRank.name} rank!`,
            });
        } else {
             toast({
                title: 'Rank Status',
                description: "You haven't qualified for a rank yet. Keep growing your team!",
            });
        }
    };

    const isLoading = userLoading || teamLoading || ranksLoading;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Share2 className="h-6 w-6 text-primary" />
                        <CardTitle>Your Referral Code</CardTitle>
                    </div>
                    <CardDescription>Share this 7-character code with new members to add them to your team.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Input
                            readOnly
                            value={userLoading ? "Loading..." : typedUserData?.referralCode || ''}
                            className="pr-12 text-lg md:text-xl font-mono tracking-widest text-center"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={handleCopy}
                            disabled={userLoading}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                     <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Team Deposits</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                       {isLoading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold">{formatCurrency(teamTotalDeposits)}</div>}
                       <p className="text-xs text-muted-foreground">Total invested by your referred members.</p>
                    </CardContent>
                </Card>
                 <Card>
                     <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">My Commissions</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                       {userLoading ? <Skeleton className="h-8 w-1/3" /> : <div className="text-2xl font-bold text-green-500">{formatCurrency(typedUserData?.referralCommissions)}</div>}
                        <p className="text-xs text-muted-foreground">Total commissions earned from your team.</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                     <div className="flex items-center gap-3">
                        <Award className="h-6 w-6" />
                        <CardTitle>Referral Ranks</CardTitle>
                    </div>
                    <CardDescription>Achieve new ranks by increasing your team's total investment to earn higher commissions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Rank</TableHead>
                                <TableHead>Required Team Investment</TableHead>
                                <TableHead className="text-right">Commission</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {ranksLoading && [...Array(3)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                </TableRow>
                            ))}
                            {!ranksLoading && ranks?.sort((a, b) => a.requiredInvestment - b.requiredInvestment).map(rank => (
                                <TableRow key={rank.id} className={!isLoading && teamTotalDeposits >= rank.requiredInvestment ? 'bg-primary/10' : ''}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        {!isLoading && teamTotalDeposits >= rank.requiredInvestment && <Check className="h-4 w-4 text-green-500" />}
                                        {rank.name}
                                    </TableCell>
                                    <TableCell>{formatCurrency(rank.requiredInvestment)}</TableCell>
                                    <TableCell className="text-right font-semibold">{rank.commissionRate}%</TableCell>
                                </TableRow>
                            ))}
                             {!ranksLoading && ranks?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No ranks have been configured by the admin yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <Button onClick={handleRankCheck} disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                        Check My Rank Status
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

function TasksTab() {
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

    if (loading) {
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

    if (!tasks || tasks.length === 0) {
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
    
    return (
        <div className="space-y-4">
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
    )
}

export default function TeamPage() {
    return (
        <div className="flex-1 space-y-6 p-4">
             <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Team & Tasks</h2>
                <p className="text-muted-foreground mt-1">Grow your team, complete tasks, and climb the ranks.</p>
            </div>
            <Tabs defaultValue="team">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="team">Team & Ranks</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                </TabsList>
                <TabsContent value="team" className="mt-6">
                    <TeamAndRanks />
                </TabsContent>
                <TabsContent value="tasks" className="mt-6">
                    <TasksTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
