import { useState, useMemo } from 'react'

const DESIGNATIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Lecturer',
  'Adjunct Professor',
  'Research Scholar',
]

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Communication',
  'Electrical & Electronics',
  'Mechanical Engineering',
  'Civil Engineering',
  'Physics',
  'Chemistry',
  'Mathematics',
  'Business Administration',
]

const EMPTY_FACULTY_FORM = {
  name: '',
  department: '',
  designation: 'Assistant Professor',
  email: '',
  researchArea: '',
}

function generateFacultyId() {
  return `fac_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function validateFaculty(form) {
  const errs = {}
  if (!form.name.trim()) errs.name = 'Name is required.'
  if (!form.department.trim()) errs.department = 'Department is required.'
  if (!form.designation.trim()) errs.designation = 'Designation is required.'

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.email.trim()) {
    errs.email = 'Email is required.'
  } else if (!emailRegex.test(form.email.trim())) {
    errs.email = 'Enter a valid email address.'
  }

  return errs
}

// ---------------------------------------------------------------------------
// Faculty Modal (Add / Edit)
// ---------------------------------------------------------------------------
function FacultyModal({ mode, initialData, onClose, onSave }) {
  const [form, setForm] = useState(initialData ? { ...EMPTY_FACULTY_FORM, ...initialData } : EMPTY_FACULTY_FORM)
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validateFaculty(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onSave(form)
    onClose()
  }

  const isEdit = mode === 'edit'

  return (
    <div
      className="modal-overlay"
      id={isEdit ? 'edit-faculty-overlay' : 'add-faculty-overlay'}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="faculty-modal-title">
        <div className="modal-header">
          <h3 id="faculty-modal-title">{isEdit ? 'Edit Faculty Profile' : 'Add Faculty Profile'}</h3>
          <button id="faculty-modal-close-btn" className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          {/* Name */}
          <div className="form-group">
            <label htmlFor="fac-name">
              Full Name <span className="required">*</span>
            </label>
            <input
              id="fac-name"
              name="name"
              type="text"
              className={`form-input${errors.name ? ' input-error' : ''}`}
              placeholder="e.g. Dr. Alan Turing"
              value={form.name}
              onChange={handleChange}
            />
            {errors.name && <span className="error-msg">{errors.name}</span>}
          </div>

          {/* Department + Designation */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fac-department">
                Department <span className="required">*</span>
              </label>
              <input
                id="fac-department"
                name="department"
                type="text"
                list="department-list"
                className={`form-input${errors.department ? ' input-error' : ''}`}
                placeholder="e.g. Computer Science"
                value={form.department}
                onChange={handleChange}
              />
              <datalist id="department-list">
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
              {errors.department && <span className="error-msg">{errors.department}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="fac-designation">
                Designation <span className="required">*</span>
              </label>
              <select
                id="fac-designation"
                name="designation"
                className={`form-input form-select${errors.designation ? ' input-error' : ''}`}
                value={form.designation}
                onChange={handleChange}
              >
                {DESIGNATIONS.map((desig) => (
                  <option key={desig} value={desig}>
                    {desig}
                  </option>
                ))}
              </select>
              {errors.designation && <span className="error-msg">{errors.designation}</span>}
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="fac-email">
              Email Address <span className="required">*</span>
            </label>
            <input
              id="fac-email"
              name="email"
              type="email"
              className={`form-input${errors.email ? ' input-error' : ''}`}
              placeholder="e.g. alan.turing@university.edu"
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>

          {/* Research Area / Interests */}
          <div className="form-group">
            <label htmlFor="fac-research">
              Research Area / Interests <span className="optional">(optional)</span>
            </label>
            <input
              id="fac-research"
              name="researchArea"
              type="text"
              className="form-input"
              placeholder="e.g. Artificial Intelligence, Cryptography, Robotics"
              value={form.researchArea}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">
            <button id="fac-modal-cancel-btn" type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button id="fac-modal-submit-btn" type="submit" className="btn btn-primary">
              {isEdit ? 'Save Changes' : 'Add Profile'}
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
function ConfirmFacultyDeleteDialog({ facultyMember, onConfirm, onCancel }) {
  return (
    <div
      className="modal-overlay"
      id="confirm-faculty-delete-overlay"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-fac-title">
        <div className="modal-header">
          <h3 id="confirm-fac-title">Delete Faculty Profile</h3>
          <button className="modal-close" onClick={onCancel} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="confirm-body">
          <p>Are you sure you want to delete the profile for:</p>
          <p className="confirm-pub-title">{facultyMember.name}</p>
          <p className="confirm-warning">
            This will remove their profile record. Existing publications linked to them will remain safe.
          </p>
        </div>
        <div className="modal-actions confirm-actions">
          <button id="confirm-fac-cancel-btn" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button id="confirm-fac-delete-btn" className="btn btn-danger" onClick={onConfirm}>
            Delete Profile
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Faculty Publications View Modal
// ---------------------------------------------------------------------------
function FacultyPublicationsModal({ facultyMember, publications = [], onClose }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg" role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h3>Publications by {facultyMember.name}</h3>
            <p className="modal-subheading">
              {facultyMember.designation} · {facultyMember.department} · {publications.length} publication
              {publications.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="faculty-pubs-list">
          {publications.length === 0 ? (
            <div className="empty-substate">
              <span className="empty-substate-icon">📄</span>
              <p>No publications linked to this faculty member yet.</p>
            </div>
          ) : (
            publications.map((pub) => (
              <div key={pub.id} className="faculty-pub-item">
                <div className="faculty-pub-item-header">
                  <span className={`badge badge-${pub.type.toLowerCase()}`}>{pub.type}</span>
                  <span className="faculty-pub-year">{pub.year}</span>
                </div>
                <h4 className="faculty-pub-title">{pub.title}</h4>
                <p className="faculty-pub-authors">{pub.authors}</p>
                {pub.venue && <p className="faculty-pub-venue">{pub.venue}</p>}
                {pub.doi && (
                  <a href={pub.doi} target="_blank" rel="noreferrer" className="pub-link faculty-pub-doi">
                    {pub.doi}
                  </a>
                )}
              </div>
            ))
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Faculty Profiles Page
// ---------------------------------------------------------------------------
function FacultyProfiles({ faculty = [], setFaculty, publications = [] }) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState(null)
  const [deletingFaculty, setDeletingFaculty] = useState(null)
  const [viewingPubsFaculty, setViewingPubsFaculty] = useState(null)
  const [search, setSearch] = useState('')

  // ── Helper: find associated publications ──────────────────────────────────
  function getFacultyPublications(fac) {
    if (!fac) return []
    const facNameLower = fac.name.trim().toLowerCase()
    return publications.filter(
      (p) => p.facultyId === fac.id || (p.authors && p.authors.toLowerCase().includes(facNameLower))
    )
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleAdd(form) {
    const newFaculty = { ...form, id: generateFacultyId() }
    setFaculty((prev) => [newFaculty, ...prev])
  }

  function handleEdit(form) {
    setFaculty((prev) =>
      prev.map((f) => (f.id === editingFaculty.id ? { ...form, id: f.id } : f))
    )
  }

  function confirmDelete() {
    setFaculty((prev) => prev.filter((f) => f.id !== deletingFaculty.id))
    setDeletingFaculty(null)
  }

  // ── Search filter ─────────────────────────────────────────────────────────
  const filteredFaculty = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return faculty
    return faculty.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.department.toLowerCase().includes(q) ||
        (f.researchArea && f.researchArea.toLowerCase().includes(q))
    )
  }, [faculty, search])

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Faculty Profiles</h2>
          <p className="page-subtitle">
            {faculty.length} faculty member{faculty.length !== 1 ? 's' : ''} in directory
          </p>
        </div>
        <button id="add-faculty-btn" className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Faculty Profile
        </button>
      </div>

      {/* Search Toolbar */}
      {faculty.length > 0 && (
        <div className="toolbar">
          <div className="toolbar-search">
            <span className="toolbar-search-icon">🔍</span>
            <input
              id="search-faculty"
              type="text"
              className="form-input toolbar-input"
              placeholder="Search faculty by name, department, or research area…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="toolbar-clear" onClick={() => setSearch('')} title="Clear search">
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      {faculty.length === 0 ? (
        <div className="empty-state" id="faculty-empty-state">
          <div className="empty-state-icon">👤</div>
          <h3>No faculty profiles yet</h3>
          <p>Add faculty profiles to organize research publications by department and author.</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '16px' }}
            onClick={() => setShowAddModal(true)}
          >
            + Add First Faculty Member
          </button>
        </div>
      ) : filteredFaculty.length === 0 ? (
        <div className="empty-state" id="faculty-no-results">
          <div className="empty-state-icon">🔍</div>
          <h3>No matching faculty found</h3>
          <p>Try searching with another name, department, or research interest.</p>
          <button className="btn btn-secondary" style={{ marginTop: '16px' }} onClick={() => setSearch('')}>
            Clear Search
          </button>
        </div>
      ) : (
        <div className="faculty-grid">
          {filteredFaculty.map((fac) => {
            const facPubs = getFacultyPublications(fac)
            return (
              <div key={fac.id} className="faculty-card">
                <div className="faculty-card-header">
                  <div className="faculty-avatar">
                    {fac.name
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0].toUpperCase())
                      .join('')}
                  </div>
                  <div className="faculty-card-title-group">
                    <h3 className="faculty-name">{fac.name}</h3>
                    <span className="faculty-designation">{fac.designation}</span>
                  </div>
                  <div className="faculty-card-actions">
                    <button
                      className="btn-icon btn-edit"
                      title="Edit Profile"
                      onClick={() => setEditingFaculty(fac)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      title="Delete Profile"
                      onClick={() => setDeletingFaculty(fac)}
                    >
                      🗑
                    </button>
                  </div>
                </div>

                <div className="faculty-card-body">
                  <div className="faculty-detail-row">
                    <span className="faculty-detail-label">🏛️ Department</span>
                    <span className="faculty-dept-badge">{fac.department}</span>
                  </div>

                  <div className="faculty-detail-row">
                    <span className="faculty-detail-label">✉️ Email</span>
                    <a href={`mailto:${fac.email}`} className="faculty-email-link">
                      {fac.email}
                    </a>
                  </div>

                  {fac.researchArea && (
                    <div className="faculty-detail-row">
                      <span className="faculty-detail-label">🔬 Research</span>
                      <span className="faculty-research-text">{fac.researchArea}</span>
                    </div>
                  )}
                </div>

                <div className="faculty-card-footer">
                  <button
                    className="faculty-pubs-badge-btn"
                    onClick={() => setViewingPubsFaculty(fac)}
                    title="View linked publications"
                  >
                    <span>📄 {facPubs.length} publication{facPubs.length !== 1 ? 's' : ''}</span>
                    <span className="view-link-arrow">→</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <FacultyModal
          mode="add"
          onClose={() => setShowAddModal(false)}
          onSave={handleAdd}
        />
      )}

      {/* Edit Modal */}
      {editingFaculty && (
        <FacultyModal
          mode="edit"
          initialData={editingFaculty}
          onClose={() => setEditingFaculty(null)}
          onSave={handleEdit}
        />
      )}

      {/* Delete Confirmation */}
      {deletingFaculty && (
        <ConfirmFacultyDeleteDialog
          facultyMember={deletingFaculty}
          onConfirm={confirmDelete}
          onCancel={() => setDeletingFaculty(null)}
        />
      )}

      {/* View Linked Publications Modal */}
      {viewingPubsFaculty && (
        <FacultyPublicationsModal
          facultyMember={viewingPubsFaculty}
          publications={getFacultyPublications(viewingPubsFaculty)}
          onClose={() => setViewingPubsFaculty(null)}
        />
      )}
    </div>
  )
}

export default FacultyProfiles
