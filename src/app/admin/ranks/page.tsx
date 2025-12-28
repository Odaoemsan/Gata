
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Award } from 'lucide-react';

export default function ManageRanksPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manage Ranks</h2>
          <p className="text-muted-foreground">
            Define rank requirements and referral commissions.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Referral Ranks</CardTitle>
            <CardDescription>Configure the conditions and rewards for each rank.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <Award className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Rank management interface is under construction.</p>
                <p className="text-sm text-muted-foreground">Soon you'll be able to create, edit, and manage ranks here.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
