import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import ProfileSetup from './pages/ProfileSetup'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'
import TeamSelection from './pages/TeamSelection'
import TeamsDashboard from './pages/TeamsDashboard'
import HackathonWorkspace from './pages/HackathonWorkspace'
import Discover from './pages/Discover'
import PitchPractice from './pages/PitchPractice'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile-setup" element={<ProfileSetup />} />
      <Route path="/profile" element={<Profile />} />

      <Route path="/dashboard" element={<Layout />}>
        <Route index element={<Dashboard />} />
      </Route>
      <Route path="/dashboard/:teamId" element={<Layout />}>
        <Route index element={<Dashboard />} />
      </Route>

      <Route path="/teams/select" element={<TeamSelection />} />
      <Route path="/teams" element={<TeamsDashboard />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="/pitch" element={<PitchPractice />} />
      <Route path="/workspace/:teamId/:hackathonId" element={<HackathonWorkspace />} />
    </Routes>
  )
}

export default App
