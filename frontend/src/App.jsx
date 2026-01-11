import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import ProfileSetup from './pages/ProfileSetup'
import TeamSelection from './pages/TeamSelection'
import TeamsDashboard from './pages/TeamsDashboard'
import HackathonWorkspace from './pages/HackathonWorkspace'

function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<Layout />}>
        <Route index element={<Dashboard />} />
      </Route>
      <Route path="/" element={<Login />} />
      <Route path="/profile-setup" element={<ProfileSetup />} />
      <Route path="/teams/select" element={<TeamSelection />} />
      <Route path="/teams" element={<TeamsDashboard />} />
      <Route path="/workspace" element={<HackathonWorkspace />} />
    </Routes>
  )
}

export default App
