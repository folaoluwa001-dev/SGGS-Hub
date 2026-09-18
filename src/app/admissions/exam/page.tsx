'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PublicLayout } from '@/components/PublicLayout';
import { schoolConfig } from '../../../../config/school.config';
import { juniorEntranceQuestions, ExamQuestion } from '@/lib/entranceExamQuestions';
import {
  GraduationCap, Clock, CheckCircle2, AlertCircle, ArrowRight,
  ArrowLeft, Check, ShieldCheck, Award, RefreshCw, FileText
} from 'lucide-react';
import Link from 'next/link';

function ExamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const refParam = searchParams.get('ref') || '';

  const [referenceNumber, setReferenceNumber] = useState(refParam);
  const [appData, setAppData] = useState<any>(null);
  const [loadingApp, setLoadingApp] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Test State
  const [examStarted, setExamStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [submitting, setSubmitting] = useState(false);
  const [examFinished, setExamFinished] = useState(false);
  const [resultScore, setResultScore] = useState<number | null>(null);

  const questions: ExamQuestion[] = juniorEntranceQuestions;

  // Fetch applicant data on mount if ref exists
  useEffect(() => {
    if (refParam) {
      loadApplication(refParam);
    }
  }, [refParam]);

  // Timer effect
  useEffect(() => {
    if (!examStarted || examFinished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStarted, examFinished, userAnswers]);

  const loadApplication = async (ref: string) => {
    if (!ref.trim()) return;
    setLoadingApp(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/admissions/${encodeURIComponent(ref.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error || 'Application not found. Please check your reference number.');
        setAppData(null);
      } else {
        setAppData(data);
        if (data.examStatus === 'completed' && data.examScore !== null) {
          setExamFinished(true);
          setResultScore(data.examScore);
        }
      }
    } catch (err: any) {
      setFetchError('Failed to load application record. Please verify your connection.');
    } finally {
      setLoadingApp(false);
    }
  };

  const handleSelectAnswer = (qIndex: number, optionIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [qIndex]: optionIndex,
    }));
  };

  const handleSubmitExam = async () => {
    if (!appData) return;
    setSubmitting(true);

    // Calculate score
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        correctCount += 1;
      }
    });

    const scorePercentage = Math.round((correctCount / questions.length) * 100);

    try {
      const res = await fetch(`/api/admissions/${appData.id}/exam`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: scorePercentage,
          answers: userAnswers,
          totalQuestions: questions.length,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setExamFinished(true);
        setResultScore(scorePercentage);
      } else {
        alert(data.error || 'Failed to submit exam. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error submitting exam. Please check connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // If no application loaded yet, show reference lookup form
  if (!appData) {
    return (
      <PublicLayout>
        <div className="py-20 max-w-xl mx-auto px-4 sm:px-6">
          <div className="bg-card-custom border border-border-custom rounded-3xl p-8 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center">
                <GraduationCap className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black text-primary dark:text-white">
                Online Entrance Assessment
              </h1>
              <p className="text-xs text-muted-fg-custom">
                Enter your Application Reference Number to start or view your entrance exam.
              </p>
            </div>

            {fetchError && (
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fetchError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                loadApplication(referenceNumber);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-fg-custom mb-1.5">
                  Application Reference Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. ADM-2026-0001"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-bg-custom border border-border-custom text-fg-custom text-sm focus:outline-hidden focus:ring-2 focus:ring-secondary uppercase tracking-wider font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loadingApp || !referenceNumber.trim()}
                className="w-full py-3 rounded-xl bg-secondary text-white font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loadingApp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Application...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to Assessment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <Link
                href="/admissions"
                className="text-xs text-secondary hover:underline font-semibold"
              >
                ← Back to Admissions Portal
              </Link>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // If exam is completed
  if (examFinished && resultScore !== null) {
    const isPass = resultScore >= 50;
    return (
      <PublicLayout>
        <div className="py-20 max-w-xl mx-auto px-4 sm:px-6">
          <div className="bg-card-custom border border-border-custom rounded-3xl p-8 shadow-sm text-center space-y-6">
            <div
              className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center ${
                isPass ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
              }`}
            >
              <Award className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-secondary/15 text-secondary">
                Assessment Completed
              </span>
              <h1 className="text-2xl font-black text-primary dark:text-white">
                Entrance Exam Result
              </h1>
              <p className="text-xs text-muted-fg-custom">
                Applicant: <strong className="text-fg-custom">{appData.studentName}</strong> ({appData.referenceNumber})
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-bg-custom border border-border-custom space-y-3">
              <div className="text-xs font-bold text-muted-fg-custom uppercase tracking-wider">
                Overall Assessment Score
              </div>
              <div className="text-5xl font-black text-primary dark:text-white">
                {resultScore}%
              </div>
              <p className="text-xs text-muted-fg-custom">
                {isPass
                  ? 'Excellent effort! Your score has been recorded for admission evaluation.'
                  : 'Your assessment has been recorded and will be reviewed by the admissions board.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left text-xs">
              <div className="p-3 rounded-xl bg-card-custom border border-border-custom">
                <span className="text-muted-fg-custom block">Target Class</span>
                <span className="font-bold text-fg-custom">{appData.targetClass}</span>
              </div>
              <div className="p-3 rounded-xl bg-card-custom border border-border-custom">
                <span className="text-muted-fg-custom block">Admission Status</span>
                <span className="font-bold text-fg-custom capitalize">{appData.status}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href="/admissions"
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center space-x-2 hover:opacity-90 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Return to Admissions Portal</span>
              </Link>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // If exam not started yet, show introductory briefing
  if (!examStarted) {
    return (
      <PublicLayout>
        <div className="py-20 max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-card-custom border border-border-custom rounded-3xl p-8 shadow-sm space-y-8">
            <div className="flex items-center space-x-4 border-b border-border-custom pb-6">
              <div className="w-14 h-14 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Computer-Based Test
                </span>
                <h1 className="text-2xl font-black text-primary dark:text-white">
                  Entrance Examination Briefing
                </h1>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-bg-custom border border-border-custom">
                  <span className="text-xs text-muted-fg-custom block">Candidate</span>
                  <span className="text-xs font-bold text-fg-custom truncate block">
                    {appData.studentName}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-bg-custom border border-border-custom">
                  <span className="text-xs text-muted-fg-custom block">Target Class</span>
                  <span className="text-xs font-bold text-fg-custom">{appData.targetClass}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-bg-custom border border-border-custom col-span-2 sm:col-span-1">
                  <span className="text-xs text-muted-fg-custom block">Duration</span>
                  <span className="text-xs font-bold text-fg-custom">15 Minutes</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-bg-custom border border-border-custom space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-fg-custom">
                  Examination Instructions
                </h3>
                <ul className="space-y-2 text-xs text-muted-fg-custom">
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>The exam consists of 10 questions covering Mathematics, English, and General Science.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>You have 15 minutes to complete the test. The timer will count down automatically.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>You may navigate back and forth between questions before submitting.</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Once submitted, your assessment score is immediately recorded to your application.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-custom">
              <Link
                href="/admissions"
                className="text-xs text-muted-fg-custom hover:text-fg-custom font-semibold"
              >
                ← Cancel & Return
              </Link>
              <button
                onClick={() => setExamStarted(true)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-secondary text-white font-bold text-xs shadow-md hover:opacity-90 transition-all flex items-center justify-center space-x-2"
              >
                <span>Start Entrance Exam</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Active Exam In Progress
  const currentQ = questions[currentQuestionIndex];
  const answeredCount = Object.keys(userAnswers).length;
  const progressPct = Math.round((answeredCount / questions.length) * 100);

  return (
    <PublicLayout>
      <div className="py-10 max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header Bar */}
        <div className="bg-card-custom border border-border-custom rounded-2xl p-4 sm:p-6 mb-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs text-secondary font-bold uppercase tracking-wider">
              {currentQ.subject}
            </span>
            <h2 className="text-base sm:text-lg font-black text-primary dark:text-white">
              Question {currentQuestionIndex + 1} of {questions.length}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-bg-custom border border-border-custom font-mono text-xs font-bold text-fg-custom">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className={timeLeft < 180 ? 'text-danger animate-pulse' : ''}>
                {formatTime(timeLeft)}
              </span>
            </div>

            <button
              onClick={() => {
                if (confirm('Are you sure you want to submit your entrance exam now?')) {
                  handleSubmitExam();
                }
              }}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-xs"
            >
              {submitting ? 'Submitting...' : 'Finish & Submit'}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-bg-custom h-2 rounded-full mb-6 border border-border-custom overflow-hidden">
          <div
            className="bg-secondary h-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Main Question Card */}
        <div className="bg-card-custom border border-border-custom rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-sm sm:text-base font-semibold text-fg-custom leading-relaxed">
            {currentQ.question}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt, oIdx) => {
              const isSelected = userAnswers[currentQuestionIndex] === oIdx;
              const optionLetters = ['A', 'B', 'C', 'D'];
              return (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => handleSelectAnswer(currentQuestionIndex, oIdx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center space-x-4 ${
                    isSelected
                      ? 'border-secondary bg-secondary/10 text-primary dark:text-white font-bold'
                      : 'border-border-custom bg-bg-custom hover:bg-card-custom text-fg-custom'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-secondary text-white'
                        : 'bg-muted-custom text-muted-fg-custom'
                    }`}
                  >
                    {optionLetters[oIdx]}
                  </div>
                  <span className="text-xs sm:text-sm flex-1">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-border-custom">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2.5 rounded-xl border border-border-custom text-xs font-bold text-fg-custom hover:bg-bg-custom disabled:opacity-30 flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button
                onClick={() =>
                  setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
                }
                className="px-5 py-2.5 rounded-xl bg-secondary text-white text-xs font-bold hover:opacity-90 transition-all flex items-center space-x-2"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (confirm('Are you ready to finalize and submit your test?')) {
                    handleSubmitExam();
                  }
                }}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-xs"
              >
                {submitting ? 'Submitting...' : 'Submit Final Test'}
              </button>
            )}
          </div>
        </div>

        {/* Question Palette / Navigator */}
        <div className="mt-6 p-6 rounded-2xl bg-card-custom border border-border-custom">
          <div className="text-xs font-bold text-muted-fg-custom uppercase tracking-wider mb-3">
            Question Palette ({answeredCount}/{questions.length} answered)
          </div>
          <div className="flex flex-wrap gap-2">
            {questions.map((_, idx) => {
              const isAnswered = userAnswers[idx] !== undefined;
              const isCurrent = currentQuestionIndex === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? 'ring-2 ring-secondary ring-offset-2 bg-secondary text-white'
                      : isAnswered
                      ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                      : 'bg-bg-custom border border-border-custom text-muted-fg-custom hover:bg-muted-custom'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

export default function EntranceExamPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-xs">Loading assessment...</div>}>
      <ExamContent />
    </Suspense>
  );
}
