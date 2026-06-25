'use client';

import React, { useState } from 'react';
import { PublicLayout } from '@/components/PublicLayout';
import { schoolConfig } from '../../../config/school.config';
import { FileText, Download, Printer, UserCheck, Key, ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';

interface ResultRow {
  subject: string;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: string;
  remark: string;
}

interface StudentInfo {
  id: string;
  admissionNumber: string;
  fullName: string;
  gender: string;
  class: string;
  parentName: string;
}

interface TermSessionInfo {
  name: string;
}

export default function ResultChecker() {
  const [formData, setFormData] = useState({ studentId: '', tokenString: '', visitorName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<{
    student: StudentInfo;
    results: ResultRow[];
    term: TermSessionInfo;
    session: TermSessionInfo;
    usageCount: number;
    maxUsage: number;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentId || !formData.tokenString || !formData.visitorName) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const response = await fetch('/api/public/check-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check result');
      }

      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!reportData) return;
    const url = `/api/results/pdf?studentId=${formData.studentId}&token=${formData.tokenString}&visitorName=${encodeURIComponent(formData.visitorName)}&termId=${reportData.results[0] ? '' : ''}&sessionId=${reportData.results[0] ? '' : ''}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const resetForm = () => {
    setReportData(null);
    setError(null);
    setFormData({ studentId: '', tokenString: '', visitorName: '' });
  };

  // Aggregates
  const totalScore = reportData?.results.reduce((acc, curr) => acc + curr.totalScore, 0) || 0;
  const averageScore = reportData?.results.length ? (totalScore / reportData.results.length).toFixed(2) : '0';

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!reportData ? (
          /* CHECKER FORM */
          <div className="max-w-md mx-auto p-8 rounded-3xl bg-card-custom border border-border-custom shadow-lg space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex w-12 h-12 rounded-2xl bg-secondary/10 text-secondary items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-primary dark:text-white">Online Result Checker</h1>
              <p className="text-xs text-muted-fg-custom leading-relaxed">
                Enter details below to pull, print, or download your child’s termly report card.
              </p>
            </div>

            {error && (
              <div className="flex items-start space-x-2.5 p-4 rounded-xl bg-danger/10 border border-danger/25 text-danger">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs font-semibold leading-normal">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="studentId" className="text-xs font-bold text-slate-400">Student ID</label>
                <div className="relative">
                  <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="studentId"
                    type="text"
                    required
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value.toUpperCase().trim() })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-ring-custom"
                    placeholder="e.g. SGGS-2026-0001"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="tokenString" className="text-xs font-bold text-slate-400">Result Check Token</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="tokenString"
                    type="text"
                    required
                    value={formData.tokenString}
                    onChange={(e) => setFormData({ ...formData, tokenString: e.target.value.toUpperCase().trim() })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm font-semibold tracking-wider focus:outline-hidden focus:ring-2 focus:ring-ring-custom"
                    placeholder="e.g. ABC123"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="visitorName" className="text-xs font-bold text-slate-400">Parent / Guardian Name</label>
                <input
                  id="visitorName"
                  type="text"
                  required
                  value={formData.visitorName}
                  onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-ring-custom"
                  placeholder="e.g. Mr. Robert Doe"
                />
                <span className="block text-[10px] text-slate-500 italic mt-1">This field is required for security auditing logs.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-secondary hover:bg-amber-600 text-white font-extrabold text-sm shadow-md shadow-secondary/15 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Fetching report card...</span>
                  </>
                ) : (
                  <span>Verify and View Result</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* REPORT CARD VIEW */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Quick Actions Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card-custom border border-border-custom print:hidden">
              <button
                onClick={resetForm}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-muted-custom hover:bg-border-custom text-xs font-bold transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Search Another Student</span>
              </button>
              
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center space-x-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-muted-custom hover:bg-border-custom border border-border-custom text-xs font-bold transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Web Page</span>
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center space-x-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-secondary text-white hover:bg-amber-600 text-xs font-black shadow-md transition-all animate-bounce"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Result</span>
                </button>
              </div>
            </div>

            {/* Printable Report Card Grid */}
            <div className="p-8 sm:p-12 rounded-3xl bg-card-custom border border-border-custom shadow-xl space-y-8 print:border-0 print:shadow-none print:p-0 print:bg-white print:text-black">
              {/* BRAND HEADER */}
              <div className="flex items-center justify-between border-b-2 border-secondary pb-6">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-14 h-14 flex items-center justify-center rounded-2xl bg-primary text-white"
                    dangerouslySetInnerHTML={{ __html: schoolConfig.schoolLogo }}
                  />
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-primary print:text-black leading-none">{schoolConfig.schoolName}</h2>
                    <p className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-widest leading-none mt-1.5">{schoolConfig.schoolMotto}</p>
                    <p className="text-[9px] text-muted-fg-custom print:text-slate-600 mt-1 max-w-md leading-tight">{schoolConfig.schoolAddress}</p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="block font-black text-sm text-slate-400">REPORT SHEET</span>
                  <span className="block font-bold text-xs text-secondary">{reportData.term.name.toUpperCase()}</span>
                  <span className="block text-[10px] text-muted-fg-custom">{reportData.session.name} Session</span>
                </div>
              </div>

              {/* STUDENT BIO CARD */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-bg-custom/50 border border-border-custom print:bg-slate-100 print:text-black">
                <div className="space-y-1.5 text-xs">
                  <div className="flex"><span className="w-28 font-bold text-slate-400">Student Name:</span><span className="font-extrabold text-primary print:text-black uppercase">{reportData.student.fullName}</span></div>
                  <div className="flex"><span className="w-28 font-bold text-slate-400">Student ID:</span><span className="font-semibold">{reportData.student.id}</span></div>
                  <div className="flex"><span className="w-28 font-bold text-slate-400">Admission No:</span><span className="font-semibold">{reportData.student.admissionNumber}</span></div>
                  <div className="flex"><span className="w-28 font-bold text-slate-400">Gender:</span><span className="font-semibold">{reportData.student.gender}</span></div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex"><span className="w-28 font-bold text-slate-400">Class Arm:</span><span className="font-extrabold text-primary print:text-black">{reportData.student.class}</span></div>
                  <div className="flex"><span className="w-28 font-bold text-slate-400">Academic Session:</span><span className="font-semibold">{reportData.session.name}</span></div>
                  <div className="flex"><span className="w-28 font-bold text-slate-400">Academic Term:</span><span className="font-semibold">{reportData.term.name}</span></div>
                  <div className="flex"><span className="w-28 font-bold text-slate-400">Parent/Guardian:</span><span className="font-semibold">{reportData.student.parentName}</span></div>
                </div>
              </div>

              {/* REPORT CARD TABLE */}
              {reportData.results.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-border-custom rounded-2xl">
                  <span className="block text-sm text-slate-400 font-bold">No results logged for this term yet.</span>
                  <span className="text-xs text-slate-500">Contact the administration if this is an error.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-primary text-white print:bg-slate-800 print:text-white">
                        <th className="p-3 font-bold rounded-l-xl">Subject</th>
                        <th className="p-3 font-bold text-center">CA (30)</th>
                        <th className="p-3 font-bold text-center">Exam (70)</th>
                        <th className="p-3 font-bold text-center">Total (100)</th>
                        <th className="p-3 font-bold text-center">Grade</th>
                        <th className="p-3 font-bold text-center rounded-r-xl">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom">
                      {reportData.results.map((row) => (
                        <tr key={row.subject} className="hover:bg-muted-custom/20">
                          <td className="p-3 font-semibold text-primary dark:text-slate-300 print:text-black">{row.subject}</td>
                          <td className="p-3 text-center">{row.caScore}</td>
                          <td className="p-3 text-center">{row.examScore}</td>
                          <td className="p-3 text-center font-bold">{row.totalScore}</td>
                          <td className={`p-3 text-center font-black ${
                            row.grade === 'F' ? 'text-danger' : 'text-primary dark:text-secondary print:text-black'
                          }`}>{row.grade}</td>
                          <td className="p-3 text-center text-muted-fg-custom font-medium print:text-slate-700">{row.remark}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* REPORT STATISTICS & GUIDE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border-custom">
                {/* Aggregate / Averages */}
                <div className="p-5 rounded-2xl bg-muted-custom/40 space-y-2 border border-border-custom">
                  <h4 className="font-extrabold text-xs text-primary dark:text-white uppercase tracking-wider">Summary Statistics</h4>
                  <div className="flex justify-between text-xs pt-2">
                    <span className="font-bold text-slate-400">Total Aggregate Score:</span>
                    <span className="font-extrabold text-primary dark:text-white">{totalScore}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-400">Overall Average Score:</span>
                    <span className="font-extrabold text-secondary">{averageScore}%</span>
                  </div>
                </div>

                {/* Grade System Guide */}
                <div className="p-5 rounded-2xl bg-muted-custom/20 border border-border-custom space-y-2 text-[10px] text-muted-fg-custom leading-normal">
                  <h4 className="font-bold text-xs text-primary dark:text-white uppercase tracking-wider">Grading Key</h4>
                  <p>70 - 100 = A (Excellent)  |  60 - 69 = B (Very Good)</p>
                  <p>50 - 59 = C (Good)            |  45 - 49 = D (Fair)</p>
                  <p>40 - 44 = E (Pass)            |  00 - 39 = F (Fail)</p>
                </div>
              </div>

              {/* PRINCIPAL SIGN OFF BLOCK */}
              <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs">
                <div className="space-y-4">
                  <div className="h-6 border-b border-slate-300 mx-auto max-w-[200px]" />
                  <span className="font-bold text-slate-400">Class Teacher Signature</span>
                </div>
                <div className="space-y-4">
                  <div className="h-6 border-b border-slate-300 mx-auto max-w-[200px]" />
                  <span className="font-bold text-slate-400">School Principal Signature</span>
                </div>
              </div>

              {/* SECURITY TRACKING FOOTER */}
              <div className="text-[10px] text-slate-400 text-center border-t border-border-custom pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>Checked by parent/guardian: {formData.visitorName}</span>
                <span>Token verification quota count: {reportData.usageCount} of {reportData.maxUsage} uses</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
