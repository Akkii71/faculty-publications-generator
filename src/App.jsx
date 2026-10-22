import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard.jsx'
import Publications from './components/Publications.jsx'
import FacultyProfiles from './components/FacultyProfiles.jsx'
import Reports from './components/Reports.jsx'
import Settings from './components/Settings.jsx'

const STORAGE_KEY = 'fpg_publications'

function loadPublications() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [publications, setPublications] = useState(loadPublications)

  // Persist publications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(publications))
    } catch {
      // storage unavailable — silently ignore
    }
  }, [publications])

  const pages = {
    dashboard:    <Dashboard    publications={publications} />,
    publications: <Publications publications={publications} setPublications={setPublications} />,
    faculty:      <FacultyProfiles />,
    reports:      <Reports />,
    settings:     <Settings />,
  }

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <div className="app-content">
        <main className="app-main" id="main-content">
          {pages[activePage]}
        </main>

        <footer className="app-footer">
          <span>Faculty Publications Generator</span>
          <span className="footer-dot">·</span>
          <span>22 October 2026</span>
        </footer>
      </div>
    </div>
  )
}

export default App
