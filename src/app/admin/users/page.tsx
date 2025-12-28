
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function ManageUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manage Users</h2>
          <p className="text-muted-foreground">
            View user details and manage their data.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>A list of all registered users in the system.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <Users className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">User management interface is under construction.</p>
                <p className="text-sm text-muted-foreground">Soon you'll be able to view, search, and edit user profiles here.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
