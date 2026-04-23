import TodoList from '../components/todos/TodoList'
import { nowInSAST } from '../lib/utils'
import { format } from 'date-fns'

export default function Todos() {
  const now = nowInSAST()

  return (
    <div className="animate-in" style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 40px 80px' }}>
      <header style={{ marginBottom: '36px' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 300,
          fontSize: '2.2rem',
          color: 'var(--ink)',
          margin: '0 0 6px',
          letterSpacing: '-0.01em',
        }}>
          To-Dos
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.8rem',
          fontWeight: 300,
          color: 'var(--ink-muted)',
          margin: 0,
        }}>
          {format(now, 'EEEE, d MMMM yyyy')}
        </p>
      </header>

      <TodoList />
    </div>
  )
}
