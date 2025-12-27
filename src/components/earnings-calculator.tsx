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
  const [earnings, setEarnings] = useState<string | null>(null);

  const calculateEarnings = () => {
    const selectedPlan = investmentPlans.find(p => p.id === planId);
    if (!selectedPlan || !amount) {
        setEarnings(null);
        return;
    }
    const principal = parseFloat(amount);
    if(isNaN(principal) || principal <= 0) {
        setEarnings('Invalid amount');
        return;
    }

    const totalReturn = principal * (1 + selectedPlan.dailyInterest * selectedPlan.duration);
    const profit = totalReturn - principal;
    
    setEarnings(`Profit: $${profit.toFixed(2)} | Total Return: $${totalReturn.toFixed(2)}`);
  };

  useEffect(() => {
    calculateEarnings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan">Investment Plan</Label>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger id="plan">
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
          <Button onClick={calculateEarnings} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            <TrendingUp className="mr-2 h-4 w-4" />
            Calculate Earnings
          </Button>
          {earnings && (
            <div className="mt-4 p-4 bg-primary/10 rounded-lg text-center">
              <p className="font-semibold text-primary">{earnings}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
