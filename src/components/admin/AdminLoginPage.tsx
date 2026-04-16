'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, LogIn } from 'lucide-react';
import { useAppStore } from '@/store/app';
import { useToast } from '@/hooks/use-toast';

export function AdminLoginPage() {
  const { setAuth, setCurrentPage } = useAppStore();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setAuth(data.admin, data.token);
        setCurrentPage('admin-dashboard');
        toast({ title: 'স্বাগতম', description: 'সফলভাবে লগইন হয়েছে' });
      } else {
        toast({ title: 'লগইন ব্যর্থ', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'সার্ভারে সমস্যা হয়েছে', variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">প্রশাসনিক প্যানেল</h1>
          <p className="text-muted-foreground text-sm mt-1">লগইন করুন এবং আপনার মাদরাসা ব্যবস্থাপনা শুরু করুন</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">লগইন</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">ইউজারনেম</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ইউজারনেম লিখুন"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">পাসওয়ার্ড</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড লিখুন"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <LogIn className="mr-2 h-4 w-4" />
                {loading ? 'লগইন হচ্ছে...' : 'লগইন'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
