'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, RefreshCcw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ChangePasswordForm() {
  const router = useRouter();

  // Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Field validation states for real-time feedback
  const [validationErrors, setValidationErrors] = useState<{
    newPassword?: string;
    confirmNewPassword?: string;
  }>({});

  const handlePasswordChange = (val: string) => {
    setNewPassword(val);
    if (val.length > 0 && val.length < 8) {
      setValidationErrors(prev => ({
        ...prev,
        newPassword: 'Password must be at least 8 characters long.'
      }));
    } else {
      setValidationErrors(prev => ({ ...prev, newPassword: undefined }));
    }

    if (confirmNewPassword && val !== confirmNewPassword) {
      setValidationErrors(prev => ({
        ...prev,
        confirmNewPassword: 'Passwords do not match.'
      }));
    } else {
      setValidationErrors(prev => ({ ...prev, confirmNewPassword: undefined }));
    }
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmNewPassword(val);
    if (newPassword && val !== newPassword) {
      setValidationErrors(prev => ({
        ...prev,
        confirmNewPassword: 'Passwords do not match.'
      }));
    } else {
      setValidationErrors(prev => ({ ...prev, confirmNewPassword: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password.');
      }

      setSuccess(true);
      
      // Clear localStorage session
      localStorage.removeItem('sggs-user');

      // Wait a moment so they can read the success message, then redirect to login page
      setTimeout(() => {
        router.push('/login');
      }, 2500);

    } catch (err: any) {
      setError(err.message || 'An error occurred during password change.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-card-custom border border-border-custom rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h3 className="text-base font-black text-primary dark:text-white uppercase tracking-wider">Account Password Configuration</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase">Update credentials to secure your portal profile</p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Password changed successfully! Terminating active sessions and redirecting to login...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-xs font-semibold flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400">Current Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              required
              disabled={loading || success}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-custom border border-border-custom text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-ring-custom disabled:opacity-50"
            />
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              required
              disabled={loading || success}
              value={newPassword}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="••••••••"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-custom border text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-ring-custom disabled:opacity-50 ${
                validationErrors.newPassword ? 'border-danger focus:ring-danger/20' : 'border-border-custom'
              }`}
            />
          </div>
          {validationErrors.newPassword && (
            <p className="text-[10px] text-danger font-bold uppercase flex items-center space-x-1">
              <span>{validationErrors.newPassword}</span>
            </p>
          )}
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400">Confirm New Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="password"
              required
              disabled={loading || success}
              value={confirmNewPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              placeholder="••••••••"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg-custom border text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-ring-custom disabled:opacity-50 ${
                validationErrors.confirmNewPassword ? 'border-danger focus:ring-danger/20' : 'border-border-custom'
              }`}
            />
          </div>
          {validationErrors.confirmNewPassword && (
            <p className="text-[10px] text-danger font-bold uppercase flex items-center space-x-1">
              <span>{validationErrors.confirmNewPassword}</span>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || success || !!validationErrors.newPassword || !!validationErrors.confirmNewPassword}
          className="flex items-center justify-center space-x-2 w-full px-5 py-3 rounded-xl bg-primary text-white hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed font-extrabold text-xs shadow-md transition-all pt-3.5"
        >
          {loading ? (
            <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Lock className="w-3.5 h-3.5" />
          )}
          <span>{loading ? 'Updating Password...' : 'Save New Password'}</span>
        </button>
      </form>
    </div>
  );
}
