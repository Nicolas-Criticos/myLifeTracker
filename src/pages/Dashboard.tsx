import TopBar from '../components/layout/TopBar'
import WeeklyDashboard from '../components/dashboard/WeeklyDashboard'

export default function Dashboard() {
  return (
    <div className="flex flex-col h-full">
      <TopBar title="Dashboard" />
      <main className="flex-1 overflow-y-auto">
        <WeeklyDashboard />
      </main>
    </div>
  )
}
