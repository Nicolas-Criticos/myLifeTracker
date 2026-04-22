import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TopBar from './components/layout/TopBar'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetailPage from './pages/ProjectDetail'
import Reviews from './pages/Reviews'
import Insights from './pages/Insights'
import Business from './pages/Business'
import Journal from './pages/Journal'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="samsara-bg">
          <TopBar />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/business" element={<Business />} />
              <Route path="/journal" element={<Journal />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
