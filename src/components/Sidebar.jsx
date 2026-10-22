const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',        icon: '▦' },
  { id: 'publications', label: 'Publications',      icon: '📄' },
  { id: 'faculty',      label: 'Faculty Profiles',  icon: '👤' },
  { id: 'reports',      label: 'Reports',           icon: '📊' },
  { id: 'settings',     label: 'Settings',          icon: '⚙️' },
]

function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-icon">🎓</span>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-title">FacPub</span>
          <span className="sidebar-brand-sub">Generator</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`sidebar-nav-item${activePage === item.id ? ' active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span className="sidebar-version">v1.0.0</span>
      </div>
    </aside>
  )
}

export default Sidebar
