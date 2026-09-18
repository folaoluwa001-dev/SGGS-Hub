'use client';

import React from 'react';
import Link from 'next/link';
import { PublicLayout } from '@/components/PublicLayout';
import { schoolConfig } from '../../config/school.config';
import {
  ShieldCheck, BookOpen, Sparkles, ArrowRight, GraduationCap,
  Calendar, Award, CheckCircle2, MapPin, Users, Beaker,
  Compass, ChevronRight, FileText, Clock
} from 'lucide-react';

export default function Home() {
  const newsItems = [
    {
      id: 1,
      tag: 'Admissions & Academic',
      tagColor: 'bg-secondary/15 text-secondary',
      title: '2026/2027 Admissions Open: Computer-Based & On-Campus Entrance Exams',
      date: 'Sept 2026',
      summary:
        'Applications are officially open for new enrollments into Primary, Junior Secondary (JSS1-3), and Senior Secondary (SSS1-3). Candidates may opt for remote CBT or scheduled physical assessments.',
      link: '/admissions',
    },
    {
      id: 2,
      tag: 'Facilities & STEM',
      tagColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      title: 'Commissioning of Ultra-Modern Science & ICT Computer Laboratories',
      date: 'Term Updates',
      summary:
        'Our upgraded physics, chemistry, biology, and high-speed computer labs are now fully operational, providing hands-on experimental learning and practical STEM enrichment.',
      link: '/about',
    },
    {
      id: 3,
      tag: 'Student Life',
      tagColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
      title: 'Annual Inter-House Sports Festival & Cultural Exhibition Schedule',
      date: 'School Calendar',
      summary:
        'Preparations are underway for our celebrated inter-house athletic events and cultural showcase, promoting sportsmanship, team spirit, and creative talents across all houses.',
      link: '/about',
    },
  ];

  const pillars = [
    {
      icon: BookOpen,
      color: 'text-secondary bg-secondary/15',
      title: 'Academic Rigor & Distinction',
      description:
        'Curricula systematically designed for outstanding performance in internal examinations, BECE, WAEC, NECO, and UTME university admissions.',
    },
    {
      icon: ShieldCheck,
      color: 'text-emerald-600 bg-emerald-500/15',
      title: 'Character & Moral Discipline',
      description:
        'Uncompromising focus on integrity, respect, and leadership development, ensuring students emerge as disciplined role models for society.',
    },
    {
      icon: Beaker,
      color: 'text-accent-light bg-accent-light/15',
      title: 'Modern Science & ICT Labs',
      description:
        'Hands-on experimental science laboratories and computer-based learning facilities tailored to prepare students for the global digital economy.',
    },
    {
      icon: Users,
      color: 'text-amber-500 bg-amber-500/15',
      title: 'Parental Partnership',
      description:
        'Transparent academic tracking, real-time result checker portals, continuous assessment updates, and active Parent-Teacher Association collaboration.',
    },
  ];

  return (
    <PublicLayout>
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden py-16 lg:py-28 bg-linear-to-b from-primary/5 via-bg-custom to-bg-custom">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Column 1: Headline & Actions */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-secondary/10 text-secondary font-bold text-xs tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Premier Primary &amp; Secondary Education</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-primary dark:text-white leading-[1.15]">
                Nurturing Academic Excellence &amp;{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-500">
                  Exceptional Character
                </span>
              </h1>

              <p className="text-sm sm:text-base text-muted-fg-custom leading-relaxed max-w-xl mx-auto lg:mx-0">
                Welcome to {schoolConfig.schoolName}. Operating dual campuses in Akobo and Highland Estate, Ibadan, we equip students with academic mastery, moral discipline, and 21st-century leadership skills.
              </p>

              {/* Action Buttons: Clean & School-Focused (No Staff Login) */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/admissions"
                  className="flex items-center justify-center space-x-2 w-full sm:w-auto px-8 py-4 rounded-2xl bg-secondary text-white hover:bg-amber-600 font-extrabold text-sm sm:text-base shadow-lg shadow-secondary/20 hover:scale-102 active:scale-98 transition-all"
                >
                  <span>Apply for Admission (2026/2027)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/result-checker"
                  className="flex items-center justify-center space-x-2 w-full sm:w-auto px-8 py-4 rounded-2xl bg-card-custom hover:bg-muted-custom border border-border-custom text-fg-custom font-extrabold text-sm sm:text-base shadow-xs hover:scale-102 active:scale-98 transition-all"
                >
                  <Award className="w-4 h-4 text-secondary" />
                  <span>Check Student Result</span>
                </Link>
              </div>

              {/* Verified School Stats */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border-custom text-center lg:text-left">
                <div>
                  <span className="block font-black text-xl sm:text-2xl text-primary dark:text-white">
                    100%
                  </span>
                  <span className="text-[11px] text-muted-fg-custom font-semibold">
                    Exam Pass Rate
                  </span>
                </div>
                <div>
                  <span className="block font-black text-xl sm:text-2xl text-primary dark:text-white">
                    2 Campuses
                  </span>
                  <span className="text-[11px] text-muted-fg-custom font-semibold">
                    Akobo &amp; Highland
                  </span>
                </div>
                <div>
                  <span className="block font-black text-xl sm:text-2xl text-primary dark:text-white">
                    STEM &amp; Arts
                  </span>
                  <span className="text-[11px] text-muted-fg-custom font-semibold">
                    Modern Labs
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Admission Highlight Showcase Card */}
            <div className="lg:col-span-5 relative hidden lg:block">
              <div className="relative mx-auto w-full max-w-[380px] bg-card-custom rounded-3xl border border-border-custom shadow-2xl p-6 sm:p-7 space-y-6">
                {/* Visual Header */}
                <div className="flex items-center justify-between border-b border-border-custom pb-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 flex items-center justify-center shrink-0"
                      dangerouslySetInnerHTML={{ __html: schoolConfig.schoolLogo }}
                    />
                    <div>
                      <span className="block font-black text-xs text-primary dark:text-white leading-tight">
                        {schoolConfig.schoolName}
                      </span>
                      <span className="block text-[10px] text-secondary font-bold tracking-wider uppercase">
                        Accredited Institution
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                    Enrolling
                  </span>
                </div>

                {/* Admission Notice Pill */}
                <div className="p-4 rounded-2xl bg-bg-custom border border-border-custom space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-fg-custom">
                      2026/2027 Admissions
                    </span>
                    <span className="text-[11px] font-mono text-secondary font-bold">
                      Open
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-fg-custom leading-relaxed">
                    Online CBT entrance exams and scheduled physical examination dates available.
                  </p>
                </div>

                {/* Academic Tracks Preview */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted-custom/40 border border-border-custom text-xs">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4 text-secondary" />
                      <span className="font-bold text-fg-custom">Primary Education</span>
                    </div>
                    <span className="text-[10px] text-muted-fg-custom font-semibold">Basic 1 - 6</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted-custom/40 border border-border-custom text-xs">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4 text-accent-light" />
                      <span className="font-bold text-fg-custom">Junior Secondary</span>
                    </div>
                    <span className="text-[10px] text-muted-fg-custom font-semibold">JSS 1 - 3</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-muted-custom/40 border border-border-custom text-xs">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-fg-custom">Senior Secondary</span>
                    </div>
                    <span className="text-[10px] text-muted-fg-custom font-semibold">SSS 1 - 3</span>
                  </div>
                </div>

                {/* Direct Admission Link */}
                <div className="pt-2">
                  <Link
                    href="/admissions"
                    className="w-full py-3 rounded-xl bg-secondary text-white font-bold text-xs flex items-center justify-center space-x-2 hover:opacity-90 transition-all shadow-xs"
                  >
                    <span>Start Online Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. ADMISSIONS ANNOUNCEMENT & 3-STEP GUIDE */}
      <section className="py-14 bg-card-custom border-t border-b border-border-custom">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-10 rounded-3xl bg-linear-to-r from-primary via-primaryLight to-primary text-white shadow-xl space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-secondary/20 text-amber-300 font-bold text-xs uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Enrolling for 2026/2027 Academic Year</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Seamless Online Admission &amp; Entrance Assessment
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                  Register your ward in three simple steps. Choose between taking the remote entrance CBT or scheduling an on-campus examination date.
                </p>
              </div>

              <Link
                href="/admissions"
                className="inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-2xl bg-secondary text-white hover:bg-amber-600 font-extrabold text-xs sm:text-sm shadow-md transition-all shrink-0 self-start md:self-auto"
              >
                <span>Apply for Admission</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* 3 Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/10">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-secondary text-white font-black text-xs flex items-center justify-center">
                  01
                </div>
                <h3 className="font-extrabold text-sm text-white">Fill Online Bio &amp; Contact</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Provide student bio, target class, and parent contact details with instant mobile validation.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-secondary text-white font-black text-xs flex items-center justify-center">
                  02
                </div>
                <h3 className="font-extrabold text-sm text-white">Choose Entrance Assessment</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Take the timed 15-minute Computer-Based Test online immediately or select an on-campus Saturday slot.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-secondary text-white font-black text-xs flex items-center justify-center">
                  03
                </div>
                <h3 className="font-extrabold text-sm text-white">Merit Review &amp; Student ID</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Upon evaluation, an official admission offer is confirmed with immediate Student Directory enrollment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LATEST SCHOOL NEWS & ANNOUNCEMENTS */}
      <section className="py-20 bg-bg-custom">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                School Updates
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-white">
                Latest News &amp; Announcements
              </h2>
            </div>
            <Link
              href="/about"
              className="text-xs font-bold text-secondary hover:underline inline-flex items-center space-x-1"
            >
              <span>View School Profile</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {newsItems.map((news) => (
              <div
                key={news.id}
                className="p-6 rounded-3xl bg-card-custom border border-border-custom shadow-xs hover:border-secondary/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${news.tagColor}`}>
                      {news.tag}
                    </span>
                    <span className="text-[11px] text-muted-fg-custom font-semibold">
                      {news.date}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-primary dark:text-white leading-snug">
                    {news.title}
                  </h3>

                  <p className="text-xs text-muted-fg-custom leading-relaxed">
                    {news.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-border-custom">
                  <Link
                    href={news.link}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-secondary hover:text-amber-600 transition-colors"
                  >
                    <span>Read More</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WHY SUCCESS GATE (CORE PILLARS) */}
      <section className="py-20 bg-card-custom border-t border-b border-border-custom">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Why Success Gate
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-primary dark:text-white">
              Shaping Minds. Building Futures.
            </h2>
            <p className="text-xs sm:text-sm text-muted-fg-custom max-w-xl mx-auto">
              Our holistic educational model combines academic distinction with foundational values that stay with our pupils for a lifetime.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-bg-custom border border-border-custom hover:shadow-lg transition-all space-y-4"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${pillar.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-extrabold text-base text-primary dark:text-white">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-muted-fg-custom leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. ACADEMIC CURRICULA & DIVISIONS */}
      <section className="py-20 bg-bg-custom">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Academic Divisions
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-primary dark:text-white">
              Tailored Educational Pathways
            </h2>
            <p className="text-xs sm:text-sm text-muted-fg-custom max-w-lg mx-auto">
              Structured learning tracks tailored to each developmental milestone from basic school through senior secondary graduation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Primary School */}
            <div className="p-8 rounded-3xl bg-card-custom border border-border-custom shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center font-black text-sm">
                  PRI
                </div>
                <h3 className="text-lg font-black text-primary dark:text-white">
                  Primary School Division
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-md bg-bg-custom border border-border-custom text-[11px] font-bold text-secondary">
                    Basic 1 - 6
                  </span>
                </div>
                <p className="text-xs text-muted-fg-custom leading-relaxed">
                  Focusing on foundational numeracy, English phonetics, elementary science, social studies, and creative expression in an engaging, safe setting.
                </p>
              </div>

              <div className="pt-4 border-t border-border-custom">
                <Link
                  href="/admissions"
                  className="text-xs font-bold text-secondary hover:underline inline-flex items-center space-x-1"
                >
                  <span>Primary Admissions &rarr;</span>
                </Link>
              </div>
            </div>

            {/* Junior Secondary */}
            <div className="p-8 rounded-3xl bg-card-custom border border-border-custom shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-accent-light/15 text-accent-light flex items-center justify-center font-black text-sm">
                  JSS
                </div>
                <h3 className="text-lg font-black text-primary dark:text-white">
                  Junior Secondary School
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-md bg-bg-custom border border-border-custom text-[11px] font-bold text-accent-light">
                    JSS 1 &bull; JSS 2 &bull; JSS 3
                  </span>
                </div>
                <p className="text-xs text-muted-fg-custom leading-relaxed">
                  Core preparatory curriculum covering General Mathematics, English Studies, Basic Sciences, Computer Studies, and Civic Education for BECE examination success.
                </p>
              </div>

              <div className="pt-4 border-t border-border-custom">
                <Link
                  href="/admissions"
                  className="text-xs font-bold text-secondary hover:underline inline-flex items-center space-x-1"
                >
                  <span>Junior Secondary Admissions &rarr;</span>
                </Link>
              </div>
            </div>

            {/* Senior Secondary */}
            <div className="p-8 rounded-3xl bg-card-custom border border-border-custom shadow-xs space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-black text-sm">
                  SSS
                </div>
                <h3 className="text-lg font-black text-primary dark:text-white">
                  Senior Secondary School
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-md bg-bg-custom border border-border-custom text-[11px] font-bold text-emerald-600">
                    SSS 1 &bull; SSS 2 &bull; SSS 3
                  </span>
                </div>
                <p className="text-xs text-muted-fg-custom leading-relaxed">
                  Specialized departmental tracks in Science, Commercial, and Arts. Thorough laboratory and classroom preparation for WAEC, NECO, and JAMB UTME.
                </p>
              </div>

              <div className="pt-4 border-t border-border-custom">
                <Link
                  href="/admissions"
                  className="text-xs font-bold text-secondary hover:underline inline-flex items-center space-x-1"
                >
                  <span>Senior Secondary Admissions &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CAMPUS DIRECTORY & FINAL CTA BANNER */}
      <section className="py-16 bg-card-custom border-t border-border-custom">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Campuses Location Card */}
            <div className="p-8 rounded-3xl bg-bg-custom border border-border-custom shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-secondary font-bold text-xs uppercase tracking-wider">
                <MapPin className="w-4 h-4" />
                <span>Our Campus Locations in Ibadan</span>
              </div>
              <h3 className="text-xl font-black text-primary dark:text-white">
                Visit or Contact Our Administration Offices
              </h3>
              <div className="space-y-3 text-xs text-muted-fg-custom">
                <div className="p-3.5 rounded-xl bg-card-custom border border-border-custom space-y-1">
                  <strong className="text-fg-custom block">Primary Campus:</strong>
                  <span>{schoolConfig.schoolAddress1}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-card-custom border border-border-custom space-y-1">
                  <strong className="text-fg-custom block">College Campus:</strong>
                  <span>{schoolConfig.schoolAddress2}</span>
                </div>
              </div>
            </div>

            {/* Quick CTA Box */}
            <div className="p-8 rounded-3xl bg-secondary/10 border border-secondary/25 space-y-5">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                Enrollment Assistance
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-primary dark:text-white">
                Give Your Ward The Success Gate Advantage
              </h3>
              <p className="text-xs text-muted-fg-custom leading-relaxed">
                Take the first step toward academic excellence and strong character formation. Apply online today or contact our admissions office for in-person tours.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/admissions"
                  className="px-6 py-3 rounded-xl bg-secondary text-white font-bold text-xs shadow-md hover:opacity-90 transition-all flex items-center space-x-2"
                >
                  <span>Start Admission Application</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/contact"
                  className="px-5 py-3 rounded-xl border border-border-custom bg-card-custom hover:bg-muted-custom font-bold text-xs text-fg-custom transition-all"
                >
                  Contact Admissions Office
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
