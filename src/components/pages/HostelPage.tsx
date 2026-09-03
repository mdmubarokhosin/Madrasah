'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BedDouble, Utensils, DoorOpen, Users, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import BackToTop from '@/components/pages/BackToTop';
import PageSkeleton from '@/components/pages/PageSkeleton';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from '@/lib/i18n-context';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// status values come from Firebase; map them to i18n keys for display
const statusConfig: Record<string, { labelKey: string; cls: string }> = {
  available: { labelKey: 'hostelPage.statusAvailable', cls: 'bg-green-100 text-green-700' },
  full: { labelKey: 'hostelPage.statusFull', cls: 'bg-red-100 text-red-700' },
  maintenance: { labelKey: 'hostelPage.statusMaintenance', cls: 'bg-yellow-100 text-yellow-700' },
};

export default function HostelPage() {
  const { hostelRooms, hostelMeals, dataLoaded } = useAppStore();
  const { t } = useTranslation();

  const totalRooms = hostelRooms.length;
  const availableRooms = hostelRooms.filter((r) => r.status === 'available').length;
  const totalCapacity = hostelRooms.reduce((sum, r) => sum + r.capacity, 0);

  const mealsByDay = useMemo(() => {
    const map = new Map<string, typeof hostelMeals>();
    for (const meal of hostelMeals) {
      const existing = map.get(meal.day) || [];
      existing.push(meal);
      map.set(meal.day, existing);
    }
    return map;
  }, [hostelMeals]);

  // meal.day values are stored in Bengali in Firebase — keep the sort order as-is
  const dayOrder = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার'];

  if (!dataLoaded) return <PageSkeleton cards={6} showStats />;

  return (
    <div className="pt-0">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-islamic-dark via-islamic to-islamic-light overflow-hidden">
        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.06]" />
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-golden/5" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-golden via-golden-light to-golden" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-golden text-xl md:text-2xl font-serif mb-3" dir="rtl">
              المسكن
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              {t('hostel.title')}
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
              {t('hostelPage.subtitle')}
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="w-16 h-[1px] bg-golden/50" />
              <div className="w-2 h-2 rounded-full bg-golden" />
              <div className="w-16 h-[1px] bg-golden/50" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <section className="py-10 bg-gradient-to-r from-islamic-dark via-islamic to-islamic-light relative overflow-hidden">
        <div className="absolute inset-0 islamic-pattern-overlay opacity-[0.04]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {[
              { label: t('hostel.totalRooms'), value: totalRooms.toString(), icon: DoorOpen },
              { label: t('hostel.availableRooms'), value: availableRooms.toString(), icon: BedDouble },
              { label: t('hostelPage.totalSeats'), value: totalCapacity.toString(), icon: Users },
            ].map((stat, i) => (
              <motion.div key={i} variants={itemVariants}>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center border border-white/10 hover:bg-white/15 transition-colors">
                  <stat.icon className="w-6 h-6 text-golden mx-auto mb-2" />
                  <p className="text-xl md:text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-white/60 mt-1">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Room List */}
      <section className="py-12 bg-islamic-lighter/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-islamic-dark mb-6 flex items-center gap-2">
            <BedDouble className="w-5 h-5" />
            {t('hostelPage.roomList')}
          </h2>

          {hostelRooms.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {hostelRooms.map((room) => (
                <motion.div key={room.id} variants={itemVariants}>
                  <Card className="h-full hover:shadow-lg transition-shadow border border-gray-100">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-islamic-lighter flex items-center justify-center">
                            <DoorOpen className="w-6 h-6 text-islamic" />
                          </div>
                          <div>
                            <h3 className="font-bold text-islamic-dark">{t('hostelPage.roomNo', { number: room.roomNumber })}</h3>
                            <p className="text-sm text-muted-foreground">{t('hostel.floor')}: {room.floor}</p>
                          </div>
                        </div>
                        <Badge className={`text-xs border-0 ${statusConfig[room.status]?.cls || 'bg-gray-100 text-gray-700'}`}>
                          {statusConfig[room.status] ? t(statusConfig[room.status].labelKey) : room.status}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>{t('hostel.type')}: <span className="text-islamic-dark font-medium">{room.type}</span></p>
                        <p>{t('hostelPage.capacityInfo', { count: room.capacity })}</p>
                        <p>
                          {t('hostelPage.occupantsInfo', { count: room.currentOccupants })}
                        </p>
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              room.currentOccupants >= room.capacity
                                ? 'bg-red-500'
                                : room.currentOccupants >= room.capacity * 0.8
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                            }`}
                            style={{
                              width: `${Math.min((room.currentOccupants / room.capacity) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('hostelPage.seatsUsed', { used: room.currentOccupants, capacity: room.capacity })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <BedDouble className="size-16 opacity-15 mb-4" />
              <p className="text-base font-medium">{t('hostelPage.noRooms')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Meal Plan */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-islamic-dark mb-6 flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            {t('hostelPage.weeklyMenu')}
          </h2>

          {hostelMeals.length > 0 ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {[...dayOrder]
                .filter((day) => mealsByDay.has(day))
                .map((day) => {
                  const dayMeals = mealsByDay.get(day)![0];
                  return (
                    <motion.div key={day} variants={itemVariants}>
                      <Card className="h-full hover:shadow-lg transition-shadow border border-gray-100">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-bold text-islamic-dark flex items-center gap-2">
                            <Utensils className="w-4 h-4 text-golden" />
                            {day}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('hostelPage.morning')}:</span>
                            <span className="text-islamic-dark font-medium">{dayMeals.breakfast}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('hostelPage.noon')}:</span>
                            <span className="text-islamic-dark font-medium">{dayMeals.lunch}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('hostelPage.night')}:</span>
                            <span className="text-islamic-dark font-medium">{dayMeals.dinner}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Utensils className="size-16 opacity-15 mb-4" />
              <p className="text-base font-medium">{t('hostelPage.noMeals')}</p>
            </div>
          )}
        </div>
      </section>

      <BackToTop />
    </div>
  );
}
