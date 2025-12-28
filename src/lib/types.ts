
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
    referralCode: string;
    referralCommissions: number;
    rankName?: string;
}

// Represents a historical transaction record.
export interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal' | 'commission' | 'task_reward';
    amount: number;
    date: any; 
    status: 'completed' | 'failed' | 'pending';
    walletAddress?: string;
    transactionId?: string; 
    userId: string; 
    username: string; 
    userDisplayName: string;
    userEmail: string; 
}

// Represents a pending request that appears in the admin panel.
export interface PendingTransaction {
    id: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
    date: any; 
    walletAddress?: string;
    transactionId?: string; 
    userId: string;
    username: string; 
    userDisplayName: string; 
    userEmail: string; 
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

export interface AppSettings {
    supportLink: string;
    depositWalletAddress: string;
}
