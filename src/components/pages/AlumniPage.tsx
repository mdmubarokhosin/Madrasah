'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Search, Phone, Mail, MapPin, Briefcase } from 'lucide-react';
import { Card } from '@heroui/react/card';
import { Chip } from '@heroui/react/chip';
import { Input } from '@heroui/react/input';
import PageBanner from '@/components/pages/PageBanner';
import BackToTop from '@/components/pages/BackToTop';
import { useAppStore } from '@/store/app-store';
import { StatCard } from '@/components/heroui/islamic';
import { useTranslation } from '@/lib/i18n-context';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AlumniPage() {
  const { alumni } = useAppStore();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    if (!searchTerm) return alumni;
    const term = searchTerm.toLowerCase();
    return alumni.filter(
      (a) =>
        a.name.toLowerCase().includes(term) ||
        a.department.toLowerCase().includes(term) ||
        a.currentOccupation.toLowerCase().includes(term) ||
        a.passingYear.includes(term)
    );
  }, [alumni, searchTerm]);


  return (
    <div className="pt-0">
      <PageBanner
        titleKey="alumni.title"
        arabicText="الخريجون"
        subtitleKey="alumni.subtitle"
      />

      {/* Stats */}
      <section className="py-10 bg-gradient-to-r from-islamic-dark via-islamic to-islamic-light relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.04]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {[
              { label: 'মোট অ্যালামনাই', value: alumni.length.toString(), icon: GraduationCap },
              { label: 'বিভাগ সংখ্যা', value: new Set(alumni.map((a) => a.department)).size.toString(), icon: GraduationCap },
              { label: 'পাসিং ইয়ার', value: new Set(alumni.map((a) => a.passingYear)).size.toString(), icon: GraduationCap },
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants}>
                <StatCard dark tone={i % 2 === 0 ? 'emerald' : 'gold'} icon={stat.icon} value={stat.value} label={stat.label} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-islamic-lighter/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-md mx-auto mb-8"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                      fullWidth
                placeholder="নাম, বিভাগ বা পেশা দিয়ে খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>

          {/* Alumni Grid */}
          {filtered.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((person) => (
                <motion.div key={person.id} variants={itemVariants}>
                  <Card className="h-full hover:shadow-lg transition-shadow border border-border">
                    <Card.Content className="p-5">
                      <div className="flex items-start gap-4 mb-4">
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-full bg-islamic-lighter flex items-center justify-center flex-shrink-0">
                          {person.imageUrl ? (
                            <img
                              src={person.imageUrl}
                              alt={person.name}
                              className="w-14 h-14 rounded-full object-cover"
                            />
                          ) : (
                            <GraduationCap className="w-7 h-7 text-islamic" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-islamic-dark truncate">{person.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Chip className="bg-islamic/10 text-islamic border-0 text-xs">
                              ব্যাচ: {person.passingYear}
                            </Chip>
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{person.department}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{person.currentOccupation}</span>
                        </div>
                        {person.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                            <a href={`tel:${person.phone.replace(/\s/g, '')}`} className="hover:text-islamic transition-colors">{person.phone}</a>
                          </div>
                        )}
                        {person.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{person.email}</span>
                          </div>
                        )}
                      </div>

                      {person.bio && (
                        <p className="mt-3 text-xs text-muted-foreground line-clamp-2 border-t pt-3">
                          {person.bio}
                        </p>
                      )}
                    </Card.Content>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <GraduationCap className="size-16 opacity-15 mb-4" />
              <p className="text-base font-medium">{t('alumni.noData')}</p>
            </div>
          )}
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
