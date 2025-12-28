'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { EarningsCalculator } from '@/components/earnings-calculator';

export default function LandingPage() {
    const heroBg = PlaceHolderImages.find(img => img.id === 'hero-bg');
    const avatar1 = PlaceHolderImages.find(img => img.id === 'avatar1');
    const avatar2 = PlaceHolderImages.find(img => img.id === 'avatar2');
    const avatar3 = PlaceHolderImages.find(img => img.id === 'avatar3');

    const features = [
      {
        title: 'High-Yield Returns',
        description: 'Our expert-managed investment plans offer competitive daily profits to grow your capital steadily.',
        icon: TrendingUp
      },
      {
        title: 'Secure Platform',
        description: 'We prioritize your security with robust measures to protect your funds and personal data.',
        icon: ShieldCheck
      },
      {
        title: 'Referral Program',
        description: 'Expand your earnings by inviting others to join. Build your team and earn commissions.',
        icon: Users
      },
      {
        title: 'Daily Profits',
        description: 'Claim your earnings every 24 hours with our straightforward daily profit claim system.',
        icon: CheckCircle
      },
    ];

    const testimonials = [
        {
            name: 'Alex Johnson',
            role: 'Professional Investor',
            quote: "GORA has been a game-changer for my portfolio. The daily profits are consistent, and the platform is incredibly easy to use. Highly recommended!",
            avatar: avatar1
        },
        {
            name: 'Samantha Lee',
            role: 'Digital Nomad',
            quote: "The security and transparency of GORA give me peace of mind. I've seen steady growth in my investment, and the support team is always responsive.",
            avatar: avatar2
        },
        {
            name: 'Michael Chen',
            role: 'Small Business Owner',
            quote: "I was new to HYIPs, but GORA made it simple. The referral program is a fantastic bonus, allowing me to earn from my network.",
            avatar: avatar3
        },
    ];

     const faqs = [
        {
            question: "What is a High-Yield Investment Program (HYIP)?",
            answer: "A HYIP is a type of investment that typically offers higher returns than traditional bank investments. GORA provides a platform for such investments with managed risk and various plans."
        },
        {
            question: "How do I make a deposit?",
            answer: "You can deposit funds into your GORA account using USDT (TRC20). Simply go to your wallet, select 'Deposit', and send the desired amount to the provided address."
        },
        {
            question: "How are my daily profits calculated?",
            answer: "Your daily profit is calculated based on the percentage specified in your chosen investment plan, applied to your invested amount. You can claim these profits once every 24 hours."
        },
         {
            question: "Is my investment secure?",
            answer: "We employ advanced security measures, including data encryption and secure server infrastructure, to protect your funds and personal information. However, like all investments, there is inherent risk, and we encourage you to invest responsibly."
        }
    ]

  return (
    <div className="flex-1 space-y-24 md:space-y-32">
      {/* Hero Section */}
       <section className="relative -mt-8 -mx-4 md:-mx-8">
        <div className="absolute inset-0 overflow-hidden">
            {heroBg && (
                <Image
                    src={heroBg.imageUrl}
                    alt={heroBg.description}
                    data-ai-hint={heroBg.imageHint}
                    fill
                    className="object-cover opacity-10"
                    priority
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        </div>
        <div className="relative container mx-auto px-4 pt-24 pb-16 text-center">
             <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                Securely Grow Your Digital Assets
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                Join GORA's high-yield investment platform to unlock daily profits and maximize your financial potential through our expertly managed plans.
            </p>
            <div className="mt-8 flex justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <Button size="lg" asChild>
                    <Link href="/signup">Get Started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                    <Link href="#plans">View Plans</Link>
                </Button>
            </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4">
        <div className="text-center space-y-3">
          <h2 className="font-headline text-3xl font-bold">Why Choose GORA?</h2>
          <p className="max-w-xl mx-auto text-muted-foreground">
            We provide a powerful and reliable platform for you to achieve your financial goals.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card key={index} className="text-center shadow-sm hover:shadow-primary/20 transition-shadow">
                <CardHeader className="items-center">
                    <div className="p-4 bg-primary/10 rounded-full w-fit">
                        <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                </CardHeader>
              <CardContent>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
       {/* How It Works Section */}
        <section id="how-it-works" className="container mx-auto px-4">
             <div className="text-center space-y-3">
                <h2 className="font-headline text-3xl font-bold">Simple Steps to Start Earning</h2>
                <p className="max-w-xl mx-auto text-muted-foreground">
                    Getting started with GORA is quick and straightforward.
                </p>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl">1</div>
                    </div>
                    <h3 className="text-lg font-semibold">Create an Account</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Sign up for a free account in minutes and secure your profile.</p>
                </div>
                 <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl">2</div>
                    </div>
                    <h3 className="text-lg font-semibold">Make a Deposit</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Deposit funds using our secure USDT (TRC20) payment gateway.</p>
                </div>
                 <div className="text-center">
                    <div className="flex items-center justify-center mb-4">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground font-bold text-2xl">3</div>
                    </div>
                    <h3 className="text-lg font-semibold">Watch it Grow</h3>
                    <p className="mt-2 text-sm text-muted-foreground">Choose an investment plan and start earning daily profits.</p>
                </div>
            </div>
        </section>

        {/* Investment Plans & Calculator */}
        <section id="plans" className="container mx-auto px-4">
            <div className="grid lg:grid-cols-5 gap-12 items-center">
                <div className="lg:col-span-2">
                    <h2 className="font-headline text-3xl font-bold">Investment Plans</h2>
                    <p className="mt-4 text-muted-foreground">
                        We offer a range of investment plans to suit different financial strategies. Choose the one that aligns with your goals and start your investment journey today.
                    </p>
                </div>
                <div className="lg:col-span-3">
                    <EarningsCalculator />
                </div>
            </div>
        </section>

       {/* Testimonials Section */}
      <section id="testimonials" className="container mx-auto px-4">
        <div className="text-center space-y-3">
          <h2 className="font-headline text-3xl font-bold">What Our Investors Say</h2>
          <p className="max-w-xl mx-auto text-muted-foreground">
            Hear from members of the GORA community about their experience.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-1 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="shadow-sm">
                <CardContent className="pt-6">
                    <p className="italic text-muted-foreground">"{testimonial.quote}"</p>
                     <div className="mt-4 flex items-center gap-4">
                        {testimonial.avatar && (
                             <Image
                                src={testimonial.avatar.imageUrl}
                                alt={`Avatar of ${testimonial.name}`}
                                data-ai-hint={testimonial.avatar.imageHint}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full object-cover"
                            />
                        )}
                        <div>
                            <p className="font-semibold">{testimonial.name}</p>
                            <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
          ))}
        </div>
      </section>

       {/* FAQ Section */}
        <section id="faq" className="container mx-auto px-4 max-w-3xl">
             <div className="text-center space-y-3">
                <h2 className="font-headline text-3xl font-bold">Frequently Asked Questions</h2>
            </div>
             <Accordion type="single" collapsible className="w-full mt-8">
                {faqs.map((faq, index) => (
                     <AccordionItem key={index} value={`item-${index + 1}`}>
                        <AccordionTrigger className="text-left font-semibold">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </section>
    </div>
  );
}
