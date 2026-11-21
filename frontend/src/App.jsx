import { Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import CalendarPage from './pages/CalendarPage'
import DashboardPage from './pages/DashboardPage'
import GroupDetailPage from './pages/GroupDetailPage'
import GroupManagePage from './pages/GroupManagePage'
import GroupRankingPage from './pages/GroupRankingPage'
import GroupsPage from './pages/GroupsPage'
import HabitCheckInPage from './pages/HabitCheckInPage'
import HabitDetailPage from './pages/HabitDetailPage'
import HabitsPage from './pages/HabitsPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import NewGroupPage from './pages/NewGroupPage'
import NewHabitPage from './pages/NewHabitPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/habits/new" element={<NewHabitPage />} />
        <Route path="/habits/:id" element={<HabitDetailPage />} />
        <Route path="/habits/:id/check-in" element={<HabitCheckInPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/new" element={<NewGroupPage />} />
        <Route path="/groups/:id" element={<GroupDetailPage />} />
        <Route path="/groups/:id/ranking" element={<GroupRankingPage />} />
        <Route path="/groups/:id/manage" element={<GroupManagePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}
