'use client';

import React, { useState } from 'react';
import { PublicLayout } from '@/components/PublicLayout';
import { schoolConfig } from '../../../config/school.config';
import {
  FileText, Calendar, ShieldCheck, Mail, ArrowRight, User, Phone,
  MapPin, School, CheckCircle2, AlertCircle, Sparkles, Clock, Copy,
  Check, Printer, Search, RefreshCw, GraduationCap
} from 'lucide-react';
import Link from 'next/link';

export default function AdmissionsPage() {
  const [activeTab, setActiveTab] = useState<'apply' | 'guidelines' | 'status'>('apply');

  // Form State
  const [formData, setFormData] = useState({
    student_name: '',
    dob: '',
    gender: 'Male',
    target_class: 'JSS1',
    parent_name: '',
    parent_phone: '',
    parent_whatsapp: '',
    residential_address: '',
    previous_school: '',
    exam_mode: 'ONLINE', // 'ONLINE' or 'PHYSICAL'
    exam_date: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<any | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Status check tab state
  const [statusSearchRef, setStatusSearchRef] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<any | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // E.164 phone regex: e.g. +2348012345678
  const E164_REGEX = /^\+[1-9]\d{6,14}$/;

  const classOptions = [
    'JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'
  ];

  // Helper to format local number to E.164 if user forgot +234
  const formatPhoneNumber = (val: string): string => {
    let clean = val.trim().replace(/[\s-]/g, '');
    if (clean.startsWith('0') && clean.length === 11) {
      // Nigerian local format e.g. 08031234567 -> +2348031234567
      clean = '+234' + clean.slice(1);
    } else if (clean && !clean.startsWith('+')) {
      clean = '+' + clean;
    }
    return clean;
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.student_name.trim()) {
      errors.student_name = 'Student full name is required.';
    }
    if (!formData.dob) {
      errors.dob = 'Date of birth is required.';
    }
    if (!formData.target_class) {
      errors.target_class = 'Please select a target class.';
    }
    if (!formData.parent_name.trim()) {
      errors.parent_name = 'Parent / Guardian name is required.';
    }

    // Phone validation
    const formattedPhone = formatPhoneNumber(formData.parent_phone);
    if (!formData.parent_phone.trim()) {
      errors.parent_phone = 'Parent phone number is required.';
    } else if (!E164_REGEX.test(formattedPhone)) {
      errors.parent_phone = 'Please provide a valid phone number in E.164 format (e.g. +2348012345678).';
    }

    // Optional WhatsApp validation
    if (formData.parent_whatsapp.trim()) {
      const formattedWhatsapp = formatPhoneNumber(formData.parent_whatsapp);
      if (!E164_REGEX.test(formattedWhatsapp)) {
        errors.parent_whatsapp = 'WhatsApp number must be in E.164 format (e.g. +2348012345678).';
      }
    }

    if (!formData.residential_address.trim()) {
      errors.residential_address = 'Residential address is required.';
    }

    if (formData.exam_mode === 'PHYSICAL' && !formData.exam_date) {
      errors.exam_date = 'Please select your preferred physical exam date.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        parent_phone: formatPhoneNumber(formData.parent_phone),
        parent_whatsapp: formData.parent_whatsapp.trim() ? formatPhoneNumber(formData.parent_whatsapp) : undefined,
      };

      const res = await fetch('/api/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit application. Please try again.');
      } else {
        setSubmittedApp(data.application);
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError('A network error occurred. Please check your connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyReferenceNumber = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleSearchStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusSearchRef.trim()) return;

    setStatusLoading(true);
    setStatusError(null);
    setStatusResult(null);

    try {
      const res = await fetch(`/api/admissions/${encodeURIComponent(statusSearchRef.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setStatusError(data.error || 'Application reference number not found.');
      } else {
        setStatusResult(data);
      }
    } catch (err) {
      setStatusError('Failed to query status. Please try again.');
    } finally {
      setStatusLoading(false);
    }
  };

  const steps = [
    {
      num: '01',
      title: 'Submit Online Application',
      desc: 'Complete the student bio, parent contact, and academic details through our simple application portal.',
    },
    {
      num: '02',
      title: 'Choose Entrance Assessment',
      desc: 'Choose between taking the online entrance exam immediately or scheduling an on-campus physical exam date.',
    },
    {
      num: '03',
      title: 'Admission Evaluation',
      desc: 'Our academic board reviews the applicant profile and entrance test scores for class placement.',
    },
    {
      num: '04',
      title: 'Enrollment & ID Assignment',
      desc: 'Upon admission offer, the student is registered into the directory and official Student ID is assigned.',
    },
  ];

  return (
    <PublicLayout>
      {/* HEADER SECTION */}
      <section className="py-14 bg-linear-to-b from-primary/5 via-bg-custom to-bg-custom border-b border-border-custom transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-secondary/10 text-secondary font-bold text-xs tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Admissions Portal &bull; 2026/2027 Academic Session</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary dark:text-white">
            Enroll at {schoolConfig.schoolName}
          </h1>
          <p className="text-xs sm:text-sm text-muted-fg-custom max-w-xl mx-auto leading-relaxed">
            Begin your ward’s journey of academic excellence and character development with our streamlined online admission process.
          </p>

          {/* Navigation Pill Tabs */}
          <div className="pt-4 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setActiveTab('apply')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'apply'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-card-custom border border-border-custom text-muted-fg-custom hover:text-fg-custom'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Apply Online</span>
            </button>

            <button
              onClick={() => setActiveTab('status')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'status'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-card-custom border border-border-custom text-muted-fg-custom hover:text-fg-custom'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Check Status / Take Exam</span>
            </button>

            <button
              onClick={() => setActiveTab('guidelines')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'guidelines'
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-card-custom border border-border-custom text-muted-fg-custom hover:text-fg-custom'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Requirements & Guidelines</span>
            </button>
          </div>
        </div>
      </section>

      {/* 1. APPLY ONLINE TAB */}
      {activeTab === 'apply' && (
        <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {submittedApp ? (
            /* SUCCESS STATE */
            <div className="bg-card-custom border border-border-custom rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600">
                  Application Submitted Successfully
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-primary dark:text-white">
                  Welcome to Success Gate!
                </h2>
                <p className="text-xs sm:text-sm text-muted-fg-custom max-w-lg mx-auto">
                  Your ward’s online admission application has been registered with reference code below.
                </p>
              </div>

              {/* Reference Number Card */}
              <div className="p-6 rounded-2xl bg-bg-custom border border-border-custom flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-muted-fg-custom block font-semibold uppercase tracking-wider">
                    Application Reference Number
                  </span>
                  <span className="text-2xl sm:text-3xl font-mono font-black text-secondary tracking-wider">
                    {submittedApp.referenceNumber}
                  </span>
                </div>
                <button
                  onClick={() => copyReferenceNumber(submittedApp.referenceNumber)}
                  className="px-4 py-2.5 rounded-xl border border-border-custom bg-card-custom hover:bg-muted-custom text-xs font-bold text-fg-custom flex items-center space-x-2 transition-all"
                >
                  {copiedRef ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Summary Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-bg-custom border border-border-custom space-y-1">
                  <span className="text-muted-fg-custom block">Student Name</span>
                  <span className="font-bold text-fg-custom text-sm">{submittedApp.studentName}</span>
                </div>
                <div className="p-4 rounded-2xl bg-bg-custom border border-border-custom space-y-1">
                  <span className="text-muted-fg-custom block">Target Class</span>
                  <span className="font-bold text-fg-custom text-sm">{submittedApp.targetClass}</span>
                </div>
                <div className="p-4 rounded-2xl bg-bg-custom border border-border-custom space-y-1">
                  <span className="text-muted-fg-custom block">Parent / Guardian</span>
                  <span className="font-bold text-fg-custom text-sm">{submittedApp.parentName}</span>
                </div>
                <div className="p-4 rounded-2xl bg-bg-custom border border-border-custom space-y-1">
                  <span className="text-muted-fg-custom block">Contact Phone</span>
                  <span className="font-mono font-bold text-fg-custom text-sm">{submittedApp.parentPhone}</span>
                </div>
              </div>

              {/* Next Steps Card based on Exam Mode */}
              <div className="p-6 rounded-2xl bg-secondary/10 border border-secondary/20 space-y-4">
                <div className="flex items-center space-x-3">
                  <GraduationCap className="w-6 h-6 text-secondary shrink-0" />
                  <div>
                    <h3 className="font-extrabold text-sm text-primary dark:text-white">
                      {submittedApp.examMode === 'ONLINE'
                        ? 'Online Entrance Assessment Ready'
                        : 'Physical Entrance Examination Scheduled'}
                    </h3>
                    <p className="text-xs text-muted-fg-custom">
                      {submittedApp.examMode === 'ONLINE'
                        ? 'You can take the 15-minute entrance exam right now or resume later with your reference number.'
                        : `Your physical exam is scheduled for ${
                            submittedApp.examDate
                              ? new Date(submittedApp.examDate).toLocaleDateString(undefined, {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })
                              : 'the upcoming weekend session'
                          } at the school main campus.`}
                    </p>
                  </div>
                </div>

                {submittedApp.examMode === 'ONLINE' && (
                  <div className="pt-2">
                    <Link
                      href={`/admissions/exam?ref=${submittedApp.referenceNumber}`}
                      className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-secondary text-white font-bold text-xs shadow-md hover:opacity-90 transition-all"
                    >
                      <span>Take Entrance Exam Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border-custom">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl border border-border-custom bg-card-custom hover:bg-muted-custom text-xs font-bold text-fg-custom flex items-center space-x-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Slip</span>
                </button>

                <button
                  onClick={() => {
                    setSubmittedApp(null);
                    setFormData({
                      student_name: '',
                      dob: '',
                      gender: 'Male',
                      target_class: 'JSS1',
                      parent_name: '',
                      parent_phone: '',
                      parent_whatsapp: '',
                      residential_address: '',
                      previous_school: '',
                      exam_mode: 'ONLINE',
                      exam_date: '',
                    });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90 transition-all"
                >
                  Submit Another Application
                </button>
              </div>
            </div>
          ) : (
            /* APPLICATION FORM */
            <div className="bg-card-custom border border-border-custom rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
              <div className="border-b border-border-custom pb-5 space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-primary dark:text-white">
                  Student Application Form
                </h2>
                <p className="text-xs text-muted-fg-custom">
                  Please fill out the form carefully with accurate information. All fields marked with * are required.
                </p>
              </div>

              {submitError && (
                <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* SECTION 1: STUDENT BIO */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-secondary">
                    <User className="w-4 h-4" />
                    <span>1. Student Information</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-fg-custom mb-1">
                        Student Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Samuel Adewale Johnson"
                        value={formData.student_name}
                        onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                        className={`w-full px-4 py-2.5 rounded-xl bg-bg-custom border text-xs text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary ${
                          formErrors.student_name ? 'border-danger' : 'border-border-custom'
                        }`}
                      />
                      {formErrors.student_name && (
                        <span className="text-[11px] text-danger mt-1 block">{formErrors.student_name}</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-fg-custom mb-1">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        value={formData.dob}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className={`w-full px-4 py-2.5 rounded-xl bg-bg-custom border text-xs text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary ${
                          formErrors.dob ? 'border-danger' : 'border-border-custom'
                        }`}
                      />
                      {formErrors.dob && (
                        <span className="text-[11px] text-danger mt-1 block">{formErrors.dob}</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-fg-custom mb-1">
                        Gender *
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-xs text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-fg-custom mb-1">
                        Target Class to Enter *
                      </label>
                      <select
                        value={formData.target_class}
                        onChange={(e) => setFormData({ ...formData, target_class: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-xs text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary font-bold"
                      >
                        {classOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-fg-custom mb-1">
                        Previous School Attended (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Apex Primary School"
                        value={formData.previous_school}
                        onChange={(e) => setFormData({ ...formData, previous_school: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-xs text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary"
                      >
                      </input>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: PARENT / GUARDIAN INFO */}
                <div className="space-y-4 pt-4 border-t border-border-custom">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-secondary">
                    <Phone className="w-4 h-4" />
                    <span>2. Parent / Guardian Contact Details</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-fg-custom mb-1">
                        Parent / Guardian Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mr. & Mrs. O. Johnson"
                        value={formData.parent_name}
                        onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                        className={`w-full px-4 py-2.5 rounded-xl bg-bg-custom border text-xs text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary ${
                          formErrors.parent_name ? 'border-danger' : 'border-border-custom'
                        }`}
                      />
                      {formErrors.parent_name && (
                        <span className="text-[11px] text-danger mt-1 block">{formErrors.parent_name}</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-fg-custom mb-1">
                        Parent Phone Number (E.164 format) *
                      </label>
                      <input
                        type="tel"
                        placeholder="+2348012345678"
                        value={formData.parent_phone}
                        onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                        className={`w-full px-4 py-2.5 rounded-xl bg-bg-custom border text-xs text-fg-custom font-mono focus:outline-hidden focus:ring-2 focus:ring-secondary ${
                          formErrors.parent_phone ? 'border-danger' : 'border-border-custom'
                        }`}
                      />
                      <span className="text-[10px] text-muted-fg-custom mt-1 block">
                        Include country code e.g. +2348012345678
                      </span>
                      {formErrors.parent_phone && (
                        <span className="text-[11px] text-danger mt-1 block">{formErrors.parent_phone}</span>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-fg-custom mb-1">
                        Parent WhatsApp Number (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="+2348012345678"
                        value={formData.parent_whatsapp}
                        onChange={(e) => setFormData({ ...formData, parent_whatsapp: e.target.value })}
                        className={`w-full px-4 py-2.5 rounded-xl bg-bg-custom border text-xs text-fg-custom font-mono focus:outline-hidden focus:ring-2 focus:ring-secondary ${
                          formErrors.parent_whatsapp ? 'border-danger' : 'border-border-custom'
                        }`}
                      />
                      {formErrors.parent_whatsapp && (
                        <span className="text-[11px] text-danger mt-1 block">{formErrors.parent_whatsapp}</span>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-fg-custom mb-1">
                        Residential Home Address *
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Street address, city, and state"
                        value={formData.residential_address}
                        onChange={(e) => setFormData({ ...formData, residential_address: e.target.value })}
                        className={`w-full px-4 py-2.5 rounded-xl bg-bg-custom border text-xs text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary ${
                          formErrors.residential_address ? 'border-danger' : 'border-border-custom'
                        }`}
                      />
                      {formErrors.residential_address && (
                        <span className="text-[11px] text-danger mt-1 block">{formErrors.residential_address}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 3: ENTRANCE EXAM OPTIONS */}
                <div className="space-y-4 pt-4 border-t border-border-custom">
                  <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-secondary">
                    <GraduationCap className="w-4 h-4" />
                    <span>3. Entrance Assessment Preference</span>
                  </div>

                  <p className="text-xs text-muted-fg-custom">
                    All applicants undergo an entrance evaluation. Choose whether to take the online computer-based exam remotely or schedule a physical on-campus date.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Option A: Online Exam */}
                    <div
                      onClick={() => setFormData({ ...formData, exam_mode: 'ONLINE' })}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                        formData.exam_mode === 'ONLINE'
                          ? 'border-secondary bg-secondary/10 ring-2 ring-secondary'
                          : 'border-border-custom bg-bg-custom hover:bg-card-custom'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-primary dark:text-white">
                          Online Entrance Exam
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            formData.exam_mode === 'ONLINE'
                              ? 'border-secondary bg-secondary text-white'
                              : 'border-border-custom'
                          }`}
                        >
                          {formData.exam_mode === 'ONLINE' && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-fg-custom leading-relaxed">
                        Take a 15-minute computer-based assessment online immediately after submitting or at your convenience.
                      </p>
                    </div>

                    {/* Option B: Physical Exam */}
                    <div
                      onClick={() => setFormData({ ...formData, exam_mode: 'PHYSICAL' })}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                        formData.exam_mode === 'PHYSICAL'
                          ? 'border-secondary bg-secondary/10 ring-2 ring-secondary'
                          : 'border-border-custom bg-bg-custom hover:bg-card-custom'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-primary dark:text-white">
                          Schedule Physical Exam Date
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            formData.exam_mode === 'PHYSICAL'
                              ? 'border-secondary bg-secondary text-white'
                              : 'border-border-custom'
                          }`}
                        >
                          {formData.exam_mode === 'PHYSICAL' && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-fg-custom leading-relaxed">
                        Schedule an in-person written entrance exam session at our school examination hall.
                      </p>
                    </div>
                  </div>

                  {formData.exam_mode === 'PHYSICAL' && (
                    <div className="p-4 rounded-2xl bg-bg-custom border border-border-custom space-y-2">
                      <label className="block text-xs font-bold text-fg-custom">
                        Select Preferred Physical Exam Date *
                      </label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={formData.exam_date}
                        onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                        className={`w-full sm:w-64 px-4 py-2.5 rounded-xl bg-card-custom border text-xs text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary ${
                          formErrors.exam_date ? 'border-danger' : 'border-border-custom'
                        }`}
                      />
                      {formErrors.exam_date && (
                        <span className="text-[11px] text-danger mt-1 block">{formErrors.exam_date}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-4 border-t border-border-custom flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-secondary text-white font-bold text-xs shadow-md hover:opacity-90 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete & Submit Application</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>
      )}

      {/* 2. CHECK STATUS / TAKE EXAM TAB */}
      {activeTab === 'status' && (
        <section className="py-12 max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-card-custom border border-border-custom rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-primary dark:text-white">
                Check Admission Status & Entrance Exam
              </h2>
              <p className="text-xs text-muted-fg-custom">
                Enter your Application Reference Number to review status or continue with your online entrance exam.
              </p>
            </div>

            {statusError && (
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{statusError}</span>
              </div>
            )}

            <form onSubmit={handleSearchStatus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-fg-custom mb-1.5">
                  Application Reference Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. ADM-2026-0001"
                  value={statusSearchRef}
                  onChange={(e) => setStatusSearchRef(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-bg-custom border border-border-custom text-fg-custom text-sm font-mono tracking-wider focus:outline-hidden focus:ring-2 focus:ring-secondary uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={statusLoading || !statusSearchRef.trim()}
                className="w-full py-3 rounded-xl bg-secondary text-white font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {statusLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <span>Find Application</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {statusResult && (
              <div className="mt-6 p-6 rounded-2xl bg-bg-custom border border-border-custom space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-secondary">
                    {statusResult.referenceNumber}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      statusResult.status === 'admitted'
                        ? 'bg-emerald-500/15 text-emerald-600'
                        : statusResult.status === 'rejected'
                        ? 'bg-danger/15 text-danger'
                        : 'bg-amber-500/15 text-amber-600'
                    }`}
                  >
                    {statusResult.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-fg-custom block">Candidate</span>
                    <span className="font-bold text-fg-custom">{statusResult.studentName}</span>
                  </div>
                  <div>
                    <span className="text-muted-fg-custom block">Target Class</span>
                    <span className="font-bold text-fg-custom">{statusResult.targetClass}</span>
                  </div>
                  <div>
                    <span className="text-muted-fg-custom block">Exam Mode</span>
                    <span className="font-bold text-fg-custom capitalize">{statusResult.examMode}</span>
                  </div>
                  <div>
                    <span className="text-muted-fg-custom block">Exam Score</span>
                    <span className="font-bold text-fg-custom">
                      {statusResult.examScore !== null ? `${statusResult.examScore}%` : 'Pending'}
                    </span>
                  </div>
                </div>

                {statusResult.assignedStudentId && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
                    <span className="block font-bold">Assigned Student ID:</span>
                    <span className="font-mono font-black text-sm">{statusResult.assignedStudentId}</span>
                    <span className="block text-[11px] mt-0.5">Assigned Class: {statusResult.assignedClass}</span>
                  </div>
                )}

                {statusResult.examMode === 'ONLINE' && statusResult.examScore === null && (
                  <div className="pt-2">
                    <Link
                      href={`/admissions/exam?ref=${statusResult.referenceNumber}`}
                      className="w-full py-2.5 rounded-xl bg-secondary text-white font-bold text-xs flex items-center justify-center space-x-2 hover:opacity-90 transition-all"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Take Online Entrance Exam Now</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. GUIDELINES & REQUIREMENTS TAB */}
      {activeTab === 'guidelines' && (
        <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {steps.map((step) => (
              <div
                key={step.num}
                className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-xs flex space-x-4"
              >
                <div className="shrink-0 w-12 h-12 rounded-xl bg-primary text-white font-black text-lg flex items-center justify-center">
                  {step.num}
                </div>
                <div className="space-y-2">
                  <h3 className="font-extrabold text-base text-primary dark:text-white">{step.title}</h3>
                  <p className="text-xs text-muted-fg-custom leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 rounded-3xl bg-card-custom border border-border-custom shadow-sm space-y-6">
            <div className="flex items-center space-x-3 text-secondary">
              <FileText className="w-6 h-6" />
              <h2 className="text-xl sm:text-2xl font-black text-primary dark:text-white">
                Documentation Checklist
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-muted-fg-custom leading-relaxed">
              Please gather the following documents when reporting for physical verification:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center text-xs text-muted-fg-custom space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>4 Recent Passport Photographs of the student</span>
              </div>
              <div className="flex items-center text-xs text-muted-fg-custom space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Birth Certificate copy (photocopy)</span>
              </div>
              <div className="flex items-center text-xs text-muted-fg-custom space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Last Academic Report Card from previous school</span>
              </div>
              <div className="flex items-center text-xs text-muted-fg-custom space-x-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>Transfer Certificate (where applicable)</span>
              </div>
            </div>

            <div className="pt-6 border-t border-border-custom flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <span className="block font-bold text-xs text-slate-400 uppercase tracking-wide">
                  Need Help?
                </span>
                <span className="text-xs text-muted-fg-custom">
                  Contact the admissions officer at {schoolConfig.schoolEmail}
                </span>
              </div>

              <a
                href={`mailto:${schoolConfig.schoolEmail}?subject=Admissions Inquiry`}
                className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-transparent border border-primary text-primary hover:bg-primary/5 dark:bg-primary dark:text-white dark:border-transparent font-bold text-xs transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>Send Email Inquiry</span>
              </a>
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}
