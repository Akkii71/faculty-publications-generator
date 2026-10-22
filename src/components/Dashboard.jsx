function Dashboard({ publications = [], faculty = [] }) {
  const total = publications.length
  const facultyCount = faculty.length
  const journals = publications.filter((p) => p.type === 'Journal').length
  const conferences = publications.filter((p) => p.type === 'Conference').length

  const SUMMARY_CARDS = [
    {
      id: 'total-publications',
      label: 'Total Publications',
      value: total,
      icon: '📄',
      accent: '#4f6ef7',
    },
    {
      id: 'faculty-members',
      label: 'Faculty Members',
      value: facultyCount,
      icon: '👤',
      accent: '#10b981',
    },
    {
      id: 'journals',
      label: 'Journals',
      value: journals,
      icon: '📰',
      accent: '#f59e0b',
    },
    {
      id: 'conferences',
      label: 'Conferences',
      value: conferences,
      icon: '🏛️',
      accent: '#8b5cf6',
    },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Overview of your faculty publications and research output</p>
        </div>
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

      {total === 0 && facultyCount === 0 ? (
        <div className="dashboard-empty">
          <div className="dashboard-empty-icon">📊</div>
          <h3>No data yet</h3>
          <p>Add publications and faculty profiles to see your dashboard come to life.</p>
        </div>
      ) : (
        <div className="dashboard-summary-text">
          <p>
            You have <strong>{total}</strong> publication{total !== 1 ? 's' : ''} recorded across{' '}
            <strong>{facultyCount}</strong> faculty member{facultyCount !== 1 ? 's' : ''} —{' '}
            <strong>{journals}</strong> journal{journals !== 1 ? 's' : ''} and{' '}
            <strong>{conferences}</strong> conference{conferences !== 1 ? 's' : ''}.
          </p>
        </div>
      )}
    </div>
  )
}

export default Dashboard
