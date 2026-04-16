'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Search, Users, Award, TrendingUp, GraduationCap, FileText,
  Bell, ChevronLeft, ChevronRight, Send, BookOpen, Star, MapPin, Phone, Mail,
  Shield, CheckCircle, ClipboardList, ArrowRight
} from 'lucide-react';
import type { Notice, FAQ, Stats } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function HomePage() {
  const { setCurrentPage, siteSettings } = useAppStore();
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [noticePage, setNoticePage] = useState(0);

  useEffect(() => {
    fetch('/api/notices').then((r) => r.json()).then((d) => setNotices(d.notices || [])).catch(() => {});
    fetch('/api/faqs').then((r) => r.json()).then((d) => setFaqs(d.faqs || [])).catch(() => {});
    fetch('/api/stats').then((r) => r.json()).then((d) => setStats(d)).catch(() => {});
  }, []);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      if (res.ok) {
        toast({ title: 'বার্তা পাঠানো হয়েছে', description: 'আমরা শীঘ্রই যোগাযোগ করবো।' });
        setContactForm({ name: '', email: '', subject: '', message: '' });
      } else {
        const data = await res.json();
        toast({ title: 'ত্রুটি', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'ত্রুটি', description: 'সার্ভারে সমস্যা হয়েছে', variant: 'destructive' });
    }
    setContactLoading(false);
  };

  const visibleNotices = 3;
  const totalNoticePages = Math.ceil(notices.length / visibleNotices);
  const displayedNotices = notices.slice(noticePage * visibleNotices, (noticePage + 1) * visibleNotices);

  return (
    <div className="flex flex-col">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-emerald-700 to-emerald-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative container mx-auto px-4 py-12 sm:py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 bg-white/10 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm backdrop-blur-sm">
              <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-300" />
              <span>বিশ্বস্ত শিক্ষা প্রতিষ্ঠান</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 sm:mb-4 leading-tight">
              {siteSettings.siteName || 'জামিয়া ইসলামিয়া দারুল উলূম'}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/80 mb-6 sm:mb-8 max-w-xl mx-auto">
              {siteSettings.siteTagline || 'ইলমে দ্বীনের আলোয় আলোকিত জীবন গড়ার প্রত্যয়ে'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 shadow-lg text-base sm:text-lg font-semibold h-12 sm:h-14 px-6 sm:px-8"
                onClick={() => setCurrentPage('result')}
              >
                <Search className="mr-2 h-5 w-5" />
                ফলাফল দেখুন
              </Button>
              <Button
                size="lg"
                className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg text-base sm:text-lg font-semibold h-12 sm:h-14 px-6 sm:px-8"
                onClick={() => setCurrentPage('certificate-apply')}
              >
                <FileText className="mr-2 h-5 w-5" />
                সনদের আবেদন
              </Button>
            </div>
          </div>
        </div>
        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 28C840 36 960 42 1080 40C1200 38 1320 28 1380 23L1440 18V60H1380C1320 60 1200 60 1080 60C960 60 840 60 720 60C600 60 480 60 360 60C240 60 120 60 60 60H0Z" fill="oklch(0.985 0.002 120)" />
          </svg>
        </div>
      </section>

      {/* ===== QUICK SERVICES ===== */}
      <section className="container mx-auto px-4 py-10 sm:py-14">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 text-center">দ্রুত সেবা</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card
              className="group hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer border-2 border-transparent"
              onClick={() => setCurrentPage('result')}
            >
              <CardContent className="p-5 sm:p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <Search className="h-7 w-7 text-primary group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-base sm:text-lg font-bold mb-1.5">পরীক্ষার ফলাফল</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">আপনার পরীক্ষার ফলাফল রোল বা রেজি. নং দিয়ে দেখুন</p>
                <div className="mt-3 text-primary font-semibold text-xs sm:text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  দেখুন <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="group hover:shadow-xl hover:border-amber-400/50 transition-all duration-300 cursor-pointer border-2 border-transparent"
              onClick={() => setCurrentPage('certificate-apply')}
            >
              <CardContent className="p-5 sm:p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-500 transition-colors duration-300">
                  <FileText className="h-7 w-7 text-amber-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-base sm:text-lg font-bold mb-1.5">সনদের আবেদন</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">অনলাইনে সনদের জন্য আবেদন করুন সহজেই</p>
                <div className="mt-3 text-amber-600 font-semibold text-xs sm:text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  আবেদন করুন <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </CardContent>
            </Card>

            <Card
              className="group hover:shadow-xl hover:border-blue-400/50 transition-all duration-300 cursor-pointer border-2 border-transparent"
              onClick={() => setCurrentPage('certificate-status')}
            >
              <CardContent className="p-5 sm:p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500 transition-colors duration-300">
                  <ClipboardList className="h-7 w-7 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-base sm:text-lg font-bold mb-1.5">সনদের স্ট্যাটাস</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">আবেদনের বর্তমান অবস্থা ট্র্যাক করুন</p>
                <div className="mt-3 text-blue-600 font-semibold text-xs sm:text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  চেক করুন <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="bg-muted/50 py-8 sm:py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {[
              { icon: Users, label: 'শিক্ষার্থী', value: stats?.totalStudents ?? 0, bg: 'bg-primary/10', color: 'text-primary' },
              { icon: BookOpen, label: 'শ্রেণি', value: stats?.totalClasses ?? 7, bg: 'bg-amber-500/10', color: 'text-amber-600' },
              { icon: Award, label: 'পাশের হার', value: `${stats?.passRate ?? 0}%`, bg: 'bg-emerald-500/10', color: 'text-emerald-600' },
              { icon: TrendingUp, label: 'পরীক্ষা', value: stats?.totalExams ?? 0, bg: 'bg-blue-500/10', color: 'text-blue-600' },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-xl p-3 sm:p-5 text-center shadow-sm border">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${stat.bg} flex items-center justify-center mx-auto mb-2`}>
                  <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                </div>
                <p className="text-xl sm:text-3xl font-bold">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== ABOUT SECTION ===== */}
      <section className="container mx-auto px-4 py-10 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-center">আমাদের সম্পর্কে</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="text-center md:text-right">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto md:ml-auto md:mr-0 mb-4">
                <GraduationCap className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">আমাদের লক্ষ্য</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                দ্বীনের সঠিক জ্ঞান সহ একজন আদর্শ মানব সম্পদ তৈরি করা যিনি
                সমাজে ইসলামের আলো ছড়িয়ে দিতে পারবেন।
              </p>
            </div>
            <div className="text-center md:text-left">
              <div className="space-y-3">
                {[
                  'কুরআন ও হাদীসের গুণগত শিক্ষা',
                  'ফিকহ ও আরবি ভাষায় দক্ষতা অর্জন',
                  'ইসলামী চরিত্র ও আদব গঠন',
                  'সমাজসেবায় অংশগ্রহণে উৎসাহ',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== NOTICE BOARD ===== */}
      {notices.length > 0 && (
        <section className="bg-muted/50 py-10 sm:py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  নোটিশ বোর্ড
                </h2>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setNoticePage(Math.max(0, noticePage - 1))}
                    disabled={noticePage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setNoticePage(Math.min(totalNoticePages - 1, noticePage + 1))}
                    disabled={noticePage >= totalNoticePages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {displayedNotices.map((notice) => (
                  <Card key={notice.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm sm:text-base">{notice.title}</CardTitle>
                        <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded shrink-0">
                          {notice.date}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{notice.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== FAQ SECTION ===== */}
      {faqs.length > 0 && (
        <section className="container mx-auto px-4 py-10 sm:py-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">সাধারণ জিজ্ঞাসা</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-right text-xs sm:text-sm font-medium">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm text-muted-foreground text-right leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* ===== CONTACT SECTION ===== */}
      <section className="bg-muted/50 py-10 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">যোগাযোগ করুন</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {/* Contact Form */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-base sm:text-lg">বার্তা পাঠান</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContact} className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="contact-name" className="text-xs sm:text-sm">নাম</Label>
                        <Input
                          id="contact-name"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="আপনার নাম"
                          required
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="contact-email" className="text-xs sm:text-sm">ইমেইল</Label>
                        <Input
                          id="contact-email"
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="আপনার ইমেইল"
                          required
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-subject" className="text-xs sm:text-sm">বিষয়</Label>
                      <Input
                        id="contact-subject"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        placeholder="বিষয়"
                        required
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="contact-message" className="text-xs sm:text-sm">বার্তা</Label>
                      <Textarea
                        id="contact-message"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        placeholder="আপনার বার্তা লিখুন"
                        rows={4}
                        required
                        className="text-sm"
                      />
                    </div>
                    <Button type="submit" className="w-full h-11" disabled={contactLoading}>
                      <Send className="mr-2 h-4 w-4" />
                      {contactLoading ? 'পাঠানো হচ্ছে...' : 'বার্তা পাঠান'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-5 sm:p-6">
                    <h4 className="font-semibold text-sm sm:text-base mb-4">যোগাযোগের তথ্য</h4>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <h5 className="font-medium text-xs sm:text-sm">ঠিকানা</h5>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {siteSettings.address || 'ঢাকা, বাংলাদেশ'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                          <Phone className="h-5 w-5" />
                        </div>
                        <div>
                          <h5 className="font-medium text-xs sm:text-sm">ফোন</h5>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {siteSettings.phone || '০১৭১২-৩৪৫৬৭৮'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <h5 className="font-medium text-xs sm:text-sm">ইমেইল</h5>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {siteSettings.email || 'info@example.com'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
