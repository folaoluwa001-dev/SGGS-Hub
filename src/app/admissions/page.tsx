'use client';

import React from 'react';
import { PublicLayout } from '@/components/PublicLayout';
import { schoolConfig } from '../../../config/school.config';
import { FileText, Award, Calendar, ShieldCheck, Mail, ArrowRight } from 'lucide-react';

export default function Admissions() {
  const steps = [
    {
      num: '01',
      title: 'Obtain Application Form',
      desc: 'Purchase application forms directly from the school administration office or contact the admin team via email to receive a digital copy.',
    },
    {
      num: '02',
      title: 'Submit Documentation',
      desc: 'Fill out details and submit the application form along with passport photographs, birth certificates, and academic reports from previous schools.',
    },
    {
      num: '03',
      title: 'Entrance Assessment',
      desc: 'Students sit for standard entrance examinations testing Mathematics and English comprehension. Interviews are conducted for senior students.',
    },
    {
      num: '04',
      title: 'Enrollment & Fees',
      desc: 'Upon successful assessment, an admission offer is sent. Tuition and PTA levies are recorded by the Bursary to activate enrollment.',
    },
  ];

  return (
    <PublicLayout>
      {/* HEADER SECTION */}
      <section className="py-16 bg-linear-to-b from-primary/5 to-bg-custom border-b border-border-custom transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-accent-light/10 text-accent-light font-bold text-xs tracking-wider uppercase">
            <Calendar className="w-3.5 h-3.5" />
            <span>Admissions open for 2026/2027</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary dark:text-white">
            Admission Guidelines
          </h1>
          <p className="text-sm sm:text-base text-muted-fg-custom max-w-xl mx-auto leading-relaxed">
            Follow our structured application process to enroll your ward in {schoolConfig.schoolName}.
          </p>
        </div>
      </section>

      {/* STEPS LIST */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-2xl font-black text-primary dark:text-white">The Application Process</h2>
          <p className="text-xs sm:text-sm text-muted-fg-custom max-w-md mx-auto">
            Four simple steps to join our academic family.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {steps.map((step) => (
            <div key={step.num} className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-xs flex space-x-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary text-white font-black text-lg flex items-center justify-center">
                {step.num}
              </div>
              <div className="space-y-2">
                <h3 className="font-extrabold text-base text-primary dark:text-white">{step.title}</h3>
                <p className="text-xs text-muted-fg-custom leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* REQUIREMENTS BOX */}
      <section className="py-20 bg-card-custom border-t border-b border-border-custom transition-all">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 rounded-3xl bg-bg-custom border border-border-custom shadow-md space-y-8">
            <div className="flex items-center space-x-3 text-secondary">
              <FileText className="w-6 h-6" />
              <h2 className="text-xl sm:text-2xl font-black text-primary dark:text-white">Documentation Checklist</h2>
            </div>
            
            <p className="text-xs sm:text-sm text-muted-fg-custom leading-relaxed">
              Please gather the following documents before submitting your ward’s application to speed up the registration process:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center text-xs text-muted-fg-custom space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>4 Recent Passport Photographs of the student</span>
              </div>
              <div className="flex items-center text-xs text-muted-fg-custom space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Birth Certificate copy (photocopy)</span>
              </div>
              <div className="flex items-center text-xs text-muted-fg-custom space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Last Academic Report Card from previous school</span>
              </div>
              <div className="flex items-center text-xs text-muted-fg-custom space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Transfer Certificate (where applicable)</span>
              </div>
            </div>

            <div className="pt-6 border-t border-border-custom flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <span className="block font-bold text-xs text-slate-400 uppercase tracking-wide">Need Help?</span>
                <span className="text-xs text-muted-fg-custom">Contact the admission officer at {schoolConfig.schoolEmail}</span>
              </div>
              
              <a
                href={`mailto:${schoolConfig.schoolEmail}?subject=Admissions Inquiry`}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary-light font-bold text-xs shadow-md transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email Inquiry</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
