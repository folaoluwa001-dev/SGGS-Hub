'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { schoolConfig } from '../../config/school.config';
import { useTheme } from './Providers';
import { ThemeToggle } from './ThemeToggle';
import { Menu, X, Award, Sparkles, ArrowRight } from 'lucide-react';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Admissions', href: '/admissions' },
    { name: 'Result Checker', href: '/result-checker' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg-custom text-fg-custom">
      {/* TOP ANNOUNCEMENT BANNER */}
      <div className="bg-gradient-to-r from-primary via-primaryLight to-secondary text-white text-[11px] sm:text-xs py-2 px-4 text-center font-bold tracking-wide flex items-center justify-center space-x-2 border-b border-white/10">
        <span className="inline-block animate-pulse">📢</span>
        <span>Admissions Open for 2026/2027 Academic Session — Online Applications &amp; Entrance Assessments Active</span>
        <Link href="/admissions" className="underline hover:text-amber-300 ml-1.5 whitespace-nowrap inline-flex items-center space-x-1">
          <span>Apply Online</span>
          <span>&rarr;</span>
        </Link>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-card-custom/80 border-b border-border-custom transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo and Name */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0"
                dangerouslySetInnerHTML={{ __html: schoolConfig.schoolLogo }}
              />
              <div>
                <span className="block font-black text-sm sm:text-base tracking-wider text-primary dark:text-white leading-none">
                  {schoolConfig.schoolName.split(' ')[0]} {schoolConfig.schoolName.split(' ')[1] || ''}
                </span>
                <span className="block font-medium text-[9px] sm:text-[10px] text-secondary tracking-widest leading-none mt-1">
                  {schoolConfig.schoolMotto.toUpperCase()}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex space-x-1 lg:space-x-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-secondary/15 text-secondary'
                        : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Actions (Theme Toggle & Apply Now) */}
            <div className="hidden md:flex items-center space-x-3">
              <ThemeToggle />
              <Link
                href="/admissions"
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-secondary text-white hover:bg-amber-600 font-bold text-xs shadow-xs transition-all"
              >
                <span>Apply Now</span>
              </Link>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg bg-muted-custom text-fg-custom"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-card-custom border-b border-border-custom px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top duration-200">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-xs font-bold ${
                    isActive
                      ? 'bg-secondary/15 text-secondary dark:text-secondary'
                      : 'text-muted-fg-custom hover:bg-muted-custom'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <div className="pt-4 border-t border-border-custom flex flex-col gap-2">
              <Link
                href="/admissions"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-xl bg-secondary text-white font-bold text-xs shadow-xs transition-all"
              >
                <span>Apply for Admission (2026/2027)</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* BODY */}
      <main className="flex-grow">{children}</main>

      {/* FOOTER */}
      <footer className="bg-[#0b1329] text-[#cbd5e1] border-t border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* School Brief */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div 
                  className="w-10 h-10 flex items-center justify-center shrink-0"
                  dangerouslySetInnerHTML={{ __html: schoolConfig.schoolLogo }}
                />
                <span className="font-extrabold text-base text-white tracking-wide">
                  {schoolConfig.schoolName}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mb-4">
                Providing standard-based, premium quality primary and secondary education in Ibadan. Building leaders of tomorrow with exceptional character and academic foundations.
              </p>
              <div className="flex items-center text-secondary text-xs font-semibold uppercase tracking-wider">
                <Award className="w-4 h-4 mr-2" />
                <span>{schoolConfig.schoolMotto}</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Quick Links</h3>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li>
                  <Link href="/admissions" className="hover:text-white transition-colors">Admissions &amp; Entrance Assessment</Link>
                </li>
                <li>
                  <Link href="/result-checker" className="hover:text-white transition-colors">Student Result Checker Portal</Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">About Our School &amp; History</Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">Campuses &amp; Contact Directory</Link>
                </li>
              </ul>
            </div>

            {/* Contact Details */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Campuses &amp; Inquiries</h3>
              <ul className="space-y-2.5 text-xs leading-relaxed">
                <li>
                  <span className="block text-slate-400 font-medium">Campuses:</span>
                  <span className="text-slate-200 block">{schoolConfig.schoolAddress1}</span>
                  <span className="text-slate-200 block mt-1">{schoolConfig.schoolAddress2}</span>
                </li>
                <li>
                  <span className="block text-slate-400 font-medium">Telephone Direct Lines:</span>
                  <span className="text-slate-200">{schoolConfig.schoolPhone}</span>
                </li>
                <li>
                  <span className="block text-slate-400 font-medium">Official Admissions Email:</span>
                  <span className="text-slate-200 hover:text-white transition-colors">{schoolConfig.schoolEmail}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Subdued Footer Bottom Utility Bar with Subtle Admin Link */}
          <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
            <div>
              &copy; {new Date().getFullYear()} {schoolConfig.schoolName}. All rights reserved.
            </div>
            <div>
              <Link href="/login" className="text-slate-600 hover:text-slate-400 transition-colors text-[11px]">
                Staff &amp; Admin Access
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
