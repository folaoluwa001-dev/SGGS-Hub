'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Search, Filter, Download, Eye, CheckCircle2, XCircle, Clock,
  RefreshCw, GraduationCap, Phone, MapPin, User, Calendar, AlertCircle,
  FileSpreadsheet, ArrowUpDown, ChevronRight, X, Sparkles, Check
} from 'lucide-react';

interface ApplicationItem {
  id: string;
  referenceNumber: string;
  studentName: string;
  dob: string;
  gender: 'Male' | 'Female';
  targetClass: string;
  parentName: string;
  parentPhone: string;
  parentWhatsapp?: string | null;
  residentialAddress: string;
  previousSchool?: string | null;
  status: 'pending' | 'admitted' | 'rejected';
  assignedStudentId?: string | null;
  assignedClass?: string | null;
  examMode: string;
  examDate?: string | null;
  examScore?: number | null;
  examStatus: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdmissionsManager() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Status/Admit form state
  const [newStatus, setNewStatus] = useState<'pending' | 'admitted' | 'rejected'>('admitted');
  const [assignedStudentId, setAssignedStudentId] = useState('');
  const [assignedClass, setAssignedClass] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);

  const classList = ['JSS1', 'JSS2', 'JSS3', 'SSS1', 'SSS2', 'SSS3'];

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (classFilter !== 'all') params.set('class', classFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/admissions?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load applications');
      } else {
        setApplications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError('Network error loading applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter, classFilter, startDate, endDate]);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchApplications();
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Suggest next student ID based on year and existing students
  const suggestStudentId = async () => {
    try {
      const res = await fetch('/api/students');
      const students = await res.json();
      const currentYear = new Date().getFullYear();
      const prefix = `SGGS-${currentYear}-`;

      let maxNum = 0;
      if (Array.isArray(students)) {
        students.forEach((s: any) => {
          if (s.id && s.id.startsWith(prefix)) {
            const num = parseInt(s.id.substring(prefix.length), 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        });
      }

      // Also check existing admitted applications
      applications.forEach((a) => {
        if (a.assignedStudentId && a.assignedStudentId.startsWith(prefix)) {
          const num = parseInt(a.assignedStudentId.substring(prefix.length), 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      });

      const nextId = `${prefix}${String(maxNum + 1).padStart(4, '0')}`;
      setAssignedStudentId(nextId);
    } catch (e) {
      const currentYear = new Date().getFullYear();
      setAssignedStudentId(`SGGS-${currentYear}-0001`);
    }
  };

  const handleOpenStatusModal = (app: ApplicationItem) => {
    setSelectedApp(app);
    setNewStatus(app.status === 'pending' ? 'admitted' : app.status);
    setAssignedClass(app.assignedClass || app.targetClass || 'JSS1');
    setAssignedStudentId(app.assignedStudentId || '');
    setStatusUpdateError(null);
    setShowStatusModal(true);

    if (!app.assignedStudentId) {
      suggestStudentId();
    }
  };

  const handleUpdateStatusAndAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    setStatusUpdateLoading(true);
    setStatusUpdateError(null);

    try {
      const payload: any = {
        status: newStatus,
        assigned_class: assignedClass,
      };

      if (newStatus === 'admitted') {
        if (!assignedStudentId.trim()) {
          setStatusUpdateError('Please specify an official Assigned Student ID.');
          setStatusUpdateLoading(false);
          return;
        }
        payload.assigned_student_id = assignedStudentId.trim();
      }

      const res = await fetch(`/api/admissions/${selectedApp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setStatusUpdateError(data.error || 'Failed to update application status');
      } else {
        setShowStatusModal(false);
        fetchApplications();
      }
    } catch (err) {
      setStatusUpdateError('Network error while updating admission status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Export Action: Generates CSV / Excel with exact requested columns retaining leading zeros
  const handleExport = (format: 'xlsx' | 'csv') => {
    if (applications.length === 0) {
      alert('No application records to export matching current filters.');
      return;
    }

    // Required columns: Parent Name, Phone, WhatsApp, Student Name, Class, Status, Assigned Student ID
    const headers = [
      'Parent Name',
      'Phone',
      'WhatsApp',
      'Student Name',
      'Class',
      'Status',
      'Assigned Student ID',
    ];

    const dataRows = applications.map((app) => [
      app.parentName || '',
      app.parentPhone || '',
      app.parentWhatsapp || '',
      app.studentName || '',
      app.assignedClass || app.targetClass || '',
      app.status.toUpperCase(),
      app.assignedStudentId || '',
    ]);

    const worksheetData = [headers, ...dataRows];

    // Create Worksheet
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Enforce string formatting ('s') on phone and ID cells to preserve leading zeros / "+" prefix
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:G1');
    for (let R = 1; R <= range.e.r; ++R) {
      // Columns B (Phone), C (WhatsApp), G (Assigned Student ID)
      [1, 2, 6].forEach((C) => {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (ws[cellAddress]) {
          ws[cellAddress].t = 's'; // Force string type
          ws[cellAddress].z = '@'; // Explicit text format for Excel
        }
      });
    }

    // Column widths
    ws['!cols'] = [
      { wch: 25 }, // Parent Name
      { wch: 18 }, // Phone
      { wch: 18 }, // WhatsApp
      { wch: 25 }, // Student Name
      { wch: 10 }, // Class
      { wch: 12 }, // Status
      { wch: 18 }, // Assigned Student ID
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Admissions_List');

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `SGGS_Admissions_Export_${timestamp}.${format}`;

    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-card-custom border border-border-custom shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-secondary font-bold text-xs uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4" />
            <span>Admissions Management Module</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-primary dark:text-white">
            Online Applications Portal
          </h1>
          <p className="text-xs text-muted-fg-custom mt-0.5">
            Manage student registrations, review entrance scores, assign student IDs, and sync into directory.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchApplications()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-border-custom bg-bg-custom hover:bg-muted-custom text-fg-custom text-xs font-bold transition-all"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="relative inline-block">
            <button
              onClick={() => handleExport('xlsx')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs flex items-center space-x-2"
              title="Download Excel spreadsheet (preserves leading zeros for bulk SMS)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export to Excel (Bulk SMS)</span>
            </button>
          </div>

          <button
            onClick={() => handleExport('csv')}
            className="px-3 py-2.5 rounded-xl border border-border-custom bg-bg-custom hover:bg-muted-custom text-fg-custom text-xs font-bold transition-all flex items-center space-x-1.5"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-5 rounded-2xl bg-card-custom border border-border-custom shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-muted-fg-custom absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by student, parent, phone, ref or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-xs text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-xs text-fg-custom font-semibold focus:outline-hidden focus:ring-2 focus:ring-secondary"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="admitted">Admitted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-xs text-fg-custom font-semibold focus:outline-hidden focus:ring-2 focus:ring-secondary"
            >
              <option value="all">All Classes</option>
              {classList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center space-x-2">
            <input
              type="date"
              title="Applied After"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-xs text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary"
            />
            <span className="text-muted-fg-custom text-xs">-</span>
            <input
              type="date"
              title="Applied Before"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-xs text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="p-2 rounded-lg text-muted-fg-custom hover:text-danger"
                title="Clear date filters"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick status pills count */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-custom text-xs">
          <span className="text-muted-fg-custom font-bold text-[11px] uppercase tracking-wider">
            Total Records: {applications.length}
          </span>
          <span className="text-muted-fg-custom">&bull;</span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-semibold text-[11px]">
            Pending: {applications.filter((a) => a.status === 'pending').length}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold text-[11px]">
            Admitted: {applications.filter((a) => a.status === 'admitted').length}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-danger/10 text-danger font-semibold text-[11px]">
            Rejected: {applications.filter((a) => a.status === 'rejected').length}
          </span>
        </div>
      </div>

      {/* Main Applications Table */}
      <div className="rounded-3xl bg-card-custom border border-border-custom shadow-xs overflow-hidden">
        {error && (
          <div className="p-4 bg-danger/10 text-danger text-xs flex items-center space-x-2 border-b border-danger/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-fg-custom">
            <thead className="bg-muted-custom/50 text-[11px] uppercase tracking-wider text-muted-fg-custom font-bold border-b border-border-custom">
              <tr>
                <th className="px-5 py-3.5">Ref / Student</th>
                <th className="px-5 py-3.5">Target / Class</th>
                <th className="px-5 py-3.5">Parent Contact</th>
                <th className="px-5 py-3.5">Assessment</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Assigned ID</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-custom">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-fg-custom">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-secondary" />
                    <span>Loading admissions records...</span>
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-fg-custom">
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 text-muted-fg-custom/50" />
                    <p className="font-bold text-sm">No applications found</p>
                    <p className="text-[11px]">Adjust your search or status filter criteria above.</p>
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-muted-custom/30 transition-colors"
                  >
                    {/* Ref / Student Name */}
                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-secondary text-[11px]">
                        {app.referenceNumber}
                      </div>
                      <div className="font-bold text-sm text-primary dark:text-white">
                        {app.studentName}
                      </div>
                      <div className="text-[11px] text-muted-fg-custom">
                        {app.gender} &bull; {new Date(app.dob).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Target / Assigned Class */}
                    <td className="px-5 py-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-bg-custom border border-border-custom font-bold text-xs text-fg-custom">
                        {app.assignedClass || app.targetClass}
                      </span>
                      {app.assignedClass && app.assignedClass !== app.targetClass && (
                        <div className="text-[10px] text-muted-fg-custom mt-0.5">
                          Target: {app.targetClass}
                        </div>
                      )}
                    </td>

                    {/* Parent Contact */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-fg-custom">{app.parentName}</div>
                      <div className="font-mono text-muted-fg-custom text-[11px]">
                        {app.parentPhone}
                      </div>
                      {app.parentWhatsapp && (
                        <div className="font-mono text-emerald-600 dark:text-emerald-400 text-[10px]">
                          WA: {app.parentWhatsapp}
                        </div>
                      )}
                    </td>

                    {/* Entrance Exam Status */}
                    <td className="px-5 py-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-bold text-[11px] uppercase tracking-wide">
                          {app.examMode}
                        </span>
                        {app.examScore !== null && app.examScore !== undefined && (
                          <span className="px-1.5 py-0.5 rounded-md bg-secondary/15 text-secondary font-bold text-[10px]">
                            {app.examScore}%
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-fg-custom capitalize">
                        {app.examMode === 'PHYSICAL' && app.examDate
                          ? `Date: ${new Date(app.examDate).toLocaleDateString()}`
                          : `Status: ${app.examStatus}`}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold text-[11px] uppercase tracking-wide ${
                          app.status === 'admitted'
                            ? 'bg-emerald-500/15 text-emerald-600'
                            : app.status === 'rejected'
                            ? 'bg-danger/15 text-danger'
                            : 'bg-amber-500/15 text-amber-600'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>

                    {/* Assigned Student ID */}
                    <td className="px-5 py-4">
                      {app.assignedStudentId ? (
                        <span className="font-mono font-bold text-xs text-primary dark:text-white px-2 py-0.5 rounded-md bg-bg-custom border border-border-custom">
                          {app.assignedStudentId}
                        </span>
                      ) : (
                        <span className="text-muted-fg-custom text-[11px] italic">Not assigned</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setShowDetailsModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-border-custom bg-bg-custom hover:bg-muted-custom text-fg-custom text-xs font-semibold inline-flex items-center space-x-1"
                        title="View Full Application Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => handleOpenStatusModal(app)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center space-x-1 shadow-xs transition-all ${
                          app.status === 'admitted'
                            ? 'bg-muted-custom text-fg-custom hover:bg-muted-custom/80'
                            : 'bg-secondary text-white hover:opacity-90'
                        }`}
                      >
                        <span>{app.status === 'admitted' ? 'Edit Status' : 'Admit / Action'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. VIEW DETAILS MODAL */}
      {showDetailsModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card-custom border border-border-custom rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-custom pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-secondary">
                  {selectedApp.referenceNumber}
                </span>
                <h2 className="text-xl font-black text-primary dark:text-white">
                  Application Record
                </h2>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 rounded-xl text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-xs">
              {/* Status Header */}
              <div className="p-4 rounded-2xl bg-bg-custom border border-border-custom flex items-center justify-between">
                <div>
                  <span className="text-muted-fg-custom block text-[11px]">Admission Status</span>
                  <span
                    className={`font-black text-sm uppercase ${
                      selectedApp.status === 'admitted'
                        ? 'text-emerald-600'
                        : selectedApp.status === 'rejected'
                        ? 'text-danger'
                        : 'text-amber-600'
                    }`}
                  >
                    {selectedApp.status}
                  </span>
                </div>
                {selectedApp.assignedStudentId && (
                  <div className="text-right">
                    <span className="text-muted-fg-custom block text-[11px]">Official Student ID</span>
                    <span className="font-mono font-black text-sm text-primary dark:text-white">
                      {selectedApp.assignedStudentId}
                    </span>
                  </div>
                )}
              </div>

              {/* Student Bio */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-secondary">
                  Student Bio & Academic Profile
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-bg-custom border border-border-custom">
                  <div>
                    <span className="text-muted-fg-custom block">Full Name</span>
                    <span className="font-bold text-fg-custom">{selectedApp.studentName}</span>
                  </div>
                  <div>
                    <span className="text-muted-fg-custom block">Gender</span>
                    <span className="font-bold text-fg-custom">{selectedApp.gender}</span>
                  </div>
                  <div>
                    <span className="text-muted-fg-custom block">Date of Birth</span>
                    <span className="font-bold text-fg-custom">
                      {new Date(selectedApp.dob).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-fg-custom block">Target Class</span>
                    <span className="font-bold text-fg-custom">{selectedApp.targetClass}</span>
                  </div>
                  <div>
                    <span className="text-muted-fg-custom block">Assigned Class</span>
                    <span className="font-bold text-fg-custom">
                      {selectedApp.assignedClass || selectedApp.targetClass}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-fg-custom block">Previous School</span>
                    <span className="font-bold text-fg-custom">
                      {selectedApp.previousSchool || 'None specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Parent Details */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-secondary">
                  Parent / Guardian Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-bg-custom border border-border-custom">
                  <div>
                    <span className="text-muted-fg-custom block">Parent / Guardian</span>
                    <span className="font-bold text-fg-custom">{selectedApp.parentName}</span>
                  </div>
                  <div>
                    <span className="text-muted-fg-custom block">Phone (E.164)</span>
                    <span className="font-mono font-bold text-fg-custom">
                      {selectedApp.parentPhone}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-fg-custom block">WhatsApp</span>
                    <span className="font-mono font-bold text-fg-custom">
                      {selectedApp.parentWhatsapp || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-fg-custom block">Date Applied</span>
                    <span className="font-bold text-fg-custom">
                      {new Date(selectedApp.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-muted-fg-custom block">Residential Address</span>
                    <span className="font-bold text-fg-custom">{selectedApp.residentialAddress}</span>
                  </div>
                </div>
              </div>

              {/* Entrance Assessment Details */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-secondary">
                  Entrance Assessment Record
                </h3>
                <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-bg-custom border border-border-custom">
                  <div>
                    <span className="text-muted-fg-custom block">Assessment Mode</span>
                    <span className="font-bold text-fg-custom uppercase">{selectedApp.examMode}</span>
                  </div>
                  <div>
                    <span className="text-muted-fg-custom block">Exam Score</span>
                    <span className="font-bold text-fg-custom">
                      {selectedApp.examScore !== null && selectedApp.examScore !== undefined
                        ? `${selectedApp.examScore}%`
                        : 'Not Graded'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-fg-custom block">Exam Status</span>
                    <span className="font-bold text-fg-custom capitalize">
                      {selectedApp.examStatus}
                    </span>
                  </div>
                  {selectedApp.examDate && (
                    <div className="col-span-3">
                      <span className="text-muted-fg-custom block">Scheduled Physical Date</span>
                      <span className="font-bold text-fg-custom">
                        {new Date(selectedApp.examDate).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border-custom">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2.5 rounded-xl border border-border-custom bg-bg-custom hover:bg-muted-custom text-xs font-bold text-fg-custom"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  handleOpenStatusModal(selectedApp);
                }}
                className="px-5 py-2.5 rounded-xl bg-secondary text-white text-xs font-bold hover:opacity-90 transition-all shadow-xs"
              >
                Update Admission Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. UPDATE STATUS & ADMIT MODAL */}
      {showStatusModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card-custom border border-border-custom rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-border-custom pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-secondary">
                  {selectedApp.referenceNumber}
                </span>
                <h2 className="text-xl font-black text-primary dark:text-white">
                  Update Status & Admit
                </h2>
                <p className="text-xs text-muted-fg-custom">
                  Candidate: <strong>{selectedApp.studentName}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="p-2 rounded-xl text-muted-fg-custom hover:bg-muted-custom hover:text-fg-custom"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {statusUpdateError && (
              <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{statusUpdateError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateStatusAndAdmit} className="space-y-5 text-xs">
              {/* Status Select */}
              <div>
                <label className="block text-xs font-bold text-fg-custom mb-1.5">
                  Admission Decision Status *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewStatus('pending')}
                    className={`py-2.5 rounded-xl font-bold border transition-all ${
                      newStatus === 'pending'
                        ? 'border-amber-500 bg-amber-500/15 text-amber-600 ring-2 ring-amber-500'
                        : 'border-border-custom bg-bg-custom text-muted-fg-custom hover:bg-card-custom'
                    }`}
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStatus('admitted')}
                    className={`py-2.5 rounded-xl font-bold border transition-all ${
                      newStatus === 'admitted'
                        ? 'border-emerald-600 bg-emerald-500/15 text-emerald-600 ring-2 ring-emerald-600'
                        : 'border-border-custom bg-bg-custom text-muted-fg-custom hover:bg-card-custom'
                    }`}
                  >
                    Admitted
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewStatus('rejected')}
                    className={`py-2.5 rounded-xl font-bold border transition-all ${
                      newStatus === 'rejected'
                        ? 'border-danger bg-danger/15 text-danger ring-2 ring-danger'
                        : 'border-border-custom bg-bg-custom text-muted-fg-custom hover:bg-card-custom'
                    }`}
                  >
                    Rejected
                  </button>
                </div>
              </div>

              {/* Admission Specific Fields */}
              {newStatus === 'admitted' && (
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-4">
                  <div className="flex items-center space-x-2 text-emerald-600 font-bold text-xs">
                    <Sparkles className="w-4 h-4" />
                    <span>Student Directory Synchronization</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-fg-custom mb-1">
                      Official Assigned Student ID *
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="e.g. SGGS-2026-0001"
                        value={assignedStudentId}
                        onChange={(e) => setAssignedStudentId(e.target.value)}
                        required
                        className="w-full px-3 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-mono font-bold text-fg-custom uppercase focus:outline-hidden focus:ring-2 focus:ring-secondary"
                      />
                      <button
                        type="button"
                        onClick={suggestStudentId}
                        className="px-3 py-2 rounded-xl border border-border-custom bg-bg-custom hover:bg-card-custom text-[11px] font-bold text-muted-fg-custom whitespace-nowrap"
                        title="Auto-generate next student ID"
                      >
                        Auto ID
                      </button>
                    </div>
                    <span className="text-[10px] text-muted-fg-custom mt-1 block">
                      Must be unique. This ID will become the student’s permanent matriculation number.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-fg-custom mb-1">
                      Confirm Assigned Class *
                    </label>
                    <select
                      value={assignedClass}
                      onChange={(e) => setAssignedClass(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-bold text-fg-custom focus:outline-hidden focus:ring-2 focus:ring-secondary"
                    >
                      {classList.map((c) => (
                        <option key={c} value={c}>
                          {c} {c === selectedApp.targetClass ? '(Applied Target)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 rounded-xl bg-bg-custom border border-border-custom text-[11px] text-muted-fg-custom space-y-1">
                    <span className="font-bold text-fg-custom block">Automatic Actions on Submit:</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Creates/Upserts record in the main Student Directory.</li>
                      <li>Syncs bio, parent contact, assigned class & ID.</li>
                      <li>Initializes fee balances based on class fee categories.</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border-custom">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border-custom bg-bg-custom hover:bg-muted-custom text-xs font-bold text-fg-custom"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusUpdateLoading}
                  className="px-6 py-2.5 rounded-xl bg-secondary text-white font-bold text-xs hover:opacity-90 transition-all shadow-xs flex items-center space-x-2 disabled:opacity-50"
                >
                  {statusUpdateLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Execute</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
