'use client';

import React from 'react';
import Link from 'next/link';
import { PublicLayout } from '@/components/PublicLayout';
import { schoolConfig } from '../../config/school.config';
import { ShieldCheck, BookOpen, CreditCard, Sparkles, Smartphone, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <PublicLayout>
      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-20 lg:py-32 bg-linear-to-b from-primary/5 via-bg-custom to-bg-custom">
        {/* Vector Background Decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Column 1: Text & Actions */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary font-bold text-xs tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Modern School Portal</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-primary dark:text-white leading-tight">
                Empowering Minds, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent-light">
                  Securing Futures
                </span>
              </h1>
              
              <p className="text-base sm:text-lg text-muted-fg-custom leading-relaxed max-w-xl mx-auto lg:mx-0">
                Welcome to the official portal of {schoolConfig.schoolName}. We are dedicated to providing student-centered, holistic education focused on outstanding character, values, and academic distinction.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link
                  href="/result-checker"
                  className="flex items-center justify-center space-x-2 w-full sm:w-auto px-8 py-4 rounded-2xl bg-secondary text-white hover:bg-amber-600 font-extrabold text-base shadow-lg shadow-secondary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <span>Check Student Result</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                
                <Link
                  href="/login"
                  className="flex items-center justify-center space-x-2 w-full sm:w-auto px-8 py-4 rounded-2xl bg-card-custom hover:bg-muted-custom border border-border-custom text-fg-custom font-extrabold text-base shadow-sm hover:scale-105 active:scale-95 transition-all"
                >
                  <span>Staff Portal Login</span>
                </Link>
              </div>
            </div>

            {/* Column 2: Graphic Mockup */}
            <div className="lg:col-span-5 relative hidden lg:block">
              <div className="relative mx-auto w-full max-w-[360px] aspect-3/4 bg-card-custom rounded-3xl border border-border-custom shadow-2xl p-6 overflow-hidden">
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full" />
                
                {/* Simulated Logo Card */}
                <div className="flex items-center justify-between border-b border-border-custom pb-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: schoolConfig.schoolLogo }}
                    />
                    <span className="font-bold text-xs tracking-wider">SGGS Portal</span>
                  </div>
                  <span className="text-[10px] text-muted-fg-custom font-semibold">ONLINE</span>
                </div>
                
                {/* Card Content Grid */}
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-muted-custom/50 space-y-2">
                    <div className="h-3 w-16 bg-border-custom rounded-sm" />
                    <div className="h-5 w-32 bg-secondary/25 rounded-md" />
                  </div>
                  <div className="p-4 rounded-xl bg-muted-custom/50 space-y-2">
                    <div className="h-3 w-24 bg-border-custom rounded-sm" />
                    <div className="h-5 w-44 bg-primary/25 rounded-md" />
                  </div>
                  <div className="p-4 rounded-xl bg-muted-custom/50 space-y-2">
                    <div className="h-3 w-12 bg-border-custom rounded-sm" />
                    <div className="h-5 w-20 bg-emerald-500/25 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE PORTAL VALUES */}
      <section className="py-20 bg-card-custom border-t border-b border-border-custom transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl font-black tracking-tight text-primary dark:text-white">
              Shaping Minds. Building Futures.
            </h2>
            <p className="text-sm sm:text-base text-muted-fg-custom max-w-lg mx-auto">
              Welcome to a community where academic excellence meets character development.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Value 1 */}
            <div className="p-6 rounded-2xl bg-bg-custom hover:bg-muted-custom/25 border border-border-custom hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-primary dark:text-white">Academic Excellence</h3>
              <p className="text-xs text-muted-fg-custom leading-relaxed">
                From foundational literacy to advanced sciences, we provide students with the knowledge and critical thinking skills needed to thrive in a rapidly changing world.
              </p>
            </div>

            {/* Value 2 */}
            <div className="p-6 rounded-2xl bg-bg-custom hover:bg-muted-custom/25 border border-border-custom hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-primary dark:text-white">Latest Announcements</h3>
              <p className="text-xs text-muted-fg-custom leading-relaxed">
                📢 2026/2027 Academic Session — Registration is now open. All new students are advised to complete enrollment online or onsite. Visit the school office or send us a mail to get started.
              </p>
            </div>

            {/* Value 3 */}
            <div className="p-6 rounded-2xl bg-bg-custom hover:bg-muted-custom/25 border border-border-custom hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-accent-light/10 text-accent-light flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-primary dark:text-white">Parental Involvement</h3>
              <p className="text-xs text-muted-fg-custom leading-relaxed">
                We believe great education is a partnership. Parents are warmly encouraged to engage with school activities, attend meetings, and stay connected with their child's academic journey. Together, we raise exceptional children.
              </p>
            </div>

            {/* Value 4 */}
            <div className="p-6 rounded-2xl bg-bg-custom hover:bg-muted-custom/25 border border-border-custom hover:shadow-lg transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-primary dark:text-white">Student Life</h3>
              <p className="text-xs text-muted-fg-custom leading-relaxed">
                Beyond the classroom, our students thrive. From inter-house sports to science fairs, debate competitions to cultural showcases. school life here is rich, vibrant, and purposefully designed to build confident, well-rounded individuals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ACADEMIC LEVELS */}
      <section className="py-20 bg-linear-to-b from-bg-custom via-muted-custom/10 to-bg-custom">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl font-black tracking-tight text-primary dark:text-white">
              Academic Curriculums
            </h2>
            <p className="text-sm sm:text-base text-muted-fg-custom max-w-lg mx-auto">
              Our structures provide dedicated learning tracks tailored to the developmental needs of our students.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-4xl mx-auto">
            {/* Level 1: Junior */}
            <div className="p-8 rounded-3xl bg-card-custom border border-border-custom shadow-md space-y-6">
              <h3 className="text-xl font-black text-secondary">Junior Secondary School</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3.5 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs">JSS 1</span>
                <span className="px-3.5 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs">JSS 2</span>
                <span className="px-3.5 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs">JSS 3</span>
              </div>
              <p className="text-xs text-muted-fg-custom leading-relaxed">
                We focus on foundational courses including General Mathematics, English Studies, Civic Education, and Basic Sciences. Preparing our students for basic education certificates and secondary transitions.
              </p>
            </div>

            {/* Level 2: Senior */}
            <div className="p-8 rounded-3xl bg-card-custom border border-border-custom shadow-md space-y-6">
              <h3 className="text-xl font-black text-accent-light">Senior Secondary School</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3.5 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs">SSS 1</span>
                <span className="px-3.5 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs">SSS 2</span>
                <span className="px-3.5 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs">SSS 3</span>
              </div>
              <p className="text-xs text-muted-fg-custom leading-relaxed">
                We offer specialized tracks in Science, Arts, and Commercial studies. Courses include Physics, Chemistry, Biology, Economics, Government, and Data Processing, preparing students for university entrance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
