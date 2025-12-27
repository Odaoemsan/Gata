export interface User {
    id: string;
    displayName: string;
    username: string;
    email: string;
    balance: number;
    totalDeposits: number;
    totalWithdrawals: number;
    createdAt: any; // Using `any` for Firebase Timestamp for simplicity
}

export interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal';
    amount: number;
    date: any; // Using `any` for Firebase Timestamp for simplicity
    status: 'pending' | 'completed' | 'failed';
}
