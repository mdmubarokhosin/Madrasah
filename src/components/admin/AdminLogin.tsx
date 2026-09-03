'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, User } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { navigateTo } from '@/lib/navigate';
import { useTranslation } from '@/lib/i18n-context';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { adminLogin, isLoggingIn } = useAppStore();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError(t('adminLogin.bothRequired'));
      return;
    }

    const success = await adminLogin(username.trim(), password);
    if (!success) {
      setError(t('admin.wrongPassword'));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-islamic-lighter via-white to-golden-lighter/30 p-4 relative overflow-hidden">
      {/* Decorative Islamic pattern overlay */}
      <div className="islamic-pattern-bg absolute inset-0 pointer-events-none" />

      {/* Top decorative stripe */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-islamic-dark via-golden to-islamic-dark" />

      {/* Main login card */}
      <Card className="w-full max-w-md relative z-10 shadow-xl border-islamic/20 overflow-hidden">
        {/* Card top decorative band */}
        <div className="h-1.5 bg-gradient-to-r from-islamic-dark via-islamic to-islamic-dark" />

        <CardHeader className="flex flex-col items-center gap-4 pt-8 pb-2">
          {/* Logo */}
          <div className="w-24 h-24 rounded-full bg-islamic-lighter border-4 border-islamic/20 flex items-center justify-center shadow-lg">
            <img
              src="/logo.png"
              alt={t('adminLayout.subtitle')}
              className="w-20 h-20 object-contain rounded-full"
            />
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-islamic-dark tracking-tight">
              {t('admin.adminPanel')}
            </h1>
            <div className="islamic-divider text-golden text-sm py-1 px-6">
              ✦
            </div>
            <p className="text-muted-foreground text-sm">
              {t('adminLayout.subtitle')}
            </p>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8 pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username field */}
            <div className="space-y-2">
              <label
                htmlFor="admin-username"
                className="text-sm font-medium text-islamic-dark"
              >
                {t('adminNav.username')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder={t('adminLogin.usernamePlaceholder')}
                  className="pl-10 h-11 border-islamic/20 focus-visible:border-islamic focus-visible:ring-islamic/30"
                  disabled={isLoggingIn}
                  autoFocus
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label
                htmlFor="admin-password"
                className="text-sm font-medium text-islamic-dark"
              >
                {t('admin.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder={t('admin.passwordPlaceholder')}
                  className="pl-10 pr-10 h-11 border-islamic/20 focus-visible:border-islamic focus-visible:ring-islamic/30"
                  disabled={isLoggingIn}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-islamic-dark transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? t('adminLogin.hidePassword') : t('adminLogin.showPassword')}
                  disabled={isLoggingIn}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-fade-in-up">
                {error}
              </div>
            )}

            {/* Login button */}
            <Button
              type="submit"
              className="w-full h-11 bg-islamic hover:bg-islamic-dark text-white font-semibold text-base shadow-md hover:shadow-lg transition-all"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  <span>{t('admin.verifying')}</span>
                </>
              ) : (
                <>
                  <Lock className="size-5" />
                  <span>{t('admin.loginButton')}</span>
                </>
              )}
            </Button>

            {/* Password hint */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground bg-islamic-lighter/60 rounded-lg px-3 py-2 inline-block">
                {t('adminLogin.legalNotice')} <span className="font-mono font-medium text-islamic-dark">{t('adminLogin.legalAction')}</span>
              </p>
            </div>
          </form>

          {/* Back to website link */}
          <div className="mt-8 pt-5 border-t border-border">
            <button
              type="button"
              onClick={() => navigateTo('public')}
              className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-islamic-dark transition-colors py-2 rounded-lg hover:bg-islamic-lighter/50"
            >
              <ArrowLeft className="size-4" />
              <span>{t('admin.backToSite')}</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Bottom decorative stripe */}
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-islamic-dark via-golden to-islamic-dark" />
    </div>
  );
}
