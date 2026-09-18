'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap, BookOpen, Plus, Edit, Trash2, Search, Filter,
  CheckCircle2, AlertCircle, RefreshCw, X, Check, Clock, Calendar,
  Award, HelpCircle, Layers, Sparkles
} from 'lucide-react';

interface QuestionItem {
  id: string;
  subject: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string | null;
  targetLevel?: string;
  createdAt?: string;
}

interface ApplicantItem {
  id: string;
  referenceNumber: string;
  studentName: string;
  dob: string;
  gender: string;
  targetClass: string;
  parentName: string;
  parentPhone: string;
  status: string;
  examMode: string;
  examDate?: string | null;
  examScore?: number | null;
  examStatus: string;
  createdAt: string;
}

export default function EntranceExamCoordinator() {
  const [subTab, setSubTab] = useState<'questions' | 'candidates'>('questions');

  // Questions state
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [questionSearch, setQuestionSearch] = useState('');

  // Add/Edit Question Modal
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);
  const [questionForm, setQuestionForm] = useState({
    subject: 'Mathematics',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    targetLevel: 'ALL',
  });
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Candidates coordination state
  const [candidates, setCandidates] = useState<ApplicantItem[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateModeFilter, setCandidateModeFilter] = useState('all');
  const [candidateClassFilter, setCandidateClassFilter] = useState('all');

  // Grade candidate modal
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [gradingCandidate, setGradingCandidate] = useState<ApplicantItem | null>(null);
  const [gradeScoreInput, setGradeScoreInput] = useState('');
  const [gradeSaving, setGradeSaving] = useState(false);

  const subjectsList = ['Mathematics', 'English Language', 'General Science', 'Social Studies'];
  const classList = ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'];

  // Fetch Questions
  const fetchQuestions = async () => {
    setQuestionsLoading(true);
    setQuestionsError(null);
    try {
      const res = await fetch('/api/admissions/questions');
      const data = await res.json();
      if (!res.ok) {
        setQuestionsError(data.error || 'Failed to fetch questions');
      } else {
        setQuestions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setQuestionsError('Network error loading entrance questions');
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Fetch Candidates
  const fetchCandidates = async () => {
    setCandidatesLoading(true);
    try {
      const res = await fetch('/api/admissions');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCandidates(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCandidatesLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    fetchCandidates();
  }, []);

  // Open Question Modal
  const handleOpenAddModal = () => {
    setEditingQuestion(null);
    setQuestionForm({
      subject: 'Mathematics',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: '',
      targetLevel: 'ALL',
    });
    setFormError(null);
    setShowQuestionModal(true);
  };

  const handleOpenEditModal = (q: QuestionItem) => {
    setEditingQuestion(q);
    setQuestionForm({
      subject: q.subject,
      question: q.question,
      options: [...q.options],
      correctAnswer: q.correctAnswer ?? 0,
      explanation: q.explanation || '',
      targetLevel: q.targetLevel || 'ALL',
    });
    setFormError(null);
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!questionForm.question.trim()) {
      setFormError('Please enter the question text.');
      return;
    }

    if (questionForm.options.some((opt) => !opt.trim())) {
      setFormError('All 4 options (A, B, C, D) must be provided.');
      return;
    }

    setFormSaving(true);
    try {
      const url = editingQuestion
        ? `/api/admissions/questions/${editingQuestion.id}`
        : '/api/admissions/questions';
      const method = editingQuestion ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to save question');
      } else {
        setShowQuestionModal(false);
        fetchQuestions();
      }
    } catch (err) {
      setFormError('Network error saving question');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`/api/admissions/questions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchQuestions();
      } else {
        alert('Failed to delete question');
      }
    } catch (err) {
      alert('Error deleting question');
    }
  };

  const handleResetDefaults = async () => {
    if (
      !confirm(
        'Reset question bank to standard curriculum defaults? This will restore the default 10 entrance questions.'
      )
    )
      return;
    try {
      const res = await fetch('/api/admissions/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed_defaults' }),
      });
      if (res.ok) {
        fetchQuestions();
      }
    } catch (err) {
      alert('Error resetting questions');
    }
  };

  // Grade candidate exam
  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingCandidate) return;

    const scoreNum = parseFloat(gradeScoreInput);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      alert('Please enter a valid score percentage between 0 and 100.');
      return;
    }

    setGradeSaving(true);
    try {
      const res = await fetch(`/api/admissions/${gradingCandidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam_score: scoreNum,
          exam_status: 'completed',
        }),
      });

      if (res.ok) {
        setShowGradeModal(false);
        fetchCandidates();
      } else {
        alert('Failed to update candidate score.');
      }
    } catch (err) {
      alert('Network error updating score');
    } finally {
      setGradeSaving(false);
    }
  };

  // Filtered Questions
  const filteredQuestions = questions.filter((q) => {
    const matchesSubject = subjectFilter === 'all' || q.subject === subjectFilter;
    const matchesSearch =
      !questionSearch.trim() ||
      q.question.toLowerCase().includes(questionSearch.toLowerCase()) ||
      q.subject.toLowerCase().includes(questionSearch.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  // Filtered Candidates
  const filteredCandidates = candidates.filter((c) => {
    const matchesMode = candidateModeFilter === 'all' || c.examMode === candidateModeFilter;
    const matchesClass = candidateClassFilter === 'all' || c.targetClass === candidateClassFilter;
    const matchesSearch =
      !candidateSearch.trim() ||
      c.studentName.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.referenceNumber.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.parentPhone.includes(candidateSearch);
    return matchesMode && matchesClass && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="p-6 rounded-3xl bg-card-custom border border-border-custom shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-secondary font-bold text-xs uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Entrance Examination Department</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-primary dark:text-white">
            Entrance Exams & Question Bank
          </h1>
          <p className="text-xs text-muted-fg-custom mt-0.5">
            Coordinate student entrance exams, grade physical papers, and curate Computer-Based Test (CBT) questions.
          </p>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center p-1 rounded-2xl bg-bg-custom border border-border-custom text-xs font-bold">
          <button
            onClick={() => setSubTab('questions')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              subTab === 'questions'
                ? 'bg-secondary text-white shadow-xs'
                : 'text-muted-fg-custom hover:text-fg-custom'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Question Bank ({questions.length})</span>
          </button>

          <button
            onClick={() => setSubTab('candidates')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
              subTab === 'candidates'
                ? 'bg-secondary text-white shadow-xs'
                : 'text-muted-fg-custom hover:text-fg-custom'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Candidates & CBT ({candidates.length})</span>
          </button>
        </div>
      </div>

      {/* 1. QUESTION BANK TAB */}
      {subTab === 'questions' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card-custom border border-border-custom shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-muted-fg-custom absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary"
                />
              </div>

              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary"
              >
                <option value="all">All Subjects</option>
                {subjectsList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleResetDefaults}
                className="px-3 py-2 rounded-xl border border-border-custom bg-bg-custom hover:bg-muted-custom text-xs font-semibold text-muted-fg-custom transition-all"
                title="Restore default 10 curriculum questions"
              >
                Reset Defaults
              </button>

              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-xl bg-secondary text-white text-xs font-bold hover:opacity-90 transition-all flex items-center space-x-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {questionsLoading ? (
              <div className="p-12 text-center text-muted-fg-custom bg-card-custom border border-border-custom rounded-3xl">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-secondary" />
                <span className="text-xs">Loading question bank...</span>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="p-12 text-center text-muted-fg-custom bg-card-custom border border-border-custom rounded-3xl space-y-2">
                <BookOpen className="w-8 h-8 mx-auto text-muted-fg-custom/40" />
                <p className="font-bold text-sm">No questions found</p>
                <p className="text-xs">Add new entrance questions or reset to standard defaults.</p>
              </div>
            ) : (
              filteredQuestions.map((q, qIndex) => {
                const optionLetters = ['A', 'B', 'C', 'D'];
                return (
                  <div
                    key={q.id}
                    className="p-5 sm:p-6 rounded-3xl bg-card-custom border border-border-custom shadow-xs space-y-4 hover:border-secondary/40 transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-lg bg-secondary/15 text-secondary text-xs font-black flex items-center justify-center">
                          {qIndex + 1}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 dark:bg-white/10 text-primary dark:text-white font-bold text-[11px] uppercase tracking-wider">
                          {q.subject}
                        </span>
                        {q.targetLevel && (
                          <span className="text-[10px] text-muted-fg-custom font-semibold">
                            Level: {q.targetLevel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(q)}
                          className="p-1.5 rounded-lg text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom"
                          title="Edit Question"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 rounded-lg text-muted-fg-custom hover:bg-danger/10 hover:text-danger"
                          title="Delete Question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold text-fg-custom leading-relaxed">
                      {q.question}
                    </p>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = q.correctAnswer === oIdx;
                        return (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-2xl border text-xs flex items-center space-x-3 ${
                              isCorrect
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                                : 'border-border-custom bg-bg-custom text-fg-custom'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-muted-custom text-muted-fg-custom'
                              }`}
                            >
                              {optionLetters[oIdx]}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="p-3 rounded-xl bg-bg-custom border border-border-custom text-[11px] text-muted-fg-custom">
                        <strong className="text-fg-custom">Explanation:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 2. CANDIDATES & EXAM COORDINATION TAB */}
      {subTab === 'candidates' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card-custom border border-border-custom shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-muted-fg-custom absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search candidate by name, phone, ref..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary"
                />
              </div>

              <select
                value={candidateModeFilter}
                onChange={(e) => setCandidateModeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary"
              >
                <option value="all">All Exam Modes</option>
                <option value="ONLINE">Online CBT</option>
                <option value="PHYSICAL">Physical On-Campus</option>
              </select>

              <select
                value={candidateClassFilter}
                onChange={(e) => setCandidateClassFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary"
              >
                <option value="all">All Classes</option>
                {classList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchCandidates}
              className="p-2 rounded-xl border border-border-custom bg-bg-custom hover:bg-muted-custom text-xs font-bold"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${candidatesLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Table */}
          <div className="rounded-3xl bg-card-custom border border-border-custom shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-fg-custom">
                <thead className="bg-muted-custom/50 text-[11px] uppercase tracking-wider text-muted-fg-custom font-bold border-b border-border-custom">
                  <tr>
                    <th className="px-5 py-3.5">Candidate / Ref</th>
                    <th className="px-5 py-3.5">Target Class</th>
                    <th className="px-5 py-3.5">Assessment Mode</th>
                    <th className="px-5 py-3.5">Exam Status</th>
                    <th className="px-5 py-3.5">Score</th>
                    <th className="px-5 py-3.5">Parent Contact</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom">
                  {candidatesLoading ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-muted-fg-custom">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-secondary" />
                        <span>Loading applicants...</span>
                      </td>
                    </tr>
                  ) : filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-10 text-center text-muted-fg-custom">
                        No candidate applications found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((c) => (
                      <tr key={c.id} className="hover:bg-muted-custom/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-mono text-secondary text-[11px] font-bold">
                            {c.referenceNumber}
                          </div>
                          <div className="font-bold text-sm text-primary dark:text-white">
                            {c.studentName}
                          </div>
                          <div className="text-[10px] text-muted-fg-custom">{c.gender}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-bg-custom border border-border-custom font-bold">
                            {c.targetClass}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="font-bold uppercase text-[11px]">{c.examMode}</span>
                          {c.examDate && (
                            <div className="text-[10px] text-muted-fg-custom">
                              Date: {new Date(c.examDate).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              c.examStatus === 'completed'
                                ? 'bg-emerald-500/15 text-emerald-600'
                                : 'bg-amber-500/15 text-amber-600'
                            }`}
                          >
                            {c.examStatus}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold">
                          {c.examScore !== null && c.examScore !== undefined ? (
                            <span className="text-sm font-black text-secondary">
                              {c.examScore}%
                            </span>
                          ) : (
                            <span className="text-muted-fg-custom text-xs italic">Ungraded</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-semibold">{c.parentName}</div>
                          <div className="font-mono text-muted-fg-custom text-[11px]">
                            {c.parentPhone}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setGradingCandidate(c);
                              setGradeScoreInput(c.examScore !== null && c.examScore !== undefined ? String(c.examScore) : '');
                              setShowGradeModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl border border-border-custom bg-bg-custom hover:bg-muted-custom font-semibold text-xs transition-all"
                          >
                            {c.examScore !== null ? 'Edit Score' : 'Grade / Score'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. ADD / EDIT QUESTION MODAL */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card-custom border border-border-custom rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-custom pb-4">
              <h2 className="text-xl font-black text-primary dark:text-white">
                {editingQuestion ? 'Edit Entrance Question' : 'Add Entrance Exam Question'}
              </h2>
              <button
                onClick={() => setShowQuestionModal(false)}
                className="p-2 rounded-xl text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-fg-custom mb-1">Subject *</label>
                  <select
                    value={questionForm.subject}
                    onChange={(e) => setQuestionForm({ ...questionForm, subject: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary"
                  >
                    {subjectsList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-fg-custom mb-1">Target Class Level</label>
                  <select
                    value={questionForm.targetLevel}
                    onChange={(e) =>
                      setQuestionForm({ ...questionForm, targetLevel: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary"
                  >
                    <option value="ALL">All Applicants</option>
                    <option value="JUNIOR">Junior Secondary (JSS)</option>
                    <option value="SENIOR">Senior Secondary (SSS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-fg-custom mb-1">Question Prompt *</label>
                <textarea
                  rows={3}
                  placeholder="Enter the entrance exam question text..."
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-xs text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-2 pt-2 border-t border-border-custom">
                <label className="block font-bold text-fg-custom">
                  Options & Correct Answer Selection *
                </label>
                <p className="text-[11px] text-muted-fg-custom">
                  Fill in all 4 choices and select the radio button next to the correct answer.
                </p>

                {['A', 'B', 'C', 'D'].map((letter, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setQuestionForm({ ...questionForm, correctAnswer: idx })}
                      className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 transition-all ${
                        questionForm.correctAnswer === idx
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-bg-custom border border-border-custom text-muted-fg-custom hover:bg-muted-custom'
                      }`}
                      title={`Mark Option ${letter} as correct answer`}
                    >
                      {letter}
                    </button>
                    <input
                      type="text"
                      placeholder={`Option ${letter} text...`}
                      value={questionForm.options[idx] || ''}
                      onChange={(e) => {
                        const newOpts = [...questionForm.options];
                        newOpts[idx] = e.target.value;
                        setQuestionForm({ ...questionForm, options: newOpts });
                      }}
                      required
                      className={`w-full px-3 py-2 rounded-xl bg-bg-custom border text-xs text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary ${
                        questionForm.correctAnswer === idx
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : 'border-border-custom'
                      }`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-fg-custom mb-1">
                  Explanation / Solution Guide (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Brief explanation of why the answer is correct"
                  value={questionForm.explanation}
                  onChange={(e) =>
                    setQuestionForm({ ...questionForm, explanation: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-xs text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border-custom">
                <button
                  type="button"
                  onClick={() => setShowQuestionModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border-custom bg-bg-custom hover:bg-muted-custom font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="px-6 py-2.5 rounded-xl bg-secondary text-white font-bold text-xs hover:opacity-90 transition-all flex items-center space-x-2"
                >
                  {formSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingQuestion ? 'Update Question' : 'Save Question'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. GRADE CANDIDATE MODAL */}
      {showGradeModal && gradingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card-custom border border-border-custom rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-border-custom pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-secondary">
                  {gradingCandidate.referenceNumber}
                </span>
                <h2 className="text-lg font-black text-primary dark:text-white">
                  Grade Entrance Assessment
                </h2>
              </div>
              <button
                onClick={() => setShowGradeModal(false)}
                className="p-1.5 rounded-lg text-muted-fg-custom hover:bg-muted-custom"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-bg-custom border border-border-custom text-xs space-y-1">
              <div>
                <span className="text-muted-fg-custom">Student:</span>{' '}
                <strong className="text-fg-custom">{gradingCandidate.studentName}</strong>
              </div>
              <div>
                <span className="text-muted-fg-custom">Target Class:</span>{' '}
                <strong className="text-fg-custom">{gradingCandidate.targetClass}</strong>
              </div>
              <div>
                <span className="text-muted-fg-custom">Exam Mode:</span>{' '}
                <strong className="text-fg-custom uppercase">{gradingCandidate.examMode}</strong>
              </div>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-fg-custom mb-1">
                  Overall Entrance Score Percentage (0 - 100)% *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  placeholder="e.g. 75"
                  value={gradeScoreInput}
                  onChange={(e) => setGradeScoreInput(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-bg-custom border border-border-custom text-lg font-black text-secondary focus:outline-hidden focus:ring-2 focus:ring-secondary text-center"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGradeModal(false)}
                  className="px-4 py-2 rounded-xl border border-border-custom bg-bg-custom hover:bg-muted-custom font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={gradeSaving}
                  className="px-5 py-2 rounded-xl bg-secondary text-white font-bold hover:opacity-90"
                >
                  {gradeSaving ? 'Recording...' : 'Save Assessment Score'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
