import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Rocket } from 'lucide-react';

export function Header() {
  const navLinks = [
    { href: '#plans', label: 'Plans' },
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#testimonials', label: 'Testimonials' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Rocket className="h-7 w-7 text-primary" />
          <span className="font-headline text-2xl font-bold text-primary">
            GORA
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-foreground/60 transition-colors hover:text-foreground/80"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-4">
          <Button variant="ghost">Login</Button>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Sign Up</Button>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-6">
                <Link href="/" className="flex items-center gap-2">
                  <Rocket className="h-7 w-7 text-primary" />
                  <span className="font-headline text-2xl font-bold text-primary">
                    GORA
                  </span>
                </Link>
              </div>
              <nav className="flex flex-col gap-4 text-lg font-medium">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-foreground/80 transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-4">
                <Button variant="ghost" size="lg">Login</Button>
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">Sign Up</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
