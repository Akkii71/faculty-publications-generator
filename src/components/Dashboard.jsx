const SUMMARY_CARDS = [
  {
    id: 'total-publications',
    label: 'Total Publications',
    value: 0,
    icon: '📄',
    accent: '#4f6ef7',
  },
  {
    id: 'faculty-members',
    label: 'Faculty Members',
    value: 0,
    icon: '👤',
    accent: '#10b981',
  },
  {
    id: 'journals',
    label: 'Journals',
    value: 0,
    icon: '📰',
    accent: '#f59e0b',
  },
  {
    id: 'conferences',
    label: 'Conferences',
    value: 0,
    icon: '🏛️',
    accent: '#8b5cf6',
  },
]

function Dashboard() {
  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-title">Dashboard</h2>
        <p className="page-subtitle">Overview of your faculty publications</p>
      </div>

      <div className="summary-grid">
        {SUMMARY_CARDS.map((card) => (
          <div key={card.id} id={card.id} className="summary-card">
            <div className="summary-card-icon" style={{ background: card.accent + '18', color: card.accent }}>
              {card.icon}
            </div>
            <div className="summary-card-body">
              <span className="summary-card-value">{card.value}</span>
              <span className="summary-card-label">{card.label}</span>
            </div>
            <div className="summary-card-accent" style={{ background: card.accent }} />
          </div>
        ))}
      </div>

      <div className="dashboard-empty">
        <div className="dashboard-empty-icon">📊</div>
        <h3>No data yet</h3>
        <p>Add publications and faculty profiles to see your dashboard come to life.</p>
      </div>
    </div>
  )
}

export default Dashboard
