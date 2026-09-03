'use client';

import { useState } from 'react';
import { Mail, MailOpen, Trash2, Eye, Search, Inbox, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { dbRemove, dbUpdate } from '@/lib/db-service';
import { useTranslation } from '@/lib/i18n-context';
import type { ContactMessage } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function AdminMessages() {
  const { contactMessages, logActivity } = useAppStore();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const unreadCount = contactMessages.filter((m) => !m.isRead).length;

  const filtered = contactMessages.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.phone.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q)
    );
  });

  const handleMarkRead = async (msg: ContactMessage) => {
    try {
      await dbUpdate(`/contactMessages/${msg.id}`, { isRead: true });
      toast({ title: t('common.success'), description: t('adminMessages.markedRead') });
      logActivity('মেসেজ', `"${msg.name}" এর মেসেজ পড়া হয়েছে`);
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await dbRemove(`/contactMessages/${id}`);
      toast({ title: t('common.success'), description: t('common.deleted') });
      logActivity('মেসেজ', 'একটি কন্টাক্ট মেসেজ মুছে ফেলা হয়েছে');
      setSelectedMessage(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      for (const m of contactMessages.filter((m) => !m.isRead)) {
        await dbUpdate(`/contactMessages/${m.id}`, { isRead: true });
      }
      toast({ title: t('common.success'), description: t('adminMessages.allMarkedRead') });
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('admin.messages')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminMessages.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge className="bg-red-100 text-red-700 border-red-200">
              <Mail className="w-3 h-3 mr-1" />
              {t('adminMessages.unreadCount', { count: unreadCount })}
            </Badge>
          )}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="gap-1.5 text-xs"
            >
              <MailOpen className="w-3.5 h-3.5" />
              {t('adminMessages.markAllRead')}
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('adminMessages.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Messages List */}
      {filtered.length > 0 ? (
        <div className="grid gap-3">
          {filtered.map((msg) => (
            <Card
              key={msg.id}
              className={`cursor-pointer hover:shadow-md transition-all ${
                !msg.isRead ? 'border-islamic/30 bg-islamic-lighter/30' : 'border-gray-100'
              }`}
              onClick={() => {
                setSelectedMessage(msg);
                if (!msg.isRead) handleMarkRead(msg);
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!msg.isRead && (
                        <span className="w-2 h-2 rounded-full bg-islamic shrink-0" />
                      )}
                      <span className="text-sm font-semibold text-islamic-dark truncate">
                        {msg.name}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1 mb-2">{msg.message}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{msg.phone}</span>
                      <span>{formatDate(msg.date)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!msg.isRead && (
                      <Badge className="bg-islamic/10 text-islamic text-xs border-0">
                        {t('admin.newMessage')}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {searchQuery ? t('adminMessages.noResults') : t('adminMessages.noMessages')}
          </p>
        </div>
      )}

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg text-islamic-dark">{selectedMessage?.name}</DialogTitle>
            <DialogDescription>
              {selectedMessage && formatDate(selectedMessage.date)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{t('common.phone')}</p>
                  <p className="font-medium">{selectedMessage.phone}</p>
                </div>
                {selectedMessage.email && (
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">{t('common.email')}</p>
                    <p className="font-medium">{selectedMessage.email}</p>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div>
                <p className="text-muted-foreground text-xs mb-2">{t('adminMessages.messageLabel')}</p>
                <p className="text-sm leading-relaxed bg-gray-50 p-3 rounded-lg">
                  {selectedMessage.message}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="gap-1.5">
                {t('common.close')}
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => selectedMessage && handleDelete(selectedMessage.id)}
              disabled={deleting === selectedMessage?.id}
              className="gap-1.5"
            >
              {deleting === selectedMessage?.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
