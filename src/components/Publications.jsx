import { useState, useMemo } from 'react'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PUB_TYPES = ['Journal', 'Conference', 'Book', 'Other']

const EMPTY_FORM = {
  title: '',
  authors: '',
  year: '',
  venue: '',
  type: 'Journal',
  doi: '',
  facultyId: '',
}

function generateId() {
  return `pub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function validate(form) {
  const errs = {}
  if (!form.title.trim())   errs.title   = 'Title is required.'
  if (!form.authors.trim()) errs.authors = 'Authors are required.'
  if (!form.year.trim())    errs.year    = 'Year is required.'
  else if (!/^\d{4}$/.test(form.year.trim())) errs.year = 'Enter a valid 4-digit year.'
  if (!form.type)           errs.type    = 'Publication type is required.'
  return errs
}

// ---------------------------------------------------------------------------
// Publication Modal  (Add + Edit)
// ---------------------------------------------------------------------------
function PublicationModal({ mode, initialData, faculty = [], onClose, onSave }) {
  const [form, setForm]     = useState(initialData ? { ...EMPTY_FORM, ...initialData } : EMPTY_FORM)
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => {
      const updated = { ...prev, [name]: value }
      // Auto-fill authors if faculty selected and authors is empty
      if (name === 'facultyId' && value) {
        const selectedFac = faculty.find((f) => f.id === value)
        if (selectedFac && !prev.authors.trim()) {
          updated.authors = selectedFac.name
        }
      }
      return updated
    })
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onSave(form)
    onClose()
  }

  const isEdit = mode === 'edit'

  return (
    <div
      className="modal-overlay"
      id={isEdit ? 'edit-publication-overlay' : 'add-publication-overlay'}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h3 id="modal-title">{isEdit ? 'Edit Publication' : 'Add Publication'}</h3>
          <button id="modal-close-btn" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="form-group">
            <label htmlFor="pub-title">Title <span className="required">*</span></label>
            <input
              id="pub-title"
              name="title"
              type="text"
              className={`form-input${errors.title ? ' input-error' : ''}`}
              placeholder="Publication title"
              value={form.title}
              onChange={handleChange}
            />
            {errors.title && <span className="error-msg">{errors.title}</span>}
          </div>

          {/* Authors */}
          <div className="form-group">
            <label htmlFor="pub-authors">Authors <span className="required">*</span></label>
            <input
              id="pub-authors"
              name="authors"
              type="text"
              className={`form-input${errors.authors ? ' input-error' : ''}`}
              placeholder="e.g. Smith J., Doe A."
              value={form.authors}
              onChange={handleChange}
            />
            {errors.authors && <span className="error-msg">{errors.authors}</span>}
          </div>

          {/* Link to Faculty Profile */}
          <div className="form-group">
            <label htmlFor="pub-faculty">Linked Faculty Member <span className="optional">(optional)</span></label>
            <select
              id="pub-faculty"
              name="facultyId"
              className="form-input form-select"
              value={form.facultyId || ''}
              onChange={handleChange}
            >
              <option value="">-- None / External Author --</option>
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.department})
                </option>
              ))}
            </select>
          </div>

          {/* Year + Type */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pub-year">Year <span className="required">*</span></label>
              <input
                id="pub-year"
                name="year"
                type="text"
                className={`form-input${errors.year ? ' input-error' : ''}`}
                placeholder="e.g. 2024"
                maxLength={4}
                value={form.year}
                onChange={handleChange}
              />
              {errors.year && <span className="error-msg">{errors.year}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="pub-type">Type <span className="required">*</span></label>
              <select
                id="pub-type"
                name="type"
                className={`form-input form-select${errors.type ? ' input-error' : ''}`}
                value={form.type}
                onChange={handleChange}
              >
                {PUB_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.type && <span className="error-msg">{errors.type}</span>}
            </div>
          </div>

          {/* Venue */}
          <div className="form-group">
            <label htmlFor="pub-venue">Journal / Conference Name</label>
            <input
              id="pub-venue"
              name="venue"
              type="text"
              className="form-input"
              placeholder="e.g. Nature, ICML 2024"
              value={form.venue}
              onChange={handleChange}
            />
          </div>

          {/* DOI */}
          <div className="form-group">
            <label htmlFor="pub-doi">DOI or URL <span className="optional">(optional)</span></label>
            <input
              id="pub-doi"
              name="doi"
              type="text"
              className="form-input"
              placeholder="https://doi.org/..."
              value={form.doi}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">
            <button id="modal-cancel-btn" type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button id="modal-submit-btn" type="submit" className="btn btn-primary">
              {isEdit ? 'Save Changes' : 'Add Publication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Confirm Delete Dialog
// ---------------------------------------------------------------------------
function ConfirmDialog({ title, onConfirm, onCancel }) {
  return (
    <div
      className="modal-overlay"
      id="confirm-delete-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
        <div className="modal-header">
          <h3 id="confirm-title">Delete Publication</h3>
          <button className="modal-close" onClick={onCancel} aria-label="Close">✕</button>
        </div>
        <div className="confirm-body">
          <p>Are you sure you want to delete:</p>
          <p className="confirm-pub-title">"{title}"</p>
          <p className="confirm-warning">This action cannot be undone.</p>
        </div>
        <div className="modal-actions confirm-actions">
          <button id="confirm-cancel-btn" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button id="confirm-delete-btn" className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Search + Filter Toolbar
// ---------------------------------------------------------------------------
function Toolbar({ search, onSearch, filterYear, onFilterYear, filterType, onFilterType, years }) {
  return (
    <div className="toolbar">
      <div className="toolbar-search">
        <span className="toolbar-search-icon">🔍</span>
        <input
          id="search-publications"
          type="text"
          className="form-input toolbar-input"
          placeholder="Search by title, authors, or venue…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        {search && (
          <button className="toolbar-clear" onClick={() => onSearch('')} title="Clear search">✕</button>
        )}
      </div>

      <div className="toolbar-filters">
        <select
          id="filter-year"
          className="form-input form-select filter-select"
          value={filterYear}
          onChange={(e) => onFilterYear(e.target.value)}
        >
          <option value="">All Years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select
          id="filter-type"
          className="form-input form-select filter-select"
          value={filterType}
          onChange={(e) => onFilterType(e.target.value)}
        >
          <option value="">All Types</option>
          {PUB_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Publications Page
// ---------------------------------------------------------------------------
function Publications({ publications = [], setPublications, faculty = [] }) {
  const [showAddModal,   setShowAddModal]   = useState(false)
  const [editingPub,     setEditingPub]     = useState(null)   // publication object | null
  const [deletingPub,    setDeletingPub]    = useState(null)   // publication object | null
  const [search,         setSearch]         = useState('')
  const [filterYear,     setFilterYear]     = useState('')
  const [filterType,     setFilterType]     = useState('')

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  function handleAdd(form) {
    const newPub = { ...form, id: generateId() }
    setPublications((prev) => [newPub, ...prev])
  }

  function handleEdit(form) {
    setPublications((prev) =>
      prev.map((p) => (p.id === editingPub.id ? { ...form, id: p.id } : p))
    )
  }

  function confirmDelete() {
    setPublications((prev) => prev.filter((p) => p.id !== deletingPub.id))
    setDeletingPub(null)
  }

  // ── Derived data ───────────────────────────────────────────────────────────
  // Unique sorted years from all publications
  const availableYears = useMemo(() => {
    const set = new Set(publications.map((p) => p.year).filter(Boolean))
    return [...set].sort((a, b) => b - a)
  }, [publications])

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return publications.filter((p) => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.authors.toLowerCase().includes(q) ||
        (p.venue && p.venue.toLowerCase().includes(q))
      const matchesYear = !filterYear || p.year === filterYear
      const matchesType = !filterType || p.type === filterType
      return matchesSearch && matchesYear && matchesType
    })
  }, [publications, search, filterYear, filterType])

  const hasActiveFilter = search || filterYear || filterType

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Publications</h2>
          <p className="page-subtitle">
            {publications.length} publication{publications.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <button id="add-publication-btn" className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Publication
        </button>
      </div>

      {/* Search + filters — only show when there are publications */}
      {publications.length > 0 && (
        <Toolbar
          search={search}
          onSearch={setSearch}
          filterYear={filterYear}
          onFilterYear={setFilterYear}
          filterType={filterType}
          onFilterType={setFilterType}
          years={availableYears}
        />
      )}

      {/* Content area */}
      {publications.length === 0 ? (
        // Brand-new empty state
        <div className="empty-state" id="publications-empty-state">
          <div className="empty-state-icon">📄</div>
          <h3>No publications yet</h3>
          <p>Click "Add Publication" to record your first entry.</p>
        </div>
      ) : filtered.length === 0 ? (
        // Filtered-to-empty state
        <div className="empty-state" id="no-results-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No results found</h3>
          <p>No publications match your current search or filters.</p>
          <button
            className="btn btn-secondary"
            style={{ marginTop: '16px' }}
            onClick={() => { setSearch(''); setFilterYear(''); setFilterType('') }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        // Table
        <div className="table-wrapper">
          <table className="pub-table" id="publications-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Authors</th>
                <th>Year</th>
                <th>Type</th>
                <th>Venue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pub) => {
                const linkedFac = pub.facultyId ? faculty.find((f) => f.id === pub.facultyId) : null
                return (
                  <tr key={pub.id}>
                    <td className="td-title">
                      {pub.doi ? (
                        <a href={pub.doi} target="_blank" rel="noreferrer" className="pub-link" title={pub.doi}>
                          {pub.title}
                        </a>
                      ) : pub.title}
                    </td>
                    <td className="td-authors">
                      <div className="authors-container">
                        <span>{pub.authors}</span>
                        {linkedFac && (
                          <span
                            className="faculty-tag"
                            title={`Linked Faculty: ${linkedFac.name} (${linkedFac.department})`}
                          >
                            👤 {linkedFac.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{pub.year}</td>
                    <td>
                      <span className={`badge badge-${pub.type.toLowerCase()}`}>{pub.type}</span>
                    </td>
                    <td className="td-venue">{pub.venue || '—'}</td>
                    <td className="td-actions">
                      <button
                        className="btn-icon btn-edit"
                        title="Edit"
                        onClick={() => setEditingPub(pub)}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        title="Delete"
                        onClick={() => setDeletingPub(pub)}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {hasActiveFilter && (
            <div className="table-footer-info">
              Showing {filtered.length} of {publications.length} publication{publications.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* Add modal */}
      {showAddModal && (
        <PublicationModal
          mode="add"
          faculty={faculty}
          onClose={() => setShowAddModal(false)}
          onSave={handleAdd}
        />
      )}

      {/* Edit modal */}
      {editingPub && (
        <PublicationModal
          mode="edit"
          faculty={faculty}
          initialData={editingPub}
          onClose={() => setEditingPub(null)}
          onSave={handleEdit}
        />
      )}

      {/* Delete confirmation */}
      {deletingPub && (
        <ConfirmDialog
          title={deletingPub.title}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingPub(null)}
        />
      )}
    </div>
  )
}

export default Publications
