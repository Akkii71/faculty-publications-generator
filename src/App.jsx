import { useState, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './components/Dashboard.jsx'
import Publications from './components/Publications.jsx'
import FacultyProfiles from './components/FacultyProfiles.jsx'
import Reports from './components/Reports.jsx'
import Settings from './components/Settings.jsx'

const PUB_STORAGE_KEY = 'fpg_publications'
const FAC_STORAGE_KEY = 'fpg_faculty'

function loadFromLocalStorage() {
  try {
    const rawPubs = localStorage.getItem(PUB_STORAGE_KEY)
    const rawFac = localStorage.getItem(FAC_STORAGE_KEY)
    return {
      publications: rawPubs ? JSON.parse(rawPubs) : [],
      faculty: rawFac ? JSON.parse(rawFac) : [],
    }
  } catch {
    return { publications: [], faculty: [] }
  }
}

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [publications, setPublications] = useState([])
  const [faculty, setFaculty] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const isFirstSave = useRef(true)

  // ── Load data on application mount ─────────────────────────────────────────
  useEffect(() => {
    async function initData() {
      try {
        if (window.electronAPI && typeof window.electronAPI.loadData === 'function') {
          const res = await window.electronAPI.loadData()
          let initialPubs = Array.isArray(res?.publications) ? res.publications : []
          let initialFac = Array.isArray(res?.faculty) ? res.faculty : []

          // Backward compatibility: If desktop storage is empty, check localStorage
          if (initialPubs.length === 0 && initialFac.length === 0) {
            const local = loadFromLocalStorage()
            if (local.publications.length > 0 || local.faculty.length > 0) {
              initialPubs = local.publications
              initialFac = local.faculty
              // Migrate to desktop storage immediately
              await window.electronAPI.saveData({
                publications: initialPubs,
                faculty: initialFac,
              })
            }
          }

          setPublications(initialPubs)
          setFaculty(initialFac)
        } else {
          // Browser environment fallback
          const local = loadFromLocalStorage()
          setPublications(local.publications)
          setFaculty(local.faculty)
        }
      } catch (err) {
        console.error('Failed to initialize app data:', err)
        const local = loadFromLocalStorage()
        setPublications(local.publications)
        setFaculty(local.faculty)
      } finally {
        setIsLoaded(true)
      }
    }

    initData()
  }, [])

  // ── Persist data whenever publications or faculty change ───────────────────
  useEffect(() => {
    if (!isLoaded) return

    // Avoid double save on initial mount
    if (isFirstSave.current) {
      isFirstSave.current = false
      return
    }

    const payload = { publications, faculty }

    // Persist to desktop file storage via Electron IPC
    if (window.electronAPI && typeof window.electronAPI.saveData === 'function') {
      window.electronAPI.saveData(payload).catch((err) => {
        console.error('Failed saving to desktop storage:', err)
      })
    }

    // Also sync to localStorage as redundant backup / browser fallback
    try {
      localStorage.setItem(PUB_STORAGE_KEY, JSON.stringify(publications))
      localStorage.setItem(FAC_STORAGE_KEY, JSON.stringify(faculty))
    } catch {
      // storage quota / unavailable fallback
    }
  }, [publications, faculty, isLoaded])

  const pages = {
    dashboard: <Dashboard publications={publications} faculty={faculty} />,
    publications: (
      <Publications
        publications={publications}
        setPublications={setPublications}
        faculty={faculty}
      />
    ),
    faculty: (
      <FacultyProfiles
        faculty={faculty}
        setFaculty={setFaculty}
        publications={publications}
      />
    ),
    reports: <Reports publications={publications} faculty={faculty} />,
    settings: <Settings />,
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
