'use client';

import React from 'react';
import { PublicLayout } from '@/components/PublicLayout';
import { schoolConfig } from '../../../config/school.config';
import { BookOpen, Users, Compass, ShieldAlert } from 'lucide-react';

export default function About() {
  return (
    <PublicLayout>
      {/* HEADER SECTION */}
      <section className="py-16 bg-linear-to-b from-primary/5 to-bg-custom border-b border-border-custom transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary dark:text-white">
            About Our School
          </h1>
          <p className="text-sm sm:text-base text-muted-fg-custom max-w-xl mx-auto leading-relaxed">
            Discover the values, mission, and history behind {schoolConfig.schoolName}.
          </p>
        </div>
      </section>

      {/* CORE VISION & MISSION */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-stretch">
          {/* Mission */}
          <div className="p-8 rounded-3xl bg-card-custom border border-border-custom shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-primary dark:text-white">Our Mission</h2>
              <p className="text-xs sm:text-sm text-muted-fg-custom leading-relaxed">
                To provide a stimulating, supportive, and safe learning environment where students are inspired to achieve academic excellence, develop integrity, and cultivate leadership skills that prepare them for local and global contributions.
              </p>
            </div>
            <div className="h-1 bg-secondary rounded-full w-20" />
          </div>

          {/* Vision */}
          <div className="p-8 rounded-3xl bg-card-custom border border-border-custom shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent-light/15 text-accent-light flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-primary dark:text-white">Our Vision</h2>
              <p className="text-xs sm:text-sm text-muted-fg-custom leading-relaxed">
                To be a leading center of educational excellence, recognized for nurturing students who are academically competent, morally upright, and equipped with standard life skills to guide them into impactful futures.
              </p>
            </div>
            <div className="h-1 bg-accent rounded-full w-20" />
          </div>
        </div>
      </section>

      {/* CORE VALUES */}
      <section className="py-20 bg-card-custom border-t border-b border-border-custom transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl font-black text-primary dark:text-white">Our Core Pillars</h2>
            <p className="text-xs sm:text-sm text-muted-fg-custom max-w-md mx-auto">
              These fundamental principles define the moral compass and academic standard of Success Gate.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-bg-custom border border-border-custom space-y-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                01
              </div>
              <h3 className="font-extrabold text-base text-primary dark:text-white">Academic Rigor</h3>
              <p className="text-xs text-muted-fg-custom leading-relaxed">
                We push standard boundaries of comprehension, teaching analytical reasoning, mathematical logic, and scientific experimentations.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-bg-custom border border-border-custom space-y-4">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                02
              </div>
              <h3 className="font-extrabold text-base text-primary dark:text-white">Character & Integrity</h3>
              <p className="text-xs text-muted-fg-custom leading-relaxed">
                Education without character is incomplete. We emphasize respect, truthfulness, accountability, and strong civic responsibilities.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-bg-custom border border-border-custom space-y-4">
              <div className="w-10 h-10 rounded-xl bg-accent-light/10 text-accent-light flex items-center justify-center font-bold">
                03
              </div>
              <h3 className="font-extrabold text-base text-primary dark:text-white">Community & Inclusion</h3>
              <p className="text-xs text-muted-fg-custom leading-relaxed">
                Building a welcoming community that promotes teamwork, mutual understanding, cultural appreciation, and support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BRIEF HISTORY */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <h2 className="text-3xl font-black text-center text-primary dark:text-white">Our Heritage</h2>
        <div className="relative border-l-2 border-border-custom ml-4 md:ml-32 pl-8 space-y-12">
          {/* Milestone 1 */}
          <div className="relative">
            <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-primary border-4 border-card-custom" />
            <div className="md:absolute md:-left-36 md:top-1.5 font-black text-sm text-secondary">
              2010
            </div>
            <h3 className="font-extrabold text-lg text-primary dark:text-white mb-2">Foundation</h3>
            <p className="text-xs text-muted-fg-custom leading-relaxed">
              Success Gate was established with a singular vision to bridge academic gaps in Alimosho, Lagos, starting with a handful of students and three classrooms.
            </p>
          </div>

          {/* Milestone 2 */}
          <div className="relative">
            <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-secondary border-4 border-card-custom" />
            <div className="md:absolute md:-left-36 md:top-1.5 font-black text-sm text-secondary">
              2018
            </div>
            <h3 className="font-extrabold text-lg text-primary dark:text-white mb-2">Campus Expansion</h3>
            <p className="text-xs text-muted-fg-custom leading-relaxed">
              Expanded to a multi-wing compound building modern science laboratories, computing facilities, and enrolling over 500 students across junior/senior wings.
            </p>
          </div>

          {/* Milestone 3 */}
          <div className="relative">
            <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-accent-light border-4 border-card-custom" />
            <div className="md:absolute md:-left-36 md:top-1.5 font-black text-sm text-secondary">
              2026
            </div>
            <h3 className="font-extrabold text-lg text-primary dark:text-white mb-2">Digital Transformation</h3>
            <p className="text-xs text-muted-fg-custom leading-relaxed">
              Launched the Success Gate Hub portal, implementing automated score syncing, digital report checks, and complete bursary record portals.
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
