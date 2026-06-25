'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { schoolConfig } from '../../../config/school.config';
import { useTheme } from '@/components/Providers';
import {
  Users, CreditCard, DollarSign, LogOut, Download, Plus,
  Printer, Search, Filter, ShieldCheck, AlertCircle, Moon, Sun, RefreshCw, FileText, Lock, Sliders
} from 'lucide-react';
import ChangePasswordForm from '@/components/ChangePasswordForm';

export default function BursarDashboard() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'overview' | 'log-payments' | 'debtors' | 'fees-structure' | 'settings'>('overview');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Data lists
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [debtors, setDebtors] = useState<any[]>([]);

  // Fee Grid state variables
  const [feeConfigs, setFeeConfigs] = useState<any[]>([]);
  const [savingFees, setSavingFees] = useState(false);
  const [feeSuccessMessage, setFeeSuccessMessage] = useState<string | null>(null);
  const [feeErrorMessage, setFeeErrorMessage] = useState<string | null>(null);

  // Selection states
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tuition Lecture Fee');
  const [amountPaid, setAmountPaid] = useState('');

  // Search/Filters
  const [debtorSearch, setDebtorSearch] = useState('');
  const [debtorClassFilter, setDebtorClassFilter] = useState('');

  // Latest logged transaction receipt link
  const [latestReceipt, setLatestReceipt] = useState<{ id: string; num: string } | null>(null);

  const fetchClassStudents = async () => {
    try {
      const res = await fetch(`/api/students?classId=${selectedClassId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudents(data);
        if (data.length > 0) {
          setSelectedStudentId(data[0].id);
        } else {
          setSelectedStudentId('');
        }
      }
    } catch (e) { console.error(e); }
  };

  const fetchDebtorsList = async () => {
    try {
      const url = `/api/payments?isDebtor=true&classId=${debtorClassFilter}&search=${debtorSearch}`;
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setDebtors(data);
    } catch (e) { console.error(e); }
  };

  const fetchBaseData = async () => {
    try {
      setLoading(true);
      const [resCls, resPayments] = await Promise.all([
        fetch('/api/classes').then(r => r.json()),
        fetch('/api/payments').then(r => r.json()),
      ]);

      if (Array.isArray(resCls)) {
        setClasses(resCls);
        if (resCls.length > 0) setSelectedClassId(resCls[0].id);
      }
      if (Array.isArray(resPayments)) {
        setPayments(resPayments);
      }

      // Load debtors
      fetchDebtorsList();
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
    if (parsed.role !== 'BURSAR' && parsed.role !== 'SUPER_ADMIN') {
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

  useEffect(() => {
    fetchDebtorsList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debtorClassFilter, debtorSearch]);

  const fetchFeeConfigs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/fee-categories');
      const data = await res.json();
      if (Array.isArray(data)) {
        setFeeConfigs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'fees-structure') {
      fetchFeeConfigs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  const handleFeeAmountChange = (classId: string, categoryName: string, value: string) => {
    setFeeConfigs((prevConfigs) =>
      prevConfigs.map((cls) => {
        if (cls.id === classId) {
          return {
            ...cls,
            feeCategories: cls.feeCategories.map((cat: any) => {
              if (cat.name === categoryName) {
                return { ...cat, defaultAmount: value === '' ? '' : Number(value) };
              }
              return cat;
            }),
          };
        }
        return cls;
      })
    );
  };

  const handleSaveFeeConfigs = async () => {
    setSavingFees(true);
    setFeeSuccessMessage(null);
    setFeeErrorMessage(null);

    const updates: any[] = [];
    feeConfigs.forEach((cls) => {
      cls.feeCategories.forEach((cat: any) => {
        updates.push({
          classId: cls.id,
          name: cat.name,
          amount: cat.defaultAmount === '' ? 0 : Number(cat.defaultAmount),
        });
      });
    });

    try {
      const response = await fetch('/api/fee-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save fee configuration');

      setFeeSuccessMessage('Fee configuration saved successfully and propagated to students!');
      
      // Reload financial totals
      const resPayments = await fetch('/api/payments').then(r => r.json());
      if (Array.isArray(resPayments)) setPayments(resPayments);
      fetchDebtorsList();
    } catch (err: any) {
      setFeeErrorMessage(err.message);
    } finally {
      setSavingFees(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !amountPaid || !selectedCategory) return;

    setLoading(true);
    setErrorMessage(null);
    setLatestReceipt(null);

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          amountPaid: Number(amountPaid),
          category: selectedCategory,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Payment logging failed');

      setLatestReceipt({ id: data.id, num: data.receiptNumber });
      setAmountPaid('');

      // Reload financial totals
      const resPayments = await fetch('/api/payments').then(r => r.json());
      if (Array.isArray(resPayments)) setPayments(resPayments);

      fetchDebtorsList();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReceipt = (paymentId: string) => {
    const url = `/api/payments/receipt?paymentId=${paymentId}`;
    window.open(url, '_blank');
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    localStorage.removeItem('sggs-user');
    router.push('/login');
  };

  // Financial aggregates
  const totalCollections = payments.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const totalOutstanding = payments.reduce((acc, curr) => acc + curr.balance, 0);
  const expectedGross = totalCollections + totalOutstanding;

  const categories = ['Tuition Lecture Fee', 'Uniforms Levy', 'Books & Materials', 'Assessments & Exams', 'Other Admin Charges'];

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
              <span className="block font-black text-xs tracking-wider uppercase text-primary dark:text-white">Bursary Portal</span>
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
              <DollarSign className="w-4 h-4" />
              <span>Financial Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('log-payments')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'log-payments'
                  ? 'bg-primary text-white dark:bg-primary dark:text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom'
                }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Log Student Payment</span>
            </button>

            <button
              onClick={() => setActiveTab('debtors')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'debtors'
                  ? 'bg-primary text-white dark:bg-primary dark:text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom'
                }`}
            >
              <Users className="w-4 h-4" />
              <span>Debtors Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('fees-structure')}
              className={`flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'fees-structure'
                  ? 'bg-primary text-white dark:bg-primary dark:text-secondary'
                  : 'text-muted-fg-custom hover:bg-muted-custom'
                }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Fee Structure</span>
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
              <span className="block text-[10px] text-slate-500 font-semibold uppercase">Bursary Officer</span>
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
            <span className="font-bold text-xs tracking-wider uppercase">SGGS Bursary</span>
          </div>

          <h2 className="text-sm font-black text-primary dark:text-white uppercase hidden md:block">
            {activeTab === 'overview' && 'Financial Statistics Overview'}
            {activeTab === 'log-payments' && 'Record Student Fee Payment'}
            {activeTab === 'debtors' && 'School Debtors & Outstandings Ledger'}
            {activeTab === 'fees-structure' && 'Class Fee Configurations Grid'}
            {activeTab === 'settings' && 'Account Settings'}
          </h2>

          <div className="flex items-center space-x-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase hidden sm:block">Ledger: Manual tracking only</span>
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

          {/* OVERVIEW STATS */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-300">

              {/* Financial KPIs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Collected */}
                <div className="p-6 rounded-2xl bg-card-custom border border-border-custom flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Collected Funds</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-600">NGN {totalCollections.toLocaleString()}</span>
                  </div>
                </div>

                {/* Outstanding */}
                <div className="p-6 rounded-2xl bg-card-custom border border-border-custom flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-danger/10 text-danger flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Outstanding Debt</span>
                    <span className="text-xl sm:text-2xl font-black text-danger">NGN {totalOutstanding.toLocaleString()}</span>
                  </div>
                </div>

                {/* Expected Gross */}
                <div className="p-6 rounded-2xl bg-card-custom border border-border-custom flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Expectation</span>
                    <span className="text-xl sm:text-2xl font-black text-primary dark:text-white">NGN {expectedGross.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Recent Transactions List */}
              <div className="space-y-4">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-primary dark:text-white">Recent Payment Activities</h3>

                <div className="bg-card-custom border border-border-custom rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-muted-custom/30 text-muted-fg-custom border-b border-border-custom">
                          <th className="p-4 font-bold">Receipt No</th>
                          <th className="p-4 font-bold">Student Name</th>
                          <th className="p-4 font-bold">Fee Category</th>
                          <th className="p-4 font-bold">Amount Paid</th>
                          <th className="p-4 font-bold">Out. Balance</th>
                          <th className="p-4 font-bold">Receipt PDF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-custom">
                        {payments.filter(p => p.amountPaid > 0).slice(0, 10).map((p) => (
                          <tr key={p.id} className="hover:bg-muted-custom/10 transition-colors">
                            <td className="p-4 font-mono font-bold text-slate-500">{p.receiptNumber}</td>
                            <td className="p-4 font-extrabold uppercase text-primary dark:text-slate-300">{p.student?.fullName}</td>
                            <td className="p-4 font-semibold text-secondary">{p.category}</td>
                            <td className="p-4 font-black text-emerald-600">NGN {p.amountPaid.toLocaleString()}</td>
                            <td className="p-4 font-bold text-slate-500">NGN {p.balance.toLocaleString()}</td>
                            <td className="p-4">
                              <button
                                onClick={() => handlePrintReceipt(p.id)}
                                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary dark:text-secondary text-xs font-bold transition-all"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Get PDF</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {payments.filter(p => p.amountPaid > 0).length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                              No payments recorded yet. Click Log Student Payment.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* LOG STUDENT PAYMENTS TAB */}
          {activeTab === 'log-payments' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in duration-300">

              {/* Recording form */}
              <div className="lg:col-span-7 p-6 sm:p-8 bg-card-custom border border-border-custom rounded-3xl shadow-sm space-y-6">
                <h3 className="font-extrabold text-base text-primary dark:text-white">Record Manual Payment</h3>
                <p className="text-xs text-muted-fg-custom leading-relaxed">
                  Log cashier payments. Finding the student will automatically associate the payment against their term fee ledgers.
                </p>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-danger/10 text-danger text-xs font-semibold text-center border border-danger/25">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleRecordPayment} className="space-y-4">
                  {/* Select class first */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400">Class arm *</label>
                      <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm font-semibold focus:outline-hidden"
                      >
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400">Target Student *</label>
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm font-semibold focus:outline-hidden"
                        required
                      >
                        <option value="">Select Student</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.id} - {s.fullName.toUpperCase()}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Fee category and amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400">Fee Category *</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm font-semibold focus:outline-hidden"
                      >
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-400">Amount Paid (NGN) *</label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm font-bold focus:outline-hidden"
                        placeholder="e.g. 45000"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !selectedStudentId || !amountPaid}
                    className="flex items-center justify-center space-x-2 w-full px-6 py-3.5 rounded-xl bg-primary text-white hover:bg-primary-light font-extrabold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Logging payment...</span>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Submit Fee Log</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Receipt output pane */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 bg-card-custom border border-border-custom rounded-3xl shadow-sm flex flex-col justify-between min-h-[280px]">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-primary dark:text-white border-b border-border-custom pb-3 mb-4">
                    Logged Receipt Actions
                  </h3>

                  {!latestReceipt ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-2">
                      <FileText className="w-8 h-8 opacity-45" />
                      <span className="text-xs font-bold">No transaction recorded yet.</span>
                      <span className="text-[10px] text-slate-500">Log a manual payment in the left pane to generate an official print voucher.</span>
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-center space-y-4">
                      <div className="inline-flex w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 items-center justify-center">
                        <ShieldCheck className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <span className="block font-bold text-xs text-slate-400 uppercase tracking-wide">Receipt Generated Successfully</span>
                        <span className="block font-black text-sm text-primary dark:text-white">{latestReceipt.num}</span>
                      </div>

                      <button
                        onClick={() => handlePrintReceipt(latestReceipt.id)}
                        className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-secondary text-white hover:bg-amber-600 font-extrabold text-xs shadow-md shadow-secondary/15 transition-all animate-bounce"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Receipt Voucher</span>
                      </button>
                    </div>
                  )}

                  <div className="text-[9px] text-slate-500 border-t border-border-custom pt-4 mt-6">
                    All payment activities automatically reflect on debtor lists and write log records on security audit tables.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DEBTORS LIST */}
          {activeTab === 'debtors' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Filters toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card-custom border border-border-custom">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search debtor names or IDs..."
                    value={debtorSearch}
                    onChange={(e) => setDebtorSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-bg-custom border border-border-custom text-xs font-semibold focus:outline-hidden"
                  />
                </div>

                {/* Filter class */}
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Class:</span>
                  <select
                    value={debtorClassFilter}
                    onChange={(e) => setDebtorClassFilter(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-bg-custom border border-border-custom text-xs font-bold focus:outline-hidden appearance-none pr-8"
                  >
                    <option value="">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Debtors Table */}
              <div className="bg-card-custom border border-border-custom rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-muted-custom/30 text-muted-fg-custom border-b border-border-custom">
                        <th className="p-4 font-bold">Student ID</th>
                        <th className="p-4 font-bold">Full Name</th>
                        <th className="p-4 font-bold">Class Arm</th>
                        <th className="p-4 font-bold">Fee Category</th>
                        <th className="p-4 font-bold">Expected (NGN)</th>
                        <th className="p-4 font-bold">Paid (NGN)</th>
                        <th className="p-4 font-bold">Outstanding Balance</th>
                        <th className="p-4 font-bold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom">
                      {debtors.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                            Excellent! No outstanding debtor profiles found matching these parameters.
                          </td>
                        </tr>
                      ) : (
                        debtors.map((debtor) => (
                          <tr key={debtor.id} className="hover:bg-muted-custom/10 transition-colors">
                            <td className="p-4 font-bold text-primary dark:text-white">{debtor.studentId}</td>
                            <td className="p-4 font-black uppercase text-primary dark:text-slate-300">{debtor.student?.fullName}</td>
                            <td className="p-4 font-bold text-secondary">{debtor.student?.class?.name}</td>
                            <td className="p-4 font-semibold text-slate-500">{debtor.category}</td>
                            <td className="p-4">NGN {debtor.totalExpected.toLocaleString()}</td>
                            <td className="p-4 font-medium text-emerald-600">NGN {debtor.amountPaid.toLocaleString()}</td>
                            <td className="p-4 font-black text-danger">NGN {debtor.balance.toLocaleString()}</td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => {
                                  setSelectedClassId(debtor.student?.classId);
                                  setSelectedStudentId(debtor.studentId);
                                  setSelectedCategory(debtor.category);
                                  setActiveTab('log-payments');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-light text-white text-[10px] font-black uppercase tracking-wider transition-all"
                              >
                                Log Payment
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

          {/* FEES STRUCTURE TAB */}
          {activeTab === 'fees-structure' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card-custom border border-border-custom shadow-xs">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-sm text-primary dark:text-white">Configure Default Class Fees</h3>
                  <p className="text-[10px] text-muted-fg-custom leading-normal">
                    Configure standard rates per class level. Saving changes will update defaults and propagate expectations for current students.
                  </p>
                </div>
                <button
                  onClick={handleSaveFeeConfigs}
                  disabled={savingFees || loading}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-light font-extrabold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {savingFees ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Sliders className="w-4 h-4" />
                      <span>Save Fee Configuration</span>
                    </>
                  )}
                </button>
              </div>

              {feeSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-semibold text-center border border-emerald-500/25 animate-in fade-in">
                  {feeSuccessMessage}
                </div>
              )}

              {feeErrorMessage && (
                <div className="p-3 rounded-xl bg-danger/10 text-danger text-xs font-semibold text-center border border-danger/25 animate-in fade-in">
                  {feeErrorMessage}
                </div>
              )}

              <div className="bg-card-custom border border-border-custom rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-muted-custom/30 text-muted-fg-custom border-b border-border-custom">
                        <th className="p-4 font-bold min-w-[120px]">CLASS/GRADE LEVEL</th>
                        {categories.map((cat) => (
                          <th key={cat} className="p-4 font-bold uppercase tracking-wider text-center">{cat}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-custom">
                      {feeConfigs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                            Loading class fee configurations...
                          </td>
                        </tr>
                      ) : (
                        feeConfigs.map((cls) => {
                          const displayName = cls.name.replace('SSS', 'SS');

                          return (
                            <tr key={cls.id} className="hover:bg-muted-custom/10 transition-colors">
                              <td className="p-4 font-black text-primary dark:text-white uppercase text-sm">{displayName}</td>
                              {categories.map((catName) => {
                                const cat = cls.feeCategories.find((c: any) => c.name === catName);
                                const value = cat ? cat.defaultAmount : 0;

                                return (
                                  <td key={catName} className="p-4 text-center">
                                    <div className="inline-block relative">
                                      <input
                                        type="number"
                                        min={0}
                                        value={value}
                                        onChange={(e) => handleFeeAmountChange(cls.id, catName, e.target.value)}
                                        className="w-32 px-3 py-1.5 rounded-lg bg-bg-custom border border-border-custom text-center text-xs font-bold text-fg-custom focus:outline-hidden focus:border-primary transition-colors"
                                      />
                                    </div>
                                  </td>
                                );
                              })}
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
