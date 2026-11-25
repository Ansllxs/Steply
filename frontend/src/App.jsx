import { Route, Routes } from 'react-router-dom'
import { RedirectIfAuthenticated, RequireAuth } from './components/RouteGuards'
import CalendarPage from './pages/CalendarPage'
import CheckInPage from './pages/CheckInPage'
import CreateHabitPage from './pages/CreateHabitPage'
import DashboardPage from './pages/DashboardPage'
import HabitDetailPage from './pages/HabitDetailPage'
import CreateGroupPage from './pages/CreateGroupPage'
import GroupDetailPage from './pages/GroupDetailPage'
import GroupRankingPage from './pages/GroupRankingPage'
import FriendsPage from './pages/FriendsPage'
import GroupsPage from './pages/GroupsPage'
import ManageGroupHabitsPage from './pages/ManageGroupHabitsPage'
import HabitsPage from './pages/HabitsPage'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import EditProfilePage from './pages/EditProfilePage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<RedirectIfAuthenticated><LoginPage /></RedirectIfAuthenticated>} />
      <Route path="/register" element={<RedirectIfAuthenticated><RegisterPage /></RedirectIfAuthenticated>} />
      <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
      <Route path="/habits" element={<RequireAuth><HabitsPage /></RequireAuth>} />
      <Route path="/habits/new" element={<RequireAuth><CreateHabitPage /></RequireAuth>} />
      <Route path="/habits/:id/check-in" element={<RequireAuth><CheckInPage /></RequireAuth>} />
      <Route path="/habits/:id" element={<RequireAuth><HabitDetailPage /></RequireAuth>} />
      <Route path="/calendar" element={<RequireAuth><CalendarPage /></RequireAuth>} />
      <Route path="/groups" element={<RequireAuth><GroupsPage /></RequireAuth>} />
      <Route path="/friends" element={<RequireAuth><FriendsPage /></RequireAuth>} />
      <Route path="/groups/new" element={<RequireAuth><CreateGroupPage /></RequireAuth>} />
      <Route path="/groups/:id/ranking" element={<RequireAuth><GroupRankingPage /></RequireAuth>} />
      <Route path="/groups/:id/manage" element={<RequireAuth><ManageGroupHabitsPage /></RequireAuth>} />
      <Route path="/groups/:id" element={<RequireAuth><GroupDetailPage /></RequireAuth>} />
      <Route path="/profile/edit" element={<RequireAuth><EditProfilePage /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
    </Routes>
  )
}
