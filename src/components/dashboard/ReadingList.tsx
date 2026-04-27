import { useState } from 'react'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

// ── Types ──────────────────────────────────────────────────────────────────────

type ReadingStatus = 'want_to_read' | 'reading' | 'completed'

interface Book {
  id: string
  title: string
  author: string | null
  status: ReadingStatus
  priority: number
  progress_pct: number
  started_date: string | null
  completed_date: string | null
  review: string | null
  gained: string | null
  genre: string | null
  created_at: string
  updated_at: string
}

// ── Queries ────────────────────────────────────────────────────────────────────

function useBooks() {
  return useQuery({
    queryKey: ['reading_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reading_list')
        .select('*')
        .order('status', { ascending: true })
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Book[]
    },
  })
}

function useAddBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (book: Partial<Book>) => {
      const { data, error } = await supabase
        .from('reading_list')
        .insert(book)
        .select()
        .single()
      if (error) throw error
      return data as Book
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reading_list'] }),
  })
}

function useUpdateBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Book> & { id: string }) => {
      const { data, error } = await supabase
        .from('reading_list')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Book
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reading_list'] }),
  })
}

function useDeleteBook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reading_list').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reading_list'] }),
  })
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const LABEL: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.6rem',
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--ink-muted)',
}

const STATUS_CONFIG: Record<ReadingStatus, { label: string; color: string; bg: string }> = {
  reading:      { label: 'Reading',      color: '#4a6b8a', bg: 'rgba(74,107,138,0.1)' },
  want_to_read: { label: 'Up next',      color: 'var(--ink-muted)', bg: 'rgba(44,42,37,0.05)' },
  completed:    { label: 'Completed',    color: '#5a7247', bg: 'rgba(90,114,71,0.1)' },
}

// ── Book Card ──────────────────────────────────────────────────────────────────

function BookCard({ book, onSelect }: { book: Book; onSelect: (b: Book) => void }) {
  const cfg = STATUS_CONFIG[book.status]
  return (
    <div
      onClick={() => onSelect(book)}
      style={{
        padding: '14px 16px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid rgba(44,42,37,0.07)',
        background: book.status === 'reading' ? 'rgba(74,107,138,0.04)' : 'transparent',
        cursor: 'pointer',
        transition: 'all 200ms ease',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
      }}
    >
      {/* Status dot */}
      <div style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: cfg.color, flexShrink: 0, marginTop: '6px',
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: '0.85rem', fontWeight: 400,
          color: 'var(--ink)', margin: 0, lineHeight: 1.4,
          textDecoration: book.status === 'completed' ? 'none' : 'none',
        }}>
          {book.title}
        </p>
        {book.author && (
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: '0.7rem', fontWeight: 300,
            color: 'var(--ink-muted)', margin: '2px 0 0',
          }}>
            {book.author}
          </p>
        )}
        {book.status === 'reading' && book.progress_pct > 0 && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ height: '2px', borderRadius: '1px', background: 'rgba(44,42,37,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${book.progress_pct}%`, background: '#4a6b8a', borderRadius: '1px', transition: 'width 0.8s ease' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.58rem', color: 'var(--ink-muted)', marginTop: '3px' }}>
              {book.progress_pct}%
            </p>
          </div>
        )}
        {book.status === 'completed' && book.completed_date && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.62rem', color: 'var(--ink-faint)', marginTop: '3px' }}>
            Finished {format(new Date(book.completed_date), 'MMM yyyy')}
          </p>
        )}
      </div>
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: '0.52rem', letterSpacing: '0.1em',
        textTransform: 'uppercase', color: cfg.color, background: cfg.bg,
        padding: '2px 8px', borderRadius: 'var(--radius-full)', flexShrink: 0,
        marginTop: '2px',
      }}>
        {cfg.label}
      </span>
    </div>
  )
}

// ── Book Detail / Edit Modal ───────────────────────────────────────────────────

function BookDetail({ book, onClose }: { book: Book | 'new'; onClose: () => void }) {
  const isNew = book === 'new'
  const updateBook = useUpdateBook()
  const addBook = useAddBook()
  const deleteBook = useDeleteBook()

  const [title, setTitle] = useState(isNew ? '' : book.title)
  const [author, setAuthor] = useState(isNew ? '' : (book.author ?? ''))
  const [status, setStatus] = useState<ReadingStatus>(isNew ? 'want_to_read' : book.status)
  const [progress, setProgress] = useState(isNew ? 0 : book.progress_pct)
  const [review, setReview] = useState(isNew ? '' : (book.review ?? ''))
  const [gained, setGained] = useState(isNew ? '' : (book.gained ?? ''))
  const [genre, setGenre] = useState(isNew ? '' : (book.genre ?? ''))
  const [startedDate, setStartedDate] = useState(isNew ? '' : (book.started_date ?? ''))
  const [completedDate, setCompletedDate] = useState(isNew ? '' : (book.completed_date ?? ''))
  const [confirmDelete, setConfirmDelete] = useState(false)

  const save = async () => {
    const payload = {
      title,
      author: author || null,
      status,
      progress_pct: progress,
      review: review || null,
      gained: gained || null,
      genre: genre || null,
      started_date: startedDate || null,
      completed_date: completedDate || null,
    }
    if (isNew) {
      await addBook.mutateAsync(payload)
    } else {
      await updateBook.mutateAsync({ id: book.id, ...payload })
    }
    onClose()
  }

  const handleDelete = async () => {
    if (!isNew) {
      await deleteBook.mutateAsync(book.id)
    }
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: 'var(--font-body)',
    fontSize: '0.82rem',
    fontWeight: 300,
    color: 'var(--ink)',
    background: 'rgba(44,42,37,0.03)',
    border: '1px solid rgba(44,42,37,0.1)',
    borderRadius: '8px',
    padding: '8px 12px',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: 'vertical' as const,
    minHeight: '80px',
    lineHeight: 1.6,
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(44,42,37,0.3)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(248,245,238,0.98)', backdropFilter: 'blur(16px)',
          borderRadius: 'var(--radius-lg)', border: '1px solid rgba(44,42,37,0.08)',
          boxShadow: '0 24px 80px rgba(44,42,37,0.12)',
          width: '100%', maxWidth: '540px', maxHeight: '85vh', overflowY: 'auto',
          padding: '32px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <p style={{ ...LABEL, margin: 0 }}>{isNew ? 'Add a book' : 'Edit book'}</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--ink-muted)' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Title */}
          <div>
            <p style={{ ...LABEL, marginBottom: '6px' }}>Title</p>
            <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder="Book title" />
          </div>

          {/* Author */}
          <div>
            <p style={{ ...LABEL, marginBottom: '6px' }}>Author</p>
            <input style={inputStyle} value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author name" />
          </div>

          {/* Genre */}
          <div>
            <p style={{ ...LABEL, marginBottom: '6px' }}>Genre / Category</p>
            <input style={inputStyle} value={genre} onChange={e => setGenre(e.target.value)} placeholder="e.g. Philosophy, Farming, Fiction" />
          </div>

          {/* Status */}
          <div>
            <p style={{ ...LABEL, marginBottom: '8px' }}>Status</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['want_to_read', 'reading', 'completed'] as ReadingStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  style={{
                    fontFamily: 'var(--font-body)', fontSize: '0.7rem', letterSpacing: '0.08em',
                    textTransform: 'uppercase', padding: '5px 14px', borderRadius: 'var(--radius-full)',
                    cursor: 'pointer', transition: 'all 200ms ease',
                    border: `1px solid ${status === s ? STATUS_CONFIG[s].color : 'rgba(44,42,37,0.12)'}`,
                    background: status === s ? STATUS_CONFIG[s].bg : 'transparent',
                    color: status === s ? STATUS_CONFIG[s].color : 'var(--ink-muted)',
                  }}
                >
                  {STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress (only if reading) */}
          {status === 'reading' && (
            <div>
              <p style={{ ...LABEL, marginBottom: '6px' }}>Progress — {progress}%</p>
              <input
                type="range" min={0} max={100} value={progress}
                onChange={e => setProgress(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#4a6b8a' }}
              />
            </div>
          )}

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <p style={{ ...LABEL, marginBottom: '6px' }}>Started</p>
              <input type="date" style={inputStyle} value={startedDate} onChange={e => setStartedDate(e.target.value)} />
            </div>
            {status === 'completed' && (
              <div>
                <p style={{ ...LABEL, marginBottom: '6px' }}>Finished</p>
                <input type="date" style={inputStyle} value={completedDate} onChange={e => setCompletedDate(e.target.value)} />
              </div>
            )}
          </div>

          {/* Review (only if completed) */}
          {status === 'completed' && (
            <>
              <div>
                <p style={{ ...LABEL, marginBottom: '6px' }}>Your thoughts</p>
                <textarea style={textareaStyle} value={review} onChange={e => setReview(e.target.value)} placeholder="What did you think of it?" />
              </div>
              <div>
                <p style={{ ...LABEL, marginBottom: '6px' }}>What you gained</p>
                <textarea style={textareaStyle} value={gained} onChange={e => setGained(e.target.value)} placeholder="Key ideas, lessons, shifts in thinking..." />
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
          <div>
            {!isNew && (
              confirmDelete ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: '#a05050' }}>Remove this book?</span>
                  <button onClick={handleDelete} style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: '#a05050', background: 'none', border: '1px solid rgba(160,80,80,0.3)', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer' }}>Yes</button>
                  <button onClick={() => setConfirmDelete(false)} style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--ink-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
              )
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--ink-muted)', background: 'none', border: '1px solid rgba(44,42,37,0.15)', borderRadius: '8px', padding: '7px 18px', cursor: 'pointer' }}>Cancel</button>
            <button
              onClick={save}
              disabled={!title.trim()}
              style={{
                fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'white',
                background: title.trim() ? '#5a7247' : 'rgba(44,42,37,0.15)',
                border: 'none', borderRadius: '8px', padding: '7px 18px', cursor: title.trim() ? 'pointer' : 'default',
                transition: 'all 200ms ease',
              }}
            >
              {isNew ? 'Add book' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Panel ─────────────────────────────────────────────────────────────────

export default function ReadingList() {
  const [open, setOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | 'new' | null>(null)
  const { data: books = [] } = useBooks()

  const reading   = books.filter(b => b.status === 'reading')
  const upNext    = books.filter(b => b.status === 'want_to_read')
  const completed = books.filter(b => b.status === 'completed')

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Reading list"
        style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 50,
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          background: open ? 'rgba(90,114,71,0.12)' : 'rgba(248,245,238,0.9)',
          border: '1px solid rgba(44,42,37,0.1)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 12px rgba(44,42,37,0.08)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 200ms ease',
        }}
      >
        {/* Book icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(44,42,37,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        {reading.length > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            width: '14px', height: '14px', borderRadius: '50%',
            background: '#4a6b8a', border: '2px solid white',
            fontFamily: 'var(--font-body)', fontSize: '0.5rem', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {reading.length}
          </span>
        )}
      </button>

      {/* Slide-in panel */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              zIndex: 100,
              width: '360px',
              background: 'rgba(248,245,238,0.97)',
              backdropFilter: 'blur(16px)',
              borderLeft: '1px solid rgba(44,42,37,0.08)',
              boxShadow: '-8px 0 40px rgba(44,42,37,0.08)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              padding: '28px 24px',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <p style={{ ...LABEL, margin: 0 }}>Reading</p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => setSelectedBook('new')}
                  style={{
                    fontFamily: 'var(--font-body)', fontSize: '0.68rem', color: '#5a7247',
                    background: 'rgba(90,114,71,0.08)', border: '1px solid rgba(90,114,71,0.2)',
                    borderRadius: '6px', padding: '4px 12px', cursor: 'pointer',
                  }}
                >
                  + Add
                </button>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--ink-muted)' }}>✕</button>
              </div>
            </div>

            {/* Currently Reading */}
            {reading.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ ...LABEL, marginBottom: '10px' }}>Currently reading</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {reading.map(b => <BookCard key={b.id} book={b} onSelect={setSelectedBook} />)}
                </div>
              </div>
            )}

            {/* Up Next */}
            {upNext.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ ...LABEL, marginBottom: '10px' }}>Up next</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {upNext.map(b => <BookCard key={b.id} book={b} onSelect={setSelectedBook} />)}
                </div>
              </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ ...LABEL, marginBottom: '10px' }}>Completed — {completed.length}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {completed.map(b => <BookCard key={b.id} book={b} onSelect={setSelectedBook} />)}
                </div>
              </div>
            )}

            {/* Empty state */}
            {books.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', opacity: 0.5 }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(44,42,37,0.3)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', fontWeight: 300, color: 'var(--ink-muted)', textAlign: 'center' }}>
                  No books yet.<br />Add what you're reading.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Book detail modal */}
      {selectedBook !== null && (
        <BookDetail book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}
    </>
  )
}
