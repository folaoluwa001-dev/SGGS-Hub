'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { schoolConfig } from '../../../config/school.config';
import { useTheme } from '@/components/Providers';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Users, BookOpen, Key, History, Database, LogOut, LayoutDashboard,
  Plus, Edit, Trash2, Search, Filter, ShieldAlert, ShieldCheck, Download, RefreshCcw,
  Save, KeyRound, Calendar, Lock,
  PanelLeftClose, PanelLeftOpen, Menu, X, ChevronLeft, ChevronRight,
  GraduationCap, Sliders, ArrowRight, CheckCircle2, AlertTriangle, Clock, CalendarDays, Check, Sparkles
} from 'lucide-react';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';

export default function AdminDashboard() {
  const router = useRouter();
  const { theme } = useTheme();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'subjects' | 'tokens' | 'backups' | 'audit' | 'settings' | 'marksheet' | 'session-settings'>('overview');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Data lists
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);

  // Bulk report state
  const [bulkClassId, setBulkClassId] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkUploadResult, setBulkUploadResult] = useState<{
    success: boolean;
    errors: string[];
    count: number;
  } | null>(null);

  // Combined Marksheet state
  const [selectedClassCategory, setSelectedClassCategory] = useState('');
  const [selectedMarksheetTermId, setSelectedMarksheetTermId] = useState('');
  const [selectedMarksheetSessionId, setSelectedMarksheetSessionId] = useState('');
  const [marksheetLoading, setMarksheetLoading] = useState(false);
  const [marksheetError, setMarksheetError] = useState<string | null>(null);
  const [marksheetSuccess, setMarksheetSuccess] = useState<string | null>(null);
  const [marksheetUploadErrors, setMarksheetUploadErrors] = useState<string[]>([]);

  // Modals state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentForm, setStudentForm] = useState({
    id: '', // for edit
    admissionNumber: '',
    fullName: '',
    gender: 'Male',
    dateOfBirth: '',
    address: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    classId: '',
    sessionId: '',
  });
  const [isEditingStudent, setIsEditingStudent] = useState(false);

  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ id: '', name: '', description: '' });
  const [isEditingSubject, setIsEditingSubject] = useState(false);

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [tokenForm, setTokenForm] = useState({ studentId: '', classId: '', mode: 'single', quantity: 1 });

  // Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState<'all' | 'active' | 'graduated'>('all');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');

  // Academic Session Settings states
  const [newSessionName, setNewSessionName] = useState('');
  const [newSessionActive, setNewSessionActive] = useState(false);
  const [sessionActionLoading, setSessionActionLoading] = useState(false);
  const [sessionActionMsg, setSessionActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Term Resumption states
  const [resumptionDates, setResumptionDates] = useState<Record<string, string>>({});
  const [resumptionSaving, setResumptionSaving] = useState(false);
  const [resumptionMsg, setResumptionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Student Directory Migration states
  const [migrateSourceSessionId, setMigrateSourceSessionId] = useState('');
  const [migrateTargetSessionId, setMigrateTargetSessionId] = useState('');
  const [migrateActivateTarget, setMigrateActivateTarget] = useState(true);
  const [migrateLoading, setMigrateLoading] = useState(false);
  const [migrateConfirmModal, setMigrateConfirmModal] = useState(false);
  const [migrateResult, setMigrateResult] = useState<any | null>(null);
  const [migrateError, setMigrateError] = useState<string | null>(null);

  // Data retrieval calls
  const fetchStudents = async (statusOverride?: string) => {
    try {
      const activeStatus = statusOverride !== undefined ? statusOverride : studentStatusFilter;
      const statusParam = activeStatus === 'all' ? '' : `&status=${activeStatus}`;
      const url = `/api/students?search=${encodeURIComponent(studentSearch)}&classId=${studentClassFilter}${statusParam}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setStudents(data);
    } catch (e) { console.error(e); }
  };

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      if (Array.isArray(data)) setSubjects(data);
    } catch (e) { console.error(e); }
  };

  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/tokens');
      const data = await res.json();
      if (Array.isArray(data)) setTokens(data);
    } catch (e) { console.error(e); }
  };

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/backup');
      const data = await res.json();
      if (Array.isArray(data)) setBackups(data);
    } catch (e) { console.error(e); }
  };

  const fetchAuditLogs = async () => {
    try {
      const url = `/api/audit-logs?search=${auditSearch}&action=${auditActionFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setAuditLogs(data);
    } catch (e) { console.error(e); }
  };

  const fetchClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      const data = await res.json();
      if (Array.isArray(data)) setClasses(data);
    } catch (e) { console.error(e); }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSessions(data);
        const activeSess = data.find((s: any) => s.active);
        if (activeSess && !migrateSourceSessionId) {
          setMigrateSourceSessionId(activeSess.id);
        }
      }
    } catch (e) { console.error(e); }
  };

  const fetchTerms = async () => {
    try {
      const res = await fetch('/api/terms');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTerms(data);
        const datesMap: Record<string, string> = {};
        data.forEach((t: any) => {
          if (t.resumptionDate) {
            datesMap[t.id] = new Date(t.resumptionDate).toISOString().split('T')[0];
          }
        });
        setResumptionDates(prev => ({ ...prev, ...datesMap }));
      }
    } catch (e) { console.error(e); }
  };

  // Fetch initial baseline data
  const fetchBaseData = async () => {
    try {
      setLoading(true);
      const [resCls, resSess, resSubj, resTerms] = await Promise.all([
        fetch('/api/classes').then(r => r.json()),
        fetch('/api/sessions').then(r => r.json()),
        fetch('/api/subjects').then(r => r.json()),
        fetch('/api/terms').then(r => r.json()),
      ]);

      if (Array.isArray(resCls)) setClasses(resCls);
      if (Array.isArray(resSess)) {
        setSessions(resSess);
        const activeSess = resSess.find((s: any) => s.active);
        if (activeSess) {
          setMigrateSourceSessionId(activeSess.id);
        }
      }
      if (Array.isArray(resSubj)) setSubjects(resSubj);
      if (Array.isArray(resTerms)) {
        setTerms(resTerms);
        const datesMap: Record<string, string> = {};
        resTerms.forEach((t: any) => {
          if (t.resumptionDate) {
            datesMap[t.id] = new Date(t.resumptionDate).toISOString().split('T')[0];
          }
        });
        setResumptionDates(datesMap);
      }

      // Default forms selection
      if (resCls.length > 0) {
        setStudentForm(prev => ({ ...prev, classId: resCls[0].id }));
        setTokenForm(prev => ({ ...prev, classId: resCls[0].id }));
      }
      if (resSess.length > 0) {
        setStudentForm(prev => ({ ...prev, sessionId: resSess[0].id }));
      }

      // Default marksheet term and session
      const activeTerm = resTerms.find((t: any) => t.active);
      if (activeTerm) {
        setSelectedMarksheetTermId(activeTerm.id);
      } else if (resTerms.length > 0) {
        setSelectedMarksheetTermId(resTerms[0].id);
      }

      const activeSession = resSess.find((s: any) => s.active);
      if (activeSession) {
        setSelectedMarksheetSessionId(activeSession.id);
      } else if (resSess.length > 0) {
        setSelectedMarksheetSessionId(resSess[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Academic Session Settings
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    setSessionActionLoading(true);
    setSessionActionMsg(null);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSessionName.trim(), active: newSessionActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create academic session');
      setNewSessionName('');
      setNewSessionActive(false);
      setSessionActionMsg({ type: 'success', text: `Session '${data.name}' was created successfully!` });
      await fetchSessions();
    } catch (err: any) {
      setSessionActionMsg({ type: 'error', text: err.message });
    } finally {
      setSessionActionLoading(false);
    }
  };

  const handleActivateSession = async (sessionId: string) => {
    setSessionActionLoading(true);
    setSessionActionMsg(null);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId, active: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to activate session');
      setSessionActionMsg({ type: 'success', text: `Active session successfully set to '${data.name}'` });
      await fetchSessions();
    } catch (err: any) {
      setSessionActionMsg({ type: 'error', text: err.message });
    } finally {
      setSessionActionLoading(false);
    }
  };

  const handleActivateTerm = async (termId: string) => {
    setResumptionSaving(true);
    setResumptionMsg(null);
    try {
      const res = await fetch('/api/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: termId, active: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to activate term');
      setResumptionMsg({ type: 'success', text: `Active term set to '${data.activeTerm?.name || 'Selected Term'}'` });
      await fetchTerms();
    } catch (err: any) {
      setResumptionMsg({ type: 'error', text: err.message });
    } finally {
      setResumptionSaving(false);
    }
  };

  const handleSaveResumptionDates = async () => {
    setResumptionSaving(true);
    setResumptionMsg(null);
    try {
      const res = await fetch('/api/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_resumption', resumptionDates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save term resumption dates');
      setResumptionMsg({ type: 'success', text: 'All term resumption dates have been saved successfully!' });
      await fetchTerms();
    } catch (err: any) {
      setResumptionMsg({ type: 'error', text: err.message });
    } finally {
      setResumptionSaving(false);
    }
  };

  const handleExecuteMigration = async () => {
    if (!migrateSourceSessionId || !migrateTargetSessionId) {
      setMigrateError('Please select both source session and target session.');
      return;
    }
    setMigrateLoading(true);
    setMigrateError(null);
    setMigrateResult(null);
    try {
      const res = await fetch('/api/admin/academic-sessions/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceSessionId: migrateSourceSessionId,
          targetSessionId: migrateTargetSessionId,
          activateTargetSession: migrateActivateTarget,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Student directory migration failed.');
      setMigrateResult(data);
      setMigrateConfirmModal(false);
      await Promise.all([fetchStudents(), fetchClasses(), fetchSessions()]);
    } catch (err: any) {
      setMigrateError(err.message);
    } finally {
      setMigrateLoading(false);
    }
  };

  // 1. Initial Authentication check
  useEffect(() => {
    const cachedUser = localStorage.getItem('sggs-user');
    if (!cachedUser) {
      router.push('/login');
      return;
    }
    const parsed = JSON.parse(cachedUser);
    if (parsed.role !== 'SUPER_ADMIN') {
      // Send them to their respective home
      if (parsed.role === 'TEACHER') router.push('/teacher');
      else if (parsed.role === 'BURSAR') router.push('/bursar');
      else router.push('/login');
      return;
    }
    Promise.resolve().then(() => {
      setUser(parsed);
      fetchBaseData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch contextual tab data
  useEffect(() => {
    if (!user) return;
    if (activeTab === 'overview') {
      fetchStudents();
      fetchTokens();
    } else if (activeTab === 'students') {
      fetchStudents();
      fetchSessions();
      fetchTerms();
    } else if (activeTab === 'subjects') {
      fetchSubjects();
    } else if (activeTab === 'tokens') {
      fetchTokens();
      fetchStudents();
    } else if (activeTab === 'backups') {
      fetchBackups();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    } else if (activeTab === 'session-settings') {
      fetchSessions();
      fetchTerms();
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user, studentClassFilter, studentSearch, studentStatusFilter, auditSearch, auditActionFilter]);

  // Report Card Downloads
  const handleDownloadStudentReportCard = (student: any) => {
    const activeSession = sessions.find(s => s.active);
    const activeTerm = terms.find(t => t.active);
    const currentSessionId = student.sessionId || activeSession?.id || sessions[0]?.id;
    const currentTermId = activeTerm?.id || terms[0]?.id;

    const params = new URLSearchParams({
      studentId: student.id,
    });
    if (currentSessionId) params.set('sessionId', currentSessionId);
    if (currentTermId) params.set('termId', currentTermId);

    const url = `/api/results/pdf?${params.toString()}`;
    window.open(url, '_blank');
  };

  const handleBulkDownload = async () => {
    if (!bulkClassId) return;

    const activeSession = sessions.find(s => s.active);
    const activeTerm = terms.find(t => t.active);
    const currentSessionId = activeSession?.id || sessions[0]?.id;
    const currentTermId = activeTerm?.id || terms[0]?.id;

    if (!currentSessionId || !currentTermId) {
      alert('No active academic session or term has been configured.');
      return;
    }

    setBulkLoading(true);
    try {
      const url = `/api/results/pdf/bulk?classId=${bulkClassId}&termId=${currentTermId}&sessionId=${currentSessionId}`;
      const response = await fetch(url);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate bulk report cards ZIP.');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      const selectedClass = classes.find(c => c.id === bulkClassId);
      const className = selectedClass ? selectedClass.name : 'Class';
      const sessionName = activeSession ? activeSession.name.replace(/\//g, '-') : 'Session';

      let termLabel = 'Term';
      if (activeTerm) {
        termLabel = activeTerm.name.replace(/\s+/g, '');
        if (activeTerm.name.toLowerCase().includes('first')) termLabel = 'Term1';
        else if (activeTerm.name.toLowerCase().includes('second')) termLabel = 'Term2';
        else if (activeTerm.name.toLowerCase().includes('third')) termLabel = 'Term3';
      }

      link.setAttribute('download', `${className}_Report_Cards_${sessionName}_${termLabel}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(err.message || 'An error occurred while downloading bulk report cards.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDownloadCombinedMarksheet = async () => {
    if (!selectedClassCategory) {
      setMarksheetError('Please select a Class Category.');
      return;
    }

    setMarksheetLoading(true);
    setMarksheetError(null);
    setMarksheetSuccess(null);
    setMarksheetUploadErrors([]);

    try {
      const url = `/api/admin/combined-marksheet?classCategory=${selectedClassCategory}&termId=${selectedMarksheetTermId}&sessionId=${selectedMarksheetSessionId}`;
      const res = await fetch(url);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to download marksheet.');
      }

      const blob = await res.blob();

      // Get filename from header or build fallback
      const disposition = res.headers.get('content-disposition');
      let filename = `${selectedClassCategory}_Marksheet.xlsx`;
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setMarksheetSuccess('Combined marksheet downloaded successfully.');
    } catch (err: any) {
      setMarksheetError(err.message || 'An error occurred while exporting.');
    } finally {
      setMarksheetLoading(false);
    }
  };

  const handleUploadCombinedMarksheet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    if (!selectedClassCategory) {
      setMarksheetError('Please select a Class Category first.');
      return;
    }

    setMarksheetLoading(true);
    setMarksheetError(null);
    setMarksheetSuccess(null);
    setMarksheetUploadErrors([]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('classCategory', selectedClassCategory);
    formData.append('termId', selectedMarksheetTermId);
    formData.append('sessionId', selectedMarksheetSessionId);

    try {
      const res = await fetch('/api/admin/combined-marksheet-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          setMarksheetUploadErrors(data.errors);
          throw new Error('Spreadsheet validation failed.');
        }
        throw new Error(data.error || 'Failed to upload marksheet.');
      }

      setMarksheetSuccess(`Marksheet uploaded and synchronized successfully. ${data.updatedCount || 0} records updated, ${data.deletedCount || 0} records deleted.`);
    } catch (err: any) {
      setMarksheetError(err.message || 'An error occurred during upload.');
    } finally {
      setMarksheetLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'Admission Number',
      'Full Name',
      'Gender',
      'Date of Birth',
      'Class Name',
      'Session Name',
      'Parent Name',
      'Parent Phone',
      'Parent Email',
      'Home Address'
    ];

    // Sort students by admission number in ascending order naturally
    const sortedStudentsForExport = [...students].sort((a, b) =>
      String(a.admissionNumber || '').localeCompare(String(b.admissionNumber || ''), undefined, { numeric: true, sensitivity: 'base' })
    );

    const rows = sortedStudentsForExport.map(s => [
      s.admissionNumber || '',
      s.fullName || '',
      s.gender || '',
      s.dateOfBirth ? s.dateOfBirth.split('T')[0] : '',
      s.class?.name || '',
      s.session?.name || '',
      s.parentName || '',
      s.parentPhone || '',
      s.parentEmail || '',
      s.address || ''
    ]);

    // If there are no students registered yet, provide one example row
    if (rows.length === 0) {
      const activeSession = sessions.find(s => s.active);
      const sessionExample = activeSession?.name || '2025/2026';
      const classExample = classes[0]?.name || 'JSS1';
      rows.push([
        'SGGS/2026/1001',
        'Olusola Adeoye',
        'Male',
        '2012-05-15',
        classExample,
        sessionExample,
        'Robert Doe',
        '+234 803 111 2222',
        'parent@example.com',
        '12, Success Close, Lagos'
      ]);
    }

    const csvContent = [
      '\uFEFF' + headers.join(','),
      ...rows.map(row =>
        row.map(val => {
          const escaped = String(val).includes(',') ? `"${val}"` : val;
          return escaped;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'student_bulk_registration_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/students/bulk-upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          setBulkUploadResult({
            success: false,
            errors: data.errors,
            count: 0
          });
        } else {
          throw new Error(data.error || 'Bulk upload failed');
        }
      } else {
        setBulkUploadResult({
          success: true,
          errors: [],
          count: data.count
        });
        fetchStudents();
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred during bulk upload');
    } finally {
      setLoading(false);
    }
  };

  // Student CRUD triggers
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const method = isEditingStudent ? 'PUT' : 'POST';
      const url = isEditingStudent ? `/api/students/${studentForm.id}` : '/api/students';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Operation failed');

      setShowStudentModal(false);
      fetchStudents();
      resetStudentForm();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const editStudent = (student: any) => {
    setIsEditingStudent(true);
    setStudentForm({
      id: student.id,
      admissionNumber: student.admissionNumber,
      fullName: student.fullName,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth.split('T')[0],
      address: student.address,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail,
      classId: student.classId,
      sessionId: student.sessionId,
    });
    setShowStudentModal(true);
  };

  const deleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this student profile and all associated grades?')) return;
    try {
      const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Deletion failed');
      fetchStudents();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const resetStudentForm = () => {
    setIsEditingStudent(false);
    setStudentForm({
      id: '',
      admissionNumber: '',
      fullName: '',
      gender: 'Male',
      dateOfBirth: '',
      address: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      classId: classes[0]?.id || '',
      sessionId: sessions[0]?.id || '',
    });
  };

  // Subject CRUD triggers
  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const method = isEditingSubject ? 'PUT' : 'POST';
      const url = isEditingSubject ? `/api/subjects/${subjectForm.id}` : '/api/subjects';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subjectForm),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Operation failed');

      setShowSubjectModal(false);
      fetchSubjects();
      setSubjectForm({ id: '', name: '', description: '' });
      setIsEditingSubject(false);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject? All results for this subject will be lost.')) return;
    try {
      const res = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Deletion failed');
      fetchSubjects();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Token Generator triggers
  const handleGenerateTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    try {
      const payload: any = { quantity: Number(tokenForm.quantity) };
      if (tokenForm.mode === 'single') {
        payload.studentId = tokenForm.studentId;
      } else {
        payload.classId = tokenForm.classId;
      }

      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Token generation failed');

      setShowTokenModal(false);
      fetchTokens();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteToken = async (id: string) => {
    if (!confirm('Are you sure you want to delete this token? This will permanently revoke result checker access for this token.')) return;
    try {
      const res = await fetch(`/api/tokens/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Deletion failed');
      fetchTokens();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Backup actions
  const triggerManualBackup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backup', { method: 'POST' });
      if (!res.ok) throw new Error('Backup failed');
      fetchBackups();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const triggerRestore = async (fileName: string) => {
    if (!confirm(`Warning: Restoring the system database to "${fileName}" will overwrite all current student logs, marks, and fees. Do you wish to proceed?`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/backup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName }),
      });
      if (!res.ok) throw new Error('Restore failed');
      alert('System database restored successfully!');
      fetchBackups();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this backup file?')) return;
    try {
      const res = await fetch(`/api/backup?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Backup deletion failed');
      fetchBackups();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Logout
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('sggs-user');
    router.push('/login');
  };

  // Pre-process charts data
  const classBreakdownData = classes.map((cls) => {
    const count = students.filter(s => s.classId === cls.id).length;
    return { name: cls.name, Students: count };
  });

  const activeTokensCount = tokens.filter(t => t.status === 'Active').length;
  const consumedTokensCount = tokens.filter(t => t.status === 'Consumed').length;
  const expiredTokensCount = tokens.filter(t => t.status === 'Expired').length;

  const tokenPieData = [
    { name: 'Active', value: activeTokensCount, color: schoolConfig.schoolColors.accent },
    { name: 'Consumed', value: consumedTokensCount, color: schoolConfig.schoolColors.secondary },
    { name: 'Expired/Other', value: expiredTokensCount, color: '#94a3b8' },
  ];

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
                    <span className="block font-black text-xs tracking-wider uppercase text-primary dark:text-white">Admin Portal</span>
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

              {/* Mobile Navigation Links */}
              <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-260px)]">
                <button
                  onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'overview'
                      ? 'bg-secondary/15 text-secondary'
                      : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                    }`}
                >
                  <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                  <span>Overview Analytics</span>
                </button>

                <button
                  onClick={() => { setActiveTab('students'); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'students'
                      ? 'bg-secondary/15 text-secondary'
                      : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                    }`}
                >
                  <Users className="w-4 h-4 flex-shrink-0" />
                  <span>Manage Students</span>
                </button>

                <button
                  onClick={() => { setActiveTab('subjects'); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'subjects'
                      ? 'bg-secondary/15 text-secondary'
                      : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                    }`}
                >
                  <BookOpen className="w-4 h-4 flex-shrink-0" />
                  <span>Manage Subjects</span>
                </button>

                <button
                  onClick={() => { setActiveTab('tokens'); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'tokens'
                      ? 'bg-secondary/15 text-secondary'
                      : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                    }`}
                >
                  <Key className="w-4 h-4 flex-shrink-0" />
                  <span>Token Management</span>
                </button>

                <button
                  onClick={() => { setActiveTab('backups'); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'backups'
                      ? 'bg-secondary/15 text-secondary'
                      : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                    }`}
                >
                  <Database className="w-4 h-4 flex-shrink-0" />
                  <span>System Backup</span>
                </button>

                <button
                  onClick={() => { setActiveTab('marksheet'); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'marksheet'
                      ? 'bg-secondary/15 text-secondary'
                      : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                    }`}
                >
                  <Download className="w-4 h-4 flex-shrink-0" />
                  <span>Combined Marksheets</span>
                </button>

                <button
                  onClick={() => { setActiveTab('session-settings'); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'session-settings'
                      ? 'bg-secondary/15 text-secondary'
                      : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                    }`}
                >
                  <CalendarDays className="w-4 h-4 flex-shrink-0" />
                  <span>Academic Session Settings</span>
                </button>

                <button
                  onClick={() => { setActiveTab('audit'); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'audit'
                      ? 'bg-secondary/15 text-secondary'
                      : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                    }`}
                >
                  <History className="w-4 h-4 flex-shrink-0" />
                  <span>Audit Trail</span>
                </button>

                <button
                  onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'settings'
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
                <span className="block text-[10px] text-muted-fg-custom font-semibold uppercase">Super Admin</span>
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
        className={`bg-card-custom border-r border-border-custom flex-col justify-between hidden md:flex transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-20' : 'w-64'
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
                  <span className="block font-black text-xs tracking-wider uppercase text-primary dark:text-white truncate">Admin Portal</span>
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
              title={sidebarCollapsed ? 'Overview Analytics' : undefined}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'overview'
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                }`}
            >
              <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Overview Analytics</span>}
            </button>

            <button
              onClick={() => setActiveTab('students')}
              title={sidebarCollapsed ? 'Manage Students' : undefined}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'students'
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                }`}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Manage Students</span>}
            </button>

            <button
              onClick={() => setActiveTab('subjects')}
              title={sidebarCollapsed ? 'Manage Subjects' : undefined}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'subjects'
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                }`}
            >
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Manage Subjects</span>}
            </button>

            <button
              onClick={() => setActiveTab('tokens')}
              title={sidebarCollapsed ? 'Token Management' : undefined}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'tokens'
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                }`}
            >
              <Key className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Token Management</span>}
            </button>

            <button
              onClick={() => setActiveTab('backups')}
              title={sidebarCollapsed ? 'System Backup' : undefined}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'backups'
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                }`}
            >
              <Database className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>System Backup</span>}
            </button>

            <button
              onClick={() => setActiveTab('marksheet')}
              title={sidebarCollapsed ? 'Combined Marksheets' : undefined}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'marksheet'
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                }`}
            >
              <Download className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Combined Marksheets</span>}
            </button>

            <button
              onClick={() => setActiveTab('session-settings')}
              title={sidebarCollapsed ? 'Academic Session Settings' : undefined}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'session-settings'
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                }`}
            >
              <CalendarDays className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Academic Session Settings</span>}
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              title={sidebarCollapsed ? 'Audit Trail' : undefined}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'audit'
                  ? 'bg-secondary/15 text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom'
                }`}
            >
              <History className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>Audit Trail</span>}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              title={sidebarCollapsed ? 'Change Password' : undefined}
              className={`flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'} w-full py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'settings'
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
                  <span className="block text-[10px] text-muted-fg-custom font-semibold uppercase truncate">Super Admin</span>
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

        {/* TOP BAR / PHONE LAYOUT NAV */}
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
              {activeTab === 'overview' && 'Overview Analytics'}
              {activeTab === 'students' && 'Student Records CRUD'}
              {activeTab === 'subjects' && 'Academic Subjects'}
              {activeTab === 'tokens' && 'Result Checker Tokens'}
              {activeTab === 'backups' && 'Database Backup Control'}
              {activeTab === 'marksheet' && 'Combined Marksheet Control'}
              {activeTab === 'session-settings' && 'Academic Session & Resumption Settings'}
              {activeTab === 'audit' && 'Security Audit Logs'}
              {activeTab === 'settings' && 'Account Settings'}
            </h2>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <span className="text-[10px] text-muted-fg-custom font-bold uppercase hidden lg:block">
              Academic session: {sessions.find(s => s.active)?.name || 'None Active'}
            </span>
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

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-grow overflow-y-auto p-6 md:p-8 space-y-6">

          {/* OVERVIEW ANALYTICS TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Students Count */}
                <div className="p-6 rounded-2xl bg-card-custom border border-border-custom flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Students</span>
                    <span className="text-2xl font-black text-primary dark:text-white">{students.length}</span>
                  </div>
                </div>

                {/* Subjects Count */}
                <div className="p-6 rounded-2xl bg-card-custom border border-border-custom flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Subjects</span>
                    <span className="text-2xl font-black text-primary dark:text-white">{subjects.length}</span>
                  </div>
                </div>

                {/* Active Tokens */}
                <div className="p-6 rounded-2xl bg-card-custom border border-border-custom flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-accent-light/10 text-accent-light flex items-center justify-center">
                    <Key className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Tokens</span>
                    <span className="text-2xl font-black text-primary dark:text-white">{activeTokensCount}</span>
                  </div>
                </div>

                {/* Consumed Tokens */}
                <div className="p-6 rounded-2xl bg-card-custom border border-border-custom flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Consumed Tokens</span>
                    <span className="text-2xl font-black text-primary dark:text-white">{consumedTokensCount}</span>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Student Enrollment Bar Chart */}
                <div className="lg:col-span-8 p-6 rounded-2xl bg-card-custom border border-border-custom space-y-4">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-primary dark:text-white">Student Enrollment by Class</h3>
                  <div className="h-64 sm:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classBreakdownData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.3} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="Students" fill={schoolConfig.schoolColors.accent} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Token Stats Pie Chart */}
                <div className="lg:col-span-4 p-6 rounded-2xl bg-card-custom border border-border-custom space-y-4 flex flex-col justify-between">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-primary dark:text-white">Token Access Breakdown</h3>

                  <div className="h-44 sm:h-52 w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tokenPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {tokenPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-black text-primary dark:text-white">{tokens.length}</span>
                      <span className="text-[9px] text-slate-500 uppercase font-bold">Total Issued</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-4 border-t border-border-custom text-xs">
                    {tokenPieData.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="font-medium text-slate-500">{entry.name}</span>
                        </div>
                        <span className="font-bold">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STUDENTS MANAGEMENT CRUD TAB */}
          {activeTab === 'students' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card-custom border border-border-custom">
                {/* Search / Filters */}
                <div className="flex flex-col lg:flex-row items-center gap-3 w-full sm:w-auto">
                  {/* Status Toggle Pills */}
                  <div className="flex items-center p-1 rounded-xl bg-muted-custom/60 border border-border-custom text-xs font-bold w-full sm:w-auto justify-center">
                    <button
                      onClick={() => { setStudentStatusFilter('all'); fetchStudents('all'); }}
                      className={`px-3 py-1.5 rounded-lg transition-all ${studentStatusFilter === 'all' ? 'bg-card-custom text-primary dark:text-white shadow-xs' : 'text-muted-fg-custom hover:text-fg-custom'}`}
                    >
                      All Students
                    </button>
                    <button
                      onClick={() => { setStudentStatusFilter('active'); fetchStudents('active'); }}
                      className={`px-3 py-1.5 rounded-lg transition-all ${studentStatusFilter === 'active' ? 'bg-card-custom text-primary dark:text-white shadow-xs' : 'text-muted-fg-custom hover:text-fg-custom'}`}
                    >
                      Active Directory
                    </button>
                    <button
                      onClick={() => { setStudentStatusFilter('graduated'); fetchStudents('graduated'); }}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${studentStatusFilter === 'graduated' ? 'bg-card-custom text-purple-600 dark:text-purple-400 shadow-xs' : 'text-muted-fg-custom hover:text-fg-custom'}`}
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Graduated List</span>
                    </button>
                  </div>

                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search ID, Admission, Name..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-semibold focus:outline-hidden"
                    />
                  </div>

                  <div className="relative w-full sm:w-auto">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={studentClassFilter}
                      onChange={(e) => setStudentClassFilter(e.target.value)}
                      className="w-full sm:w-48 pl-9 pr-8 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold focus:outline-hidden appearance-none"
                    >
                      <option value="">All Classes & Groups</option>
                      <optgroup label="Standard Classes">
                        {classes.filter(c => c.level !== 'GRADUATED' && !c.name.startsWith('Graduating Class')).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </optgroup>
                      {classes.some(c => c.level === 'GRADUATED' || c.name.startsWith('Graduating Class')) && (
                        <optgroup label="Graduated Classes">
                          {classes.filter(c => c.level === 'GRADUATED' || c.name.startsWith('Graduating Class')).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>

                {/* Add CTA */}
                <button
                  onClick={() => { resetStudentForm(); setShowStudentModal(true); }}
                  className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-transparent border border-primary text-primary hover:bg-primary/5 dark:bg-primary dark:text-white dark:border-transparent dark:hover:bg-primary-light font-extrabold text-xs shadow-xs transition-all w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Student</span>
                </button>
              </div>

              {/* Bulk Student Enrollment */}
              <div className="p-4 rounded-2xl bg-card-custom border border-border-custom flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-left w-full sm:w-auto">
                  <h4 className="text-xs font-black uppercase text-primary dark:text-white">Bulk Student Enrollment</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Download spreadsheet template or upload student lists (.csv, .xlsx)</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-muted-custom hover:bg-border-custom text-fg-custom font-extrabold text-xs shadow-xs transition-all w-full sm:w-auto"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Template</span>
                  </button>

                  <label className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-secondary text-white hover:bg-amber-600 font-extrabold text-xs shadow-md cursor-pointer transition-all w-full sm:w-auto">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Bulk Upload Students</span>
                    <input
                      type="file"
                      accept=".csv, .xlsx"
                      className="hidden"
                      onChange={handleBulkUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Bulk Report Card Downloader */}
              <div className="p-4 rounded-2xl bg-card-custom border border-border-custom flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-left w-full sm:w-auto">
                  <h4 className="text-xs font-black uppercase text-primary dark:text-white">Bulk Download Report Cards</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Generate ZIP file of all report cards for the selected class arm</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <select
                    value={bulkClassId}
                    onChange={(e) => setBulkClassId(e.target.value)}
                    className="w-full sm:w-44 px-3 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold focus:outline-hidden"
                  >
                    <option value="">Select Class...</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>

                  <button
                    onClick={handleBulkDownload}
                    disabled={bulkLoading || !bulkClassId}
                    className="flex items-center justify-center space-x-2 px-5 py-2 rounded-xl bg-secondary text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed font-extrabold text-xs shadow-md transition-all w-full sm:w-auto"
                  >
                    {bulkLoading ? (
                      <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>{bulkLoading ? 'Generating ZIP...' : 'Bulk Download'}</span>
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-card-custom border border-border-custom rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-muted-custom/30 text-muted-fg-custom border-b border-border-custom">
                        <th className="p-4 font-bold">Student ID</th>
                        <th className="p-4 font-bold">Admission No</th>
                        <th className="p-4 font-bold">Full Name</th>
                        <th className="p-4 font-bold">Gender</th>
                        <th className="p-4 font-bold">Class arm</th>
                        <th className="p-4 font-bold">Parent Name</th>
                        <th className="p-4 font-bold">Parent Phone</th>
                        <th className="p-4 font-bold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom">
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                            No student records found matching the search criteria.
                          </td>
                        </tr>
                      ) : (
                        students.map((student) => (
                          <tr key={student.id} className="hover:bg-muted-custom/10 transition-colors">
                            <td className="p-4 font-bold font-mono select-all text-primary dark:text-white" title="Click or double-click to select">{student.id}</td>
                            <td className="p-4 font-semibold font-mono select-all text-slate-500" title="Admission Number">{student.admissionNumber}</td>
                            <td className="p-4 font-black uppercase text-primary dark:text-slate-300">{student.fullName}</td>
                            <td className="p-4 font-semibold">{student.gender}</td>
                            <td className="p-4 font-semibold">
                              {student.class?.level === 'GRADUATED' || student.class?.name.startsWith('Graduating Class') ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                                  <GraduationCap className="w-3.5 h-3.5" />
                                  <span>{student.class?.name}</span>
                                </span>
                              ) : (
                                <span className="font-extrabold text-secondary">{student.class?.name}</span>
                              )}
                            </td>
                            <td className="p-4 font-medium">{student.parentName}</td>
                            <td className="p-4 font-medium text-slate-500">{student.parentPhone}</td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <a
                                  href={`/api/results/pdf?studentId=${student.id}${
                                    student.sessionId || (sessions.find(s => s.active)?.id || sessions[0]?.id)
                                      ? `&sessionId=${student.sessionId || (sessions.find(s => s.active)?.id || sessions[0]?.id)}`
                                      : ''
                                  }${
                                    (terms.find(t => t.active)?.id || terms[0]?.id)
                                      ? `&termId=${terms.find(t => t.active)?.id || terms[0]?.id}`
                                      : ''
                                  }`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-500 inline-flex items-center justify-center transition-colors"
                                  title="Download Report Card (PDF)"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => editStudent(student)}
                                  className="p-1.5 rounded-lg hover:bg-primary/10 text-accent-light"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteStudent(student.id)}
                                  className="p-1.5 rounded-lg hover:bg-danger/10 text-danger"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
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

          {/* SUBJECTS MANAGEMENT TAB */}
          {activeTab === 'subjects' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Header */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-card-custom border border-border-custom">
                <span className="text-xs text-muted-fg-custom font-semibold">Define or remove curriculum subjects dynamically.</span>

                <button
                  onClick={() => { setSubjectForm({ id: '', name: '', description: '' }); setIsEditingSubject(false); setShowSubjectModal(true); }}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-transparent border border-primary text-primary hover:bg-primary/5 dark:bg-primary dark:text-white dark:border-transparent dark:hover:bg-primary-light font-extrabold text-xs shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Subject</span>
                </button>
              </div>

              {/* Grid of subjects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjects.map((subj) => (
                  <div key={subj.id} className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-xs space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center font-bold">
                        <BookOpen className="w-5 h-5 text-accent-light" />
                      </div>
                      <h3 className="font-extrabold text-base text-primary dark:text-white leading-tight">{subj.name}</h3>
                      <p className="text-xs text-muted-fg-custom leading-normal">{subj.description || 'No description provided.'}</p>
                    </div>

                    <div className="pt-4 border-t border-border-custom flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setIsEditingSubject(true);
                          setSubjectForm({ id: subj.id, name: subj.name, description: subj.description || '' });
                          setShowSubjectModal(true);
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg hover:bg-primary/10 text-accent-light text-xs font-bold transition-all"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => deleteSubject(subj.id)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg hover:bg-danger/10 text-danger text-xs font-bold transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TOKEN MANAGEMENT TAB */}
          {activeTab === 'tokens' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Header tool bar */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-card-custom border border-border-custom">
                <span className="text-xs text-muted-fg-custom font-semibold">Tokens restrict access to result checks. Maximum usage limit is 3.</span>

                <button
                  onClick={() => setShowTokenModal(true)}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-transparent border border-primary text-primary hover:bg-primary/5 dark:bg-primary dark:text-white dark:border-transparent dark:hover:bg-primary-light font-extrabold text-xs shadow-xs transition-all"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Generate Tokens</span>
                </button>
              </div>

              {/* Tokens Table */}
              <div className="bg-card-custom border border-border-custom rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-muted-custom/30 text-muted-fg-custom border-b border-border-custom">
                        <th className="p-4 font-bold">Token Code</th>
                        <th className="p-4 font-bold">Assigned Student</th>
                        <th className="p-4 font-bold">Class</th>
                        <th className="p-4 font-bold">Max Uses</th>
                        <th className="p-4 font-bold">Used Count</th>
                        <th className="p-4 font-bold">Status</th>
                        <th className="p-4 font-bold">Expiry Date</th>
                        <th className="p-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom">
                      {tokens.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                            No tokens generated yet. Click Generate Tokens above.
                          </td>
                        </tr>
                      ) : (
                        tokens.map((token) => {
                          const isExpired = token.status === 'Expired';
                          const isConsumed = token.status === 'Consumed';
                          const isActive = token.status === 'Active';

                          let statusBg = 'bg-muted-custom text-muted-fg-custom';
                          if (isActive) statusBg = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
                          else if (isConsumed) statusBg = 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
                          else if (isExpired) statusBg = 'bg-danger/15 text-danger';

                          return (
                            <tr key={token.id} className="hover:bg-muted-custom/10 transition-colors">
                              <td className="p-4 font-black tracking-wider text-primary dark:text-secondary">{token.tokenString}</td>
                              <td className="p-4 font-extrabold uppercase text-primary dark:text-slate-300">{token.student?.fullName}</td>
                              <td className="p-4 font-semibold text-slate-400">{token.student?.class?.name}</td>
                              <td className="p-4 font-semibold text-center">{token.maxUsage}</td>
                              <td className="p-4 font-bold text-center">{token.usageCount}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${statusBg}`}>
                                  {token.status}
                                </span>
                              </td>
                              <td className="p-4 font-semibold text-slate-400">
                                {new Date(token.expiresAt).toLocaleDateString()}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center space-x-1.5 justify-end">
                                  <button
                                    onClick={() => deleteToken(token.id)}
                                    className="p-1.5 rounded-lg hover:bg-danger/10 text-danger"
                                    title="Delete Token"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
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

          {/* BACKUPS TAB */}
          {activeTab === 'backups' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Actions Header */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-card-custom border border-border-custom">
                <span className="text-xs text-muted-fg-custom font-semibold">Store system copies. Backups copy SQLite database file. Restoring will overwrite existing records.</span>

                <button
                  onClick={triggerManualBackup}
                  disabled={loading}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-transparent border border-primary text-primary hover:bg-primary/5 dark:bg-primary dark:text-white dark:border-transparent dark:hover:bg-primary-light font-extrabold text-xs shadow-xs transition-all disabled:opacity-50"
                >
                  <Database className="w-4 h-4" />
                  <span>Run Manual Backup</span>
                </button>
              </div>

              {/* Backups List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {backups.length === 0 ? (
                  <div className="md:col-span-2 p-8 text-center border border-dashed border-border-custom rounded-2xl text-slate-400 font-bold">
                    No backup files found on the system. Click Run Manual Backup.
                  </div>
                ) : (
                  backups.map((bk) => (
                    <div key={bk.id} className="p-6 rounded-2xl bg-card-custom border border-border-custom shadow-xs space-y-4 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary dark:text-secondary font-bold text-[9px] uppercase">
                            {bk.backupType}
                          </span>
                          <span className={`text-[10px] font-bold ${bk.status === 'Success' ? 'text-emerald-500' : 'text-danger'
                            }`}>
                            {bk.status}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-primary dark:text-white truncate" title={bk.fileName}>
                          {bk.fileName}
                        </h4>
                        <div className="flex justify-between text-xs text-slate-400">
                          <span>Size: {bk.fileSize}</span>
                          <span>{new Date(bk.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border-custom flex items-center justify-end space-x-2">
                        <button
                          onClick={() => triggerRestore(bk.fileName)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-secondary/15 hover:bg-secondary/25 text-secondary text-xs font-bold transition-all"
                        >
                          <RefreshCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => deleteBackup(bk.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg hover:bg-danger/10 text-danger text-xs font-bold transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* AUDIT TRAIL TAB */}
          {activeTab === 'audit' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Filters toolbar */}
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-card-custom border border-border-custom">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search logs details..."
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-semibold focus:outline-hidden"
                  />
                </div>

                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="w-full sm:w-44 px-4 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold focus:outline-hidden"
                >
                  <option value="">All Event Actions</option>
                  <option value="Login">Logins</option>
                  <option value="Logout">Logouts</option>
                  <option value="Student Created">Student Creations</option>
                  <option value="Student Updated">Student Updates</option>
                  <option value="Student Deleted">Student Deletions</option>
                  <option value="Payment Logged">Payment Logs</option>
                  <option value="Google Sheet Sync">Google Sheet Syncs</option>
                  <option value="Backup Created">Backup Creations</option>
                  <option value="Backup Restored">Database Restores</option>
                </select>
              </div>

              {/* Logs Table */}
              <div className="bg-card-custom border border-border-custom rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-muted-custom/30 text-muted-fg-custom border-b border-border-custom">
                        <th className="p-4 font-bold">Timestamp</th>
                        <th className="p-4 font-bold">Action Event</th>
                        <th className="p-4 font-bold">Staff User</th>
                        <th className="p-4 font-bold">Activity Description</th>
                        <th className="p-4 font-bold">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom">
                      {auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                            No logs registered on the audit ledger.
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-muted-custom/10 transition-colors">
                            <td className="p-4 font-semibold text-slate-400">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <span className="font-extrabold text-primary dark:text-white bg-primary/5 px-2 py-1 rounded-lg">
                                {log.action}
                              </span>
                            </td>
                            <td className="p-4 font-bold text-secondary">
                              {log.user ? log.user.fullName : 'System'}
                            </td>
                            <td className="p-4 font-medium text-slate-600 dark:text-slate-300 max-w-sm truncate" title={log.details}>
                              {log.details}
                            </td>
                            <td className="p-4 font-mono text-slate-400">{log.ipAddress}</td>
                          </tr>
                        ))
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

          {/* COMBINED MARKSHEET TAB */}
          {activeTab === 'marksheet' && (() => {
            const classCategories = Array.from(
              new Set(
                classes.map((c: any) => {
                  const match = c.name.trim().match(/^(JSS\d|SSS\d)/i);
                  return match ? match[1].toUpperCase() : c.name.trim();
                })
              )
            ).sort() as string[];

            return (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="p-6 rounded-3xl bg-card-custom border border-border-custom shadow-sm space-y-6">
                  <div>
                    <h3 className="text-base font-black text-primary dark:text-white uppercase">Export & Sync Combined Marksheets</h3>
                    <p className="text-[11px] text-slate-400 font-bold uppercase mt-1">
                      Select a class category to download a consolidated marksheet or sync changes back.
                    </p>
                  </div>

                  {marksheetSuccess && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{marksheetSuccess}</span>
                    </div>
                  )}

                  {marksheetError && (
                    <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-xs font-bold">
                      <span>{marksheetError}</span>
                    </div>
                  )}

                  {marksheetUploadErrors.length > 0 && (
                    <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-xs font-bold space-y-1">
                      <p className="font-extrabold uppercase">Upload failed with the following validation errors:</p>
                      <ul className="list-disc pl-4 space-y-0.5 max-h-48 overflow-y-auto font-mono text-[10px]">
                        {marksheetUploadErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Class Category Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Class Category *</label>
                      <select
                        value={selectedClassCategory}
                        onChange={(e) => setSelectedClassCategory(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-border-custom bg-muted-custom/30 text-fg-custom font-extrabold text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      >
                        <option value="">Select Category</option>
                        {(classCategories.length > 0 ? classCategories : ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3']).map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Term Override */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Academic Term</label>
                      <select
                        value={selectedMarksheetTermId}
                        onChange={(e) => setSelectedMarksheetTermId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-border-custom bg-muted-custom/30 text-fg-custom font-extrabold text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      >
                        {terms.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} {t.active ? '(Active)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Session Override */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">Academic Session</label>
                      <select
                        value={selectedMarksheetSessionId}
                        onChange={(e) => setSelectedMarksheetSessionId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-border-custom bg-muted-custom/30 text-fg-custom font-extrabold text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      >
                        {sessions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.active ? '(Active)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                    <button
                      onClick={handleDownloadCombinedMarksheet}
                      disabled={marksheetLoading}
                      className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-transparent border border-primary text-primary hover:bg-primary/5 dark:bg-primary dark:text-white dark:border-transparent dark:hover:bg-primary-light font-extrabold text-xs shadow-xs transition-all w-full sm:w-auto disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>{marksheetLoading ? 'Generating Sheet...' : 'Download Combined Marksheet'}</span>
                    </button>

                    <label className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-secondary text-white hover:bg-amber-600 font-extrabold text-xs shadow-md cursor-pointer transition-all w-full sm:w-auto disabled:opacity-50">
                      <Plus className="w-4 h-4" />
                      <span>Upload Updated Marksheet</span>
                      <input
                        type="file"
                        accept=".xlsx"
                        className="hidden"
                        disabled={marksheetLoading}
                        onChange={handleUploadCombinedMarksheet}
                      />
                    </label>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ACADEMIC SESSION SETTINGS TAB */}
          {activeTab === 'session-settings' && (() => {
            const activeSession = sessions.find((s: any) => s.active);
            const activeTerm = terms.find((t: any) => t.active);
            const activeTermResumption = activeTerm?.resumptionDate 
              ? new Date(activeTerm.resumptionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
              : 'Not set yet';

            const sourceSessObj = sessions.find((s: any) => s.id === migrateSourceSessionId) || activeSession || sessions[0];
            const targetSessObj = sessions.find((s: any) => s.id === migrateTargetSessionId);

            // Calculate student cohort counts in the selected source session
            const sourceStudents = students.filter((st: any) => st.sessionId === sourceSessObj?.id);
            const jss1Count = sourceStudents.filter((st: any) => st.class?.name === 'JSS1').length;
            const jss2Count = sourceStudents.filter((st: any) => st.class?.name === 'JSS2').length;
            const jss3Count = sourceStudents.filter((st: any) => st.class?.name === 'JSS3').length;
            const sss1Count = sourceStudents.filter((st: any) => st.class?.name === 'SSS1').length;
            const sss2Count = sourceStudents.filter((st: any) => st.class?.name === 'SSS2').length;
            const sss3Count = sourceStudents.filter((st: any) => st.class?.name === 'SSS3').length;
            const totalToMigrate = jss1Count + jss2Count + jss3Count + sss1Count + sss2Count + sss3Count;

            return (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* Top Status & Overview Banner */}
                <div className="p-6 rounded-3xl bg-gradient-to-r from-primary/10 via-card-custom to-secondary/10 border border-border-custom shadow-xs space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <CalendarDays className="w-5 h-5 text-secondary" />
                        <h3 className="text-lg font-black text-primary dark:text-white uppercase tracking-wider">
                          Academic Session & Resumption Control
                        </h3>
                      </div>
                      <p className="text-xs text-muted-fg-custom font-medium max-w-2xl">
                        Manage academic calendar sessions, activate school terms, set official resumption dates, and automatically advance students cohorts through graduation.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Active Session Pill */}
                      <div className="px-4 py-2 rounded-2xl bg-card-custom border border-border-custom shadow-xs flex items-center space-x-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <div className="text-left">
                          <span className="block text-[9px] uppercase font-extrabold text-slate-400">Current Session</span>
                          <span className="block text-xs font-black text-primary dark:text-white">
                            {activeSession ? activeSession.name : 'No Active Session'}
                          </span>
                        </div>
                      </div>

                      {/* Active Term Pill */}
                      <div className="px-4 py-2 rounded-2xl bg-card-custom border border-border-custom shadow-xs flex items-center space-x-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
                        <div className="text-left">
                          <span className="block text-[9px] uppercase font-extrabold text-slate-400">Current Term</span>
                          <span className="block text-xs font-black text-secondary">
                            {activeTerm ? activeTerm.name : 'No Active Term'}
                          </span>
                        </div>
                      </div>

                      {/* Resumption Pill */}
                      <div className="px-4 py-2 rounded-2xl bg-card-custom border border-border-custom shadow-xs flex items-center space-x-2.5">
                        <Clock className="w-4 h-4 text-accent-light" />
                        <div className="text-left">
                          <span className="block text-[9px] uppercase font-extrabold text-slate-400">Next Resumption</span>
                          <span className="block text-xs font-bold text-fg-custom">{activeTermResumption}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notifications & Feedback Alerts */}
                {sessionActionMsg && (
                  <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs ${
                    sessionActionMsg.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/25'
                      : 'bg-danger/10 text-danger border border-danger/25'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {sessionActionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      <span>{sessionActionMsg.text}</span>
                    </div>
                    <button onClick={() => setSessionActionMsg(null)} className="p-1 hover:opacity-75">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {resumptionMsg && (
                  <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xs ${
                    resumptionMsg.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/25'
                      : 'bg-danger/10 text-danger border border-danger/25'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {resumptionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      <span>{resumptionMsg.text}</span>
                    </div>
                    <button onClick={() => setResumptionMsg(null)} className="p-1 hover:opacity-75">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {migrateResult && (
                  <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-fg-custom space-y-4 shadow-sm animate-in fade-in duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                          <GraduationCap className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase">
                            Academic Migration Executed Successfully!
                          </h4>
                          <p className="text-xs text-muted-fg-custom font-medium">
                            Directory migrated from <strong>{migrateResult.sourceSession?.name}</strong> to <strong>{migrateResult.targetSession?.name}</strong>.
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setMigrateResult(null)} className="p-1 text-muted-fg-custom hover:text-fg-custom">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div className="p-4 rounded-2xl bg-card-custom border border-border-custom text-center">
                        <span className="block text-[10px] text-slate-400 uppercase font-extrabold">Total Processed</span>
                        <span className="text-2xl font-black text-primary dark:text-white">{migrateResult.totalMigrated}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-card-custom border border-border-custom text-center">
                        <span className="block text-[10px] text-emerald-500 uppercase font-extrabold">Promoted Classes</span>
                        <span className="text-2xl font-black text-emerald-600">{migrateResult.totalPromoted}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-card-custom border border-border-custom text-center">
                        <span className="block text-[10px] text-purple-500 uppercase font-extrabold">Graduated into Alumni</span>
                        <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{migrateResult.totalGraduated}</span>
                      </div>
                    </div>

                    {/* Breakdown table */}
                    <div className="rounded-2xl border border-border-custom overflow-hidden bg-card-custom">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted-custom/40 border-b border-border-custom font-bold text-muted-fg-custom">
                          <tr>
                            <th className="p-3">Previous Class</th>
                            <th className="p-3">Destination Category</th>
                            <th className="p-3 text-right">Students Promoted</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-custom font-semibold">
                          {migrateResult.breakdown?.map((b: any, idx: number) => (
                            <tr key={idx} className="hover:bg-muted-custom/10">
                              <td className="p-3 font-bold text-primary dark:text-white">{b.from}</td>
                              <td className="p-3 text-secondary">{b.to}</td>
                              <td className="p-3 text-right font-black">{b.count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => {
                          setStudentStatusFilter('graduated');
                          setActiveTab('students');
                        }}
                        className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 font-extrabold text-xs shadow-md transition-all cursor-pointer"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>View Graduated List in Directory</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2-Column Grid: Sessions Management & Term Resumption */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left: Academic Sessions Card (7 Cols) */}
                  <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-card-custom border border-border-custom shadow-xs space-y-6">
                    <div className="flex items-center justify-between border-b border-border-custom pb-4">
                      <div>
                        <h4 className="text-sm font-black uppercase text-primary dark:text-white flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-secondary" />
                          <span>Academic Sessions Directory</span>
                        </h4>
                        <p className="text-[11px] text-muted-fg-custom font-medium mt-0.5">
                          Create session years and activate the current school academic year.
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-muted-custom text-fg-custom border border-border-custom">
                        {sessions.length} Sessions Registered
                      </span>
                    </div>

                    {/* Create New Session Form */}
                    <form onSubmit={handleCreateSession} className="p-4 rounded-2xl bg-muted-custom/30 border border-border-custom space-y-4">
                      <span className="block text-xs font-black uppercase text-primary dark:text-white">
                        Create New Academic Session
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-7">
                          <input
                            type="text"
                            required
                            placeholder="e.g. 2026/2027 or 2027/2028"
                            value={newSessionName}
                            onChange={(e) => setNewSessionName(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                        <div className="sm:col-span-5 flex items-center space-x-2">
                          <button
                            type="submit"
                            disabled={sessionActionLoading || !newSessionName.trim()}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-light disabled:opacity-50 font-extrabold text-xs shadow-md transition-all cursor-pointer"
                          >
                            {sessionActionLoading ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            <span>Add Session</span>
                          </button>
                        </div>
                      </div>
                      <label className="flex items-center space-x-2 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={newSessionActive}
                          onChange={(e) => setNewSessionActive(e.target.checked)}
                          className="w-4 h-4 rounded text-secondary focus:ring-secondary/30 accent-secondary"
                        />
                        <span className="text-[11px] font-bold text-muted-fg-custom">
                          Immediately set this new session as the current active session
                        </span>
                      </label>
                    </form>

                    {/* Sessions List */}
                    <div className="rounded-2xl border border-border-custom overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-muted-custom/40 border-b border-border-custom font-bold text-muted-fg-custom">
                          <tr>
                            <th className="p-3.5">Session Name</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5">Enrolled</th>
                            <th className="p-3.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-custom">
                          {sessions.map((sess: any) => {
                            const count = students.filter((s: any) => s.sessionId === sess.id).length;
                            return (
                              <tr key={sess.id} className="hover:bg-muted-custom/10 transition-colors">
                                <td className="p-3.5 font-extrabold text-primary dark:text-white">
                                  {sess.name}
                                </td>
                                <td className="p-3.5">
                                  {sess.active ? (
                                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      <span>ACTIVE</span>
                                    </span>
                                  ) : (
                                    <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-muted-custom text-muted-fg-custom">
                                      Inactive
                                    </span>
                                  )}
                                </td>
                                <td className="p-3.5 font-semibold text-slate-400">
                                  {count} students
                                </td>
                                <td className="p-3.5 text-right">
                                  {sess.active ? (
                                    <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end space-x-1">
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Current Active</span>
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleActivateSession(sess.id)}
                                      disabled={sessionActionLoading}
                                      className="px-3 py-1.5 rounded-xl border border-secondary/40 text-secondary hover:bg-secondary hover:text-white font-extrabold text-[11px] transition-all cursor-pointer shadow-2xs"
                                    >
                                      Activate Session
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right: Term Resumption Settings Card (5 Cols) */}
                  <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-card-custom border border-border-custom shadow-xs space-y-6 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b border-border-custom pb-4">
                        <div>
                          <h4 className="text-sm font-black uppercase text-primary dark:text-white flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-secondary" />
                            <span>Term Resumption Settings</span>
                          </h4>
                          <p className="text-[11px] text-muted-fg-custom font-medium mt-0.5">
                            Set resumption dates and activate current academic term.
                          </p>
                        </div>
                      </div>

                      {/* Term Items */}
                      <div className="space-y-4">
                        {terms.map((term: any) => {
                          const dateVal = resumptionDates[term.id] || '';
                          return (
                            <div
                              key={term.id}
                              className={`p-4 rounded-2xl border transition-all ${
                                term.active
                                  ? 'bg-secondary/5 border-secondary/30 ring-1 ring-secondary/20 shadow-xs'
                                  : 'bg-card-custom border-border-custom'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-2">
                                  <span className="font-black text-xs text-primary dark:text-white">{term.name}</span>
                                  {term.active && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-secondary text-white">
                                      ACTIVE
                                    </span>
                                  )}
                                </div>
                                {!term.active && (
                                  <button
                                    onClick={() => handleActivateTerm(term.id)}
                                    disabled={resumptionSaving}
                                    className="text-[10px] font-extrabold text-secondary hover:underline cursor-pointer"
                                  >
                                    Set as Active Term
                                  </button>
                                )}
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-extrabold uppercase text-slate-400">
                                  Resumption Date
                                </label>
                                <input
                                  type="date"
                                  value={dateVal}
                                  onChange={(e) =>
                                    setResumptionDates({
                                      ...resumptionDates,
                                      [term.id]: e.target.value,
                                    })
                                  }
                                  className="w-full px-3 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary/30"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Save Resumption Button */}
                    <div className="pt-4 border-t border-border-custom">
                      <button
                        onClick={handleSaveResumptionDates}
                        disabled={resumptionSaving}
                        className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-secondary text-white hover:bg-amber-600 disabled:opacity-50 font-extrabold text-xs shadow-md transition-all cursor-pointer"
                      >
                        {resumptionSaving ? (
                          <RefreshCcw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>Save Term Resumption Dates</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Card 3: Student Directory Migration Station */}
                <div className="p-6 sm:p-8 rounded-3xl bg-card-custom border border-border-custom shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-custom pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-5 h-5 text-secondary" />
                        <h4 className="text-base font-black uppercase text-primary dark:text-white tracking-wide">
                          Student Directory Migration & Promotion
                        </h4>
                      </div>
                      <p className="text-xs text-muted-fg-custom font-medium max-w-3xl">
                        Promote students from their current class to the next class cohort for a new academic session. Final-year classes (SSS3) will automatically graduate into their dedicated alumni category: <strong>Graduating Class of [Session]</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Progression Path Infographic */}
                  <div className="p-4 rounded-2xl bg-muted-custom/40 border border-border-custom overflow-x-auto">
                    <span className="block text-[10px] font-extrabold uppercase text-slate-400 mb-2">Cohort Progression Pipeline</span>
                    <div className="flex items-center space-x-2 min-w-[700px] text-xs font-bold">
                      <span className="px-3 py-1.5 rounded-xl bg-card-custom border border-border-custom text-primary dark:text-white">JSS1</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span className="px-3 py-1.5 rounded-xl bg-card-custom border border-border-custom text-primary dark:text-white">JSS2</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span className="px-3 py-1.5 rounded-xl bg-card-custom border border-border-custom text-primary dark:text-white">JSS3</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span className="px-3 py-1.5 rounded-xl bg-card-custom border border-border-custom text-primary dark:text-white">SSS1</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span className="px-3 py-1.5 rounded-xl bg-card-custom border border-border-custom text-primary dark:text-white">SSS2</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span className="px-3 py-1.5 rounded-xl bg-card-custom border border-border-custom text-primary dark:text-white">SSS3</span>
                      <ArrowRight className="w-4 h-4 text-purple-500" />
                      <span className="px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center space-x-1.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Graduating Class of {sourceSessObj?.name || 'Year'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Migration Selector Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">
                        Source Academic Session (Current) *
                      </label>
                      <select
                        value={migrateSourceSessionId}
                        onChange={(e) => setMigrateSourceSessionId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-border-custom bg-muted-custom/30 text-fg-custom font-extrabold text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      >
                        {sessions.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.active ? '(Active Session)' : ''}
                          </option>
                        ))}
                      </select>
                      <span className="text-[10px] text-muted-fg-custom font-medium block">
                        Students in this session will be advanced to their next class cohort.
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400 uppercase">
                        Target Academic Session (Next Year) *
                      </label>
                      <select
                        value={migrateTargetSessionId}
                        onChange={(e) => setMigrateTargetSessionId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-border-custom bg-muted-custom/30 text-fg-custom font-extrabold text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      >
                        <option value="">Select Destination Session...</option>
                        {sessions
                          .filter((s: any) => s.id !== migrateSourceSessionId)
                          .map((s: any) => (
                            <option key={s.id} value={s.id}>
                              {s.name} {s.active ? '(Active Session)' : ''}
                            </option>
                          ))}
                      </select>
                      <span className="text-[10px] text-muted-fg-custom font-medium block">
                        Promoted students will reflect in this destination academic session.
                      </span>
                    </div>
                  </div>

                  {/* Live Cohort Breakdown Preview */}
                  <div className="space-y-2">
                    <span className="text-xs font-black uppercase text-primary dark:text-white block">
                      Source Cohort Breakdown Preview ({sourceSessObj?.name || ''})
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="p-3 rounded-xl bg-muted-custom/30 border border-border-custom text-center">
                        <span className="block text-[10px] font-extrabold text-slate-400">JSS1 ➜ JSS2</span>
                        <span className="text-lg font-black text-primary dark:text-white">{jss1Count}</span>
                        <span className="text-[9px] text-muted-fg-custom block">students</span>
                      </div>
                      <div className="p-3 rounded-xl bg-muted-custom/30 border border-border-custom text-center">
                        <span className="block text-[10px] font-extrabold text-slate-400">JSS2 ➜ JSS3</span>
                        <span className="text-lg font-black text-primary dark:text-white">{jss2Count}</span>
                        <span className="text-[9px] text-muted-fg-custom block">students</span>
                      </div>
                      <div className="p-3 rounded-xl bg-muted-custom/30 border border-border-custom text-center">
                        <span className="block text-[10px] font-extrabold text-slate-400">JSS3 ➜ SSS1</span>
                        <span className="text-lg font-black text-primary dark:text-white">{jss3Count}</span>
                        <span className="text-[9px] text-muted-fg-custom block">students</span>
                      </div>
                      <div className="p-3 rounded-xl bg-muted-custom/30 border border-border-custom text-center">
                        <span className="block text-[10px] font-extrabold text-slate-400">SSS1 ➜ SSS2</span>
                        <span className="text-lg font-black text-primary dark:text-white">{sss1Count}</span>
                        <span className="text-[9px] text-muted-fg-custom block">students</span>
                      </div>
                      <div className="p-3 rounded-xl bg-muted-custom/30 border border-border-custom text-center">
                        <span className="block text-[10px] font-extrabold text-slate-400">SSS2 ➜ SSS3</span>
                        <span className="text-lg font-black text-primary dark:text-white">{sss2Count}</span>
                        <span className="text-[9px] text-muted-fg-custom block">students</span>
                      </div>
                      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                        <span className="block text-[10px] font-extrabold text-purple-600 dark:text-purple-400">SSS3 ➜ Graduating</span>
                        <span className="text-lg font-black text-purple-600 dark:text-purple-400">{sss3Count}</span>
                        <span className="text-[9px] text-purple-500/80 block">graduating</span>
                      </div>
                    </div>
                  </div>

                  {/* Activate Target Toggle */}
                  <div className="flex items-center space-x-3 pt-2">
                    <input
                      type="checkbox"
                      id="activateTarget"
                      checked={migrateActivateTarget}
                      onChange={(e) => setMigrateActivateTarget(e.target.checked)}
                      className="w-4 h-4 rounded text-secondary focus:ring-secondary/30 accent-secondary cursor-pointer"
                    />
                    <label htmlFor="activateTarget" className="text-xs font-bold text-fg-custom cursor-pointer">
                      Automatically activate the target session (<strong>{targetSessObj?.name || 'Selected'}</strong>) as the current system active session upon migration
                    </label>
                  </div>

                  {/* Migration CTA */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-custom">
                    <div className="text-xs text-muted-fg-custom">
                      Ready to advance <strong>{totalToMigrate}</strong> eligible students into the next academic classes.
                    </div>
                    <button
                      onClick={() => {
                        if (!migrateSourceSessionId || !migrateTargetSessionId) {
                          setMigrateError('Please select both source session and target session.');
                          return;
                        }
                        setMigrateError(null);
                        setMigrateConfirmModal(true);
                      }}
                      disabled={migrateLoading || !migrateTargetSessionId || totalToMigrate === 0}
                      className="flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-secondary text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed font-extrabold text-xs shadow-md transition-all cursor-pointer w-full sm:w-auto"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Start Directory Migration</span>
                    </button>
                  </div>

                  {migrateError && (
                    <div className="p-4 rounded-2xl bg-danger/10 border border-danger/25 text-danger text-xs font-bold flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{migrateError}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

        </div>
      </main>

      {/* STUDENT REGISTRATION DIALOG MODAL */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-card-custom border border-border-custom rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-xl font-black text-primary dark:text-white">
              {isEditingStudent ? 'Update Student Record' : 'Register New Student'}
            </h3>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-danger/10 text-danger text-xs font-semibold text-center border border-danger/25">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Admission Number *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.admissionNumber}
                    onChange={(e) => setStudentForm({ ...studentForm, admissionNumber: e.target.value.trim() })}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm focus:outline-hidden focus:ring-2 focus:ring-ring-custom"
                    placeholder="e.g. SGGS/2026/1023"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={studentForm.fullName}
                    onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm focus:outline-hidden focus:ring-2 focus:ring-ring-custom"
                    placeholder="e.g. Olusola Adeoye"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Gender *</label>
                  <select
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm focus:outline-hidden"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={studentForm.dateOfBirth}
                    onChange={(e) => setStudentForm({ ...studentForm, dateOfBirth: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Class Arm *</label>
                  <select
                    value={studentForm.classId}
                    onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm focus:outline-hidden"
                  >
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={studentForm.parentName}
                    onChange={(e) => setStudentForm({ ...studentForm, parentName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm focus:outline-hidden"
                    placeholder="e.g. Robert Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Parent Phone Number</label>
                  <input
                    type="text"
                    value={studentForm.parentPhone}
                    onChange={(e) => setStudentForm({ ...studentForm, parentPhone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm focus:outline-hidden"
                    placeholder="e.g. +234 803..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Parent Email Address</label>
                <input
                  type="email"
                  value={studentForm.parentEmail}
                  onChange={(e) => setStudentForm({ ...studentForm, parentEmail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm focus:outline-hidden"
                  placeholder="parent@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Home Address</label>
                <input
                  type="text"
                  value={studentForm.address}
                  onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm focus:outline-hidden"
                  placeholder="e.g. 12, Success Close"
                />
              </div>

              <div className="pt-4 border-t border-border-custom flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-muted-custom hover:bg-border-custom text-fg-custom font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-transparent border border-primary text-primary hover:bg-primary/5 dark:bg-primary dark:text-white dark:border-transparent dark:hover:bg-primary-light font-extrabold text-xs shadow-xs transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>{isEditingStudent ? 'Save Changes' : 'Register Student'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBJECTS MODAL */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card-custom border border-border-custom rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-xl font-black text-primary dark:text-white">
              {isEditingSubject ? 'Edit Subject' : 'Create New Subject'}
            </h3>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-danger/10 text-danger text-xs font-semibold text-center border border-danger/25">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubjectSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm focus:outline-hidden"
                  placeholder="e.g. Mathematics"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Description</label>
                <textarea
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm focus:outline-hidden resize-none"
                  placeholder="Write a brief overview..."
                />
              </div>

              <div className="pt-4 border-t border-border-custom flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-muted-custom hover:bg-border-custom text-fg-custom font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-transparent border border-primary text-primary hover:bg-primary/5 dark:bg-primary dark:text-white dark:border-transparent dark:hover:bg-primary-light font-extrabold text-xs shadow-xs transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Subject</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOKENS GENERATOR MODAL */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card-custom border border-border-custom rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-xl font-black text-primary dark:text-white">Generate Access Tokens</h3>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-danger/10 text-danger text-xs font-semibold text-center border border-danger/25">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleGenerateTokens} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Generation Scope</label>
                <div className="grid grid-cols-2 gap-2 bg-bg-custom p-1 rounded-xl border border-border-custom">
                  <button
                    type="button"
                    onClick={() => setTokenForm({ ...tokenForm, mode: 'single' })}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${tokenForm.mode === 'single'
                        ? 'bg-transparent border border-primary text-primary hover:bg-primary/5 dark:bg-primary dark:text-white dark:border-transparent'
                        : 'text-muted-fg-custom hover:text-fg-custom border border-transparent'
                      }`}
                  >
                    Single Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setTokenForm({ ...tokenForm, mode: 'bulk' })}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${tokenForm.mode === 'bulk'
                        ? 'bg-transparent border border-primary text-primary hover:bg-primary/5 dark:bg-primary dark:text-white dark:border-transparent'
                        : 'text-muted-fg-custom hover:text-fg-custom border border-transparent'
                      }`}
                  >
                    Bulk Class Arm
                  </button>
                </div>
              </div>

              {tokenForm.mode === 'single' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Target Student *</label>
                  <select
                    value={tokenForm.studentId}
                    onChange={(e) => setTokenForm({ ...tokenForm, studentId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm focus:outline-hidden"
                  >
                    <option value="">Select Student</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.id} - {s.fullName.toUpperCase()}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Target Class arm *</label>
                  <select
                    value={tokenForm.classId}
                    onChange={(e) => setTokenForm({ ...tokenForm, classId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm focus:outline-hidden"
                  >
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <span className="block text-[10px] text-slate-500 italic">Generates exactly 1 result checker token for every student registered in this class arm.</span>
                </div>
              )}

              {tokenForm.mode === 'single' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">Quantity of tokens</label>
                  <select
                    value={tokenForm.quantity}
                    onChange={(e) => setTokenForm({ ...tokenForm, quantity: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm focus:outline-hidden"
                  >
                    <option value={1}>1 Token</option>
                    <option value={5}>5 Tokens</option>
                    <option value={10}>10 Tokens</option>
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-border-custom flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowTokenModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-muted-custom hover:bg-border-custom text-fg-custom font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (tokenForm.mode === 'single' && !tokenForm.studentId)}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-transparent border border-primary text-primary hover:bg-primary/5 dark:bg-primary dark:text-white dark:border-transparent dark:hover:bg-primary-light font-extrabold text-xs shadow-xs transition-all disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Generate Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK UPLOAD RESULT MODAL */}
      {bulkUploadResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card-custom border border-border-custom rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-xl font-black text-primary dark:text-white flex items-center gap-2">
              {bulkUploadResult.success ? (
                <>
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  <span>Bulk Upload Successful</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-6 h-6 text-danger" />
                  <span>Bulk Upload Validation Errors</span>
                </>
              )}
            </h3>

            {bulkUploadResult.success ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-sm font-semibold">
                  Successfully imported <strong>{bulkUploadResult.count}</strong> new student records. All fee schedules and outstanding balances have been initialized automatically!
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-danger/10 text-danger text-xs font-semibold border border-danger/20 mb-2">
                  The spreadsheet contains validation errors. No student records were imported. Please fix the errors listed below and re-upload:
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2 border border-border-custom p-3 rounded-xl bg-bg-custom divide-y divide-border-custom">
                  {bulkUploadResult.errors.map((err, i) => (
                    <div key={i} className="text-xs text-muted-fg-custom font-medium pt-2 first:pt-0">
                      {err}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-border-custom flex items-center justify-end">
              <button
                type="button"
                onClick={() => setBulkUploadResult(null)}
                className="px-6 py-2.5 rounded-xl bg-transparent border border-primary text-primary hover:bg-primary/5 dark:bg-primary dark:text-white dark:border-transparent dark:hover:bg-primary-light font-extrabold text-xs shadow-xs transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MIGRATION CONFIRMATION MODAL */}
      {migrateConfirmModal && (() => {
        const sourceSess = sessions.find((s: any) => s.id === migrateSourceSessionId);
        const targetSess = sessions.find((s: any) => s.id === migrateTargetSessionId);
        const sss3Count = students.filter((s: any) => s.sessionId === sourceSess?.id && s.class?.name === 'SSS3').length;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-card-custom border border-border-custom rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-primary dark:text-white uppercase">
                    Confirm Student Directory Migration
                  </h3>
                  <p className="text-xs text-muted-fg-custom font-medium">
                    Advance class cohorts and transition graduating classes.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted-custom/40 border border-border-custom space-y-3 text-xs">
                <p className="font-bold text-fg-custom">
                  You are about to advance students from session <strong>{sourceSess?.name}</strong> to <strong>{targetSess?.name}</strong>:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-muted-fg-custom font-medium">
                  <li>Classes <strong>JSS1 through SSS2</strong> will be promoted to the subsequent class level in <strong>{targetSess?.name}</strong>.</li>
                  <li>All <strong>{sss3Count} students</strong> currently in SSS3 will graduate into the dedicated alumni category <strong className="text-purple-600 dark:text-purple-400">"Graduating Class of {sourceSess?.name}"</strong>.</li>
                  {migrateActivateTarget && (
                    <li>Target session <strong>{targetSess?.name}</strong> will be set as the new active academic session.</li>
                  )}
                </ul>
              </div>

              {migrateError && (
                <div className="p-3 rounded-xl bg-danger/10 text-danger text-xs font-bold border border-danger/20">
                  {migrateError}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMigrateConfirmModal(false)}
                  disabled={migrateLoading}
                  className="px-5 py-2.5 rounded-xl border border-border-custom text-muted-fg-custom hover:text-fg-custom font-extrabold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteMigration}
                  disabled={migrateLoading}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-secondary text-white hover:bg-amber-600 disabled:opacity-50 font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  {migrateLoading ? (
                    <>
                      <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Migrating Directory...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Promote Students</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
