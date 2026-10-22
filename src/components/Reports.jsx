import { useState, useMemo } from 'react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getPublicationDepartment(pub, faculty) {
  if (pub.facultyId) {
    const fac = faculty.find((f) => f.id === pub.facultyId)
    if (fac?.department) return fac.department
  }
  if (pub.authors) {
    const authorLower = pub.authors.toLowerCase()
    const matchedFac = faculty.find((f) => authorLower.includes(f.name.toLowerCase()))
    if (matchedFac?.department) return matchedFac.department
  }
  return 'Unassigned'
}

function escapeCSV(val) {
  if (val == null) return '""'
  const str = String(val).replace(/"/g, '""')
  return `"${str}"`
}

function downloadInBrowser(filename, content, mimeType = 'text/plain;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Reports Component
// ---------------------------------------------------------------------------
function Reports({ publications = [], faculty = [] }) {
  const [activeTab, setActiveTab] = useState('department') // 'department' | 'annual' | 'productivity'
  const [deptFilter, setDeptFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [notification, setNotification] = useState(null) // { type: 'success' | 'error' | 'info', message: string }

  function showToast(type, message) {
    setNotification({ type, message })
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev))
    }, 4500)
  }

  // ── Unified Publication Enrichment ─────────────────────────────────────────
  const enrichedPublications = useMemo(() => {
    return publications.map((p) => ({
      ...p,
      department: getPublicationDepartment(p, faculty),
    }))
  }, [publications, faculty])

  // Unique departments & years for filtering
  const allDepartments = useMemo(() => {
    const set = new Set(enrichedPublications.map((p) => p.department))
    faculty.forEach((f) => {
      if (f.department) set.add(f.department)
    })
    return [...set].sort()
  }, [enrichedPublications, faculty])

  const allYears = useMemo(() => {
    const set = new Set(enrichedPublications.map((p) => p.year).filter(Boolean))
    return [...set].sort((a, b) => b - a)
  }, [enrichedPublications])

  // ── Filtered Subset for View & Export ─────────────────────────────────────
  const filteredPublications = useMemo(() => {
    return enrichedPublications.filter((p) => {
      const matchDept = deptFilter === 'all' || p.department === deptFilter
      const matchYear = yearFilter === 'all' || p.year === yearFilter
      return matchDept && matchYear
    })
  }, [enrichedPublications, deptFilter, yearFilter])

  // ── Report 1: Department Summary ───────────────────────────────────────────
  const departmentReport = useMemo(() => {
    const deptMap = {}
    allDepartments.forEach((d) => {
      deptMap[d] = {
        department: d,
        facultyCount: faculty.filter((f) => f.department === d).length,
        total: 0,
        journals: 0,
        conferences: 0,
        books: 0,
        others: 0,
      }
    })

    filteredPublications.forEach((p) => {
      const dept = p.department
      if (!deptMap[dept]) {
        deptMap[dept] = {
          department: dept,
          facultyCount: faculty.filter((f) => f.department === dept).length,
          total: 0,
          journals: 0,
          conferences: 0,
          books: 0,
          others: 0,
        }
      }
      deptMap[dept].total += 1
      if (p.type === 'Journal') deptMap[dept].journals += 1
      else if (p.type === 'Conference') deptMap[dept].conferences += 1
      else if (p.type === 'Book') deptMap[dept].books += 1
      else deptMap[dept].others += 1
    })

    return Object.values(deptMap).sort((a, b) => b.total - a.total || a.department.localeCompare(b.department))
  }, [filteredPublications, allDepartments, faculty])

  // ── Report 2: Annual / Year-wise ───────────────────────────────────────────
  const annualReport = useMemo(() => {
    const yearMap = {}
    filteredPublications.forEach((p) => {
      const yr = p.year || 'Unknown'
      if (!yearMap[yr]) {
        yearMap[yr] = {
          year: yr,
          total: 0,
          journals: 0,
          conferences: 0,
          books: 0,
          others: 0,
        }
      }
      yearMap[yr].total += 1
      if (p.type === 'Journal') yearMap[yr].journals += 1
      else if (p.type === 'Conference') yearMap[yr].conferences += 1
      else if (p.type === 'Book') yearMap[yr].books += 1
      else yearMap[yr].others += 1
    })

    return Object.values(yearMap).sort((a, b) => {
      if (a.year === 'Unknown') return 1
      if (b.year === 'Unknown') return -1
      return b.year - a.year
    })
  }, [filteredPublications])

  // ── Report 3: Faculty Productivity ────────────────────────────────────────
  const facultyProductivityReport = useMemo(() => {
    return faculty
      .map((fac) => {
        const facNameLower = fac.name.trim().toLowerCase()
        const facPubs = filteredPublications.filter(
          (p) => p.facultyId === fac.id || (p.authors && p.authors.toLowerCase().includes(facNameLower))
        )

        return {
          id: fac.id,
          name: fac.name,
          department: fac.department,
          designation: fac.designation,
          total: facPubs.length,
          journals: facPubs.filter((p) => p.type === 'Journal').length,
          conferences: facPubs.filter((p) => p.type === 'Conference').length,
          books: facPubs.filter((p) => p.type === 'Book').length,
          others: facPubs.filter((p) => !['Journal', 'Conference', 'Book'].includes(p.type)).length,
        }
      })
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
  }, [faculty, filteredPublications])

  const maxFacultyPubs = useMemo(() => {
    return Math.max(...facultyProductivityReport.map((f) => f.total), 0)
  }, [facultyProductivityReport])

  // ── File Export Generators ────────────────────────────────────────────────
  async function saveFileSafely(defaultFilename, content, filters, successMsg) {
    if (window.electronAPI && typeof window.electronAPI.saveExportFile === 'function') {
      try {
        const res = await window.electronAPI.saveExportFile({
          defaultFilename,
          content,
          filters,
        })
        if (res.canceled) {
          showToast('info', 'Export was cancelled.')
        } else if (res.success) {
          showToast('success', `${successMsg}: ${res.filePath}`)
        } else {
          showToast('error', `Export failed: ${res.error || 'Unknown error'}`)
        }
      } catch (err) {
        showToast('error', `Export failed: ${err.message}`)
      }
    } else {
      // Browser fallback
      const mime = defaultFilename.endsWith('.csv') ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;'
      downloadInBrowser(defaultFilename, content, mime)
      showToast('success', `${successMsg} downloaded to your computer.`)
    }
  }

  // 1. Export Publications CSV
  async function exportPublicationsCSV() {
    const headers = [
      'Title',
      'Authors',
      'Department',
      'Year',
      'Type',
      'Journal/Conference/Venue',
      'DOI or URL',
    ]

    const rows = filteredPublications.map((p) => [
      escapeCSV(p.title),
      escapeCSV(p.authors),
      escapeCSV(p.department),
      escapeCSV(p.year),
      escapeCSV(p.type),
      escapeCSV(p.venue || ''),
      escapeCSV(p.doi || ''),
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    const filename = `faculty_publications_${new Date().toISOString().slice(0, 10)}.csv`
    await saveFileSafely(
      filename,
      csvContent,
      [{ name: 'CSV Files', extensions: ['csv'] }],
      'Publications CSV exported successfully'
    )
  }

  // 2. Export Current Report CSV
  async function exportCurrentReportCSV() {
    let filename = `report_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`
    let csvContent = ''

    if (activeTab === 'department') {
      const headers = ['Department', 'Faculty Members', 'Total Publications', 'Journals', 'Conferences', 'Books', 'Others']
      const rows = departmentReport.map((d) => [
        escapeCSV(d.department),
        d.facultyCount,
        d.total,
        d.journals,
        d.conferences,
        d.books,
        d.others,
      ])
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    } else if (activeTab === 'annual') {
      const headers = ['Year', 'Total Publications', 'Journals', 'Conferences', 'Books', 'Others']
      const rows = annualReport.map((y) => [
        escapeCSV(y.year),
        y.total,
        y.journals,
        y.conferences,
        y.books,
        y.others,
      ])
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    } else {
      const headers = ['Faculty Member', 'Department', 'Designation', 'Total Publications', 'Journals', 'Conferences', 'Books', 'Others']
      const rows = facultyProductivityReport.map((f) => [
        escapeCSV(f.name),
        escapeCSV(f.department),
        escapeCSV(f.designation),
        f.total,
        f.journals,
        f.conferences,
        f.books,
        f.others,
      ])
      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    }

    await saveFileSafely(
      filename,
      csvContent,
      [{ name: 'CSV Files', extensions: ['csv'] }],
      `${activeTab.toUpperCase()} report exported successfully`
    )
  }

  // 3. Export Formatted Text Summary Report
  async function exportFormattedTextSummary() {
    const dateStr = '22 October 2026'
    const totalPubs = filteredPublications.length
    const totalFaculty = faculty.length
    const totalJournals = filteredPublications.filter((p) => p.type === 'Journal').length
    const totalConferences = filteredPublications.filter((p) => p.type === 'Conference').length
    const totalBooks = filteredPublications.filter((p) => p.type === 'Book').length
    const totalOthers = filteredPublications.filter((p) => !['Journal', 'Conference', 'Book'].includes(p.type)).length

    let text = ''
    text += '================================================================================\n'
    text += '                     FACULTY PUBLICATIONS GENERATOR REPORT                     \n'
    text += '================================================================================\n'
    text += `Generated On   : ${dateStr}\n`
    text += `Active Filter  : Department: ${deptFilter} | Year: ${yearFilter}\n`
    text += `Total Records  : ${totalPubs} publications across ${totalFaculty} faculty profiles\n\n`

    text += '--------------------------------------------------------------------------------\n'
    text += '1. EXECUTIVE SUMMARY\n'
    text += '--------------------------------------------------------------------------------\n'
    text += `  • Total Publications : ${totalPubs}\n`
    text += `  • Journal Articles   : ${totalJournals}\n`
    text += `  • Conference Papers  : ${totalConferences}\n`
    text += `  • Books / Chapters   : ${totalBooks}\n`
    text += `  • Other Publications : ${totalOthers}\n\n`

    text += '--------------------------------------------------------------------------------\n'
    text += '2. DEPARTMENT SUMMARY REPORT\n'
    text += '--------------------------------------------------------------------------------\n'
    text += `${'Department'.padEnd(32)} ${'Faculty'.padStart(8)} ${'Total'.padStart(7)} ${'Journals'.padStart(9)} ${'Conf'.padStart(6)} ${'Books'.padStart(6)}\n`
    text += '-'.repeat(74) + '\n'
    departmentReport.forEach((d) => {
      text += `${d.department.slice(0, 31).padEnd(32)} ${String(d.facultyCount).padStart(8)} ${String(d.total).padStart(7)} ${String(d.journals).padStart(9)} ${String(d.conferences).padStart(6)} ${String(d.books).padStart(6)}\n`
    })
    text += '\n'

    text += '--------------------------------------------------------------------------------\n'
    text += '3. ANNUAL / YEAR-WISE BREAKDOWN\n'
    text += '--------------------------------------------------------------------------------\n'
    text += `${'Year'.padEnd(10)} ${'Total'.padStart(8)} ${'Journals'.padStart(10)} ${'Conferences'.padStart(13)} ${'Books'.padStart(8)} ${'Others'.padStart(8)}\n`
    text += '-'.repeat(60) + '\n'
    annualReport.forEach((y) => {
      text += `${String(y.year).padEnd(10)} ${String(y.total).padStart(8)} ${String(y.journals).padStart(10)} ${String(y.conferences).padStart(13)} ${String(y.books).padStart(8)} ${String(y.others).padStart(8)}\n`
    })
    text += '\n'

    text += '--------------------------------------------------------------------------------\n'
    text += '4. FACULTY PRODUCTIVITY HIGHLIGHTS\n'
    text += '--------------------------------------------------------------------------------\n'
    facultyProductivityReport.forEach((f, idx) => {
      const star = idx === 0 && f.total > 0 ? ' [Top Contributor]' : ''
      text += `${(idx + 1 + '.').padEnd(4)} ${f.name} (${f.designation}, ${f.department})${star}\n`
      text += `     Total: ${f.total} | Journals: ${f.journals} | Conferences: ${f.conferences} | Books: ${f.books} | Others: ${f.others}\n`
    })
    text += '\n'

    text += '--------------------------------------------------------------------------------\n'
    text += '5. DETAILED PUBLICATION LISTING\n'
    text += '--------------------------------------------------------------------------------\n'
    filteredPublications.forEach((p, idx) => {
      text += `[${idx + 1}] "${p.title}"\n`
      text += `    Authors : ${p.authors}\n`
      text += `    Dept    : ${p.department} | Year: ${p.year} | Type: ${p.type}\n`
      if (p.venue) text += `    Venue   : ${p.venue}\n`
      if (p.doi) text += `    DOI/URL : ${p.doi}\n`
      text += '\n'
    })

    text += '================================================================================\n'
    text += '                                END OF REPORT                                   \n'
    text += '================================================================================\n'

    const filename = `faculty_publications_summary_${new Date().toISOString().slice(0, 10)}.txt`
    await saveFileSafely(
      filename,
      text,
      [{ name: 'Text Documents', extensions: ['txt', 'md'] }],
      'Formatted summary report saved successfully'
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const hasData = publications.length > 0 || faculty.length > 0

  return (
    <div className="page">
      {/* Toast Notification */}
      {notification && (
        <div className={`report-notification toast-${notification.type}`} role="alert">
          <span>{notification.message}</span>
          <button className="toast-close" onClick={() => setNotification(null)}>
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Reports & Export</h2>
          <p className="page-subtitle">Analyze research productivity, departmental metrics, and export data</p>
        </div>

        {/* Global Export Actions */}
        <div className="report-action-buttons">
          <button
            id="export-csv-btn"
            className="btn btn-secondary"
            onClick={exportPublicationsCSV}
            title="Export publication table as CSV"
            disabled={filteredPublications.length === 0}
          >
            📥 Export CSV
          </button>
          <button
            id="export-summary-btn"
            className="btn btn-primary"
            onClick={exportFormattedTextSummary}
            title="Export clean formatted report as text file"
            disabled={!hasData}
          >
            📄 Export Text Summary
          </button>
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="report-tab-bar">
        <button
          id="tab-department"
          className={`report-tab-btn${activeTab === 'department' ? ' active' : ''}`}
          onClick={() => setActiveTab('department')}
        >
          🏛️ Department Summary
        </button>
        <button
          id="tab-annual"
          className={`report-tab-btn${activeTab === 'annual' ? ' active' : ''}`}
          onClick={() => setActiveTab('annual')}
        >
          📅 Annual / Year-wise
        </button>
        <button
          id="tab-productivity"
          className={`report-tab-btn${activeTab === 'productivity' ? ' active' : ''}`}
          onClick={() => setActiveTab('productivity')}
        >
          ⭐ Faculty Productivity
        </button>
      </div>

      {/* Filter and Export Sub-bar */}
      <div className="toolbar report-toolbar">
        <div className="toolbar-filters">
          <label className="toolbar-label">Department:</label>
          <select
            id="report-filter-dept"
            className="form-input form-select filter-select"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {allDepartments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <label className="toolbar-label">Year:</label>
          <select
            id="report-filter-year"
            className="form-input form-select filter-select"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="all">All Years</option>
            {allYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {(deptFilter !== 'all' || yearFilter !== 'all') && (
            <button
              className="btn btn-secondary toolbar-reset-btn"
              onClick={() => {
                setDeptFilter('all')
                setYearFilter('all')
              }}
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="report-subbar-export">
          <button
            className="btn btn-secondary btn-sm"
            onClick={exportCurrentReportCSV}
            title="Export currently displayed table view as CSV"
            disabled={!hasData}
          >
            📊 Export Current View CSV
          </button>
        </div>
      </div>

      {/* Content Area */}
      {!hasData ? (
        <div className="empty-state" id="reports-empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>No data available for reports</h3>
          <p>Add faculty profiles and research publications to generate comprehensive analytics.</p>
        </div>
      ) : (
        <div className="report-container">
          {/* ── View 1: Department Summary ── */}
          {activeTab === 'department' && (
            <div className="report-view" id="department-summary-view">
              <div className="report-view-header">
                <div>
                  <h3 className="report-view-title">Department Publications Summary</h3>
                  <p className="report-view-desc">
                    Publication output and type distribution categorized by academic department
                  </p>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="pub-table report-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th className="th-center">Faculty</th>
                      <th className="th-center">Total Publications</th>
                      <th className="th-center">Journals</th>
                      <th className="th-center">Conferences</th>
                      <th className="th-center">Books</th>
                      <th className="th-center">Others</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentReport.map((row) => (
                      <tr key={row.department}>
                        <td className="td-department-name">
                          <strong>{row.department}</strong>
                        </td>
                        <td className="td-center">
                          <span className="count-pill pill-neutral">{row.facultyCount}</span>
                        </td>
                        <td className="td-center">
                          <span className="count-pill pill-primary">{row.total}</span>
                        </td>
                        <td className="td-center">
                          <span className="count-pill pill-journal">{row.journals}</span>
                        </td>
                        <td className="td-center">
                          <span className="count-pill pill-conf">{row.conferences}</span>
                        </td>
                        <td className="td-center">
                          <span className="count-pill pill-book">{row.books}</span>
                        </td>
                        <td className="td-center">
                          <span className="count-pill pill-other">{row.others}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── View 2: Annual / Year-wise ── */}
          {activeTab === 'annual' && (
            <div className="report-view" id="annual-report-view">
              <div className="report-view-header">
                <div>
                  <h3 className="report-view-title">Annual Publication Trends</h3>
                  <p className="report-view-desc">
                    Yearly research productivity breakdown and venue classifications
                  </p>
                </div>
              </div>

              {annualReport.length === 0 ? (
                <div className="empty-state">
                  <p>No publications found for the selected filter.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="pub-table report-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th className="th-center">Total Publications</th>
                        <th className="th-center">Journals</th>
                        <th className="th-center">Conferences</th>
                        <th className="th-center">Books</th>
                        <th className="th-center">Others</th>
                        <th>Distribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {annualReport.map((row) => {
                        const total = row.total || 1
                        const jPct = Math.round((row.journals / total) * 100)
                        const cPct = Math.round((row.conferences / total) * 100)
                        const bPct = Math.round((row.books / total) * 100)
                        const oPct = 100 - (jPct + cPct + bPct)

                        return (
                          <tr key={row.year}>
                            <td>
                              <strong>{row.year}</strong>
                            </td>
                            <td className="td-center">
                              <span className="count-pill pill-primary">{row.total}</span>
                            </td>
                            <td className="td-center">
                              <span className="count-pill pill-journal">{row.journals}</span>
                            </td>
                            <td className="td-center">
                              <span className="count-pill pill-conf">{row.conferences}</span>
                            </td>
                            <td className="td-center">
                              <span className="count-pill pill-book">{row.books}</span>
                            </td>
                            <td className="td-center">
                              <span className="count-pill pill-other">{row.others}</span>
                            </td>
                            <td className="td-distribution">
                              <div className="dist-bar" title={`Journals: ${jPct}%, Conf: ${cPct}%, Books: ${bPct}%`}>
                                <div style={{ width: `${jPct}%`, background: '#f59e0b' }} />
                                <div style={{ width: `${cPct}%`, background: '#8b5cf6' }} />
                                <div style={{ width: `${bPct}%`, background: '#10b981' }} />
                                <div style={{ width: `${Math.max(0, oPct)}%`, background: '#9ca3af' }} />
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── View 3: Faculty Productivity ── */}
          {activeTab === 'productivity' && (
            <div className="report-view" id="faculty-productivity-view">
              <div className="report-view-header">
                <div>
                  <h3 className="report-view-title">Faculty Productivity & Research Activity</h3>
                  <p className="report-view-desc">
                    Publication records and output performance by faculty researchers
                  </p>
                </div>
              </div>

              {facultyProductivityReport.length === 0 ? (
                <div className="empty-state">
                  <p>No faculty profiles added yet. Head to "Faculty Profiles" to add members.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="pub-table report-table">
                    <thead>
                      <tr>
                        <th>Faculty Member</th>
                        <th>Department</th>
                        <th>Designation</th>
                        <th className="th-center">Total Output</th>
                        <th className="th-center">Journals</th>
                        <th className="th-center">Conferences</th>
                        <th className="th-center">Books</th>
                        <th>Productivity Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {facultyProductivityReport.map((f, idx) => {
                        const isTop = idx === 0 && f.total > 0
                        const pct = maxFacultyPubs > 0 ? Math.round((f.total / maxFacultyPubs) * 100) : 0
                        return (
                          <tr key={f.id}>
                            <td>
                              <div className="fac-productivity-name">
                                <strong>{f.name}</strong>
                                {isTop && <span className="top-author-badge">⭐ Top Contributor</span>}
                              </div>
                            </td>
                            <td>{f.department}</td>
                            <td className="td-designation">{f.designation}</td>
                            <td className="td-center">
                              <span className="count-pill pill-primary">{f.total}</span>
                            </td>
                            <td className="td-center">
                              <span className="count-pill pill-journal">{f.journals}</span>
                            </td>
                            <td className="td-center">
                              <span className="count-pill pill-conf">{f.conferences}</span>
                            </td>
                            <td className="td-center">
                              <span className="count-pill pill-book">{f.books}</span>
                            </td>
                            <td className="td-distribution">
                              <div className="productivity-bar-wrap">
                                <div className="productivity-bar" style={{ width: `${Math.max(pct, 4)}%` }} />
                                <span className="productivity-pct">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Reports
