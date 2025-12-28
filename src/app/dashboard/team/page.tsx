
'use client';

import { useUser, useFirestore, useCollection } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Copy, Medal, Users, Share2, ListTodo, Send, Loader2, DollarSign } from 'lucide-react';
import type { User, Task } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { useMemo, useState, useEffect } from 'react';
import { addDoc, collection, query, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useFirebaseApp } from '@/firebase/provider';
import { formatCurrency } from '@/lib/formatters';


function TaskCard({ task }: { task: Task }) {
    const { toast } = useToast();
    const { user, userData } = useUser();
    const firestore = useFirestore();
    const [submissionLink, setSubmissionLink] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const typedUserData = userData as User;

    const handleSubmit = async () => {
        if (!submissionLink || !user || !typedUserData || !firestore) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please provide a valid submission link.' });
            return;
        }
        setIsLoading(true);

        const newSubmission = {
            taskId: task.id,
            taskTitle: task.title,
            userId: user.uid,
            username: typedUserData.username,
            userDisplayName: typedUserData.displayName,
            userEmail: typedUserData.email,
            submissionLink,
            status: 'pending' as const,
            submittedAt: serverTimestamp()
        };

        try {
            await addDoc(collection(firestore, 'taskSubmissions'), newSubmission);
            toast({ title: 'Submission Sent!', description: 'Your task submission has been sent for review.' });
            setSubmissionLink('');
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit your task. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded-lg space-y-3">
            <h4 className="font-semibold">{task.title} - <span className="text-primary">${task.reward.toFixed(2)}</span></h4>
            <p className="text-sm text-muted-foreground">{task.description}</p>
            <div className="space-y-2">
                <Label htmlFor={`task-link-${task.id}`}>Submission Link</Label>
                <Input id={`task-link-${task.id}`} placeholder="https://example.com/proof" value={submissionLink} onChange={(e) => setSubmissionLink(e.target.value)} />
            </div>
            <Button size="sm" className="w-full" onClick={handleSubmit} disabled={isLoading || !submissionLink}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit for Review
            </Button>
        </div>
    );
}

export default function TeamPage() {
    const { userData, user } = useUser();
    const firebaseApp = useFirebaseApp();
    const firestore = useFirestore();
    const { toast } = useToast();
    
    const [teamStats, setTeamStats] = useState<{ teamSize: number; teamTotalDeposits: number } | null>(null);
    const [teamLoading, setTeamLoading] = useState(true);

    const typedUserData = userData as User | null;
    const referralCode = typedUserData?.referralCode;

    useEffect(() => {
        if (referralCode && firebaseApp) {
            const functions = getFunctions(firebaseApp);
            const getTeamStats = httpsCallable(functions, 'getTeamStats');
            
            setTeamLoading(true);
            getTeamStats({ referralCode })
                .then((result: any) => {
                    setTeamStats(result.data);
                })
                .catch((error: any) => {
                    console.error("Error calling getTeamStats function:", error);
                    let description = "Could not fetch team stats. Please try again later.";
                    if (error.details?.code === 'failed-precondition') {
                         description = "Database setup required. Please check server logs for an index creation link.";
                    }
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: description,
                    });
                })
                .finally(() => {
                    setTeamLoading(false);
                });
        } else if (typedUserData) {
            setTeamLoading(false);
            setTeamStats({ teamSize: 0, teamTotalDeposits: 0 });
        }
    }, [referralCode, firebaseApp, toast, typedUserData]);


    const tasksQuery = useMemo(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'tasks'));
    }, [firestore]);

    const { data: tasks, loading: tasksLoading } = useCollection<Task>(tasksQuery);

    const handleCopy = () => {
        if (!referralCode) return;
        const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;
        navigator.clipboard.writeText(referralLink);
        toast({
            title: 'Copied!',
            description: 'Referral link copied to clipboard.',
        });
    };

    return (
        <div className="flex-1 space-y-6 p-4">
             <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">My Team</h2>
                <p className="text-muted-foreground mt-1">Invite friends and earn commissions.</p>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Share2 className="h-6 w-6 text-primary" />
                        <CardTitle>Your Referral Link</CardTitle>
                    </div>
                    <CardDescription>Share your link to invite new members and earn commissions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Input
                            readOnly
                            value={`${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/signup?ref=${referralCode}`}
                            className="pr-12 text-sm md:text-base font-mono tracking-wide text-center"
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                            onClick={handleCopy}
                            disabled={!referralCode}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {teamLoading ? (
                            <div className="flex items-center justify-center h-10">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="text-2xl font-bold">{teamStats?.teamSize ?? 0}</div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Team Total Deposits</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                       {teamLoading ? (
                            <div className="flex items-center justify-center h-10">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                             <div className="text-2xl font-bold">{formatCurrency(teamStats?.teamTotalDeposits)}</div>
                        )}
                    </CardContent>
                </Card>
            </div>

             <Card>
                <CardHeader>
                     <div className="flex items-center gap-3">
                        <Medal className="h-6 w-6 text-yellow-500" />
                        <CardTitle>Commission Ranks</CardTitle>
                    </div>
                    <CardDescription>Earn commissions from your team's investments across three levels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <span className="font-medium">Level 1:</span>
                        <span className="font-bold text-primary">7%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                        <span className="font-medium">Level 2:</span>
                        <span className="font-bold text-yellow-500">3%</span>
                    </div>
                     <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                       <span className="font-medium">Level 3:</span>
                        <span className="font-bold text-purple-500">1%</span>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                     <div className="flex items-center gap-3">
                        <ListTodo className="h-6 w-6" />
                        <CardTitle>Tasks</CardTitle>
                    </div>
                    <CardDescription>Complete the following tasks to get rewards.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {tasksLoading && (
                         <div className="flex flex-col items-center justify-center h-48">
                            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                        </div>
                    )}
                    {!tasksLoading && tasks && tasks.length > 0 && tasks.map(task => (
                        <TaskCard key={task.id} task={task} />
                    ))}
                    {!tasksLoading && (!tasks || tasks.length === 0) && (
                        <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg">
                            <ListTodo className="h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-muted-foreground">No other tasks are available at the moment.</p>
                            <p className="text-sm text-muted-foreground">Please check back later.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
