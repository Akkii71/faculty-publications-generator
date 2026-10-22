function Settings() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="page-subtitle">Configure application preferences</p>
        </div>
      </div>

      <div className="empty-state" id="settings-empty-state">
        <div className="empty-state-icon">⚙️</div>
        <h3>Settings coming soon</h3>
        <p>Application settings will be available in a future update.</p>
      </div>
    </div>
  )
}

export default Settings
