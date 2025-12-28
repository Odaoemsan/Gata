'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Award, ListTodo, Package, Settings, Users, Wallet } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {

    const adminSections = [
        { href: "/admin/plans", title: "Manage Investment Plans", description: "Create, edit, and delete investment plans.", icon: Package },
        { href: "/admin/transactions", title: "Manage Transactions", description: "Approve deposits and process withdrawals.", icon: Wallet },
        { href: "/admin/users", title: "Manage Users", description: "View user details and manage balances.", icon: Users },
        { href: "/admin/ranks", title: "Manage Ranks", description: "Define rank requirements and commissions.", icon: Award },
        { href: "/admin/tasks", title: "Manage Tasks", description: "Create and review user tasks for rewards.", icon: ListTodo },
        { href: "/admin/settings", title: "General Settings", description: "Manage global application settings.", icon: Settings },
    ];

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
                {adminSections.map((section) => (
                    <Link href={section.href} key={section.href} className="block hover:bg-muted/50 transition-colors rounded-lg border bg-card text-card-foreground shadow-sm">
                        <Card className="border-none shadow-none h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {section.title}
                                </CardTitle>
                                <section.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">
                                    {section.description}
                                </p>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    )
}
