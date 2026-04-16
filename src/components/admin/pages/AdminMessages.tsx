/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/api';
import { Mail, MailOpen, Eye } from 'lucide-react';
import type { ContactMessage } from '@/types';

export function AdminMessages() {
  const { toast } = useToast();
  const token = typeof window !== 'undefined' ? localStorage.getItem('madrasa_token') : '';

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
    setLoading(false);
  };

  useEffect(() => { loadMessages();  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await authFetch(`/api/messages/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) loadMessages();
    } catch {
      toast({ title: 'ত্রুটি', variant: 'destructive' });
    }
  };

  const viewMessage = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    setViewDialogOpen(true);
    if (!msg.isRead) markAsRead(msg.id);
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">বার্তা</h2>
        <p className="text-sm text-muted-foreground">
          মোট: {messages.length} টি {unreadCount > 0 && <Badge className="ml-1">{unreadCount} নতুন</Badge>}
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>নাম</TableHead>
                  <TableHead className="hidden sm:table-cell">ইমেইল</TableHead>
                  <TableHead>বিষয়</TableHead>
                  <TableHead className="text-center hidden md:table-cell">তারিখ</TableHead>
                  <TableHead className="text-right">কার্যক্রম</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">কোনো বার্তা নেই</TableCell></TableRow>
                ) : messages.map((msg) => (
                  <TableRow key={msg.id} className={!msg.isRead ? 'bg-primary/5' : ''}>
                    <TableCell>
                      {msg.isRead ? <MailOpen className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-primary" />}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{msg.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{msg.email}</TableCell>
                    <TableCell className="text-sm">{msg.subject}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground hidden md:table-cell">
                      {new Date(msg.createdAt).toLocaleDateString('bn-BD')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => viewMessage(msg)}>
                        <Eye className="h-3.5 w-3.5 mr-1" />দেখুন
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">নাম</p><p className="text-sm font-medium">{selectedMessage.name}</p></div>
                <div><p className="text-xs text-muted-foreground">ইমেইল</p><p className="text-sm">{selectedMessage.email}</p></div>
                <div><p className="text-xs text-muted-foreground">তারিখ</p><p className="text-sm">{new Date(selectedMessage.createdAt).toLocaleString('bn-BD')}</p></div>
                <div><p className="text-xs text-muted-foreground">অবস্থা</p><Badge variant={selectedMessage.isRead ? 'secondary' : 'default'}>{selectedMessage.isRead ? 'পড়া হয়েছে' : 'নতুন'}</Badge></div>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm leading-relaxed">{selectedMessage.message}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
