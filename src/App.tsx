import React, { useState, useEffect } from 'react';
import { 
  Search, 
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
  Bold,
  Italic,
  List,
  Image as ImageIcon,
  Mic,
  Share2,
  History,
  Pin,
  Settings,
  PlusCircle,
  MinusCircle,
  Square,
  CheckSquare,
  X,
  Check,
  ChevronLeft,
  FileText,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  where
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db, auth, signIn, logout } from './firebase';
import { cn } from './lib/utils';
import { Note, ViewState } from './types';

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button onClick={onClick} className={cn("flex flex-col items-center gap-1 transition-colors", active ? "text-[#0058bd]" : "text-[#424753]")}>
      <div className={cn("px-5 py-1 rounded-full flex items-center justify-center transition-colors", active && "bg-[#b7ccfd]")}>
        {icon}
      </div>
      <span className={cn("text-[11px]", active ? "font-bold" : "font-medium")}>{label}</span>
    </button>
  );
}

function ToolbarButton({ icon, label }: { icon: React.ReactNode, label?: string }) {
  return (
    <button className="flex flex-col items-center gap-1 p-2.5 text-[#424753] hover:text-[#0058bd] transition-colors">
      {icon}
      {label && <span className="text-[10px] font-medium">{label}</span>}
    </button>
  );
}

interface NoteCardProps {
  note: Note;
  onClick: () => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onClick }) => {
  const isPinned = note.isPinned;
  
  // Determine card style based on content
  if (note.imageUrl) {
    return (
      <div onClick={onClick} className="bg-white rounded-xl overflow-hidden shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
        <div className="h-32 bg-[#d8e2ff] overflow-hidden">
          <img src={note.imageUrl} alt={note.title} className="w-full h-full object-cover mix-blend-multiply opacity-80" />
        </div>
        <div className="p-6">
          <h3 className="font-headline text-lg font-bold mb-3">{note.title}</h3>
          <div className="flex items-start gap-3 mb-2">
            <Lightbulb size={16} className="text-[#0058bd] shrink-0 mt-0.5" />
            <p className="text-[#424753] text-sm line-clamp-2">{note.solution}</p>
          </div>
          <p className="text-xs text-[#424753]/60 font-medium mt-4">{note.date}</p>
        </div>
      </div>
    );
  }

  if (note.checklist && note.checklist.length > 0) {
    return (
      <div onClick={onClick} className="bg-white rounded-xl p-6 shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
        <h3 className="font-headline text-lg font-bold mb-3">{note.title}</h3>
        <div className="space-y-2 mb-4">
          {note.checklist.slice(0, 2).map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              {item.completed ? <CheckSquare size={16} className="text-[#0058bd]" /> : <Square size={16} className="text-[#424753]/30" />}
              <p className={cn("text-sm", item.completed ? "text-[#424753]/50 line-through" : "text-[#424753]")}>{item.text}</p>
            </div>
          ))}
          {note.checklist.length > 2 && <p className="text-xs text-[#424753]/40 font-medium">+ {note.checklist.length - 2} more items</p>}
        </div>
        <p className="text-xs text-[#424753]/60 font-medium mt-4">{note.date}</p>
      </div>
    );
  }

  return (
    <div onClick={onClick} className="bg-white rounded-xl p-6 shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-headline text-xl font-bold pr-4">{note.title}</h3>
        {isPinned && <span className="text-[#8f4a00] bg-[#ffdcc4] px-3 py-1 rounded-full text-xs font-bold">PINNED</span>}
      </div>
      <div className="space-y-3 mb-4">
        {note.pros.slice(0, 1).map((pro, i) => (
          <div key={i} className="flex items-start gap-3">
            <PlusCircle size={16} className="text-[#0058bd] shrink-0 mt-0.5" />
            <p className="text-[#424753] text-sm leading-relaxed line-clamp-2">{pro}</p>
          </div>
        ))}
        {note.cons.slice(0, 1).map((con, i) => (
          <div key={i} className="flex items-start gap-3">
            <MinusCircle size={16} className="text-[#ba1a1a] shrink-0 mt-0.5" />
            <p className="text-[#424753] text-sm leading-relaxed line-clamp-2">{con}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#ebeef4]">
        <p className="text-xs text-[#424753]/60 font-medium">Updated {note.modifiedDate || note.date}</p>
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full bg-[#b7ccfd] border-2 border-white"></div>
          <div className="w-6 h-6 rounded-full bg-[#ffdcc4] border-2 border-white"></div>
        </div>
      </div>
    </div>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <div className={cn("w-5 h-5 rounded-full bg-current flex items-center justify-center", className)}>
      <Check size={12} className="text-white" />
    </div>
  );
}

function CancelCircleIcon({ className }: { className?: string }) {
  return (
    <div className={cn("w-5 h-5 rounded-full bg-current flex items-center justify-center", className)}>
      <X size={12} className="text-white" />
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<ViewState>('list');
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      setNotes(fetchedNotes);
    }, (error) => {
      console.error('Firestore Error:', error);
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
      console.error('Create Error:', error);
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
      console.error('Update Error:', error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      setView('list');
      setSelectedNote(null);
    } catch (error) {
      console.error('Delete Error:', error);
    }
  };

  const togglePin = async (note: Note) => {
    try {
      await updateDoc(doc(db, 'notes', note.id), {
        isPinned: !note.isPinned
      });
    } catch (error) {
      console.error('Pin Error:', error);
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

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9ff] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0058bd]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f7f9ff] flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md"
        >
          <h1 className="font-headline text-5xl font-extrabold mb-6 text-[#181c20]">Notebook</h1>
          <p className="text-[#424753] mb-8 text-lg">
            A refined space for your thoughts and explorations. Sign in to start syncing your notes across all devices.
          </p>
          <button 
            onClick={signIn}
            className="flex items-center gap-3 px-8 py-4 bg-[#0058bd] text-white rounded-2xl font-bold text-lg shadow-xl hover:scale-105 transition-transform mx-auto"
          >
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9ff] text-[#181c20] font-body pb-24">
      <AnimatePresence mode="wait">
        {view === 'list' && (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col"
          >
            <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 bg-[#f7f9ff]/80 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <button className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-[#e5e8ee] transition-colors">
                  <Menu size={24} />
                </button>
                <h1 className="font-headline text-2xl font-bold tracking-tight">Notebook</h1>
              </div>
              <div className="relative flex-1 max-w-[200px] ml-4">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#424753]/50" />
                <input 
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#e5e8ee] border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#0058bd]/20 outline-none"
                />
              </div>
            </header>

            <main className="px-6 py-4">
              <div className="mb-10 ml-2">
                <p className="text-[#424753] font-medium text-sm mb-1">
                  {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
                <h2 className="font-headline text-4xl font-extrabold tracking-tighter">Your Library</h2>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {filteredNotes.length === 0 && (
                  <div className="text-center py-20 opacity-50">
                    <p>No notes found. Tap the + to start.</p>
                  </div>
                )}
                {filteredNotes.map((note) => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    onClick={() => handleViewNote(note)}
                  />
                ))}
              </div>
            </main>
          </motion.div>
        )}

        {view === 'recent' && (
          <motion.div 
            key="recent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col"
          >
            <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 bg-[#f7f9ff]/80 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <h1 className="font-headline text-2xl font-bold tracking-tight">Recent</h1>
              </div>
            </header>

            <main className="px-6 py-4">
              <div className="mb-10 ml-2">
                <h2 className="font-headline text-4xl font-extrabold tracking-tighter">Recently Modified</h2>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {notes.slice(0, 5).map((note) => (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    onClick={() => handleViewNote(note)}
                  />
                ))}
                {notes.length === 0 && (
                  <div className="text-center py-20 opacity-50">
                    <p>No recent activity.</p>
                  </div>
                )}
              </div>
            </main>
          </motion.div>
        )}

        {view === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col"
          >
            <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-4 bg-[#f7f9ff]/80 backdrop-blur-md">
              <h1 className="font-headline text-2xl font-bold tracking-tight">Settings</h1>
            </header>

            <main className="px-6 py-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-6 flex items-center gap-4">
                <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-16 h-16 rounded-full border-2 border-[#0058bd]/10" referrerPolicy="no-referrer" />
                <div>
                  <h3 className="font-headline text-xl font-bold">{user.displayName}</h3>
                  <p className="text-[#424753] text-sm">{user.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <button className="w-full bg-white p-4 rounded-xl shadow-sm flex items-center justify-between hover:bg-[#f1f4fa] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0058bd]/10 flex items-center justify-center text-[#0058bd]">
                      <Settings size={20} />
                    </div>
                    <span className="font-medium">Account Preferences</span>
                  </div>
                  <ChevronLeft size={20} className="rotate-180 text-[#424753]/30" />
                </button>

                <button className="w-full bg-white p-4 rounded-xl shadow-sm flex items-center justify-between hover:bg-[#f1f4fa] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#8f4a00]/10 flex items-center justify-center text-[#8f4a00]">
                      <Share2 size={20} />
                    </div>
                    <span className="font-medium">Sync & Backup</span>
                  </div>
                  <ChevronLeft size={20} className="rotate-180 text-[#424753]/30" />
                </button>

                <button 
                  onClick={logout}
                  className="w-full bg-[#ba1a1a]/5 p-4 rounded-xl flex items-center gap-3 text-[#ba1a1a] font-bold mt-8"
                >
                  <Trash2 size={20} />
                  Sign Out
                </button>
              </div>
            </main>
          </motion.div>
        )}

        {view === 'view' && selectedNote && (
          <motion.div 
            key="view"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="flex flex-col min-h-screen"
          >
            <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-[#f7f9ff]/80 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#e5e8ee] transition-colors">
                  <ArrowLeft size={24} />
                </button>
                <h1 className="font-headline text-lg font-semibold">Notebook</h1>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEditNote(selectedNote)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#e5e8ee] transition-colors">
                  <Edit2 size={20} />
                </button>
                <button onClick={() => handleDeleteNote(selectedNote.id)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#e5e8ee] transition-colors">
                  <Trash2 size={20} />
                </button>
                <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#e5e8ee] transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </header>

            <main className="flex-1 px-6 pt-8 pb-32 max-w-screen-md mx-auto w-full">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 bg-[#b7ccfd] text-[#415680] text-xs font-medium rounded-full">{selectedNote.category}</span>
                <span className="text-[#424753] text-xs">{selectedNote.date}</span>
              </div>
              <h2 className="font-headline text-4xl font-bold tracking-tight leading-tight mb-6">
                {selectedNote.title}
              </h2>
              
              {selectedNote.referenceUrl && (
                <div className="flex items-center gap-3 p-3 bg-[#f1f4fa] rounded-xl w-fit mb-8">
                  <LinkIcon size={18} className="text-[#0058bd]" />
                  <a href={selectedNote.referenceUrl} target="_blank" rel="noreferrer" className="text-sm text-[#0058bd] font-medium truncate max-w-[250px]">
                    {selectedNote.referenceUrl.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}

              <div className="space-y-6">
                {selectedNote.checklist && selectedNote.checklist.length > 0 && (
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-[#0058bd]/10 flex items-center justify-center">
                        <List size={16} className="text-[#0058bd]" />
                      </div>
                      <h3 className="font-headline font-semibold">Checklist</h3>
                    </div>
                    <ul className="space-y-3">
                      {selectedNote.checklist.map((item, i) => (
                        <li key={i} className="flex items-center gap-3">
                          {item.completed ? (
                            <CheckSquare size={20} className="text-[#0058bd]" />
                          ) : (
                            <Square size={20} className="text-[#424753]/30" />
                          )}
                          <span className={cn("text-sm", item.completed ? "text-[#424753]/50 line-through" : "text-[#424753]")}>
                            {item.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-[#0058bd]/10 flex items-center justify-center">
                        <TrendingUp size={16} className="text-[#0058bd]" />
                      </div>
                      <h3 className="font-headline font-semibold">Advantages</h3>
                    </div>
                    <ul className="space-y-3">
                      {selectedNote.pros.map((pro, i) => (
                        <li key={i} className="flex gap-3">
                          <CheckCircleIcon className="text-[#0058bd] shrink-0 mt-1" />
                          <p className="text-sm text-[#424753] leading-relaxed">{pro}</p>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-[#ba1a1a]/10 flex items-center justify-center">
                        <TrendingDown size={16} className="text-[#ba1a1a]" />
                      </div>
                      <h3 className="font-headline font-semibold">Challenges</h3>
                    </div>
                    <ul className="space-y-3">
                      {selectedNote.cons.map((con, i) => (
                        <li key={i} className="flex gap-3">
                          <CancelCircleIcon className="text-[#ba1a1a] shrink-0 mt-1" />
                          <p className="text-sm text-[#424753] leading-relaxed">{con}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <section className="bg-white p-8 rounded-xl relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#0058bd]/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <Lightbulb size={24} className="text-[#8f4a00]" />
                      <h3 className="font-headline text-xl font-bold">Proposed Solution</h3>
                    </div>
                    <div className="text-[#181c20] text-base leading-loose whitespace-pre-wrap">
                      {selectedNote.solution}
                    </div>
                    {selectedNote.imageUrl && (
                      <div className="mt-8 rounded-xl overflow-hidden aspect-video bg-[#e5e8ee]">
                        <img src={selectedNote.imageUrl} alt="Note visual" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </section>

                <div className="flex flex-wrap gap-2 pt-4">
                  {selectedNote.tags.map(tag => (
                    <span key={tag} className="px-4 py-2 bg-[#ebeef4] text-[#424753] text-xs font-medium rounded-full">#{tag}</span>
                  ))}
                </div>
              </div>
            </main>

            {/* Glass Toolbar for View */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm h-16 bg-[#f7f9ff]/80 backdrop-blur-xl rounded-full flex items-center justify-between px-6 z-50 border border-white/20 shadow-xl">
              <ToolbarButton icon={<Bold size={20} />} label="Format" />
              <ToolbarButton icon={<ImageIcon size={20} />} label="Media" />
              <ToolbarButton icon={<List size={20} />} label="Tasks" />
              <div className="w-[1px] h-6 bg-[#c2c6d5]/30"></div>
              <ToolbarButton icon={<Share2 size={20} />} label="Share" />
            </div>
          </motion.div>
        )}

        {view === 'create' && (
          <motion.div 
            key="create"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="flex flex-col min-h-screen"
          >
            <header className="sticky top-0 z-50 flex items-center justify-between px-4 h-16 bg-[#f7f9ff]/80 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <button onClick={handleBack} className="p-2 hover:bg-[#ebeef4] rounded-full">
                  <X size={24} />
                </button>
                <h1 className="text-xl font-bold font-headline tracking-tight">{selectedNote ? 'Edit Note' : 'New Analysis'}</h1>
              </div>
              <button 
                onClick={() => {
                  const form = document.getElementById('note-form') as HTMLFormElement;
                  form.requestSubmit();
                }}
                className="bg-gradient-to-br from-[#0058bd] to-[#2771df] text-white px-6 py-2 rounded-full font-semibold text-sm shadow-lg"
              >
                Save
              </button>
            </header>

            <main className="flex-1 px-6 pt-4 pb-32 max-w-2xl mx-auto w-full">
              <form 
                id="note-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  
                  // Extract checklist items
                  const checklistItems: { text: string; completed: boolean }[] = [];
                  const checklistTexts = formData.getAll('checklist-text') as string[];
                  const checklistStatus = formData.getAll('checklist-completed') as string[];
                  
                  checklistTexts.forEach((text, i) => {
                    if (text.trim()) {
                      checklistItems.push({
                        text,
                        completed: checklistStatus[i] === 'true'
                      });
                    }
                  });

                  const data = {
                    title: formData.get('title') as string,
                    category: formData.get('category') as string,
                    referenceUrl: formData.get('referenceUrl') as string,
                    pros: (formData.get('pros') as string).split('\n').filter(Boolean),
                    cons: (formData.get('cons') as string).split('\n').filter(Boolean),
                    solution: formData.get('solution') as string,
                    imageUrl: formData.get('imageUrl') as string,
                    checklist: checklistItems,
                    tags: (formData.get('category') as string).split(' ').map(s => s.toLowerCase()),
                  };
                  if (selectedNote) {
                    handleUpdateNote(selectedNote.id, data);
                  } else {
                    handleCreateNote(data);
                  }
                }}
                className="space-y-8"
              >
                <div className="mb-10">
                  <span className="text-[#424753] text-xs font-semibold uppercase tracking-widest block mb-2">Workspace / Notes</span>
                  <input 
                    name="title"
                    defaultValue={selectedNote?.title}
                    required
                    className="w-full bg-transparent border-none focus:ring-0 text-3xl font-extrabold font-headline placeholder:text-[#dfe3e8] p-0 mb-2" 
                    placeholder="Untitled Analysis" 
                  />
                  <input 
                    name="category"
                    defaultValue={selectedNote?.category}
                    required
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-[#424753] p-0" 
                    placeholder="Category (e.g. Product Strategy)" 
                  />
                </div>

                <section className="space-y-3">
                  <label className="flex items-center gap-2 text-[#424753] font-semibold text-xs uppercase tracking-wider">
                    <ImageIcon size={14} />
                    Cover Image URL
                  </label>
                  <div className="bg-[#e5e8ee] rounded-xl px-4 py-3 flex items-center">
                    <input 
                      name="imageUrl"
                      defaultValue={selectedNote?.imageUrl}
                      className="bg-transparent border-none focus:ring-0 w-full text-sm placeholder:text-[#727785]/50" 
                      placeholder="https://images.unsplash.com/..." 
                      type="url" 
                    />
                  </div>
                </section>

                <section className="space-y-3">
                  <label className="flex items-center gap-2 text-[#424753] font-semibold text-xs uppercase tracking-wider">
                    <LinkIcon size={14} />
                    Reference URL
                  </label>
                  <div className="bg-[#e5e8ee] rounded-xl px-4 py-3 flex items-center">
                    <input 
                      name="referenceUrl"
                      defaultValue={selectedNote?.referenceUrl}
                      className="bg-transparent border-none focus:ring-0 w-full text-sm placeholder:text-[#727785]/50" 
                      placeholder="https://example.com/source-article" 
                      type="url" 
                    />
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-[#424753] font-semibold text-xs uppercase tracking-wider">
                      <List size={14} />
                      Checklist
                    </label>
                    <button 
                      type="button"
                      onClick={() => {
                        // This is a bit hacky for a simple form, but works for adding items
                        const container = document.getElementById('checklist-container');
                        if (container) {
                          const div = document.createElement('div');
                          div.className = "flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm mb-2";
                          div.innerHTML = `
                            <input type="hidden" name="checklist-completed" value="false" />
                            <div class="w-5 h-5 rounded border border-[#424753]/30"></div>
                            <input name="checklist-text" class="flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm" placeholder="Task item..." />
                          `;
                          container.appendChild(div);
                        }
                      }}
                      className="text-[#0058bd] text-xs font-bold"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div id="checklist-container">
                    {selectedNote?.checklist?.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-sm mb-2">
                        <input type="hidden" name="checklist-completed" value={String(item.completed)} />
                        <div className={cn("w-5 h-5 rounded border", item.completed ? "bg-[#0058bd] border-[#0058bd] flex items-center justify-center" : "border-[#424753]/30")}>
                          {item.completed && <Check size={12} className="text-white" />}
                        </div>
                        <input name="checklist-text" defaultValue={item.text} className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm" placeholder="Task item..." />
                      </div>
                    ))}
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-[#0058bd]">
                      <CheckCircleIcon />
                      <h3 className="font-headline font-bold text-sm">Key Advantages</h3>
                    </div>
                    <textarea 
                      name="pros"
                      defaultValue={selectedNote?.pros.join('\n')}
                      className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm leading-relaxed placeholder:text-[#727785]/40 resize-none" 
                      placeholder="What are the primary benefits or strengths?" 
                      rows={4}
                    />
                  </section>

                  <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-[#8f4a00]">
                      <TrendingDown size={18} />
                      <h3 className="font-headline font-bold text-sm">Identified Risks</h3>
                    </div>
                    <textarea 
                      name="cons"
                      defaultValue={selectedNote?.cons.join('\n')}
                      className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm leading-relaxed placeholder:text-[#727785]/40 resize-none" 
                      placeholder="What are the potential blockers or downsides?" 
                      rows={4}
                    />
                  </section>
                </div>

                <section className="space-y-4">
                  <label className="flex items-center gap-2 text-[#424753] font-semibold text-xs uppercase tracking-wider">
                    <Lightbulb size={14} />
                    Strategic Solution
                  </label>
                  <div className="bg-white p-6 rounded-3xl shadow-sm min-h-[200px]">
                    <textarea 
                      name="solution"
                      defaultValue={selectedNote?.solution}
                      className="w-full bg-transparent border-none focus:ring-0 p-0 text-base leading-relaxed placeholder:text-[#727785]/30 resize-none h-full" 
                      placeholder="Outline the proposed solution and implementation strategy..." 
                      rows={8}
                    />
                  </div>
                </section>
              </form>
            </main>

            {/* Editor Toolbar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40">
              <div className="bg-[#f7f9ff]/80 backdrop-blur-2xl border border-white/10 rounded-full h-14 flex items-center justify-between px-2 shadow-2xl">
                <div className="flex items-center gap-1">
                  <ToolbarButton icon={<Bold size={20} />} />
                  <ToolbarButton icon={<Italic size={20} />} />
                  <ToolbarButton icon={<List size={20} />} />
                  <div className="w-px h-6 bg-[#c2c6d5]/30 mx-1"></div>
                  <ToolbarButton icon={<LinkIcon size={20} />} />
                  <ToolbarButton icon={<ImageIcon size={20} />} />
                </div>
                <button className="bg-[#e5e8ee] p-2.5 rounded-full">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Nav */}
      {view !== 'create' && view !== 'view' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#f7f9ff]/80 backdrop-blur-xl h-20 flex items-center justify-around px-6 z-40 border-t border-white/10">
          <NavButton 
            active={view === 'list'} 
            onClick={() => setView('list')} 
            icon={<FileText size={24} />} 
            label="Notes" 
          />
          <NavButton 
            active={view === 'recent'} 
            onClick={() => setView('recent')} 
            icon={<History size={24} />} 
            label="Recent" 
          />
          <NavButton 
            active={view === 'settings'} 
            onClick={() => setView('settings')} 
            icon={<Settings size={24} />} 
            label="Settings" 
          />
        </nav>
      )}

      {/* FAB */}
      {(view === 'list' || view === 'recent') && (
        <button 
          onClick={() => setView('create')}
          className="fixed bottom-24 right-6 w-14 h-14 rounded-xl bg-gradient-to-br from-[#0058bd] to-[#2771df] flex items-center justify-center text-white z-50 shadow-xl active:scale-90 transition-transform"
        >
          <Plus size={32} />
        </button>
      )}
    </div>
  );
}
