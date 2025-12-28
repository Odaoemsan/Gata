
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
    referralCommissions?: number;
}

export interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal' | 'commission';
    amount: number;
    date: any; // Using `any` for Firebase Timestamp for simplicity
    status: 'pending' | 'completed' | 'failed';
    walletAddress?: string;
    transactionId?: string; // For deposit verification
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
