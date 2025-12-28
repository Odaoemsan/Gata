

export interface User {
    id: string;
    displayName: string;
    username: string;
    email: string;
    balance: number;
    totalDeposits: number;
    totalWithdrawals: number;
    createdAt: any; // Using `any` for Firebase Timestamp for simplicity
    referredBy?: string;
    referralCommissions: number;
}

export interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal' | 'commission' | 'task_reward';
    amount: number;
    date: any; // Using `any` for Firebase Timestamp for simplicity
    status: 'pending' | 'completed' | 'failed';
    walletAddress?: string;
    transactionId?: string; // For deposit verification
    userId?: string; // Added to identify the user for admin queries
    username?: string; // Added for display in admin panel
    userDisplayName?: string; // Added for display in admin panel
    userEmail?: string; // Added for display in admin panel
}

export interface InvestmentPlan {
    id: string;
    name: string;
    dailyProfit: number;
    duration: number;
    minMax: string;
}

export interface ActiveInvestment {
    id: string;
    planId: string;
    planName: string;
    amount: number;
    startDate: any;
    endDate: any;
    status: 'active' | 'completed';
}

export interface Rank {
    id: string;
    name: string;
    requiredInvestment: number;
    commissionRate: number;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    reward: number;
    createdAt: any;
}

export interface TaskSubmission {
    id: string;
    taskId: string;
    taskTitle: string;
    userId: string;
    username: string;
    userDisplayName: string;
    userEmail: string;
    submissionLink: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: any;
}
