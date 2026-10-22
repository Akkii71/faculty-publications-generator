import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard.jsx'
import Publications from './components/Publications.jsx'
import FacultyProfiles from './components/FacultyProfiles.jsx'
import Reports from './components/Reports.jsx'
import Settings from './components/Settings.jsx'

const PAGE_COMPONENTS = {
  dashboard:    <Dashboard />,
  publications: <Publications />,
  faculty:      <FacultyProfiles />,
  reports:      <Reports />,
  settings:     <Settings />,
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />

      <div className="app-content">
        <main className="app-main" id="main-content">
          {PAGE_COMPONENTS[activePage]}
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
