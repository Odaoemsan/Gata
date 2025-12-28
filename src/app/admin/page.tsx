
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Package, Users, Wallet } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {

    return (
        <div className="flex-1 space-y-6">
             <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Admin Dashboard
                </h1>
                <p className="text-muted-foreground">
                    Welcome to the GORA administration panel.
                </p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Link href="/admin/plans" className="hover:bg-muted/50 transition-colors rounded-lg border bg-card text-card-foreground shadow-sm block">
                    <Card className="border-none shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Manage Investment Plans
                            </CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Create, edit, and delete investment plans.
                            </p>
                        </CardContent>
                    </Card>
                </Link>
                 <Link href="/admin/transactions" className="hover:bg-muted/50 transition-colors rounded-lg border bg-card text-card-foreground shadow-sm block">
                    <Card className="border-none shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Manage Transactions
                            </CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                Approve deposits and process withdrawals.
                            </p>
                        </CardContent>
                    </Card>
                </Link>
                 <Link href="/admin/users" className="hover:bg-muted/50 transition-colors rounded-lg border bg-card text-card-foreground shadow-sm block">
                    <Card className="border-none shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Manage Users
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                View user details and manage balances.
                            </p>
                        </CardContent>
                    </Card>
                </Link>
                {/* Add more admin sections here */}
            </div>
        </div>
    )
}
