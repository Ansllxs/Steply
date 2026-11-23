import { Route, Routes } from 'react-router-dom'
import CalendarPage from './pages/CalendarPage'
import CheckInPage from './pages/CheckInPage'
import CreateHabitPage from './pages/CreateHabitPage'
import DashboardPage from './pages/DashboardPage'
import HabitDetailPage from './pages/HabitDetailPage'
import CreateGroupPage from './pages/CreateGroupPage'
import GroupDetailPage from './pages/GroupDetailPage'
import GroupRankingPage from './pages/GroupRankingPage'
import GroupsPage from './pages/GroupsPage'
import ManageGroupHabitsPage from './pages/ManageGroupHabitsPage'
import HabitsPage from './pages/HabitsPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import EditProfilePage from './pages/EditProfilePage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/habits" element={<HabitsPage />} />
      <Route path="/habits/new" element={<CreateHabitPage />} />
      <Route path="/habits/:id/check-in" element={<CheckInPage />} />
      <Route path="/habits/:id" element={<HabitDetailPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="/groups/new" element={<CreateGroupPage />} />
      <Route path="/groups/:id/ranking" element={<GroupRankingPage />} />
      <Route path="/groups/:id/manage" element={<ManageGroupHabitsPage />} />
      <Route path="/groups/:id" element={<GroupDetailPage />} />
      <Route path="/profile/edit" element={<EditProfilePage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  )
}
