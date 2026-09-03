'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, BookMarked, Loader2, BookOpenText, ArrowRightLeft } from 'lucide-react';
import { dbPush, dbUpdate, dbRemove, dbSubscribe } from '@/lib/db-service';
import { useTranslation } from '@/lib/i18n-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  totalCopies: number;
  availableCopies: number;
  shelf: string;
  createdAt: number;
}

interface BookIssue {
  id: string;
  bookId: string;
  bookTitle: string;
  studentName: string;
  studentRoll: string;
  issueDate: string;
  returnDate: string;
  status: 'issued' | 'returned' | 'overdue';
  returnedOn?: string;
  wasOverdue?: boolean;
  createdAt: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const EMPTY_BOOK_FORM = {
  title: '',
  author: '',
  category: '',
  isbn: '',
  totalCopies: '1',
  availableCopies: '1',
  shelf: '',
};

const EMPTY_ISSUE_FORM = {
  bookId: '',
  bookTitle: '',
  studentName: '',
  studentRoll: '',
  returnDate: '',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminLibrary() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [books, setBooks] = useState<Book[]>([]);
  const [issues, setIssues] = useState<BookIssue[]>([]);
  const [activeTab, setActiveTab] = useState<'books' | 'issues'>('books');

  /* Book Dialog */
  const [bookDialogOpen, setBookDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookForm, setBookForm] = useState(EMPTY_BOOK_FORM);
  const [bookSubmitting, setBookSubmitting] = useState(false);

  /* Issue Dialog */
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [issueForm, setIssueForm] = useState(EMPTY_ISSUE_FORM);
  const [issueSubmitting, setIssueSubmitting] = useState(false);

  /* Delete */
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [deleting, setDeleting] = useState(false);

  /* Subscribe to data */
  useEffect(() => {
    const unsubBooks = dbSubscribe('/libraryBooks', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: Book[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setBooks(list);
      } else {
        setBooks([]);
      }
    });

    const unsubIssues = dbSubscribe('/libraryIssues', (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: BookIssue[] = Object.entries(data).map(([id, item]: [string, any]) => ({
          ...item, id,
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setIssues(list);
      } else {
        setIssues([]);
      }
    });

    return () => { unsubBooks(); unsubIssues(); };
  }, []);

  /* Book handlers */
  const resetAndOpenBook = useCallback(() => {
    setEditingBook(null);
    setBookForm(EMPTY_BOOK_FORM);
    setBookDialogOpen(true);
  }, []);

  const openEditBook = useCallback((book: Book) => {
    setEditingBook(book);
    setBookForm({
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      totalCopies: String(book.totalCopies),
      availableCopies: String(book.availableCopies),
      shelf: book.shelf,
    });
    setBookDialogOpen(true);
  }, []);

  const handleSubmitBook = async () => {
    if (!bookForm.title.trim()) {
      toast({ title: t('common.error'), description: t('adminLibrary.bookRequired'), variant: 'destructive' });
      return;
    }

    setBookSubmitting(true);
    try {
      const payload = {
        title: bookForm.title.trim(),
        author: bookForm.author.trim(),
        category: bookForm.category.trim(),
        isbn: bookForm.isbn.trim(),
        totalCopies: Number(bookForm.totalCopies) || 1,
        availableCopies: Number(bookForm.availableCopies) || 0,
        shelf: bookForm.shelf.trim(),
      };

      if (editingBook) {
        await dbUpdate('/libraryBooks/' + editingBook.id, payload);
        toast({ title: t('common.success'), description: t('adminLibrary.updated') });
      } else {
        await dbPush('/libraryBooks', { ...payload, createdAt: Date.now() });
        toast({ title: t('common.success'), description: t('adminLibrary.created') });
      }
      setBookDialogOpen(false);
      setBookForm(EMPTY_BOOK_FORM);
      setEditingBook(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.operationFailed'), variant: 'destructive' });
    } finally {
      setBookSubmitting(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dbRemove('/libraryBooks/' + deleteTarget.id);
      toast({ title: t('common.success'), description: t('adminLibrary.deleted') });
      setDeleteTarget(null);
    } catch {
      toast({ title: t('common.error'), description: t('common.deleteFailed'), variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  /* Issue handlers */
  const openIssueDialog = () => {
    setIssueForm(EMPTY_ISSUE_FORM);
    setIssueDialogOpen(true);
  };

  const handleIssueBook = async () => {
    if (!issueForm.bookId || !issueForm.studentName.trim()) {
      toast({ title: t('common.error'), description: t('adminLibrary.issueRequired'), variant: 'destructive' });
      return;
    }

    const selectedBook = books.find((b) => b.id === issueForm.bookId);
    if (selectedBook && selectedBook.availableCopies <= 0) {
      toast({ title: t('common.error'), description: t('adminLibrary.noCopies'), variant: 'destructive' });
      return;
    }

    setIssueSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await dbPush('/libraryIssues', {
        bookId: issueForm.bookId,
        bookTitle: selectedBook?.title || '',
        studentName: issueForm.studentName.trim(),
        studentRoll: issueForm.studentRoll.trim(),
        issueDate: today,
        returnDate: issueForm.returnDate,
        status: 'issued',
        createdAt: Date.now(),
      });

      // Decrement available copies
      if (selectedBook) {
        await dbUpdate('/libraryBooks/' + selectedBook.id, {
          availableCopies: Math.max(0, selectedBook.availableCopies - 1),
        });
      }

      toast({ title: t('common.success'), description: t('adminLibrary.issuedToast') });
      setIssueDialogOpen(false);
      setIssueForm(EMPTY_ISSUE_FORM);
    } catch {
      toast({ title: t('common.error'), description: t('adminLibrary.issueFailed'), variant: 'destructive' });
    } finally {
      setIssueSubmitting(false);
    }
  };

  /* Return book */
  const handleReturnBook = async (issue: BookIssue) => {
    // Guard: already returned — prevent duplicate submission
    if (issue.status === 'returned') {
      toast({ title: t('adminLibrary.info'), description: t('adminLibrary.alreadyReturned'), variant: 'destructive' });
      return;
    }

    // Guard: prevent rapid double-clicks
    if (issue.returnedOn) {
      toast({ title: t('adminLibrary.info'), description: t('adminLibrary.alreadyReturned'), variant: 'destructive' });
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const returnDate = issue.returnDate;
      const isOverdue = returnDate && today > returnDate;

      // Always set status to 'returned' — overdue is just informational
      await dbUpdate('/libraryIssues/' + issue.id, {
        status: 'returned',
        returnedOn: today,
        wasOverdue: isOverdue ? true : false,
      });

      // Increment available copies (cap at totalCopies)
      const book = books.find((b) => b.id === issue.bookId);
      if (book) {
        const newAvailable = Math.min(book.availableCopies + 1, book.totalCopies);
        await dbUpdate('/libraryBooks/' + book.id, {
          availableCopies: newAvailable,
        });
      }

      toast({
        title: t('common.success'),
        description: isOverdue
          ? t('adminLibrary.returnedLateToast')
          : t('adminLibrary.returnedOk'),
      });
    } catch {
      toast({ title: t('common.error'), description: t('adminLibrary.returnFailed'), variant: 'destructive' });
    }
  };

  /* Check overdue issues */
  useEffect(() => {
    const checkOverdue = async () => {
      const today = new Date().toISOString().split('T')[0];
      for (const issue of issues) {
        // Only mark as overdue if still issued (not yet returned)
        if (issue.status === 'issued' && issue.returnDate && issue.returnDate < today) {
          try {
            await dbUpdate('/libraryIssues/' + issue.id, { status: 'overdue' });
          } catch {
            // silent fail
          }
        }
      }
    };
    if (issues.length > 0) checkOverdue();
  }, [issues]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-islamic-dark">{t('adminLibrary.title')}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('adminLibrary.stats', {
              books: books.length,
              issued: issues.filter((i) => i.status === 'issued').length,
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'books' ? 'default' : 'outline'}
            onClick={() => setActiveTab('books')}
            className={`gap-2 cursor-pointer ${activeTab === 'books' ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
          >
            <BookMarked className="size-4" />
            {t('adminLibrary.tabBooks')}
          </Button>
          <Button
            variant={activeTab === 'issues' ? 'default' : 'outline'}
            onClick={() => setActiveTab('issues')}
            className={`gap-2 cursor-pointer ${activeTab === 'issues' ? 'bg-islamic hover:bg-islamic-light text-white' : ''}`}
          >
            <ArrowRightLeft className="size-4" />
            {t('adminLibrary.tabIssues')}
          </Button>
        </div>
      </div>

      {activeTab === 'books' ? (
        <>
          {/* Books List */}
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              {books.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('common.title')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminLibrary.author')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminLibrary.category')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('adminLibrary.copies')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {books.map((book) => (
                        <TableRow key={book.id}>
                          <TableCell className="py-3">
                            <p className="font-medium text-sm text-islamic-dark">{book.title}</p>
                            {book.isbn && <p className="text-xs text-muted-foreground">ISBN: {book.isbn}</p>}
                          </TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{book.author || '—'}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{book.category || '—'}</TableCell>
                          <TableCell className="py-3 text-center">
                            <Badge variant="secondary" className="text-xs">
                              {book.availableCopies}/{book.totalCopies}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-islamic cursor-pointer"
                                onClick={() => openEditBook(book)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-red-600 cursor-pointer"
                                onClick={() => setDeleteTarget(book)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <BookOpenText className="size-12 opacity-20 mb-3" />
                  <p className="text-sm">{t('adminLibrary.noBooks')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Books Mobile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {books.length > 0 ? books.map((book) => (
              <Card key={book.id} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{book.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{book.author || '—'}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => openEditBook(book)}><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="size-7" onClick={() => setDeleteTarget(book)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {book.category && <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium">{book.category}</span>}
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">{t('adminLibrary.copiesMobile', { available: book.availableCopies, total: book.totalCopies })}</span>
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <BookOpenText className="size-10 opacity-20 mb-2" />
                <p className="text-sm">{t('adminLibrary.noBooks')}</p>
              </div>
            )}
          </div>

          {/* Add Book Button */}
          <div className="flex justify-end">
            <Button
              onClick={resetAndOpenBook}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
            >
              <Plus className="size-4" />
              {t('adminLibrary.addBook')}
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Issue Button */}
          <div className="flex justify-end">
            <Button
              onClick={openIssueDialog}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
            >
              <Plus className="size-4" />
              {t('adminLibrary.newIssue')}
            </Button>
          </div>

          {/* Issues List */}
          <Card className="shadow-sm hidden md:block">
            <CardContent className="p-0">
              {issues.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminLibrary.book')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminLibrary.student')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminLibrary.issueDate')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground">{t('adminLibrary.returnDate')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-center">{t('common.status')}</TableHead>
                        <TableHead className="text-xs font-semibold text-muted-foreground text-right">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {issues.map((issue) => (
                        <TableRow key={issue.id}>
                          <TableCell className="font-medium text-sm text-islamic-dark py-3">
                            {issue.bookTitle}
                          </TableCell>
                          <TableCell className="text-sm py-3">
                            <p>{issue.studentName}</p>
                            <p className="text-xs text-muted-foreground">{t('adminLibrary.roll')}: {issue.studentRoll || '—'}</p>
                          </TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{issue.issueDate}</TableCell>
                          <TableCell className="text-sm py-3 text-muted-foreground">{issue.returnDate || '—'}</TableCell>
                          <TableCell className="py-3 text-center">
                            <Badge className={`text-xs ${
                              issue.status === 'issued' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              issue.status === 'returned' ? 'bg-green-100 text-green-700 border-green-200' :
                              'bg-red-100 text-red-700 border-red-200'
                            }`}>
                              {issue.status === 'issued' ? t('library.issued') :
                               issue.status === 'returned' ? t('adminLibrary.returned') : t('adminLibrary.overdue')}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-right">
                            {issue.status === 'issued' || issue.status === 'overdue' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReturnBook(issue)}
                                disabled={!!issue.returnedOn}
                                className="text-xs cursor-pointer"
                              >
                                {t('adminLibrary.returnBtn')}
                              </Button>
                            ) : (
                              <div className="flex flex-col items-end gap-0.5">
                                <span className="text-xs text-muted-foreground">{issue.returnedOn}</span>
                                {issue.wasOverdue && (
                                  <span className="text-[10px] text-orange-600">{t('adminLibrary.returnedLate')}</span>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <ArrowRightLeft className="size-12 opacity-20 mb-3" />
                  <p className="text-sm">{t('adminLibrary.noIssues')}</p>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Issues Mobile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {issues.length > 0 ? issues.map((issue) => (
              <Card key={issue.id} className="shadow-sm">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{issue.bookTitle}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{issue.studentName} • {t('adminLibrary.roll')}: {issue.studentRoll || '—'}</p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      {(issue.status === 'issued' || issue.status === 'overdue') && !issue.returnedOn && (
                        <Button variant="ghost" size="icon" className="size-7 text-green-600 cursor-pointer" onClick={() => handleReturnBook(issue)}><ArrowRightLeft className="size-3.5" /></Button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {issue.returnDate && <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium">{t('adminLibrary.returnBy', { date: issue.returnDate })}</span>}
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      issue.status === 'issued' ? 'bg-blue-100 text-blue-700' :
                      issue.status === 'returned' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>{issue.status === 'issued' ? t('library.issued') : issue.status === 'returned' ? t('adminLibrary.returned') : t('adminLibrary.overdue')}</span>
                    {issue.status === 'returned' && issue.wasOverdue && (
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700">{t('adminLibrary.returnedLate')}</span>
                    )}
                    {issue.returnedOn && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{t('adminLibrary.returnedOn', { date: issue.returnedOn })}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ArrowRightLeft className="size-10 opacity-20 mb-2" />
                <p className="text-sm">{t('adminLibrary.noIssues')}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Book Create/Edit Dialog */}
      <Dialog open={bookDialogOpen} onOpenChange={(open) => {
        setBookDialogOpen(open);
        if (!open) { setEditingBook(null); setBookForm(EMPTY_BOOK_FORM); }
      }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">
              {editingBook ? t('adminLibrary.bookEditTitle') : t('adminLibrary.addBook')}
            </DialogTitle>
            <DialogDescription>
              {editingBook ? t('adminLibrary.bookEditDesc') : t('adminLibrary.bookAddDesc')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="book-title">{t('adminLibrary.bookName')} *</Label>
              <Input
                id="book-title"
                placeholder={t('adminLibrary.bookName')}
                value={bookForm.title}
                onChange={(e) => setBookForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="book-author">{t('adminLibrary.author')}</Label>
                <Input
                  id="book-author"
                  placeholder={t('adminLibrary.authorPlaceholder')}
                  value={bookForm.author}
                  onChange={(e) => setBookForm((f) => ({ ...f, author: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-category">{t('adminLibrary.category')}</Label>
                <Input
                  id="book-category"
                  placeholder={t('adminLibrary.categoryPlaceholder')}
                  value={bookForm.category}
                  onChange={(e) => setBookForm((f) => ({ ...f, category: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="book-isbn">ISBN</Label>
                <Input
                  id="book-isbn"
                  placeholder={t('adminLibrary.isbnPlaceholder')}
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm((f) => ({ ...f, isbn: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-shelf">{t('adminLibrary.shelf')}</Label>
                <Input
                  id="book-shelf"
                  placeholder={t('adminLibrary.shelfPlaceholder')}
                  value={bookForm.shelf}
                  onChange={(e) => setBookForm((f) => ({ ...f, shelf: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="book-total">{t('adminLibrary.totalCopies')}</Label>
                <Input
                  id="book-total"
                  type="number"
                  placeholder="1"
                  value={bookForm.totalCopies}
                  onChange={(e) => setBookForm((f) => ({ ...f, totalCopies: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="book-available">{t('adminLibrary.availableCopies')}</Label>
                <Input
                  id="book-available"
                  type="number"
                  placeholder="1"
                  value={bookForm.availableCopies}
                  onChange={(e) => setBookForm((f) => ({ ...f, availableCopies: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setBookDialogOpen(false); setEditingBook(null); setBookForm(EMPTY_BOOK_FORM); }}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmitBook}
              disabled={bookSubmitting}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
            >
              {bookSubmitting && <Loader2 className="size-4 animate-spin" />}
              {editingBook ? t('common.update') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Dialog */}
      <Dialog open={issueDialogOpen} onOpenChange={(open) => setIssueDialogOpen(open)}>
        <DialogContent className="sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-islamic-dark">{t('adminLibrary.issueTitle')}</DialogTitle>
            <DialogDescription>{t('adminLibrary.issueDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t('adminLibrary.selectBook')} *</Label>
              <Select value={issueForm.bookId} onValueChange={(val) => {
                const book = books.find((b) => b.id === val);
                setIssueForm((f) => ({ ...f, bookId: val, bookTitle: book?.title || '' }));
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('adminLibrary.selectBook')} />
                </SelectTrigger>
                <SelectContent>
                  {books.filter((b) => b.availableCopies > 0).map((book) => (
                    <SelectItem key={book.id} value={book.id}>
                      {t('adminLibrary.bookOption', { title: book.title, available: book.availableCopies })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issue-studentName">{t('adminLibrary.studentName')} *</Label>
                <Input
                  id="issue-studentName"
                  placeholder={t('adminLibrary.studentName')}
                  value={issueForm.studentName}
                  onChange={(e) => setIssueForm((f) => ({ ...f, studentName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue-studentRoll">{t('adminLibrary.rollNumber')}</Label>
                <Input
                  id="issue-studentRoll"
                  placeholder={t('adminLibrary.rollNumber')}
                  value={issueForm.studentRoll}
                  onChange={(e) => setIssueForm((f) => ({ ...f, studentRoll: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue-returnDate">{t('adminLibrary.returnDateLabel')}</Label>
              <Input
                id="issue-returnDate"
                type="date"
                value={issueForm.returnDate}
                onChange={(e) => setIssueForm((f) => ({ ...f, returnDate: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIssueDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button
              onClick={handleIssueBook}
              disabled={issueSubmitting}
              className="bg-islamic hover:bg-islamic-light text-white gap-2 cursor-pointer"
            >
              {issueSubmitting && <Loader2 className="size-4 animate-spin" />}
              {t('adminLibrary.issueBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('adminLibrary.deleteDesc', { title: deleteTarget?.title ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBook}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white gap-2 cursor-pointer"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {t('common.confirmDelete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
