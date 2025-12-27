'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircleDollarSign, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function EarningsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleClaim = () => {
        setIsLoading(true);
        // Simulate API call to claim earnings
        setTimeout(() => {
            setIsLoading(false);
            toast({
                title: "Earnings Claimed!",
                description: "Your daily earnings have been added to your balance.",
            });
        }, 1500);
    }

    return (
        <div className="flex-1 space-y-6 p-4 md:p-8">
             <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight">Daily Earnings</h2>
                <p className="text-muted-foreground mt-1">Claim your profits from active investments.</p>
            </div>
            
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <div className="flex flex-col items-center text-center gap-2">
                        <CircleDollarSign className="h-16 w-16 text-primary" />
                        <CardTitle className="text-2xl">Available to Claim</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-5xl font-bold tracking-tighter text-green-500">
                        $12.50
                    </p>
                    <p className="text-muted-foreground">
                        This is the accumulated profit from all your active investments since your last claim.
                    </p>
                    <Button 
                        size="lg" 
                        className="w-full" 
                        onClick={handleClaim} 
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Claim Now
                    </Button>
                </CardContent>
            </Card>

            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>How it works</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>1. Your earnings from active investments accumulate here every 24 hours.</p>
                    <p>2. You can claim your available earnings at any time by clicking the "Claim Now" button.</p>
                    <p>3. Once claimed, the amount will be instantly added to your main account balance.</p>
                    <p>4. From your main balance, you can either reinvest or request a withdrawal.</p>
                </CardContent>
            </Card>

        </div>
    )
}
