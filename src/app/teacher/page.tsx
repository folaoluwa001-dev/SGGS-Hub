'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { schoolConfig } from '../../../config/school.config';
import { useTheme } from '@/components/Providers';
import {
  Users, BookOpen, FileSpreadsheet, RefreshCw, LogOut,
  Download, Upload, Save, CheckCircle2, ShieldAlert, Moon, Sun, Search, AlertCircle, Lock
} from 'lucide-react';
import ChangePasswordForm from '@/components/ChangePasswordForm';

export default function TeacherDashboard() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'overview' | 'sync' | 'manual' | 'settings'>('overview');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Data lists
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [syncHistory, setSyncHistory] = useState<any[]>([]);

  // Selection States
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');

  // Sheet sync state
  const [sheetUrl, setSheetUrl] = useState('');
  const [syncLogs, setSyncLogs] = useState<{
    success: boolean;
    recordsSynced: number;
    errors: string[];
  } | null>(null);

  // Manual grading state
  const [gradingScores, setGradingScores] = useState<Record<string, { caScore: string; examScore: string }>>({});

  const fetchClassGrades = async (studentList = students) => {
    try {
      const url = `/api/results?classId=${selectedClassId}&subjectId=${selectedSubjectId}&termId=${selectedTermId}&sessionId=${selectedSessionId}`;
      const res = await fetch(url);
      const data = await res.json();

      const scoreMap: Record<string, { caScore: string; examScore: string }> = {};

      // Prefill default empty values for all class students
      studentList.forEach(s => {
        scoreMap[s.id] = { caScore: '', examScore: '' };
      });

      // Populate with existing database scores
      if (Array.isArray(data)) {
        data.forEach((r: any) => {
          scoreMap[r.studentId] = {
            caScore: r.caScore.toString(),
            examScore: r.examScore.toString()
          };
        });
      }
      setGradingScores(scoreMap);
    } catch (e) { console.error(e); }
  };

  const fetchClassStudents = async () => {
    try {
      const res = await fetch(`/api/students?classId=${selectedClassId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudents(data);
        // If tab is manual grading, fetch existing results to prefill form inputs
        if (activeTab === 'manual') {
          fetchClassGrades(data);
        }
      }
    } catch (e) { console.error(e); }
  };

  const fetchBaseData = async () => {
    try {
      setLoading(true);
      const [resCls, resSubj, resTerms, resSess] = await Promise.all([
        fetch('/api/classes').then(r => r.json()),
        fetch('/api/subjects').then(r => r.json()),
        fetch('/api/terms').then(r => r.json()),
        fetch('/api/sessions').then(r => r.json()),
      ]);

      if (Array.isArray(resCls)) {
        setClasses(resCls);
        if (resCls.length > 0) setSelectedClassId(resCls[0].id);
      }
      if (Array.isArray(resSubj)) {
        setSubjects(resSubj);
        if (resSubj.length > 0) setSelectedSubjectId(resSubj[0].id);
      }
      if (Array.isArray(resTerms)) {
        setTerms(resTerms);
        const activeTerm = resTerms.find(t => t.active);
        setSelectedTermId(activeTerm ? activeTerm.id : (resTerms[0]?.id || ''));
      }
      if (Array.isArray(resSess)) {
        setSessions(resSess);
        const activeSession = resSess.find(s => s.active);
        setSelectedSessionId(activeSession ? activeSession.id : (resSess[0]?.id || ''));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedUser = localStorage.getItem('sggs-user');
    if (!cachedUser) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(cachedUser);
    if (parsed.role !== 'TEACHER' && parsed.role !== 'SUPER_ADMIN') {
      router.push('/login');
      return;
    }
    Promise.resolve().then(() => {
      setUser(parsed);
      fetchBaseData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchClassStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId]);

  // Prefill when options are modified in manual tab
  useEffect(() => {
    if (activeTab === 'manual' && selectedClassId && selectedSubjectId && selectedTermId && selectedSessionId) {
      fetchClassGrades();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedClassId, selectedSubjectId, selectedTermId, selectedSessionId]);

  // Download template triggers
  const downloadTemplate = () => {
    if (!selectedClassId) return;
    const url = `/api/sync-sheets?classId=${selectedClassId}`;
    window.open(url, '_blank');
  };

  // Google Sheets Sync
  const handleSheetSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl || !selectedClassId || !selectedSubjectId || !selectedTermId || !selectedSessionId) return;

    setLoading(true);
    setSyncLogs(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spreadsheetUrl: sheetUrl,
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          termId: selectedTermId,
          sessionId: selectedSessionId
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Synchronization failed');

      setSyncLogs(data);
      if (data.success) {
        setSheetUrl('');
        fetchClassStudents(); // reload students list and score cache
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDirectResultUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('classId', selectedClassId);
    formData.append('subjectId', selectedSubjectId);
    formData.append('termId', selectedTermId);
    formData.append('sessionId', selectedSessionId);

    setLoading(true);
    setSyncLogs(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/results/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          setSyncLogs({
            success: false,
            recordsSynced: 0,
            errors: data.errors
          });
        } else {
          throw new Error(data.error || 'Result upload failed');
        }
      } else {
        setSyncLogs({
          success: true,
          recordsSynced: data.recordsSynced,
          errors: []
        });
        fetchClassStudents();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during file upload.');
    } finally {
      setLoading(false);
    }
  };

  // Manual Grade submission
  const handleManualGradeSubmit = async (studentId: string) => {
    const scores = gradingScores[studentId];
    if (!scores) return;

    const ca = parseFloat(scores.caScore);
    const exam = parseFloat(scores.examScore);

    if (isNaN(ca) || ca < 0 || ca > 30) {
      alert('CA Score must be a number between 0 and 30');
      return;
    }

    if (isNaN(exam) || exam < 0 || exam > 70) {
      alert('Exam Score must be a number between 0 and 70');
      return;
    }

    try {
      const response = await fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          subjectId: selectedSubjectId,
          termId: selectedTermId,
          sessionId: selectedSessionId,
          caScore: ca,
          examScore: exam
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save score');

      // Update state
      setGradingScores(prev => ({
        ...prev,
        [studentId]: {
          caScore: data.caScore.toString(),
          examScore: data.examScore.toString()
        }
      }));
      alert(`Score saved for ${data.student.fullName}`);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('sggs-user');
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-bg-custom text-fg-custom overflow-hidden transition-colors">

      {/* SIDEBAR */}
      <aside className="w-64 bg-card-custom border-r border-border-custom flex flex-col justify-between hidden md:flex">
        <div className="p-6 space-y-8">
          {/* Brand header */}
          <div className="flex items-center space-x-3">
            <div
              className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: schoolConfig.schoolLogo }}
            />
            <div>
              <span className="block font-black text-xs tracking-wider uppercase text-primary dark:text-white">Teacher Portal</span>
              <span className="block text-[9px] text-slate-500 font-bold uppercase">{schoolConfig.schoolName.substring(0, 12)}...</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'overview'
                  ? 'bg-primary text-white dark:bg-primary dark:text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom'
                }`}
            >
              <Users className="w-4 h-4" />
              <span>Student Directory</span>
            </button>

            <button
              onClick={() => setActiveTab('sync')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'sync'
                  ? 'bg-primary text-white dark:bg-primary dark:text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom'
                }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Spreadsheet Grade Upload</span>
            </button>

            <button
              onClick={() => setActiveTab('manual')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'manual'
                  ? 'bg-primary text-white dark:bg-primary dark:text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom'
                }`}
            >
              <Save className="w-4 h-4" />
              <span>Manual Grade book</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'settings'
                  ? 'bg-primary text-white dark:bg-primary dark:text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom'
                }`}
            >
              <Lock className="w-4 h-4" />
              <span>Change Password</span>
            </button>
          </nav>
        </div>

        {/* User profile footer */}
        <div className="p-6 border-t border-border-custom space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs">
              <span className="block font-bold text-fg-custom">{user?.fullName}</span>
              <span className="block text-[10px] text-slate-500 font-semibold uppercase">Academic Teacher</span>
            </div>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-muted-custom"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-secondary" />}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 rounded-xl border border-border-custom hover:bg-danger/10 hover:text-danger text-xs font-extrabold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Portal</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* TOP BAR */}
        <header className="h-16 bg-card-custom border-b border-border-custom px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 md:hidden">
            <div
              className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: schoolConfig.schoolLogo }}
            />
            <span className="font-bold text-xs tracking-wider uppercase">SGGS Teacher</span>
          </div>

          <h2 className="text-sm font-black text-primary dark:text-white uppercase hidden md:block">
            {activeTab === 'overview' && 'Student Directory & class Lists'}
            {activeTab === 'sync' && 'Spreadsheet Grade Upload & Sync'}
            {activeTab === 'manual' && 'Manual Grade book overrides'}
            {activeTab === 'settings' && 'Account Settings'}
          </h2>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Class:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-muted-custom border border-border-custom text-xs font-bold focus:outline-hidden"
              >
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <button
              onClick={handleLogout}
              className="md:hidden p-2 rounded-lg hover:bg-danger/10 text-danger"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-6">

          {/* OVERVIEW: CLASS LIST */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-4 rounded-xl bg-primary/5 text-primary border border-primary/10 text-xs font-semibold">
                You are currently viewing the student registry folder for Class arm: {classes.find(c => c.id === selectedClassId)?.name}.
              </div>

              {/* Students list */}
              <div className="bg-card-custom border border-border-custom rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-muted-custom/30 text-muted-fg-custom border-b border-border-custom">
                        <th className="p-4 font-bold">Student ID</th>
                        <th className="p-4 font-bold">Admission Number</th>
                        <th className="p-4 font-bold">Full Name</th>
                        <th className="p-4 font-bold">Gender</th>
                        <th className="p-4 font-bold">Parent Contact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom">
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                            No students registered under this class arm.
                          </td>
                        </tr>
                      ) : (
                        students.map((student) => (
                          <tr key={student.id} className="hover:bg-muted-custom/10 transition-colors">
                            <td className="p-4 font-bold text-primary dark:text-white">{student.id}</td>
                            <td className="p-4 font-semibold text-slate-500">{student.admissionNumber}</td>
                            <td className="p-4 font-black uppercase text-primary dark:text-slate-300">{student.fullName}</td>
                            <td className="p-4 font-semibold">{student.gender}</td>
                            <td className="p-4 font-medium text-slate-400">
                              {student.parentName} ({student.parentPhone})
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

          {/* GOOGLE SHEETS SYNC TAB */}
          {activeTab === 'sync' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">

              {/* Sync controls */}
              <div className="lg:col-span-7 space-y-6">

                {/* 1. Download template card */}
                <div className="p-6 rounded-2xl bg-card-custom border border-border-custom space-y-4">
                  <h3 className="font-extrabold text-sm text-primary dark:text-white flex items-center space-x-2">
                    <Download className="w-5 h-5 text-secondary animate-pulse" />
                    <span>Step 1: Download Score Template</span>
                  </h3>
                  <p className="text-xs text-muted-fg-custom leading-normal">
                    First, export the current student list for <b>{classes.find(c => c.id === selectedClassId)?.name}</b> as a CSV file. Upload this CSV to Google Sheets, fill in the CA and Exam scores, and keep the headers intact.
                  </p>

                  <button
                    onClick={downloadTemplate}
                    className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-secondary text-white hover:bg-amber-600 font-extrabold text-xs shadow-md transition-all w-full sm:w-auto"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download CSV Template</span>
                  </button>
                </div>

                {/* 2. Direct Spreadsheet Upload Card */}
                <div className="p-6 rounded-2xl bg-card-custom border border-border-custom space-y-4">
                  <h3 className="font-extrabold text-sm text-primary dark:text-white flex items-center space-x-2">
                    <Upload className="w-5 h-5 text-accent-light" />
                    <span>Step 2 (Option A): Direct Spreadsheet Upload (.csv, .xlsx, .xls)</span>
                  </h3>
                  <p className="text-xs text-muted-fg-custom leading-normal">
                    Select your grading criteria, then upload your marksheet spreadsheet directly to record scores instantly.
                  </p>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Class Arm</label>
                        <select
                          value={selectedClassId}
                          onChange={(e) => setSelectedClassId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold focus:outline-hidden"
                        >
                          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Subject</label>
                        <select
                          value={selectedSubjectId}
                          onChange={(e) => setSelectedSubjectId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold focus:outline-hidden"
                        >
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Academic Term</label>
                        <select
                          value={selectedTermId}
                          onChange={(e) => setSelectedTermId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold focus:outline-hidden"
                        >
                          {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Session</label>
                        <select
                          value={selectedSessionId}
                          onChange={(e) => setSelectedSessionId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold focus:outline-hidden"
                        >
                          {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-center justify-center space-x-2 w-full px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary-light font-extrabold text-xs shadow-md cursor-pointer transition-all">
                        <Upload className="w-4 h-4" />
                        <span>Upload Spreadsheet file</span>
                        <input
                          type="file"
                          accept=".csv, .xlsx, .xls"
                          className="hidden"
                          onChange={handleDirectResultUpload}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* 3. Sync from Google Sheet card */}
                <div className="p-6 rounded-2xl bg-card-custom border border-border-custom space-y-4">
                  <h3 className="font-extrabold text-sm text-primary dark:text-white flex items-center space-x-2">
                    <RefreshCw className="w-5 h-5 text-secondary" />
                    <span>Step 2 (Option B): Sync Google Sheet URL</span>
                  </h3>
                  <p className="text-xs text-muted-fg-custom leading-normal">
                    Configure your spreadsheet share permissions to <b>"Anyone with the link can view"</b>, paste the URL below, choose settings, and trigger the sync database upload.
                  </p>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-danger/10 text-danger text-xs font-semibold border border-danger/25">
                      {errorMessage}
                    </div>
                  )}

                  <form onSubmit={handleSheetSync} className="space-y-4">

                    {/* Selections for subject and term */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Subject</label>
                        <select
                          value={selectedSubjectId}
                          onChange={(e) => setSelectedSubjectId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold focus:outline-hidden"
                        >
                          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Academic Term</label>
                        <select
                          value={selectedTermId}
                          onChange={(e) => setSelectedTermId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold focus:outline-hidden"
                        >
                          {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Session</label>
                        <select
                          value={selectedSessionId}
                          onChange={(e) => setSelectedSessionId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold focus:outline-hidden"
                        >
                          {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Google Sheet URL */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Google Sheet URL / Link</label>
                      <input
                        type="url"
                        required
                        value={sheetUrl}
                        onChange={(e) => setSheetUrl(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-ring-custom"
                        placeholder="https://docs.google.com/spreadsheets/d/..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !sheetUrl}
                      className="flex items-center justify-center space-x-2 w-full px-6 py-3.5 rounded-xl bg-primary text-white hover:bg-primary-light font-extrabold text-xs shadow-md transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Syncing marks...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          <span>Synchronize Google Sheet Now</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Sync logs output pane */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-xs min-h-[300px] flex flex-col justify-between">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-primary dark:text-white border-b border-border-custom pb-3 mb-4">
                    Synchronization Status Logs
                  </h3>

                  {!syncLogs ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                      <FileSpreadsheet className="w-8 h-8 opacity-45" />
                      <span className="text-xs font-bold">No active logs to display.</span>
                      <span className="text-[10px] text-slate-500">Submit a sheet URL or upload a file in Step 2 to parse records.</span>
                    </div>
                  ) : (
                    <div className="flex-grow space-y-4">
                      {/* Status header */}
                      <div className="flex items-center space-x-2">
                        {syncLogs.success ? (
                          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Upload / Sync Success</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-danger/10 text-danger text-xs font-bold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Upload / Sync Failed</span>
                          </div>
                        )}
                        <span className="text-xs font-extrabold">Imported: {syncLogs.recordsSynced} rows</span>
                      </div>

                      {/* Error warnings */}
                      {syncLogs.errors.length > 0 && (
                        <div className="space-y-2">
                          <span className="block text-[10px] font-black text-danger uppercase tracking-wider">Validation Errors & Warnings ({syncLogs.errors.length}):</span>
                          <div className="max-h-52 overflow-y-auto p-4 rounded-xl bg-danger/5 border border-danger/10 space-y-1.5">
                            {syncLogs.errors.map((err, idx) => (
                              <div key={idx} className="flex items-start space-x-2 text-[10px] text-danger leading-normal font-semibold">
                                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{err}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-[9px] text-slate-500 border-t border-border-custom pt-4 mt-6">
                    Active verification checks: CA limits (&le; 30), Exam limits (&le; 70), Student ID validity in selected class.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MANUAL SCORE SHEET TAB */}
          {activeTab === 'manual' && (
            <div className="space-y-6 animate-in fade-in duration-300">

              {/* Grading Subject / Term configuration toolbar */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-card-custom border border-border-custom">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Subject:</span>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-muted-custom border border-border-custom text-xs font-bold focus:outline-hidden"
                  >
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Term:</span>
                  <select
                    value={selectedTermId}
                    onChange={(e) => setSelectedTermId(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-muted-custom border border-border-custom text-xs font-bold focus:outline-hidden"
                  >
                    {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Session:</span>
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-muted-custom border border-border-custom text-xs font-bold focus:outline-hidden"
                  >
                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Grading input Table */}
              <div className="bg-card-custom border border-border-custom rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-muted-custom/30 text-muted-fg-custom border-b border-border-custom">
                        <th className="p-4 font-bold">Student ID</th>
                        <th className="p-4 font-bold">Full Name</th>
                        <th className="p-4 font-bold text-center">CA Score (Max 30)</th>
                        <th className="p-4 font-bold text-center">Exam Score (Max 70)</th>
                        <th className="p-4 font-bold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom">
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                            No students registered under this class arm.
                          </td>
                        </tr>
                      ) : (
                        students.map((student) => {
                          const scores = gradingScores[student.id] || { caScore: '', examScore: '' };

                          return (
                            <tr key={student.id} className="hover:bg-muted-custom/10 transition-colors">
                              <td className="p-4 font-bold text-primary dark:text-white">{student.id}</td>
                              <td className="p-4 font-black uppercase text-primary dark:text-slate-300">{student.fullName}</td>
                              <td className="p-4 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={30}
                                  value={scores.caScore}
                                  onChange={(e) => setGradingScores(prev => ({
                                    ...prev,
                                    [student.id]: { ...scores, caScore: e.target.value }
                                  }))}
                                  className="w-20 px-2 py-1.5 rounded-lg bg-bg-custom border border-border-custom text-center font-bold text-xs focus:outline-hidden focus:ring-1 focus:ring-ring-custom"
                                  placeholder="0-30"
                                />
                              </td>
                              <td className="p-4 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={70}
                                  value={scores.examScore}
                                  onChange={(e) => setGradingScores(prev => ({
                                    ...prev,
                                    [student.id]: { ...scores, examScore: e.target.value }
                                  }))}
                                  className="w-20 px-2 py-1.5 rounded-lg bg-bg-custom border border-border-custom text-center font-bold text-xs focus:outline-hidden focus:ring-1 focus:ring-ring-custom"
                                  placeholder="0-70"
                                />
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => handleManualGradeSubmit(student.id)}
                                  className="px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-light text-white text-xs font-extrabold transition-all"
                                >
                                  Save Score
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="flex justify-center items-start pt-4 animate-in fade-in duration-300">
              <ChangePasswordForm />
            </div>
          )}

        </div>
      </main>

    </div>
  );
}
