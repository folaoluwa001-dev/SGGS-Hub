'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { schoolConfig } from '../../../config/school.config';
import { useTheme } from '@/components/Providers';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Users, BookOpen, FileSpreadsheet, RefreshCw, LogOut,
  Download, Upload, Save, CheckCircle2, ShieldAlert, Search, AlertCircle, Lock,
  PanelLeftClose, PanelLeftOpen, Menu, X, ChevronLeft, ChevronRight,
  CalendarCheck, Check, Sparkles, Sliders, Calendar, GraduationCap
} from 'lucide-react';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import EntranceExamCoordinator from '@/components/teacher/EntranceExamCoordinator';

export default function TeacherDashboard() {
  const router = useRouter();
  const { theme } = useTheme();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'manual' | 'sync' | 'entrance-exams' | 'settings'>('overview');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Attendance states
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { daysPresent: string; totalDays: string; remark: string }>>({});
  const [defaultTotalDays, setDefaultTotalDays] = useState('60');
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceMsg, setAttendanceMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
  const [selectedClassCategory, setSelectedClassCategory] = useState('');

  const classCategories = Array.from(
    new Set(
      classes.map((c: any) => {
        const match = c.name.trim().match(/^(JSS\d|SSS\d)/i);
        return match ? match[1].toUpperCase() : c.name.trim();
      })
    )
  ).sort() as string[];

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

  const fetchClassAttendance = async (studentList = students) => {
    if (!selectedClassId || !selectedTermId || !selectedSessionId) return;
    setAttendanceLoading(true);
    setAttendanceMsg(null);
    try {
      const url = `/api/attendance?classId=${selectedClassId}&termId=${selectedTermId}&sessionId=${selectedSessionId}`;
      const res = await fetch(url);
      const data = await res.json();

      const map: Record<string, { daysPresent: string; totalDays: string; remark: string }> = {};
      studentList.forEach(s => {
        map[s.id] = { daysPresent: '', totalDays: defaultTotalDays || '60', remark: '' };
      });

      if (Array.isArray(data) && data.length > 0) {
        data.forEach((r: any) => {
          map[r.studentId] = {
            daysPresent: String(r.daysPresent),
            totalDays: String(r.totalDays),
            remark: r.remark || '',
          };
        });
        if (data[0]?.totalDays) {
          setDefaultTotalDays(String(data[0].totalDays));
        }
      }
      setAttendanceRecords(map);
    } catch (err: any) {
      console.error(err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedClassId || !selectedTermId || !selectedSessionId) {
      setAttendanceMsg({ type: 'error', text: 'Please select class, session, and term.' });
      return;
    }
    if (students.length === 0) {
      setAttendanceMsg({ type: 'error', text: 'No students in this class to record attendance for.' });
      return;
    }

    setAttendanceSaving(true);
    setAttendanceMsg(null);
    try {
      const records = students.map(s => {
        const rec = attendanceRecords[s.id] || { daysPresent: '0', totalDays: defaultTotalDays || '60', remark: '' };
        const parsedTotal = parseInt(rec.totalDays, 10) || parseInt(defaultTotalDays, 10) || 60;
        const parsedDays = parseInt(rec.daysPresent, 10) || 0;
        return {
          studentId: s.id,
          classId: selectedClassId,
          sessionId: selectedSessionId,
          termId: selectedTermId,
          daysPresent: parsedDays,
          totalDays: parsedTotal,
          remark: rec.remark || null,
        };
      });

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save attendance records.');

      setAttendanceMsg({
        type: 'success',
        text: `Attendance saved successfully for ${data.count} student(s)! Percentage is now automatically reflected on their report cards.`,
      });
      await fetchClassAttendance();
    } catch (err: any) {
      setAttendanceMsg({ type: 'error', text: err.message || 'Error saving attendance.' });
    } finally {
      setAttendanceSaving(false);
    }
  };

  const applyDefaultTotalDaysToAll = () => {
    const parsed = parseInt(defaultTotalDays, 10);
    if (isNaN(parsed) || parsed <= 0) {
      alert('Please enter a valid positive number for total school days.');
      return;
    }
    setAttendanceRecords(prev => {
      const next = { ...prev };
      students.forEach(s => {
        next[s.id] = {
          ...(next[s.id] || { daysPresent: '', remark: '' }),
          totalDays: String(parsed),
        };
      });
      return next;
    });
  };

  const markAllPresent = () => {
    setAttendanceRecords(prev => {
      const next = { ...prev };
      students.forEach(s => {
        const curTotal = next[s.id]?.totalDays || defaultTotalDays || '60';
        next[s.id] = {
          ...(next[s.id] || { remark: '' }),
          daysPresent: curTotal,
          totalDays: curTotal,
        };
      });
      return next;
    });
  };

  const fetchClassStudents = async () => {
    try {
      const res = await fetch(`/api/students?classId=${selectedClassId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudents(data);
        if (activeTab === 'manual') {
          fetchClassGrades(data);
        } else if (activeTab === 'attendance') {
          fetchClassAttendance(data);
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

  const handleCategoryChange = (category: string) => {
    setSelectedClassCategory(category);
    if (category) {
      const filtered = classes.filter(c => {
        const match = c.name.trim().match(/^(JSS\d|SSS\d)/i);
        const cat = match ? match[1].toUpperCase() : c.name.trim();
        return cat === category;
      });
      if (filtered.length > 0) {
        const isCurrentInFiltered = filtered.some(c => c.id === selectedClassId);
        if (!isCurrentInFiltered) {
          setSelectedClassId(filtered[0].id);
        }
      }
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

  // Fetch attendance when options are modified in attendance tab
  useEffect(() => {
    if (activeTab === 'attendance' && selectedClassId && selectedTermId && selectedSessionId) {
      fetchClassAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedClassId, selectedTermId, selectedSessionId]);

  // Download template triggers
  const downloadTemplate = () => {
    if (!selectedClassId) return;
    const url = `/api/sync-sheets?classId=${selectedClassId}&subjectId=${selectedSubjectId}`;
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

      {/* MOBILE DRAWER BACKDROP & SIDEBAR */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-card-custom border-r border-border-custom flex flex-col justify-between shadow-2xl p-6 z-10 animate-in slide-in-from-left duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border-custom pb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-9 h-9 flex items-center justify-center flex-shrink-0"
                    dangerouslySetInnerHTML={{ __html: schoolConfig.schoolLogo }}
                  />
                  <div>
                    <span className="block font-black text-xs tracking-wider uppercase text-primary dark:text-white">Teacher Portal</span>
                    <span className="block text-[9px] text-muted-fg-custom font-bold uppercase">{schoolConfig.schoolName.substring(0, 14)}...</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-muted-custom text-fg-custom hover:text-danger cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Nav Links */}
              <nav className="space-y-1.5">
                <button
                  onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'overview'
                      ? 'bg-secondary/15 text-secondary'
                      : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                  }`}
                >
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span>Student Directory</span>
                </button>

                <button
                  onClick={() => { setActiveTab('attendance'); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'attendance'
                      ? 'bg-secondary/15 text-secondary'
                      : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4 flex-shrink-0" />
                  <span>Attendance Records</span>
                </button>

                <button
                  onClick={() => { setActiveTab('sync'); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'sync'
                      ? 'bg-secondary/15 text-secondary'
                      : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
                  <span>Spreadsheet Grade Upload</span>
                </button>

                <button
                  onClick={() => { setActiveTab('manual'); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'manual'
                      ? 'bg-secondary/15 text-secondary'
                      : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                  }`}
                >
                  <Save className="w-4 h-4 flex-shrink-0" />
                  <span>Manual Grade book</span>
                </button>

                <button
                  onClick={() => { setActiveTab('entrance-exams'); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'entrance-exams'
                      ? 'bg-secondary/15 text-secondary'
                      : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 flex-shrink-0" />
                  <span>Entrance Exams</span>
                </button>

                <button
                  onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'settings'
                      ? 'bg-secondary/15 text-secondary'
                      : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                  }`}
                >
                  <Lock className="w-4 h-4 flex-shrink-0" />
                  <span>Change Password</span>
                </button>
              </nav>
            </div>

            {/* Mobile Footer */}
            <div className="border-t border-border-custom pt-4 space-y-4">
              <div className="text-xs">
                <span className="block font-bold text-fg-custom">{user?.fullName}</span>
                <span className="block text-[10px] text-muted-fg-custom font-semibold uppercase">Academic Teacher</span>
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
        </div>
      )}

      {/* DESKTOP COLLAPSIBLE SIDEBAR */}
      <aside
        className={`bg-card-custom border-r border-border-custom flex-col justify-between hidden md:flex transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`p-4 ${sidebarCollapsed ? 'space-y-6' : 'p-6 space-y-8'}`}>
          {/* Brand header & expand/collapse toggle */}
          <div className={`flex items-center ${sidebarCollapsed ? 'flex-col space-y-3' : 'justify-between'}`}>
            <div className="flex items-center space-x-3 overflow-hidden">
              <div
                className="w-9 h-9 flex items-center justify-center flex-shrink-0"
                dangerouslySetInnerHTML={{ __html: schoolConfig.schoolLogo }}
              />
              {!sidebarCollapsed && (
                <div className="truncate">
                  <span className="block font-black text-xs tracking-wider uppercase text-primary dark:text-white truncate">Teacher Portal</span>
                  <span className="block text-[9px] text-muted-fg-custom font-bold uppercase truncate">{schoolConfig.schoolName.substring(0, 12)}...</span>
                </div>
              )}
            </div>

            {/* In-sidebar Expand/Collapse Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg border border-border-custom bg-muted-custom/60 hover:bg-muted-custom text-fg-custom hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              title={sidebarCollapsed ? 'Student Directory' : undefined}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
              }`}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Student Directory</span>}
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              title={sidebarCollapsed ? 'Attendance Records' : undefined}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'attendance'
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
              }`}
            >
              <CalendarCheck className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Attendance Records</span>}
            </button>

            <button
              onClick={() => setActiveTab('sync')}
              title={sidebarCollapsed ? 'Spreadsheet Grade Upload' : undefined}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'sync'
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Spreadsheet Upload</span>}
            </button>

            <button
              onClick={() => setActiveTab('manual')}
              title={sidebarCollapsed ? 'Manual Grade book' : undefined}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'manual'
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
              }`}
            >
              <Save className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Manual Grade book</span>}
            </button>

            <button
              onClick={() => setActiveTab('entrance-exams')}
              title={sidebarCollapsed ? 'Entrance Exams' : undefined}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'entrance-exams'
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
              }`}
            >
              <GraduationCap className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Entrance Exams</span>}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              title={sidebarCollapsed ? 'Change Password' : undefined}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'settings'
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
              }`}
            >
              <Lock className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Change Password</span>}
            </button>
          </nav>
        </div>

        {/* User profile footer */}
        <div className={`p-4 border-t border-border-custom ${sidebarCollapsed ? 'flex flex-col items-center space-y-3' : 'p-6 space-y-4'}`}>
          {!sidebarCollapsed ? (
            <>
              <div className="flex items-center justify-between">
                <div className="text-xs truncate">
                  <span className="block font-bold text-fg-custom truncate">{user?.fullName}</span>
                  <span className="block text-[10px] text-muted-fg-custom font-semibold uppercase truncate">Academic Teacher</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 rounded-xl border border-border-custom hover:bg-danger/10 hover:text-danger text-xs font-extrabold transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl border border-border-custom hover:bg-danger/10 hover:text-danger transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* TOP BAR */}
        <header className="h-16 bg-card-custom border-b border-border-custom px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Mobile menu open button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl border border-border-custom bg-muted-custom/60 hover:bg-muted-custom text-fg-custom cursor-pointer"
              aria-label="Open sidebar menu"
              title="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex p-2 rounded-xl border border-border-custom bg-muted-custom/60 hover:bg-muted-custom text-fg-custom hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>

            <h2 className="text-sm font-black text-primary dark:text-white uppercase hidden sm:block">
              {activeTab === 'overview' && 'Student Directory & Class Lists'}
              {activeTab === 'attendance' && 'Student Attendance Recording'}
              {activeTab === 'sync' && 'Spreadsheet Grade Upload & Sync'}
              {activeTab === 'manual' && 'Manual Grade Book Overrides'}
              {activeTab === 'entrance-exams' && 'Entrance Exam Coordination & Questions'}
              {activeTab === 'settings' && 'Account Settings'}
            </h2>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="text-[10px] text-muted-fg-custom font-bold uppercase hidden xs:inline">Class:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-muted-custom border border-border-custom text-xs font-bold focus:outline-hidden"
              >
                {classes
                  .filter(c => {
                    if (!selectedClassCategory) return true;
                    const match = c.name.trim().match(/^(JSS\d|SSS\d)/i);
                    const category = match ? match[1].toUpperCase() : c.name.trim();
                    return category === selectedClassCategory;
                  })
                  .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <ThemeToggle />

            <button
              onClick={handleLogout}
              className="md:hidden p-2 rounded-xl border border-border-custom hover:bg-danger/10 text-danger"
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
                          {classes
                            .filter(c => {
                              if (!selectedClassCategory) return true;
                              const match = c.name.trim().match(/^(JSS\d|SSS\d)/i);
                              const category = match ? match[1].toUpperCase() : c.name.trim();
                              return category === selectedClassCategory;
                            })
                            .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
                      <label className="flex items-center justify-center space-x-2 w-full px-6 py-3 rounded-xl bg-transparent border border-primary text-primary hover:bg-primary/5 dark:bg-primary dark:text-white dark:border-transparent dark:hover:bg-primary-light font-extrabold text-xs shadow-xs cursor-pointer transition-all">
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
                      className="flex items-center justify-center space-x-2 w-full px-6 py-3.5 rounded-xl bg-transparent border border-primary text-primary hover:bg-primary/5 dark:bg-primary dark:text-white dark:border-transparent dark:hover:bg-primary-light font-extrabold text-xs shadow-xs transition-all disabled:opacity-50"
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

          {/* ATTENDANCE RECORD TAB */}
          {activeTab === 'attendance' && (() => {
            const selectedClassRecord = classes.find(c => c.id === selectedClassId);
            const selectedSessionRecord = sessions.find(s => s.id === selectedSessionId);
            const selectedTermRecord = terms.find(t => t.id === selectedTermId);

            // Compute summary statistics
            let totalPctSum = 0;
            let recordedCount = 0;
            students.forEach(s => {
              const rec = attendanceRecords[s.id];
              if (rec && rec.daysPresent !== '') {
                const pDays = parseInt(rec.daysPresent, 10) || 0;
                const tDays = parseInt(rec.totalDays, 10) || parseInt(defaultTotalDays, 10) || 60;
                if (tDays > 0) {
                  totalPctSum += Math.min(100, (pDays / tDays) * 100);
                  recordedCount++;
                }
              }
            });
            const classAvgAttendance = recordedCount > 0 ? (totalPctSum / recordedCount).toFixed(1) : '0.0';

            return (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Header Banner */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-primary/10 via-card-custom to-secondary/10 border border-border-custom shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <CalendarCheck className="w-5 h-5 text-secondary" />
                        <h3 className="text-base font-black text-primary dark:text-white uppercase tracking-wider">
                          Student Attendance Recording
                        </h3>
                      </div>
                      <p className="text-xs text-muted-fg-custom font-medium max-w-2xl">
                        Record termly attendance days per student. The calculated attendance percentage will automatically be reflected on their official term report card.
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="px-4 py-2 rounded-2xl bg-card-custom border border-border-custom text-center shadow-xs">
                        <span className="block text-[9px] uppercase font-extrabold text-slate-400">Class Average</span>
                        <span className="block text-sm font-black text-secondary">{classAvgAttendance}%</span>
                      </div>
                      <div className="px-4 py-2 rounded-2xl bg-card-custom border border-border-custom text-center shadow-xs">
                        <span className="block text-[9px] uppercase font-extrabold text-slate-400">Students</span>
                        <span className="block text-sm font-black text-primary dark:text-white">{students.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notifications & Feedback */}
                {attendanceMsg && (
                  <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs ${
                    attendanceMsg.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/25'
                      : 'bg-danger/10 text-danger border border-danger/25'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {attendanceMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span>{attendanceMsg.text}</span>
                    </div>
                    <button onClick={() => setAttendanceMsg(null)} className="p-1 hover:opacity-75">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Configuration Toolbar */}
                <div className="p-6 rounded-3xl bg-card-custom border border-border-custom shadow-xs space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Class Arm */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400">Class Arm *</label>
                      <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                      >
                        {classes.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Academic Session */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400">Academic Session *</label>
                      <select
                        value={selectedSessionId}
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                      >
                        {sessions.map(s => (
                          <option key={s.id} value={s.id}>{s.name} {s.active ? '(Active)' : ''}</option>
                        ))}
                      </select>
                    </div>

                    {/* Academic Term */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400">Academic Term *</label>
                      <select
                        value={selectedTermId}
                        onChange={(e) => setSelectedTermId(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                      >
                        {terms.map(t => (
                          <option key={t.id} value={t.id}>{t.name} {t.active ? '(Active)' : ''}</option>
                        ))}
                      </select>
                    </div>

                    {/* Reload Button */}
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <button
                        onClick={() => fetchClassAttendance()}
                        disabled={attendanceLoading}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-border-custom hover:bg-muted-custom text-xs font-bold transition-all cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${attendanceLoading ? 'animate-spin' : ''}`} />
                        <span>Reload Register</span>
                      </button>
                    </div>
                  </div>

                  {/* Batch Tools */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-custom">
                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">Default Total Days:</span>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={defaultTotalDays}
                        onChange={(e) => setDefaultTotalDays(e.target.value)}
                        className="w-20 px-3 py-1.5 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold text-center"
                      />
                      <button
                        onClick={applyDefaultTotalDaysToAll}
                        type="button"
                        className="px-3 py-1.5 rounded-xl border border-secondary/40 text-secondary hover:bg-secondary hover:text-white text-[11px] font-extrabold transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                      >
                        Apply to All
                      </button>
                    </div>

                    <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                      <button
                        onClick={markAllPresent}
                        type="button"
                        className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-extrabold transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Mark All 100% Present</span>
                      </button>

                      <button
                        onClick={handleSaveAttendance}
                        disabled={attendanceSaving || students.length === 0}
                        className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-secondary text-white hover:bg-amber-600 disabled:opacity-50 font-extrabold text-xs shadow-md transition-all cursor-pointer"
                      >
                        {attendanceSaving ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save All Attendance</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Attendance Table */}
                <div className="bg-card-custom border border-border-custom rounded-3xl overflow-hidden shadow-xs">
                  <div className="p-4 border-b border-border-custom flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase text-primary dark:text-white">
                        Class Register: {selectedClassRecord?.name} ({selectedSessionRecord?.name} - {selectedTermRecord?.name})
                      </h4>
                      <p className="text-[10px] text-muted-fg-custom font-medium mt-0.5">
                        Each student has an individual input for days present to reflect their specific attendance rate.
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-muted-fg-custom">
                      {students.length} Students Listed
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-muted-custom/40 text-muted-fg-custom font-bold border-b border-border-custom">
                          <th className="p-4 w-12 text-center">#</th>
                          <th className="p-4">Student ID & Admission</th>
                          <th className="p-4">Student Name</th>
                          <th className="p-4 text-center">Days Present</th>
                          <th className="p-4 text-center">Total School Days</th>
                          <th className="p-4 text-center">Attendance %</th>
                          <th className="p-4">Remark / Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-custom">
                        {students.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                              No students found in this class arm.
                            </td>
                          </tr>
                        ) : (
                          students.map((student, idx) => {
                            const rec = attendanceRecords[student.id] || { daysPresent: '', totalDays: defaultTotalDays || '60', remark: '' };
                            const parsedDays = parseInt(rec.daysPresent, 10) || 0;
                            const parsedTotal = parseInt(rec.totalDays, 10) || parseInt(defaultTotalDays, 10) || 60;
                            const pct = parsedTotal > 0 ? Math.min(100, Math.round(((parsedDays / parsedTotal) * 100) * 10) / 10) : 0;
                            const hasEntered = rec.daysPresent !== '';

                            let badgeStyle = 'bg-muted-custom text-slate-400';
                            if (hasEntered) {
                              if (pct >= 75) badgeStyle = 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30';
                              else if (pct >= 50) badgeStyle = 'bg-amber-500/15 text-amber-600 border border-amber-500/30';
                              else badgeStyle = 'bg-danger/15 text-danger border border-danger/30';
                            }

                            return (
                              <tr key={student.id} className="hover:bg-muted-custom/10 transition-colors">
                                <td className="p-4 text-center text-slate-400 font-bold">{idx + 1}</td>
                                <td className="p-4">
                                  <span className="block font-bold text-primary dark:text-white">{student.id}</span>
                                  <span className="block text-[10px] text-muted-fg-custom font-medium">{student.admissionNumber}</span>
                                </td>
                                <td className="p-4">
                                  <span className="block font-extrabold uppercase text-primary dark:text-white">{student.fullName}</span>
                                  <span className="block text-[10px] text-slate-400">{student.gender}</span>
                                </td>
                                <td className="p-4 text-center">
                                  <input
                                    type="number"
                                    min={0}
                                    max={parsedTotal}
                                    value={rec.daysPresent}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setAttendanceRecords(prev => ({
                                        ...prev,
                                        [student.id]: {
                                          ...(prev[student.id] || { totalDays: defaultTotalDays || '60', remark: '' }),
                                          daysPresent: val,
                                        }
                                      }));
                                    }}
                                    className="w-24 px-3 py-1.5 rounded-xl bg-bg-custom border border-border-custom text-center font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-secondary/30"
                                    placeholder="Days"
                                  />
                                </td>
                                <td className="p-4 text-center">
                                  <input
                                    type="number"
                                    min={1}
                                    max={365}
                                    value={rec.totalDays}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setAttendanceRecords(prev => ({
                                        ...prev,
                                        [student.id]: {
                                          ...(prev[student.id] || { daysPresent: '', remark: '' }),
                                          totalDays: val,
                                        }
                                      }));
                                    }}
                                    className="w-24 px-3 py-1.5 rounded-xl bg-bg-custom border border-border-custom text-center font-bold text-xs focus:outline-hidden focus:ring-2 focus:ring-secondary/30"
                                    placeholder="Total"
                                  />
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black ${badgeStyle}`}>
                                    {hasEntered ? `${pct}%` : 'Pending'}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <input
                                    type="text"
                                    value={rec.remark}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setAttendanceRecords(prev => ({
                                        ...prev,
                                        [student.id]: {
                                          ...(prev[student.id] || { daysPresent: '', totalDays: defaultTotalDays || '60' }),
                                          remark: val,
                                        }
                                      }));
                                    }}
                                    className="w-full max-w-xs px-3 py-1.5 rounded-xl bg-bg-custom border border-border-custom text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-secondary/30"
                                    placeholder="e.g. Regular, Sick leave..."
                                  />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Table Footer Actions */}
                  <div className="p-4 border-t border-border-custom bg-muted-custom/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-muted-fg-custom">
                      Ready to save attendance for <strong>{students.length}</strong> students. Values are saved to the database and will reflect automatically on PDF and Online Report Cards.
                    </div>
                    <button
                      onClick={handleSaveAttendance}
                      disabled={attendanceSaving || students.length === 0}
                      className="flex items-center space-x-2 px-6 py-2.5 rounded-2xl bg-secondary text-white hover:bg-amber-600 disabled:opacity-50 font-extrabold text-xs shadow-md transition-all cursor-pointer w-full sm:w-auto justify-center"
                    >
                      {attendanceSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving Records...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save All Attendance Records</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ENTRANCE EXAMS COORDINATION TAB */}
          {activeTab === 'entrance-exams' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <EntranceExamCoordinator />
            </div>
          )}

          {/* MANUAL SCORE SHEET TAB */}
          {activeTab === 'manual' && (
            <div className="space-y-6 animate-in fade-in duration-300">

              {/* Grading Subject / Term configuration toolbar */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-card-custom border border-border-custom">
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Class Category:</span>
                  <select
                    value={selectedClassCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-muted-custom border border-border-custom text-xs font-bold focus:outline-hidden"
                  >
                    <option value="">All Categories</option>
                    {classCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

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
                                  className="px-3.5 py-1.5 rounded-lg bg-transparent border border-primary text-primary hover:bg-primary/5 dark:bg-primary dark:text-white dark:border-transparent dark:hover:bg-primary-light text-xs font-extrabold transition-all"
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
