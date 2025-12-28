
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

const investmentPlans = [
  { name: 'Starter', dailyInterest: 0.05, duration: 30, id: 'starter' },
  { name: 'Advanced', dailyInterest: 0.07, duration: 45, id: 'advanced' },
  { name: 'Professional', dailyInterest: 0.1, duration: 60, id: 'professional' },
];

export function EarningsCalculator() {
  const [amount, setAmount] = useState('1000');
  const [planId, setPlanId] = useState(investmentPlans[0].id);
  const [totalReturn, setTotalReturn] = useState<number>(0);
  const [profit, setProfit] = useState<number>(0);

  const calculateEarnings = () => {
    const selectedPlan = investmentPlans.find(p => p.id === planId);
    if (!selectedPlan || !amount) {
        setTotalReturn(0);
        setProfit(0);
        return;
    }
    const principal = parseFloat(amount);
    if(isNaN(principal) || principal <= 0) {
        setTotalReturn(0);
        setProfit(0);
        return;
    }

    const calculatedTotalReturn = principal * (1 + selectedPlan.dailyInterest * selectedPlan.duration);
    const calculatedProfit = calculatedTotalReturn - principal;
    
    setTotalReturn(calculatedTotalReturn);
    setProfit(calculatedProfit);
  };

  useEffect(() => {
    calculateEarnings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, planId]);

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg bg-secondary/50 border-border/50">
      <CardHeader>
        <CardTitle className="font-headline text-center text-2xl">Earnings Calculator</CardTitle>
        <CardDescription className="text-center">Estimate your potential profit.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Investment Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="e.g., 1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan">Investment Plan</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger id="plan" className="bg-background">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                {investmentPlans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - {plan.dailyInterest * 100}% daily for {plan.duration} days
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="!mt-6 pt-6 border-t border-border/20">
            <div className="flex justify-between items-center text-lg">
                <span className="text-muted-foreground">Profit</span>
                <span className="font-bold text-primary">
                    ${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
            <div className="flex justify-between items-center text-xl mt-2">
                <span className="text-muted-foreground">Total Return</span>
                <span className="font-bold text-foreground">
                   ${totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
