import Link from 'next/link';
import { Rocket, Twitter, Linkedin, Facebook } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Rocket className="h-7 w-7 text-primary" />
              <span className="font-headline text-2xl font-bold text-primary">
                GORA
              </span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Securely grow your wealth with our high-yield investment programs.
            </p>
            <div className="flex gap-4 mt-2">
                <Link href="#" aria-label="Facebook">
                    <Facebook className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                </Link>
                <Link href="#" aria-label="Twitter">
                    <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                </Link>
                <Link href="#" aria-label="LinkedIn">
                    <Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                </Link>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#plans" className="text-muted-foreground hover:text-primary">Investment Plans</Link></li>
              <li><Link href="#how-it-works" className="text-muted-foreground hover:text-primary">How It Works</Link></li>
              <li><Link href="#testimonials" className="text-muted-foreground hover:text-primary">Testimonials</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary">Risk Disclosure</Link></li>
            </ul>
          </div>
           <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>123 Growth Ave,</li>
              <li>Finance City, 10101</li>
              <li className="pt-2"><a href="mailto:support@gora.com" className="hover:text-primary">support@gora.com</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} GORA HYIP. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
