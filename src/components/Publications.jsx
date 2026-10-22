import { useState } from 'react'

const EMPTY_FORM = {
  title: '',
  authors: '',
  year: '',
  venue: '',
  type: 'Journal',
  doi: '',
}

const PUB_TYPES = ['Journal', 'Conference', 'Book', 'Other']

function AddPublicationModal({ onClose, onAdd }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.title.trim())   errs.title   = 'Title is required.'
    if (!form.authors.trim()) errs.authors = 'Authors are required.'
    if (!form.year.trim())    errs.year    = 'Year is required.'
    else if (!/^\d{4}$/.test(form.year.trim())) errs.year = 'Enter a valid 4-digit year.'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    onAdd({ ...form, id: Date.now() })
    onClose()
  }

  return (
    <div className="modal-overlay" id="add-publication-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h3 id="modal-title">Add Publication</h3>
          <button id="modal-close-btn" className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
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
              <label htmlFor="pub-type">Type</label>
              <select
                id="pub-type"
                name="type"
                className="form-input form-select"
                value={form.type}
                onChange={handleChange}
              >
                {PUB_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

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
            <button id="modal-cancel-btn" type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="modal-submit-btn" type="submit" className="btn btn-primary">Add Publication</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Publications() {
  const [publications, setPublications] = useState([])
  const [showModal, setShowModal] = useState(false)

  function handleAdd(pub) {
    setPublications((prev) => [pub, ...prev])
  }

  function handleDelete(id) {
    setPublications((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Publications</h2>
          <p className="page-subtitle">{publications.length} publication{publications.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <button id="add-publication-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Publication
        </button>
      </div>

      {publications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <h3>No publications yet</h3>
          <p>Click "Add Publication" to record your first entry.</p>
        </div>
      ) : (
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
              {publications.map((pub) => (
                <tr key={pub.id}>
                  <td className="td-title">
                    {pub.doi ? (
                      <a href={pub.doi} target="_blank" rel="noreferrer" className="pub-link" title={pub.doi}>
                        {pub.title}
                      </a>
                    ) : pub.title}
                  </td>
                  <td className="td-authors">{pub.authors}</td>
                  <td>{pub.year}</td>
                  <td><span className={`badge badge-${pub.type.toLowerCase()}`}>{pub.type}</span></td>
                  <td className="td-venue">{pub.venue || '—'}</td>
                  <td>
                    <button
                      className="btn-icon btn-delete"
                      title="Delete"
                      onClick={() => handleDelete(pub.id)}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <AddPublicationModal
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}

export default Publications
