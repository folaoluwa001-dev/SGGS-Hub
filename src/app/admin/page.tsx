'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { schoolConfig } from '../../../config/school.config';
import { useTheme } from '@/components/Providers';
import { 
  Users, BookOpen, Key, History, Database, LogOut, LayoutDashboard, 
  Plus, Edit, Trash2, Search, Filter, ShieldAlert, ShieldCheck, Download, RefreshCcw, 
  Save, KeyRound, Calendar, Moon, Sun, ToggleLeft, ToggleRight, Lock
} from 'lucide-react';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';

export default function AdminDashboard() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  // App state
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'subjects' | 'tokens' | 'backups' | 'audit' | 'settings' | 'marksheet'>('overview');
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
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('');

  // Data retrieval calls
  const fetchStudents = async () => {
    try {
      const url = `/api/students?search=${studentSearch}&classId=${studentClassFilter}`;
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
      if (Array.isArray(resSess)) setSessions(resSess);
      if (Array.isArray(resSubj)) setSubjects(resSubj);
      if (Array.isArray(resTerms)) setTerms(resTerms);

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
    } else if (activeTab === 'subjects') {
      fetchSubjects();
    } else if (activeTab === 'tokens') {
      fetchTokens();
      fetchStudents();
    } else if (activeTab === 'backups') {
      fetchBackups();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user, studentClassFilter, studentSearch, auditSearch, auditActionFilter]);

  // Report Card Downloads
  const handleDownloadStudentReportCard = (student: any) => {
    const activeSession = sessions.find(s => s.active);
    const activeTerm = terms.find(t => t.active);
    const currentSessionId = activeSession?.id || sessions[0]?.id;
    const currentTermId = activeTerm?.id || terms[0]?.id;

    if (!currentSessionId || !currentTermId) {
      alert('No active academic session or term has been configured. Please configure them before printing reports.');
      return;
    }

    const url = `/api/results/pdf?studentId=${student.id}&termId=${currentTermId}&sessionId=${currentSessionId}`;
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
        'John Doe',
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
              <span className="block font-black text-xs tracking-wider uppercase text-primary dark:text-white">Admin Portal</span>
              <span className="block text-[9px] text-slate-500 font-bold uppercase">{schoolConfig.schoolName.substring(0, 12)}...</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-primary text-white dark:bg-primary dark:text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'students'
                  ? 'bg-primary text-white dark:bg-primary dark:text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Manage Students</span>
            </button>

            <button
              onClick={() => setActiveTab('subjects')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'subjects'
                  ? 'bg-primary text-white dark:bg-primary dark:text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Manage Subjects</span>
            </button>

            <button
              onClick={() => setActiveTab('tokens')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tokens'
                  ? 'bg-primary text-white dark:bg-primary dark:text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Token Management</span>
            </button>

            <button
              onClick={() => setActiveTab('backups')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'backups'
                  ? 'bg-primary text-white dark:bg-primary dark:text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>System Backup</span>
            </button>

            <button
              onClick={() => setActiveTab('marksheet')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'marksheet'
                  ? 'bg-primary text-white dark:bg-primary dark:text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Combined Marksheets</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'audit'
                  ? 'bg-primary text-white dark:bg-primary dark:text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Audit Trail</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'settings'
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
              <span className="block text-[10px] text-slate-500 font-semibold uppercase">Super Admin</span>
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
        
        {/* TOP BAR / PHONE LAYOUT NAV */}
        <header className="h-16 bg-card-custom border-b border-border-custom px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2 md:hidden">
            <div 
              className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: schoolConfig.schoolLogo }}
            />
            <span className="font-bold text-xs tracking-wider uppercase">SGGS Admin</span>
          </div>

          <h2 className="text-sm font-black text-primary dark:text-white uppercase hidden md:block">
            {activeTab === 'overview' && 'Overview Analytics'}
            {activeTab === 'students' && 'Student Records CRUD'}
            {activeTab === 'subjects' && 'Academic Subjects'}
            {activeTab === 'tokens' && 'Result Checker Tokens'}
            {activeTab === 'backups' && 'Database Backup Control'}
            {activeTab === 'marksheet' && 'Combined Marksheet Control'}
            {activeTab === 'audit' && 'Security Audit Logs'}
            {activeTab === 'settings' && 'Account Settings'}
          </h2>

          <div className="flex items-center space-x-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase hidden sm:block">Academic session: 2025/2026</span>
            <button 
              onClick={handleLogout}
              className="md:hidden p-2 rounded-lg hover:bg-danger/10 text-danger"
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
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
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
                      className="w-full sm:w-44 pl-9 pr-8 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold focus:outline-hidden appearance-none"
                    >
                      <option value="">All Classes</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Add CTA */}
                <button
                  onClick={() => { resetStudentForm(); setShowStudentModal(true); }}
                  className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-light font-extrabold text-xs shadow-md transition-all w-full sm:w-auto"
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
                            <td className="p-4 font-bold text-primary dark:text-white">{student.id}</td>
                            <td className="p-4 font-semibold text-slate-500">{student.admissionNumber}</td>
                            <td className="p-4 font-black uppercase text-primary dark:text-slate-300">{student.fullName}</td>
                            <td className="p-4 font-semibold">{student.gender}</td>
                            <td className="p-4 font-extrabold text-secondary">{student.class?.name}</td>
                            <td className="p-4 font-medium">{student.parentName}</td>
                            <td className="p-4 font-medium text-slate-500">{student.parentPhone}</td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={() => handleDownloadStudentReportCard(student)}
                                  className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-500"
                                  title="Download Report Card"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
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
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-light font-extrabold text-xs shadow-md transition-all"
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
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-light font-extrabold text-xs shadow-md transition-all"
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom">
                      {tokens.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                            No tokens generated yet. Click Generate Tokens above.
                          </td>
                        </tr>
                      ) : (
                        tokens.map((token) => {
                          const isExpired = token.status === 'Expired';
                          const isConsumed = token.status === 'Consumed';
                          const isActive = token.status === 'Active';
                          
                          let statusBg = 'bg-slate-100 text-slate-600';
                          if (isActive) statusBg = 'bg-emerald-500/10 text-emerald-600';
                          else if (isConsumed) statusBg = 'bg-amber-500/10 text-amber-600';
                          else if (isExpired) statusBg = 'bg-danger/10 text-danger';

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
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-light font-extrabold text-xs shadow-md transition-all disabled:opacity-50"
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
                          <span className={`text-[10px] font-bold ${
                            bk.status === 'Success' ? 'text-emerald-500' : 'text-danger'
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
                      className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary-light font-extrabold text-xs shadow-md transition-all w-full sm:w-auto disabled:opacity-50"
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
                    placeholder="e.g. John Doe"
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
                  className="px-5 py-2.5 rounded-xl bg-muted-custom hover:bg-border-custom font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-light font-extrabold text-xs shadow-md transition-all"
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
                  className="px-5 py-2.5 rounded-xl bg-muted-custom hover:bg-border-custom font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-light font-extrabold text-xs shadow-md transition-all"
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
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      tokenForm.mode === 'single' ? 'bg-primary text-white dark:text-secondary' : 'text-slate-400 hover:text-fg-custom'
                    }`}
                  >
                    Single Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setTokenForm({ ...tokenForm, mode: 'bulk' })}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      tokenForm.mode === 'bulk' ? 'bg-primary text-white dark:text-secondary' : 'text-slate-400 hover:text-fg-custom'
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
                  className="px-5 py-2.5 rounded-xl bg-muted-custom hover:bg-border-custom font-bold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || (tokenForm.mode === 'single' && !tokenForm.studentId)}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-light font-extrabold text-xs shadow-md transition-all disabled:opacity-50"
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
                className="px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-light font-extrabold text-xs shadow-md transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
