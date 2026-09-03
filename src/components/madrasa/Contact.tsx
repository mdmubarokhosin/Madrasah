'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, Facebook, Youtube, MessageCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import SectionHeading from './SectionHeading';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';
import { dbPush } from '@/lib/db-service';
import { useToast } from '@/hooks/use-toast';

export default function Contact({ hideHeading }: { hideHeading?: boolean }) {
  const { siteInfo } = useAppStore();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.message.trim()) return;

    setSending(true);
    try {
      await dbPush('/contactMessages', {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        message: formData.message.trim(),
        date: new Date().toISOString(),
        isRead: false,
        createdAt: Date.now(),
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ name: '', email: '', phone: '', message: '' });
      }, 3000);
    } catch {
      toast({ title: t('contact.failed'), variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const contactInfo = [
    { icon: MapPin, label: t('common.location'), value: siteInfo?.address || t('contact.notSet') },
    { icon: Phone, label: t('contact.phone'), value: siteInfo?.phone || t('contact.notSet') },
    { icon: Mail, label: t('contact.email'), value: siteInfo?.email || t('contact.notSet') },
    { icon: Clock, label: t('contact.officeHours'), value: siteInfo?.officeHours || t('contact.notSet') },
  ];

  const socialLinks = [
    { icon: Facebook, label: t('footer.facebook'), color: 'hover:bg-blue-600', url: siteInfo?.facebook },
    { icon: Youtube, label: t('footer.youtube'), color: 'hover:bg-red-600', url: siteInfo?.youtube },
    { icon: MessageCircle, label: t('footer.whatsapp'), color: 'hover:bg-green-600', url: siteInfo?.whatsapp },
  ];

  const handleSocialClick = (url: string | undefined) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const mapEmbedUrl = siteInfo?.mapEmbedUrl;

  return (
    <section id="contact" className="py-12 md:py-20 bg-islamic-lighter/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!hideHeading && (
          <SectionHeading
            title={t('contact.title')}
            subtitle={t('contact.subtitle')}
            arabicText={t('contact.arabic')}
          />
        )}

        <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-4 md:space-y-6"
          >
            {/* Contact Cards */}
            {contactInfo.map((info, index) => (
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-islamic-lighter flex items-center justify-center flex-shrink-0">
                  <info.icon className="w-5 h-5 text-islamic" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-islamic-dark mb-1">{info.label}</p>
                  <p className="text-sm text-gray-600">{info.value}</p>
                </div>
              </div>
            ))}

            {/* Google Map Embed */}
            <Card className="overflow-hidden border-0 shadow-md mt-6">
              <CardContent className="p-0">
                {mapEmbedUrl ? (
                  <iframe
                    src={mapEmbedUrl}
                    width="100%"
                    className="h-[200px] md:h-[300px]"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={t('contactPage.googleMap')}
                  />
                ) : (
                  <div className="w-full h-48 bg-islamic-lighter flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-10 h-10 text-islamic mx-auto mb-2" />
                      <p className="text-sm text-gray-500">{t('contactPage.googleMap')}</p>
                      <p className="text-xs text-gray-400">{t('contactPage.setMapUrl')}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-sm text-gray-500 mr-2">{t('contact.socialMedia')}</span>
              {socialLinks.map((social) => (
                <button
                  key={social.label}
                  onClick={() => handleSocialClick(social.url)}
                  className={`w-10 h-10 rounded-full bg-gray-100 ${social.color} text-gray-500 hover:text-white flex items-center justify-center transition-all ${!social.url ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  aria-label={social.label}
                  title={social.url ? t('contactPage.visitSocial', { label: social.label }) : t('contactPage.socialNotSet', { label: social.label })}
                >
                  <social.icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-md">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-islamic-dark mb-4">{t('contact.submit')}</h3>

                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-10"
                  >
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <Send className="w-7 h-7 text-green-600" />
                    </div>
                    <p className="text-lg font-semibold text-islamic-dark">{t('contact.success')}</p>
                    <p className="text-sm text-gray-500 mt-1">{t('contact.subtitle')}</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                        {t('contact.name')} *
                      </Label>
                      <Input
                        id="name"
                        required
                        placeholder={t('contact.name')}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="border-gray-200 focus:border-islamic"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                          {t('contact.email')}
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="example@email.com"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="border-gray-200 focus:border-islamic"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          {t('contact.phone')} *
                        </Label>
                        <Input
                          id="phone"
                          required
                          placeholder="০১XXXXXXXXX"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="border-gray-200 focus:border-islamic"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                        {t('contact.message')} *
                      </Label>
                      <Textarea
                        id="message"
                        required
                        placeholder={t('contact.writeMessage')}
                        rows={4}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="border-gray-200 focus:border-islamic resize-none"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={sending}
                      className="w-full bg-islamic hover:bg-islamic-light text-white py-5 font-semibold transition-colors"
                    >
                      {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                      {sending ? t('contact.sending') : t('contact.submit')}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
