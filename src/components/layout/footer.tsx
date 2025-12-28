'use client';

import Link from 'next/link';
import { Rocket, Twitter, Linkedin, Facebook } from 'lucide-react';
import React from 'react';

export function Footer() {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
  };

  return (
    <footer className="border-t border-border/20 bg-background">
      <div className="container mx-auto max-w-7xl px-4 py-12">
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
                <a href="#" onClick={handleLinkClick} aria-label="Facebook">
                    <Facebook className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                </a>
                <a href="#" onClick={handleLinkClick} aria-label="Twitter">
                    <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                </a>
                <a href="#" onClick={handleLinkClick} aria-label="LinkedIn">
                    <Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                </a>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" onClick={handleLinkClick} className="text-muted-foreground hover:text-primary">Investment Plans</a></li>
              <li><a href="#" onClick={handleLinkClick} className="text-muted-foreground hover:text-primary">How It Works</a></li>
              <li><a href="#" onClick={handleLinkClick} className="text-muted-foreground hover:text-primary">Testimonials</a></li>
              <li><a href="#" onClick={handleLinkClick} className="text-muted-foreground hover:text-primary">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" onClick={handleLinkClick} className="text-muted-foreground hover:text-primary">Terms of Service</a></li>
              <li><a href="#" onClick={handleLinkClick} className="text-muted-foreground hover:text-primary">Privacy Policy</a></li>
              <li><a href="#" onClick={handleLinkClick} className="text-muted-foreground hover:text-primary">Risk Disclosure</a></li>
            </ul>
          </div>
           <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>123 Growth Ave,</li>
              <li>Finance City, 10101</li>
              <li className="pt-2"><a href="#" onClick={handleLinkClick} className="hover:text-primary">support@gora.com</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/20 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} GORA HYIP. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
