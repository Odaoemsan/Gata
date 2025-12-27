import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { EarningsCalculator } from '@/components/earnings-calculator';
import { CheckCircle, TrendingUp, Users, ShieldCheck, Wallet, Quote } from 'lucide-react';

const investmentPlans = [
  {
    name: 'Starter Plan',
    dailyProfit: '5%',
    duration: '30 Days',
    minMax: '$100 - $1,000',
    features: ['Basic Support', 'Daily Payouts', 'Principal Return'],
    popular: false,
  },
  {
    name: 'Advanced Plan',
    dailyProfit: '7%',
    duration: '45 Days',
    minMax: '$1,001 - $10,000',
    features: ['Priority Support', 'Daily Payouts', 'Principal Return', 'Compounding'],
    popular: true,
  },
  {
    name: 'Professional Plan',
    dailyProfit: '10%',
    duration: '60 Days',
    minMax: '$10,001 - $100,000',
    features: ['Dedicated Manager', 'Instant Payouts', 'Principal Return', 'Compounding'],
    popular: false,
  },
];

const features = [
  { icon: ShieldCheck, title: 'Secure & Trusted', description: 'Your investments are protected with top-tier security protocols.' },
  { icon: TrendingUp, title: 'High Returns', description: 'Achieve significant growth with our competitive interest rates.' },
  { icon: Users, title: 'Referral Program', description: 'Earn commissions by inviting your friends to join GORA.' },
  { icon: Wallet, title: 'Instant Withdrawals', description: 'Access your earnings quickly and conveniently at any time.' },
];

const testimonials = [
  {
    name: 'John D.',
    role: 'Investor',
    text: "GORA has been a game-changer for my portfolio. The returns are consistent, and the platform is incredibly easy to use. Highly recommended!",
    avatarId: 'avatar1',
  },
  {
    name: 'Sarah L.',
    role: 'Financial Analyst',
    text: "As someone in finance, I'm cautious about HYIPs. But GORA's transparency and reliable payouts have won my trust. An excellent platform for passive income.",
    avatarId: 'avatar2',
  },
    {
    name: 'Mike R.',
    role: 'Entrepreneur',
    text: "The referral system is fantastic! I've not only grown my investment but also built a steady income stream from my referrals. The support team is also very responsive.",
    avatarId: 'avatar3',
  },
];

const howItWorksSteps = [
  {
    step: 1,
    title: 'Create an Account',
    description: 'Sign up for a free account in just a few minutes. It’s quick, easy, and secure.'
  },
  {
    step: 2,
    title: 'Choose a Plan',
    description: 'Select an investment plan that aligns with your financial goals and risk tolerance.'
  },
  {
    step: 3,
    title: 'Start Earning',
    description: 'Deposit funds and watch your investment grow daily. Withdraw your profits anytime.'
  }
];


export default function Home() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-bg');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center text-center text-white">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover -z-10"
              priority
              data-ai-hint={heroImage.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-black/50 -z-10" />
          <div className="container px-4 md:px-6">
            <div className="max-w-3xl mx-auto space-y-4 animate-fade-in-up">
              <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
                Unlock Your Financial Future with GORA
              </h1>
              <p className="text-lg md:text-xl text-white/80">
                The most reliable platform for high-yield investments. Start growing your capital today with our secure and profitable plans.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="#plans">Get Started</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                  <Link href="#how-it-works">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 md:py-24 bg-card">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-3 mb-12">
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary">Why Choose GORA?</h2>
              <p className="max-w-2xl mx-auto text-muted-foreground">We provide the best features to make your investment journey seamless and profitable.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="text-center p-6 space-y-3">
                  <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold font-headline">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Investment Plans Section */}
        <section id="plans" className="py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-3 mb-12">
              <h2 className="font-headline text-3xl md:text-4xl font-bold">Our Investment Plans</h2>
              <p className="max-w-2xl mx-auto text-muted-foreground">Choose a plan that best fits your investment goals.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
              {investmentPlans.map((plan, index) => (
                <Card key={index} className={`flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${plan.popular ? 'border-primary ring-2 ring-primary shadow-lg' : ''}`}>
                  {plan.popular && <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-semibold rounded-t-lg">Most Popular</div>}
                  <CardHeader className="text-center">
                    <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.minMax}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-6">
                    <div className="text-center">
                      <span className="font-headline text-5xl font-bold">{plan.dailyProfit}</span>
                      <span className="text-muted-foreground">/ Daily</span>
                    </div>
                    <ul className="space-y-3 text-sm">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-center font-bold text-sm">For {plan.duration}</p>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>Invest Now</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section id="how-it-works" className="py-12 md:py-24 bg-card">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-3 mb-12">
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary">Get Started in 3 Easy Steps</h2>
              <p className="max-w-2xl mx-auto text-muted-foreground">Start your journey towards financial freedom with GORA.</p>
            </div>
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="absolute top-10 left-0 w-full h-0.5 bg-border -z-10 hidden md:block" />
              {howItWorksSteps.map((step, index) => (
                <div key={step.step} className="relative flex flex-col items-center text-center p-4">
                   <div className="w-20 h-20 flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-3xl z-10 mb-4 font-headline ring-8 ring-card">
                    {step.step}
                  </div>
                  <h3 className="font-headline text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Earnings Calculator Section */}
        <section id="calculator" className="py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <EarningsCalculator />
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-12 md:py-24 bg-card">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-3 mb-12">
              <h2 className="font-headline text-3xl md:text-4xl font-bold text-primary">What Our Investors Say</h2>
              <p className="max-w-2xl mx-auto text-muted-foreground">Real stories from our satisfied community members.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => {
                const avatar = PlaceHolderImages.find(p => p.id === testimonial.avatarId);
                return (
                  <Card key={index} className="flex flex-col">
                    <CardContent className="pt-6 flex-grow">
                      <Quote className="w-8 h-8 text-primary/30 mb-4" />
                      <p className="text-muted-foreground italic">"{testimonial.text}"</p>
                    </CardContent>
                    <CardFooter className="flex items-center gap-4 mt-4 bg-muted/50 p-4">
                      {avatar && (
                        <Avatar>
                          <AvatarImage src={avatar.imageUrl} alt={testimonial.name} data-ai-hint={avatar.imageHint} />
                          <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Referral CTA Section */}
        <section id="referral" className="py-12 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="bg-primary/90 rounded-lg p-8 md:p-12 text-center text-primary-foreground overflow-hidden relative">
               <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full" />
               <div className="absolute -bottom-16 -right-5 w-40 h-40 bg-white/10 rounded-full" />
              <div className="relative z-10">
                <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">Invite Friends, Earn More!</h2>
                <p className="max-w-2xl mx-auto mb-6">
                  Share your referral link and earn a commission on every deposit made by your referrals. It's a win-win!
                </p>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  Start Referring Now
                </Button>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
