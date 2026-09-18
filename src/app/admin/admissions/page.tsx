'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAdmissionsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin?tab=admissions');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-bg-custom text-fg-custom">
      <div className="p-8 rounded-3xl bg-card-custom border border-border-custom shadow-xs text-center space-y-3">
        <div className="w-8 h-8 mx-auto border-2 border-secondary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-muted-fg-custom">Loading Admissions Console...</p>
      </div>
    </div>
  );
}
