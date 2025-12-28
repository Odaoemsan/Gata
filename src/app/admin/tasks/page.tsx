
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ListTodo } from 'lucide-react';

export default function ManageTasksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manage Tasks</h2>
          <p className="text-muted-foreground">
            Create new tasks and review user submissions.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>User Tasks</CardTitle>
            <CardDescription>A list of available tasks and user submissions.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <ListTodo className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Task management interface is under construction.</p>
                <p className="text-sm text-muted-foreground">Soon you'll be able to add tasks and approve submissions here.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
