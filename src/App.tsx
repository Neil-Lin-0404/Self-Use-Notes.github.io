import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  User, 
  FileText, 
  Star, 
  Folder, 
  Archive, 
  Plus, 
  Menu,
  ArrowLeft,
  Edit2,
  Trash2,
  MoreVertical,
  Link as LinkIcon,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  Bold,
  Italic,
  List,
  Image as ImageIcon,
  Mic,
  Share2,
  History,
  Pin,
  Bookmark,
  Zap,
  LogIn,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db, auth, signIn, logout } from './firebase';
import { cn } from './lib/utils';
import { Note, ViewState } from './types';

// Error Handling Spec
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We'll show a toast or alert instead of throwing to keep the app running
  alert(`Firestore Error: ${errInfo.error}`);
}

export default function App() {
  const [view, setView] = useState<ViewState>('list');
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'pinned'>('all');

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Notes Listener
  useEffect(() => {
    if (!user) {
      setNotes([]);
      return;
    }

    const q = query(
      collection(db, 'notes'), 
      where('uid', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      setNotes(fetchedNotes);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notes');
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateNote = async (noteData: Partial<Note>) => {
    if (!user) return;
    try {
      const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      await addDoc(collection(db, 'notes'), {
        ...noteData,
        uid: user.uid,
        date: now,
        modifiedDate: now,
        authorName: user.displayName,
        authorAvatar: user.photoURL,
        createdAt: serverTimestamp(),
      });
      setView('list');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notes');
    }
  };

  const handleUpdateNote = async (noteId: string, noteData: Partial<Note>) => {
    if (!user) return;
    try {
      const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      await updateDoc(doc(db, 'notes', noteId), {
        ...noteData,
        modifiedDate: now,
      });
      setView('list');
      setSelectedNote(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notes/${noteId}`);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      setView('list');
      setSelectedNote(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notes/${noteId}`);
    }
  };

  const toggleFavorite = async (note: Note) => {
    try {
      await updateDoc(doc(db, 'notes', note.id), {
        isFavorite: !note.isFavorite
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notes/${note.id}`);
    }
  };

  const togglePin = async (note: Note) => {
    try {
      await updateDoc(doc(db, 'notes', note.id), {
        isPinned: !note.isPinned
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notes/${note.id}`);
    }
  };

  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setView('view');
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setView('create');
  };

  const handleBack = () => {
    setView('list');
    setSelectedNote(null);
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         note.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'favorites' && note.isFavorite) || 
                         (filter === 'pinned' && note.isPinned);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md"
        >
          <h1 className="font-headline text-5xl font-extrabold mb-6">Notebook</h1>
          <p className="text-on-surface-variant mb-8 text-lg">
            A refined space for your thoughts and explorations. Sign in to start syncing your notes across all devices.
          </p>
          <button 
            onClick={signIn}
            className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition-transform mx-auto"
          >
            <LogIn size={24} />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-on-surface font-body">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-surface-container transition-transform lg:relative lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="p-8 pb-4">
          <h1 className="font-headline text-2xl font-bold tracking-tight">My Notes</h1>
          <p className="text-sm text-on-surface-variant">Personal Workspace</p>
        </div>
        <nav className="mt-8 px-4 space-y-2">
          <SidebarLink 
            icon={<FileText size={20} />} 
            label="All Notes" 
            active={filter === 'all'} 
            onClick={() => { setFilter('all'); setView('list'); }}
          />
          <SidebarLink 
            icon={<Star size={20} />} 
            label="Favorites" 
            active={filter === 'favorites'} 
            onClick={() => { setFilter('favorites'); setView('list'); }}
          />
          <SidebarLink 
            icon={<Pin size={20} />} 
            label="Pinned" 
            active={filter === 'pinned'} 
            onClick={() => { setFilter('pinned'); setView('list'); }}
          />
          <SidebarLink icon={<Folder size={20} />} label="Notebooks" />
          <SidebarLink icon={<Archive size={20} />} label="Archive" />
          <div className="pt-8">
            <button 
              onClick={logout}
              className="flex items-center gap-4 px-6 py-4 rounded-full w-full hover:bg-error-container text-error font-medium transition-colors"
            >
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        {/* Top Bar */}
        <header className="h-20 flex items-center justify-between px-8 bg-surface/50 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-surface-container-high rounded-full transition-colors"
            >
              <Menu size={24} />
            </button>
            {view !== 'list' && (
              <button 
                onClick={handleBack}
                className="p-2 hover:bg-surface-container-high rounded-full transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <div className="relative flex-1 max-w-md hidden md:block">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input 
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-container-high border-none rounded-full py-2 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/40 transition-all outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="md:hidden p-3 hover:bg-surface-container-high rounded-full transition-colors">
              <Search size={20} />
            </button>
            <div className="p-1">
              <img src={user.photoURL || ''} alt="User" className="w-10 h-10 rounded-full border-2 border-primary/20" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        {/* View Container */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {view === 'list' && (
              <motion.div 
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 lg:p-12 max-w-7xl mx-auto"
              >
                <div className="mb-12">
                  <h3 className="font-headline text-4xl lg:text-5xl font-extrabold leading-tight mb-2">
                    {filter === 'all' ? 'Thoughts &' : filter === 'favorites' ? 'Favorite' : 'Pinned'} <br />
                    <span className="text-primary">{filter === 'all' ? 'Explorations' : 'Notes'}</span>
                  </h3>
                  <div className="flex gap-3 mt-4">
                    <span className="bg-surface-container-high px-4 py-1.5 rounded-full text-xs font-semibold text-on-surface-variant tracking-wide">
                      LATEST: {filteredNotes[0]?.date || 'N/A'}
                    </span>
                    <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide">
                      {filteredNotes.length} NOTES
                    </span>
                  </div>
                </div>

                {filteredNotes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-on-surface-variant">
                    <div className="bg-surface-container p-6 rounded-full mb-4">
                      <FileText size={48} className="opacity-20" />
                    </div>
                    <p className="text-lg font-medium">No notes found</p>
                    <p className="text-sm">Try a different search or filter.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredNotes.map((note) => (
                      <NoteCard 
                        key={note.id} 
                        note={note} 
                        onClick={() => handleViewNote(note)}
                        onFavorite={() => toggleFavorite(note)}
                        onPin={() => togglePin(note)}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {view === 'create' && (
              <motion.div 
                key="create"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="p-8 lg:p-12 max-w-4xl mx-auto"
              >
                <NoteEditor 
                  initialNote={selectedNote}
                  onCancel={handleBack} 
                  onSave={(data) => selectedNote ? handleUpdateNote(selectedNote.id, data) : handleCreateNote(data)} 
                />
              </motion.div>
            )}

            {view === 'view' && selectedNote && (
              <motion.div 
                key="view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 lg:p-12 max-w-4xl mx-auto"
              >
                <NoteViewer 
                  note={selectedNote} 
                  onDelete={() => handleDeleteNote(selectedNote.id)} 
                  onEdit={() => handleEditNote(selectedNote)}
                  onFavorite={() => toggleFavorite(selectedNote)}
                  onPin={() => togglePin(selectedNote)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FAB */}
        {view === 'list' && (
          <button 
            onClick={() => setView('create')}
            className="fixed bottom-12 right-12 w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform z-20"
          >
            <Plus size={32} />
          </button>
        )}
      </main>
    </div>
  );
}

function SidebarLink({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 px-6 py-4 rounded-full transition-colors w-full text-left",
        active ? "bg-primary-fixed text-primary font-semibold" : "hover:bg-surface-container-high text-on-surface-variant font-medium"
      )}
    >
      {icon}
      <span className="font-label">{label}</span>
    </button>
  );
}

function NoteCard({ note, onClick, onFavorite, onPin }: { note: Note, onClick: () => void, onFavorite: () => void | Promise<void>, onPin: () => void | Promise<void>, key?: React.Key }) {
  const isFeatured = note.category === 'Project Alpha';
  
  return (
    <article 
      onClick={onClick}
      className={cn(
        "rounded-xl p-8 transition-all hover:-translate-y-1 cursor-pointer group relative",
        isFeatured ? "bg-primary text-white shadow-lg" : "bg-surface-container-lowest shadow-sm border border-transparent hover:border-outline-variant/10"
      )}
    >
      <div className="flex justify-between items-start mb-6">
        <span className={cn(
          "text-xs font-bold font-label uppercase tracking-widest",
          isFeatured ? "text-white/80" : "text-on-surface-variant"
        )}>
          {note.category}
        </span>
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onFavorite(); }}
            className={cn("p-1 rounded-full hover:bg-black/5 transition-colors", note.isFavorite ? "text-tertiary" : "text-on-surface-variant/40")}
          >
            <Star size={18} className={cn(note.isFavorite && "fill-tertiary")} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onPin(); }}
            className={cn("p-1 rounded-full hover:bg-black/5 transition-colors", note.isPinned ? (isFeatured ? "text-white" : "text-primary") : "text-on-surface-variant/40")}
          >
            <Pin size={18} className={cn(note.isPinned && "fill-current")} />
          </button>
        </div>
      </div>
      
      <h4 className="font-headline text-2xl font-bold mb-6 leading-snug">
        {note.title}
      </h4>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <TrendingUp size={18} className={cn("mt-1 shrink-0", isFeatured ? "text-white" : "text-primary")} />
          <p className={cn("text-sm line-clamp-2", isFeatured ? "text-white/90" : "text-on-surface-variant")}>
            <strong className={isFeatured ? "text-white" : "text-on-surface"}>Pros:</strong> {note.pros?.[0] || 'N/A'}
          </p>
        </div>
        <div className="flex gap-4">
          <TrendingDown size={18} className={cn("mt-1 shrink-0", isFeatured ? "text-white" : "text-error")} />
          <p className={cn("text-sm line-clamp-2", isFeatured ? "text-white/90" : "text-on-surface-variant")}>
            <strong className={isFeatured ? "text-white" : "text-on-surface"}>Cons:</strong> {note.cons?.[0] || 'N/A'}
          </p>
        </div>
      </div>
      
      <div className={cn(
        "mt-8 pt-6 border-t flex items-center gap-2",
        isFeatured ? "border-white/10" : "border-outline-variant/10"
      )}>
        {note.authorAvatar ? (
          <img src={note.authorAvatar} alt="Avatar" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-secondary-fixed flex items-center justify-center text-[10px] font-bold text-on-secondary-fixed">
            {note.authorName?.charAt(0) || 'U'}
          </div>
        )}
        <span className={cn("text-xs font-medium", isFeatured ? "text-white/60" : "text-on-surface-variant")}>
          Edited {note.date}
        </span>
      </div>
    </article>
  );
}

function NoteEditor({ initialNote, onCancel, onSave }: { initialNote?: Note | null, onCancel: () => void, onSave: (data: Partial<Note>) => void }) {
  const [title, setTitle] = useState(initialNote?.title || '');
  const [category, setCategory] = useState(initialNote?.category || '');
  const [refUrl, setRefUrl] = useState(initialNote?.referenceUrl || '');
  const [pros, setPros] = useState(initialNote?.pros?.join('\n') || '');
  const [cons, setCons] = useState(initialNote?.cons?.join('\n') || '');
  const [solution, setSolution] = useState(initialNote?.solution || '');

  const handleSave = () => {
    if (!title || !category) {
      alert('Title and Category are required');
      return;
    }
    onSave({
      title,
      category,
      referenceUrl: refUrl,
      pros: pros.split('\n').filter(p => p.trim()),
      cons: cons.split('\n').filter(c => c.trim()),
      solution,
      tags: category.split(',').map(t => t.trim()),
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-12">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-semibold mb-2 uppercase">
            {initialNote ? 'EDITING' : 'DRAFT'}
          </span>
          <h2 className="font-headline text-4xl font-bold leading-tight tracking-tight">
            {initialNote ? 'Refine Synthesis' : 'New Synthesis'}
          </h2>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="px-6 py-2.5 rounded-full font-medium text-on-surface-variant hover:bg-surface-container-high transition-all">
            Cancel
          </button>
          <button onClick={handleSave} className="px-8 py-2.5 rounded-full font-medium bg-gradient-to-r from-primary to-primary-container text-white shadow-lg hover:shadow-primary/20 transition-all">
            {initialNote ? 'Update' : 'Save'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant px-1">Document Title</label>
          <input 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-surface-container-lowest border-none rounded-xl p-4 text-lg font-headline focus:ring-2 focus:ring-primary/40 placeholder:text-outline-variant transition-all outline-none" 
            placeholder="Enter note title..." 
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant px-1">Category / Project</label>
          <input 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-surface-container-high border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/40 placeholder:text-outline-variant transition-all outline-none" 
            placeholder="e.g. Tech Design" 
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant px-1">Reference Link</label>
        <div className="relative">
          <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input 
            value={refUrl}
            onChange={(e) => setRefUrl(e.target.value)}
            className="w-full bg-surface-container-high border-none rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/40 placeholder:text-outline-variant transition-all outline-none" 
            placeholder="https://..." 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-transparent hover:border-outline-variant/10 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
              <TrendingUp size={16} />
            </div>
            <label className="text-sm font-semibold">Key Advantages (One per line)</label>
          </div>
          <textarea 
            value={pros}
            onChange={(e) => setPros(e.target.value)}
            className="w-full bg-transparent border-none resize-none p-0 focus:ring-0 placeholder:text-outline-variant leading-relaxed outline-none" 
            placeholder="What are the strong points?" 
            rows={6}
          />
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-transparent hover:border-outline-variant/10 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-error-container flex items-center justify-center text-error">
              <TrendingDown size={16} />
            </div>
            <label className="text-sm font-semibold">Identified Risks (One per line)</label>
          </div>
          <textarea 
            value={cons}
            onChange={(e) => setCons(e.target.value)}
            className="w-full bg-transparent border-none resize-none p-0 focus:ring-0 placeholder:text-outline-variant leading-relaxed outline-none" 
            placeholder="Where are the vulnerabilities?" 
            rows={6}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-sm border border-transparent overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tertiary to-tertiary-container flex items-center justify-center text-white">
            <Lightbulb size={20} />
          </div>
          <label className="text-lg font-headline font-semibold">Strategic Solution</label>
        </div>
        <textarea 
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          className="w-full bg-transparent border-none resize-none p-0 focus:ring-0 text-lg placeholder:text-outline-variant leading-relaxed outline-none" 
          placeholder="Synthesize the findings into a clear path forward..." 
          rows={8}
        />
      </div>

      {/* Formatting Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-2xl px-6 py-3 rounded-full border border-outline-variant/10 shadow-xl flex items-center gap-6 z-50">
        <button className="text-on-surface-variant hover:text-primary transition-colors"><Bold size={20} /></button>
        <button className="text-on-surface-variant hover:text-primary transition-colors"><Italic size={20} /></button>
        <button className="text-on-surface-variant hover:text-primary transition-colors"><List size={20} /></button>
        <div className="w-px h-6 bg-outline-variant/30"></div>
        <button className="text-on-surface-variant hover:text-primary transition-colors"><ImageIcon size={20} /></button>
        <button className="text-on-surface-variant hover:text-primary transition-colors"><Mic size={20} /></button>
      </div>
    </div>
  );
}

function NoteViewer({ note, onDelete, onEdit, onFavorite, onPin }: { note: Note, onDelete: () => void | Promise<void>, onEdit: () => void, onFavorite: () => void | Promise<void>, onPin: () => void | Promise<void> }) {
  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-primary-fixed text-primary text-xs font-bold rounded-full uppercase tracking-widest">
            {note.category}
          </span>
          <span className="text-on-surface-variant text-sm font-label">Modified {note.modifiedDate || note.date}</span>
        </div>
        <h2 className="font-headline text-5xl font-extrabold leading-tight mb-6">
          {note.title}
        </h2>
        {note.referenceUrl && (
          <div className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl group cursor-pointer border border-transparent hover:border-outline-variant/20 transition-all">
            <LinkIcon size={20} className="text-primary" />
            <a className="text-primary font-medium hover:underline truncate" href={note.referenceUrl} target="_blank" rel="noreferrer">
              {note.referenceUrl}
            </a>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ThumbsUp size={20} className="text-primary fill-primary" />
            </div>
            <h3 className="font-headline text-2xl font-bold">Pros</h3>
          </div>
          <ul className="space-y-4">
            {note.pros?.map((pro, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="text-primary mt-1">•</span>
                <p className="text-on-surface-variant leading-relaxed">{pro}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center">
              <ThumbsDown size={20} className="text-tertiary fill-tertiary" />
            </div>
            <h3 className="font-headline text-2xl font-bold">Cons</h3>
          </div>
          <ul className="space-y-4">
            {note.cons?.map((con, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="text-tertiary mt-1">•</span>
                <p className="text-on-surface-variant leading-relaxed">{con}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10"></div>
        <div className="flex items-center gap-3 mb-6 relative">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Lightbulb size={20} className="text-white fill-white" />
          </div>
          <h3 className="font-headline text-2xl font-bold">Solution</h3>
        </div>
        <div className="relative">
          <p className="text-on-surface-variant leading-relaxed text-lg whitespace-pre-wrap">
            {note.solution}
          </p>
        </div>
        <div className="mt-8 pt-8 border-t border-outline-variant/20 flex flex-wrap gap-2">
          {note.tags?.map(tag => (
            <span key={tag} className="bg-surface-container-high px-4 py-1.5 rounded-full text-sm font-medium text-on-surface-variant">
              #{tag}
            </span>
          ))}
        </div>
      </section>

      {/* View Toolbar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-2xl px-6 py-3 rounded-full border border-outline-variant/10 shadow-xl flex items-center gap-6 z-50">
        <button className="flex flex-col items-center gap-1 group">
          <Share2 size={20} className="text-on-surface-variant group-hover:text-primary transition-colors" />
          <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">Share</span>
        </button>
        <div className="w-px h-8 bg-outline-variant/30"></div>
        <button 
          onClick={onFavorite}
          className="flex flex-col items-center gap-1 group"
        >
          <Star size={20} className={cn("transition-colors", note.isFavorite ? "text-tertiary fill-tertiary" : "text-on-surface-variant group-hover:text-primary")} />
          <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">Fav</span>
        </button>
        <div className="w-px h-8 bg-outline-variant/30"></div>
        <button 
          onClick={onPin}
          className="flex flex-col items-center gap-1 group"
        >
          <Pin size={20} className={cn("transition-colors", note.isPinned ? "text-primary fill-primary" : "text-on-surface-variant group-hover:text-primary")} />
          <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">Pin</span>
        </button>
      </div>

      {/* Actions Bar */}
      <div className="fixed top-4 right-8 flex items-center gap-2 z-50">
        <button 
          onClick={onEdit}
          className="p-2 text-on-surface hover:bg-surface-container rounded-full transition-colors"
        >
          <Edit2 size={20} />
        </button>
        <button 
          onClick={onDelete}
          className="p-2 text-error hover:bg-error-container rounded-full transition-colors"
        >
          <Trash2 size={20} />
        </button>
        <button className="p-2 text-on-surface hover:bg-surface-container rounded-full transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
}
