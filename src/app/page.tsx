'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app';
import { PublicNavbar } from '@/components/public/PublicNavbar';
import { PublicFooter } from '@/components/public/PublicFooter';
import { HomePage } from '@/components/public/HomePage';
import { ResultPage } from '@/components/public/ResultPage';
import { CertificateApplyPage } from '@/components/public/CertificateApplyPage';
import { CertificateStatusPage } from '@/components/public/CertificateStatusPage';
import { AdminLoginPage } from '@/components/admin/AdminLoginPage';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function Page() {
  const { currentPage, siteSettings, setSiteSettings, admin, token } = useAppStore();

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) setSiteSettings(data.settings);
      })
      .catch(() => {});
  }, [setSiteSettings]);

  // Check auth on admin pages
  useEffect(() => {
    if (currentPage.startsWith('admin-') && currentPage !== 'admin-login') {
      if (!admin || !token) {
        useAppStore.getState().setCurrentPage('admin-login');
        return;
      }
      fetch('/api/auth/check', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => {
        if (!r.ok) {
          useAppStore.getState().clearAuth();
        }
      });
    }
  }, [currentPage, admin, token]);

  const isAdminPage = currentPage.startsWith('admin-');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'result':
        return <ResultPage />;
      case 'certificate-apply':
        return <CertificateApplyPage />;
      case 'certificate-status':
        return <CertificateStatusPage />;
      case 'admin-login':
        return <AdminLoginPage />;
      default:
        // All admin-* pages go to AdminLayout
        if (currentPage.startsWith('admin-')) {
          return <AdminLayout />;
        }
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminPage && <PublicNavbar />}
      <main className="flex-1">{renderPage()}</main>
      {!isAdminPage && <PublicFooter />}
    </div>
  );
}
