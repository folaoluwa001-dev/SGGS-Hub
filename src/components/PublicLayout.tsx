'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { schoolConfig } from '../../config/school.config';
import { useTheme } from './Providers';
import { ThemeToggle } from './ThemeToggle';
import { Menu, X, LogIn, Award } from 'lucide-react';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Admissions', href: '/admissions' },
    { name: 'Contact', href: '/contact' },
    { name: 'Result Checker', href: '/result-checker' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-bg-custom text-fg-custom">
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-card-custom/80 border-b border-border-custom transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo and Name */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-primary text-white shadow-md group-hover:scale-105 transition-transform"
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
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
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

            {/* Actions (Theme Toggle & Login) */}
            <div className="hidden md:flex items-center space-x-3">
              <ThemeToggle />
              <Link
                href="/login"
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-transparent border border-primary text-primary hover:bg-primary/5 dark:bg-primary dark:text-white dark:border-transparent dark:hover:bg-primary-light font-bold text-sm shadow-xs transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Portal Login</span>
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
                  className={`block px-4 py-2.5 rounded-xl text-sm font-bold ${
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
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center space-x-2 w-full px-4 py-3 rounded-xl bg-transparent border border-primary text-primary hover:bg-primary/5 dark:bg-primary dark:text-white dark:border-transparent dark:hover:bg-primary-light font-bold shadow-xs transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Portal Login</span>
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
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10"
                  dangerouslySetInnerHTML={{ __html: schoolConfig.schoolLogo }}
                />
                <span className="font-extrabold text-base text-white tracking-wide">
                  {schoolConfig.schoolName}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mb-4">
                Providing standard-based, premium quality primary and secondary education. Building leaders of tomorrow with character and excellent academic foundations.
              </p>
              <div className="flex items-center text-secondary text-xs font-semibold uppercase tracking-wider">
                <Award className="w-4 h-4 mr-2" />
                <span>{schoolConfig.schoolMotto}</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Portal Navigation</h3>
              <ul className="space-y-2.5 text-xs text-slate-300">
                <li>
                  <Link href="/result-checker" className="hover:text-white transition-colors">Result Checker Portal</Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">Staff Login (Teacher / Bursar / Admin)</Link>
                </li>
                <li>
                  <Link href="/admissions" className="hover:text-white transition-colors">Admissions Guidelines</Link>
                </li>
              </ul>
            </div>

            {/* Contact Details */}
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contact Directory</h3>
              <ul className="space-y-2.5 text-xs leading-relaxed">
                <li>
                  <span className="block text-slate-400 font-medium">Main Addresses:</span>
                  <span className="text-slate-200 block">{schoolConfig.schoolAddress1}</span>
                  <span className="text-slate-200 block mt-1">{schoolConfig.schoolAddress2}</span>
                </li>
                <li>
                  <span className="block text-slate-400 font-medium">Telephone Direct Line:</span>
                  <span className="text-slate-200">{schoolConfig.schoolPhone}</span>
                </li>
                <li>
                  <span className="block text-slate-400 font-medium">Email Address:</span>
                  <span className="text-slate-200 hover:text-white transition-colors">{schoolConfig.schoolEmail}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-[10px] text-slate-400">
            &copy; {new Date().getFullYear()} {schoolConfig.schoolName}. All rights reserved. Designed and developed as a Progressive Web Application.
          </div>
        </div>
      </footer>
    </div>
  );
}
