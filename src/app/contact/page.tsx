'use client';

import React, { useState } from 'react';
import { PublicLayout } from '@/components/PublicLayout';
import { schoolConfig } from '../../../config/school.config';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setLoading(true);
    // Simulate contact form submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <PublicLayout>
      {/* HEADER SECTION */}
      <section className="py-16 bg-linear-to-b from-primary/5 to-bg-custom border-b border-border-custom transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary dark:text-white">
            Contact Our Campus
          </h1>
          <p className="text-sm sm:text-base text-muted-fg-custom max-w-xl mx-auto leading-relaxed">
            Have questions about student enrollment, portal login, or fees? Get in touch with our admin desk.
          </p>
        </div>
      </section>

      {/* CONTACT INFO AND FORM */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Column 1: Contact Details */}
          <div className="lg:col-span-5 space-y-6">
            <h2 className="text-2xl font-black text-primary dark:text-white">Get in Touch</h2>
            <p className="text-xs sm:text-sm text-muted-fg-custom leading-relaxed">
              We respond to inquiries within 24 working hours. Feel free to visit the school administration block during office hours.
            </p>

            <div className="space-y-4">
              {/* Detail 1 */}
              <div className="flex items-start space-x-4 p-4 rounded-xl bg-card-custom border border-border-custom">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-xs text-slate-400 uppercase tracking-wide">Campus Address</span>
                  <span className="text-xs sm:text-sm text-muted-fg-custom">{schoolConfig.schoolAddress}</span>
                </div>
              </div>

              {/* Detail 2 */}
              <div className="flex items-start space-x-4 p-4 rounded-xl bg-card-custom border border-border-custom">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-xs text-slate-400 uppercase tracking-wide">Phone Numbers</span>
                  <span className="text-xs sm:text-sm text-muted-fg-custom">{schoolConfig.schoolPhone}</span>
                </div>
              </div>

              {/* Detail 3 */}
              <div className="flex items-start space-x-4 p-4 rounded-xl bg-card-custom border border-border-custom">
                <div className="w-10 h-10 rounded-lg bg-accent-light/10 text-accent-light flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-xs text-slate-400 uppercase tracking-wide">Inquiry Email</span>
                  <span className="text-xs sm:text-sm text-muted-fg-custom">{schoolConfig.schoolEmail}</span>
                </div>
              </div>

              {/* Detail 4 */}
              <div className="flex items-start space-x-4 p-4 rounded-xl bg-card-custom border border-border-custom">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-bold text-xs text-slate-400 uppercase tracking-wide">Administrative Hours</span>
                  <span className="text-xs sm:text-sm text-muted-fg-custom">Monday - Friday: 7:30 AM - 4:00 PM</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Form */}
          <div className="lg:col-span-7 p-8 rounded-3xl bg-card-custom border border-border-custom shadow-xs">
            {submitted ? (
              <div className="text-center py-16 space-y-4">
                <div className="inline-flex w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-primary dark:text-white">Message Sent!</h3>
                <p className="text-sm text-muted-fg-custom max-w-sm mx-auto">
                  Thank you for reaching out. We have received your message and will contact you shortly.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2.5 rounded-xl bg-muted-custom hover:bg-border-custom font-bold text-xs transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-xl font-extrabold text-primary dark:text-white">Send a Message</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-xs font-semibold text-slate-400">Full Name</label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm focus:outline-hidden focus:ring-2 focus:ring-ring-custom transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-semibold text-slate-400">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm focus:outline-hidden focus:ring-2 focus:ring-ring-custom transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="subject" className="text-xs font-semibold text-slate-400">Inquiry Subject</label>
                  <input
                    id="subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm focus:outline-hidden focus:ring-2 focus:ring-ring-custom transition-all"
                    placeholder="e.g. Admission Forms"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-xs font-semibold text-slate-400">Message / Inquiry Details</label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm focus:outline-hidden focus:ring-2 focus:ring-ring-custom transition-all resize-none"
                    placeholder="Enter your questions here..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 w-full px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-light text-white font-extrabold text-sm shadow-md transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Inquiry</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
