import { useState } from 'react';
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
  X,
  Check,
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
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { Note, ViewState } from './types';
import { INITIAL_NOTES } from './constants';

export default function App() {
  const [view, setView] = useState<ViewState>('list');
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleCreateNote = () => {
    setView('create');
    setSelectedNote(null);
  };

  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setView('view');
  };

  const handleBack = () => {
    setView('list');
    setSelectedNote(null);
  };

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
          <SidebarLink icon={<FileText size={20} />} label="All Notes" active />
          <SidebarLink icon={<Star size={20} />} label="Favorites" />
          <SidebarLink icon={<Folder size={20} />} label="Notebooks" />
          <SidebarLink icon={<Archive size={20} />} label="Archive" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-hidden">
        {/* Top Bar */}
        <header className="h-20 flex items-center justify-between px-8 bg-surface/50 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-surface-container-high rounded-full transition-colors"
            >
              <Menu size={24} />
            </button>
            {view === 'view' && (
              <button 
                onClick={handleBack}
                className="p-2 hover:bg-surface-container-high rounded-full transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
            )}
            <h2 className="font-headline text-xl font-bold tracking-tight">
              {view === 'create' ? 'New Note' : 'Notebook'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-3 hover:bg-surface-container-high rounded-full transition-colors">
              <Search size={20} />
            </button>
            <button className="p-3 hover:bg-surface-container-high rounded-full transition-colors">
              <User size={20} />
            </button>
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
                    Thoughts & <br />
                    <span className="text-primary">Explorations</span>
                  </h3>
                  <div className="flex gap-3 mt-4">
                    <span className="bg-surface-container-high px-4 py-1.5 rounded-full text-xs font-semibold text-on-surface-variant tracking-wide">
                      LATEST: AUG 24
                    </span>
                    <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide">
                      {notes.length} NOTES
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {notes.filter(n => n.id !== '5').map((note) => (
                    <NoteCard 
                      key={note.id} 
                      note={note} 
                      onClick={() => handleViewNote(note)}
                    />
                  ))}
                </div>
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
                <NoteEditor onCancel={handleBack} onSave={handleBack} />
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
                <NoteViewer note={selectedNote} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FAB */}
        {view === 'list' && (
          <button 
            onClick={handleCreateNote}
            className="fixed bottom-12 right-12 w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform z-20"
          >
            <Plus size={32} />
          </button>
        )}
      </main>
    </div>
  );
}

function SidebarLink({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <a 
      href="#" 
      className={cn(
        "flex items-center gap-4 px-6 py-4 rounded-full transition-colors",
        active ? "bg-primary-fixed text-primary font-semibold" : "hover:bg-surface-container-high text-on-surface-variant font-medium"
      )}
    >
      {icon}
      <span className="font-label">{label}</span>
    </a>
  );
}

function NoteCard({ note, onClick }: { note: Note, onClick: () => void }) {
  const isFeatured = note.category === 'Project Alpha';
  
  return (
    <article 
      onClick={onClick}
      className={cn(
        "rounded-xl p-8 transition-all hover:-translate-y-1 cursor-pointer",
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
        {note.isFavorite && <Star size={18} className="fill-tertiary text-tertiary" />}
        {note.isPinned && <Pin size={18} className="text-on-surface-variant" />}
        {note.category === 'Bookshelf' && <Bookmark size={18} className="text-on-surface-variant" />}
        {isFeatured && <Zap size={18} className="fill-white text-white" />}
      </div>
      
      <h4 className="font-headline text-2xl font-bold mb-6 leading-snug">
        {note.title}
      </h4>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <TrendingUp size={18} className={cn("mt-1 shrink-0", isFeatured ? "text-white" : "text-primary")} />
          <p className={cn("text-sm", isFeatured ? "text-white/90" : "text-on-surface-variant")}>
            <strong className={isFeatured ? "text-white" : "text-on-surface"}>Pros:</strong> {note.pros[0]}...
          </p>
        </div>
        <div className="flex gap-4">
          <TrendingDown size={18} className={cn("mt-1 shrink-0", isFeatured ? "text-white" : "text-error")} />
          <p className={cn("text-sm", isFeatured ? "text-white/90" : "text-on-surface-variant")}>
            <strong className={isFeatured ? "text-white" : "text-on-surface"}>Cons:</strong> {note.cons[0]}...
          </p>
        </div>
      </div>
      
      <div className={cn(
        "mt-8 pt-6 border-t flex items-center gap-2",
        isFeatured ? "border-white/10" : "border-outline-variant/10"
      )}>
        {note.authorAvatar ? (
          <img src={note.authorAvatar} alt="Avatar" className="w-6 h-6 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : note.authorInitials ? (
          <div className="w-6 h-6 rounded-full bg-secondary-fixed flex items-center justify-center text-[10px] font-bold text-on-secondary-fixed">
            {note.authorInitials}
          </div>
        ) : null}
        <span className={cn("text-xs font-medium", isFeatured ? "text-white/60" : "text-on-surface-variant")}>
          {note.category === 'Project Alpha' ? 'Updated 5m ago' : note.category === 'Bookshelf' ? 'Created Aug 12' : `Edited ${note.date}`}
        </span>
      </div>
    </article>
  );
}

function NoteEditor({ onCancel, onSave }: { onCancel: () => void, onSave: () => void }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-12">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-xs font-semibold mb-2 uppercase">DRAFT</span>
          <h2 className="font-headline text-4xl font-bold leading-tight tracking-tight">New Synthesis</h2>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="px-6 py-2.5 rounded-full font-medium text-on-surface-variant hover:bg-surface-container-high transition-all">
            Cancel
          </button>
          <button onClick={onSave} className="px-8 py-2.5 rounded-full font-medium bg-gradient-to-r from-primary to-primary-container text-white shadow-lg hover:shadow-primary/20 transition-all">
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant px-1">Document Title</label>
          <input 
            className="w-full bg-surface-container-lowest border-none rounded-xl p-4 text-lg font-headline focus:ring-2 focus:ring-primary/40 placeholder:text-outline-variant transition-all outline-none" 
            placeholder="Enter note title..." 
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant px-1">Reference Link</label>
          <div className="relative">
            <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input 
              className="w-full bg-surface-container-high border-none rounded-xl py-4 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/40 placeholder:text-outline-variant transition-all outline-none" 
              placeholder="https://..." 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-transparent hover:border-outline-variant/10 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
              <TrendingUp size={16} />
            </div>
            <label className="text-sm font-semibold">Key Advantages</label>
          </div>
          <textarea 
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
            <label className="text-sm font-semibold">Identified Risks</label>
          </div>
          <textarea 
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
          className="w-full bg-transparent border-none resize-none p-0 focus:ring-0 text-lg placeholder:text-outline-variant leading-relaxed outline-none" 
          placeholder="Synthesize the findings into a clear path forward..." 
          rows={8}
        />
      </div>

      <div className="flex flex-wrap gap-4 pt-4">
        <div className="flex items-center gap-2 text-on-surface-variant text-sm">
          <Calendar size={16} />
          <span>October 24, 2023</span>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant text-sm">
          <Tag size={16} />
          <span>Productivity, Design</span>
        </div>
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

function NoteViewer({ note }: { note: Note }) {
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
            <a className="text-primary font-medium hover:underline truncate" href={note.referenceUrl}>
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
            {note.pros.map((pro, i) => (
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
            {note.cons.map((con, i) => (
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
          {note.tags.map(tag => (
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
        <button className="flex flex-col items-center gap-1 group">
          <Star size={20} className="text-on-surface-variant group-hover:text-primary transition-colors" />
          <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">Fav</span>
        </button>
        <div className="w-px h-8 bg-outline-variant/30"></div>
        <button className="flex flex-col items-center gap-1 group">
          <History size={20} className="text-on-surface-variant group-hover:text-primary transition-colors" />
          <span className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">History</span>
        </button>
      </div>

      {/* Actions Bar */}
      <div className="fixed top-4 right-8 flex items-center gap-2 z-50">
        <button className="p-2 text-on-surface hover:bg-surface-container rounded-full transition-colors">
          <Edit2 size={20} />
        </button>
        <button className="p-2 text-error hover:bg-error-container rounded-full transition-colors">
          <Trash2 size={20} />
        </button>
        <button className="p-2 text-on-surface hover:bg-surface-container rounded-full transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
}
