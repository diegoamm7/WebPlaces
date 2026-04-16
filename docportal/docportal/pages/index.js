import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'

// ── Helpers ──────────────────────────────────────────────────────────────────

function mimeLabel(m) {
  if (m?.includes('document') || m?.includes('word')) return 'Google Doc'
  if (m?.includes('spreadsheet'))                      return 'Hoja de cálculo'
  if (m?.includes('presentation'))                     return 'Presentación'
  if (m?.includes('pdf'))                              return 'PDF'
  return 'Documento'
}

function mimeIcon(m) {
  if (m?.includes('document') || m?.includes('word')) return '📄'
  if (m?.includes('spreadsheet'))                      return '📊'
  if (m?.includes('presentation'))                     return '📑'
  if (m?.includes('pdf'))                              return '🔴'
  return '📝'
}

function mimeTagClass(m) {
  if (m?.includes('document') || m?.includes('word')) return 'tag-doc'
  if (m?.includes('spreadsheet'))                      return 'tag-sheet'
  if (m?.includes('presentation'))                     return 'tag-slide'
  if (m?.includes('pdf'))                              return 'tag-pdf'
  return 'tag-txt'
}

function iconBg(m) {
  if (m?.includes('document') || m?.includes('word')) return '#eff6ff'
  if (m?.includes('spreadsheet'))                      return '#f0fdf4'
  if (m?.includes('presentation'))                     return '#fef3c7'
  if (m?.includes('pdf'))                              return '#fef2f2'
  return '#f7f8fc'
}

function fmtDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtTime() {
  return new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ page, setPage, onFilter, activeCategory }) {
  const cats = [
    { key: 'Todos', icon: '🗂️', label: 'Todos' },
    { key: 'Google Doc', icon: '📄', label: 'Google Docs' },
    { key: 'Hoja de cálculo', icon: '📊', label: 'Hojas de cálculo' },
    { key: 'PDF', icon: '🔴', label: 'PDFs' },
    { key: 'Presentación', icon: '📑', label: 'Presentaciones' },
  ]

  return (
    <div className="sidebar">
      <div className="logo">
        <div className="logo-icon">📚</div>
        <div>
          <div className="logo-text">DocPortal</div>
          <div className="logo-sub">Base de conocimiento</div>
        </div>
      </div>

      <div className="nav-section">
        <div className="nav-label">Principal</div>
        <div className={`nav-item ${page==='docs' ? 'active' : ''}`} onClick={() => setPage('docs')}>
          <span className="nav-icon">🏠</span> Inicio
        </div>
        <div className={`nav-item ${page==='search' ? 'active' : ''}`} onClick={() => setPage('search')}>
          <span className="nav-icon">🔍</span> Buscador
        </div>
        <div className={`nav-item ${page==='bot' ? 'active' : ''}`} onClick={() => setPage('bot')}>
          <span className="nav-icon">🤖</span> Asistente IA
          <span className="nav-badge">BETA</span>
        </div>
      </div>

      <div className="nav-section">
        <div className="nav-label">Tipo</div>
        {cats.map(c => (
          <div
            key={c.key}
            className={`nav-item ${activeCategory===c.key && page==='docs' ? 'active' : ''}`}
            onClick={() => { onFilter(c.key); setPage('docs') }}
          >
            <span className="nav-icon">{c.icon}</span> {c.label}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <a
          href="https://drive.google.com/drive/folders/1ytvTwjvD0TAZ8Uh3je3myZTDHq2BRHwq"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-drive"
        >
          📁 Abrir carpeta en Drive
        </a>
      </div>
    </div>
  )
}

// ── Docs page ─────────────────────────────────────────────────────────────────

function DocsPage({ docs, loading, error, category, onCategory }) {
  const filtered = category === 'Todos' ? docs : docs.filter(d => mimeLabel(d.mimeType) === category)
  const cats = ['Todos', 'Google Doc', 'Hoja de cálculo', 'PDF', 'Presentación']

  const count = (type) => docs.filter(d => mimeLabel(d.mimeType) === type).length

  return (
    <>
      <div className="stats-row">
        {[
          { icon: '📄', bg: '#eff6ff', num: docs.length,              label: 'Total docs',      sub: 'desde Drive' },
          { icon: '📊', bg: '#f0fdf4', num: count('Hoja de cálculo'), label: 'Hojas de cálculo', sub: '' },
          { icon: '🔴', bg: '#fef2f2', num: count('PDF'),             label: 'PDFs',             sub: '' },
          { icon: '📑', bg: '#fef3c7', num: count('Presentación'),    label: 'Presentaciones',   sub: '' },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-top">
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
              {s.sub && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{s.sub}</span>}
            </div>
            <div className="stat-num">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="section-header">
        <div>
          <div className="section-title">Todos los documentos</div>
          <div className="section-sub">{filtered.length} documentos · Google Drive</div>
        </div>
      </div>

      <div className="filter-row">
        {cats.map(c => (
          <div key={c} className={`chip ${category===c ? 'active' : ''}`} onClick={() => onCategory(c)}>
            {c}
          </div>
        ))}
      </div>

      {error && <div className="error-banner">⚠️ {error}</div>}

      {loading ? (
        <div className="loader"><div className="loader-circle spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="em-icon">📂</div>
          <h3>No hay documentos</h3>
          <p>
            {docs.length === 0
              ? 'Subí documentos a tu carpeta de Google Drive y aparecerán acá automáticamente.'
              : `No hay documentos de tipo "${category}".`}
          </p>
        </div>
      ) : (
        <div className="doc-grid">
          {filtered.map(doc => (
            <a
              key={doc.id}
              href={doc.webViewLink || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="doc-card fade-in"
            >
              <div className="doc-card-top">
                <div className="doc-icon-wrap" style={{ background: iconBg(doc.mimeType) }}>
                  {mimeIcon(doc.mimeType)}
                </div>
                <span className={`doc-tag ${mimeTagClass(doc.mimeType)}`}>
                  {mimeLabel(doc.mimeType)}
                </span>
              </div>
              <div className="doc-name">{doc.name}</div>
              <div className="doc-desc">{doc.description || 'Sin descripción'}</div>
              <div className="doc-footer">
                <span className="doc-date">{fmtDate(doc.modifiedTime)}</span>
                <span className="doc-arrow">→</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  )
}

// ── Search page ───────────────────────────────────────────────────────────────

function SearchPage({ docs }) {
  const [q, setQ] = useState('')
  const results = q.length < 2 ? [] : docs.filter(d =>
    d.name.toLowerCase().includes(q.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(q.toLowerCase()) ||
    mimeLabel(d.mimeType).toLowerCase().includes(q.toLowerCase())
  )

  return (
    <>
      <div className="search-hero">
        <h2>¿Qué estás buscando?</h2>
        <p>Buscá en todos los documentos del equipo</p>
      </div>
      <div className="search-big">
        <span style={{ fontSize: 20, color: 'var(--muted)' }}>🔍</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Ej: política de vacaciones, onboarding..." autoFocus />
        {q && <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18 }}>×</button>}
      </div>

      {q.length >= 2 && results.length === 0 && (
        <div className="empty-state">
          <div className="em-icon">🔍</div>
          <h3>Sin resultados</h3>
          <p>No encontramos nada para &ldquo;{q}&rdquo;.</p>
        </div>
      )}

      {results.map(doc => (
        <a key={doc.id} href={doc.webViewLink || '#'} target="_blank" rel="noopener noreferrer"
          className="result-item" style={{ display: 'block', textDecoration: 'none', color: 'inherit', marginBottom: 10 }}>
          <div className="result-header">
            <div className="result-icon" style={{ background: iconBg(doc.mimeType) }}>{mimeIcon(doc.mimeType)}</div>
            <div>
              <div className="result-title">{doc.name}</div>
              <div className="result-meta">{mimeLabel(doc.mimeType)} · {fmtDate(doc.modifiedTime)}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>Abrir →</span>
          </div>
          {doc.description && <div className="result-excerpt">{doc.description}</div>}
        </a>
      ))}

      {!q && docs.length > 0 && (
        <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, paddingTop: 12 }}>
          {docs.length} documentos disponibles — empezá a escribir para buscar
        </div>
      )}
    </>
  )
}

// ── Bot page ──────────────────────────────────────────────────────────────────

const WELCOME = [{
  id: 'w', role: 'bot',
  text: '¡Hola! 👋 Soy el asistente del portal.\n\nPuedo responder preguntas sobre los documentos del equipo. Para mejores resultados seleccioná un documento del menú de abajo y haceme una pregunta sobre él.',
  time: fmtTime()
}]

const SUGGESTIONS = ['📅 ¿Cómo pido vacaciones?', '🆕 Proceso de onboarding', '💰 Política de gastos', '🖥️ Solicitar equipo nuevo']

function BotPage({ docs }) {
  const [messages, setMessages]     = useState(WELCOME)
  const [input, setInput]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [selectedFile, setSelected] = useState('')
  const endRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = useCallback(async (text) => {
    const msg = (text || input).trim()
    if (!msg || loading) return

    setMessages(p => [...p, { id: Date.now()+'', role: 'user', text: msg, time: fmtTime() }])
    setInput('')
    setLoading(true)

    try {
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, ...(selectedFile ? { fileId: selectedFile } : {}) })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')

      const srcDoc = docs.find(d => d.id === selectedFile) || null
      setMessages(p => [...p, { id: (Date.now()+1)+'', role: 'bot', text: data.reply, time: fmtTime(), srcDoc }])
    } catch (err) {
      setMessages(p => [...p, { id: (Date.now()+1)+'', role: 'bot', text: `Error: ${err.message}`, time: fmtTime() }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, selectedFile, docs])

  return (
    <div className="bot-container">
      <div className="bot-header">
        <h2>🤖 Asistente de documentos</h2>
        <p>Hacé preguntas sobre cualquier documento del equipo</p>
      </div>

      <div className="chat-area">
        {messages.map(m => (
          <div key={m.id} className={`msg ${m.role==='user' ? 'user' : ''}`}>
            <div className={`msg-av ${m.role==='bot' ? 'bot-av' : 'user-av'}`}>
              {m.role==='bot' ? '🤖' : '👤'}
            </div>
            <div>
              <div className={`msg-bubble ${m.role==='bot' ? 'bot-bub' : 'user-bub'}`}>{m.text}</div>
              <div className="msg-time" style={m.role==='user' ? { textAlign:'right' } : {}}>
                {m.time} · {m.role==='bot' ? 'DocBot' : 'Vos'}
              </div>
              {m.srcDoc && (
                <a href={m.srcDoc.webViewLink||'#'} target="_blank" rel="noopener noreferrer" className="doc-ref">
                  <span style={{ fontSize:18 }}>{mimeIcon(m.srcDoc.mimeType)}</span>
                  <div>
                    <div className="ref-title">{m.srcDoc.name}</div>
                    <div className="ref-meta">Fuente · {mimeLabel(m.srcDoc.mimeType)} · {fmtDate(m.srcDoc.modifiedTime)}</div>
                  </div>
                  <span style={{ marginLeft:'auto', color:'var(--accent)', fontSize:12, fontWeight:600 }}>Ver →</span>
                </a>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="msg">
            <div className="msg-av bot-av">🤖</div>
            <div className="msg-bubble bot-bub">
              <div className="typing-dots">
                <div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/>
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="chat-input-area">
        {docs.length > 0 && (
          <div className="doc-selector-wrap">
            <div className="doc-selector-label">📎 Consultar sobre un documento (opcional)</div>
            <select className="doc-selector" value={selectedFile} onChange={e => setSelected(e.target.value)}>
              <option value="">— Sin documento seleccionado —</option>
              {docs.map(d => <option key={d.id} value={d.id}>{mimeIcon(d.mimeType)} {d.name}</option>)}
            </select>
          </div>
        )}
        <div className="suggestions">
          {SUGGESTIONS.map(s => <div key={s} className="suggest-chip" onClick={() => send(s)}>{s}</div>)}
        </div>
        <div className="chat-input-row">
          <textarea
            className="chat-textarea" rows={1} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Escribí tu consulta..." disabled={loading}
          />
          <button className="send-btn" onClick={() => send()} disabled={loading || !input.trim()}>➤</button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [page, setPage]         = useState('docs')
  const [docs, setDocs]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [category, setCategory] = useState('Todos')

  useEffect(() => {
    fetch('/api/documents')
      .then(r => r.json())
      .then(data => { setDocs(data.files || []); setError(data.error || '') })
      .catch(() => setError('No se pudo conectar con Google Drive'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Head>
        <title>DocPortal — Base de conocimiento</title>
        <meta name="description" content="Portal de documentos del equipo" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📚</text></svg>" />
      </Head>

      <div className="layout">
        <Sidebar page={page} setPage={setPage} onFilter={setCategory} activeCategory={category} />
        <div className="main">
          <div className="topbar">
            <button className={`tab-btn ${page==='docs'   ? 'active':''}`} onClick={() => setPage('docs')}>📄 Documentos</button>
            <button className={`tab-btn ${page==='search' ? 'active':''}`} onClick={() => setPage('search')}>🔍 Buscador</button>
            <button className={`tab-btn ${page==='bot'    ? 'active':''}`} onClick={() => setPage('bot')}>🤖 Asistente</button>
            <div className="topbar-right">
              <a href="https://drive.google.com/drive/folders/1ytvTwjvD0TAZ8Uh3je3myZTDHq2BRHwq"
                target="_blank" rel="noopener noreferrer" className="btn-add">
                ＋ Subir a Drive
              </a>
            </div>
          </div>
          <div className="content">
            {page==='docs'   && <DocsPage  docs={docs} loading={loading} error={error} category={category} onCategory={setCategory} />}
            {page==='search' && <SearchPage docs={docs} />}
            {page==='bot'    && <BotPage   docs={docs} />}
          </div>
        </div>
      </div>
    </>
  )
}
