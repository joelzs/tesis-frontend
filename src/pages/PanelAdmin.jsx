import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from '../config';

export default function PanelAdmin() {
  const { usuario, token, logout } = useAuth();
  const navigate = useNavigate();
  const [tesis, setTesis]           = useState([]);
  const [filtro, setFiltro]         = useState('todos');
  const [cargando, setCargando]     = useState(true);
  const [modalTesis, setModalTesis] = useState(null);
  const [fecha, setFecha]           = useState('');
  const [hora, setHora]             = useState('');
  const [comentario, setComentario] = useState('');
  const [modoRechazo, setModoRechazo] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [toast, setToast]           = useState('');

  useEffect(() => { cargarTesis(); }, [filtro]);

  async function cargarTesis() {
    setCargando(true);
    try {
      const params = filtro !== 'todos' ? `?estado=${filtro}` : '';
      const res = await axios.get(`${API_URL}/tesis/todas${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTesis(res.data.tesis);
    } catch {
      mostrarToast('Error al cargar las tesis');
    } finally {
      setCargando(false);
    }
  }

  function abrirModal(t) {
    setModalTesis(t);
    setFecha(t.fecha_sustentacion?.split('T')[0] || '');
    setHora(t.hora_sustentacion?.slice(0,5) || '');
    setComentario('');
    setModoRechazo(false);
  }

  async function aprobar() {
    if (!fecha || !hora) return mostrarToast('Asigna fecha y hora primero');
    setProcesando(true);
    try {
      await axios.put(`${API_URL}/tesis/${modalTesis.id}/aprobar`,
        { fecha_sustentacion: fecha, hora_sustentacion: hora },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mostrarToast('✅ Tesis aprobada y fecha asignada');
      setModalTesis(null);
      cargarTesis();
    } catch (err) {
      mostrarToast(err.response?.data?.error || 'Error al aprobar');
    } finally { setProcesando(false); }
  }

  async function rechazar() {
    if (!comentario.trim()) return mostrarToast('Escribe un comentario de rechazo');
    setProcesando(true);
    try {
      await axios.put(`${API_URL}/tesis/${modalTesis.id}/rechazar`,
        { comentario },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      mostrarToast('Documento rechazado. El estudiante debe corregirlo.');
      setModalTesis(null);
      cargarTesis();
    } catch (err) {
      mostrarToast(err.response?.data?.error || 'Error al rechazar');
    } finally { setProcesando(false); }
  }

  function mostrarToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const stats = {
    pendiente: tesis.filter(t => t.estado === 'pendiente').length,
    aprobado:  tesis.filter(t => t.estado === 'aprobado').length,
    rechazado: tesis.filter(t => t.estado === 'rechazado').length,
  };

  const badgeColor = {
    pendiente: { bg:'#fef3cd', color:'#8a6914', label:'Pendiente' },
    aprobado:  { bg:'#d4edda', color:'#1a5c2e', label:'Aprobado' },
    rechazado: { bg:'#fde8e6', color:'#8c2018', label:'Rechazado' },
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f5f2eb' }}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <span style={styles.navLogo}>Tesis<span style={{color:'#e8b84b'}}>TIC</span> <span style={{fontSize:'0.75rem', background:'rgba(255,255,255,0.2)', padding:'2px 8px', borderRadius:12}}>ADMIN</span></span>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <span style={{color:'rgba(255,255,255,0.8)', fontSize:'0.85rem'}}>{usuario?.nombre}</span>
          <button style={styles.navBtn} onClick={() => { logout(); navigate('/login'); }}>Cerrar sesión</button>
        </div>
      </nav>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:32 }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12, marginBottom:0}}>
          <div>
            <h1 style={styles.titulo}>Panel de Administración</h1>
            <p style={styles.subtitulo}>Gestión de documentos de titulación — Carrera Tecnologías de la Información</p>
          </div>
          <Link to="/admin/usuarios" style={{padding:'9px 18px', background:'#fff', border:'1px solid #d8d2c6', borderRadius:8, color:'#2d5a3d', fontWeight:600, fontSize:'0.88rem', textDecoration:'none', boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            &#128100; Gestionar usuarios
          </Link>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          {[
            { n: stats.pendiente, label:'⏳ Pendientes', bg:'#fffbf0' },
            { n: stats.aprobado,  label:'✅ Aprobados',  bg:'#f0faf4' },
            { n: stats.rechazado, label:'❌ Rechazados', bg:'#fff5f5' },
          ].map((s,i) => (
            <div key={i} style={{...styles.statCard, background: s.bg}}>
              <div style={styles.statNum}>{s.n}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabla */}
        <div style={styles.card}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
            <h2 style={{fontFamily:'Georgia,serif', fontSize:'1.2rem', margin:0}}>Documentos recibidos</h2>
            <select
              style={{padding:'6px 12px', border:'1px solid #d8d2c6', borderRadius:8, background:'#f5f2eb', fontSize:'0.85rem'}}
              value={filtro} onChange={e => setFiltro(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobado">Aprobados</option>
              <option value="rechazado">Rechazados</option>
            </select>
          </div>

          {cargando ? (
            <p style={{color:'#6b6456', padding:16}}>Cargando...</p>
          ) : tesis.length === 0 ? (
            <p style={{color:'#6b6456', padding:16, textAlign:'center'}}>No hay documentos con este filtro.</p>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr>
                    {['Estudiante','Título','Tutor','Fecha sust.','Estado','Acciones'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tesis.map(t => (
                    <tr key={t.id} style={{borderBottom:'1px solid #f0ece4'}}>
                      <td style={styles.td}>
                        <strong style={{display:'block'}}>{t.estudiante_nombre}</strong>
                        <span style={{fontSize:'0.78rem', color:'#9a9288'}}>{t.cedula}</span>
                      </td>
                      <td style={{...styles.td, maxWidth:200, fontSize:'0.85rem'}}>{t.titulo}</td>
                      <td style={{...styles.td, fontSize:'0.85rem'}}>{t.tutor}</td>
                      <td style={{...styles.td, fontSize:'0.85rem'}}>
                        {t.fecha_sustentacion ? `${t.fecha_sustentacion?.split('T')[0]} ${t.hora_sustentacion?.slice(0,5)}` : '—'}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          display:'inline-block', padding:'3px 10px', borderRadius:20,
                          fontSize:'0.78rem', fontWeight:600,
                          background: badgeColor[t.estado]?.bg,
                          color: badgeColor[t.estado]?.color,
                        }}>
                          {badgeColor[t.estado]?.label}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button style={styles.btnRevisar} onClick={() => abrirModal(t)}>
                          Revisar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalTesis && (
        <div style={styles.overlay} onClick={e => { if(e.target === e.currentTarget) setModalTesis(null); }}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitulo}>{modalTesis.estudiante_nombre}</h2>
            <p style={{color:'#6b6456', fontSize:'0.88rem', marginBottom:16}}>{modalTesis.titulo} · Tutor: {modalTesis.tutor}</p>

            {/* Ver PDF */}
            <div style={styles.pdfInfo}>
              <span style={{fontSize:'0.85rem', color:'#6b6456'}}>📄 {modalTesis.nombre_pdf || 'documento.pdf'}</span>
              <a
                href={`${API_URL}/tesis/pdf-admin/${modalTesis.id}?token=${token}`}
                target="_blank" rel="noreferrer"
                style={{color:'#2d5a3d', fontWeight:600, fontSize:'0.85rem', textDecoration:'none'}}
              >
                Abrir PDF →
              </a>
            </div>

            {/* Fecha y hora */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12}}>
              <div>
                <label style={styles.label}>Fecha de sustentación</label>
                <input type="date" style={styles.input} value={fecha} onChange={e => setFecha(e.target.value)} />
              </div>
              <div>
                <label style={styles.label}>Hora</label>
                <input type="time" style={styles.input} value={hora} onChange={e => setHora(e.target.value)} />
              </div>
            </div>

            {/* Comentario rechazo */}
            {modoRechazo && (
              <div style={{marginBottom:12}}>
                <label style={styles.label}>Comentario de rechazo (obligatorio)</label>
                <textarea
                  style={{...styles.input, resize:'vertical', minHeight:80}}
                  placeholder="Indica qué debe corregir el estudiante..."
                  value={comentario}
                  onChange={e => setComentario(e.target.value)}
                />
              </div>
            )}

            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              <button style={styles.btnAprobar} onClick={aprobar} disabled={procesando}>
                ✓ Aprobar y asignar fecha
              </button>
              {!modoRechazo
                ? <button style={styles.btnRechazar} onClick={() => setModoRechazo(true)}>✗ Rechazar</button>
                : <button style={styles.btnRechazar} onClick={rechazar} disabled={procesando}>✗ Confirmar rechazo</button>
              }
              <button style={styles.btnCancelar} onClick={() => setModalTesis(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={styles.toast}>{toast}</div>
      )}
    </div>
  );
}

const styles = {
  nav:        { background:'#2d5a3d', padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', height:60 },
  navLogo:    { fontFamily:'Georgia,serif', fontSize:'1.2rem', fontWeight:700, color:'white' },
  navBtn:     { padding:'6px 16px', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:8, color:'white', cursor:'pointer', fontSize:'0.85rem' },
  titulo:     { fontFamily:'Georgia,serif', fontSize:'2rem', color:'#1a1814', marginBottom:4 },
  subtitulo:  { color:'#6b6456', fontSize:'0.95rem', marginBottom:24 },
  statsGrid:  { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 },
  statCard:   { borderRadius:12, border:'1px solid #e0dbd0', padding:'20px 24px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' },
  statNum:    { fontFamily:'Georgia,serif', fontSize:'2.4rem', color:'#2d5a3d' },
  statLabel:  { color:'#6b6456', fontSize:'0.85rem', marginTop:4 },
  card:       { background:'#fff', borderRadius:14, border:'1px solid #e0dbd0', padding:24, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' },
  th:         { textAlign:'left', padding:'10px 14px', fontSize:'0.75rem', fontWeight:700, color:'#9a9288', borderBottom:'2px solid #e0dbd0', textTransform:'uppercase', letterSpacing:'0.05em' },
  td:         { padding:'12px 14px', verticalAlign:'middle' },
  btnRevisar: { padding:'6px 16px', background:'#f5f2eb', border:'1px solid #d8d2c6', borderRadius:8, cursor:'pointer', fontSize:'0.85rem', fontWeight:500 },
  overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', padding:'20px 0' },
  modal:      { background:'#fff', borderRadius:14, padding:28, maxWidth:600, width:'95%', margin:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
  modalTitulo:{ fontFamily:'Georgia,serif', fontSize:'1.3rem', marginBottom:4 },
  pdfInfo:    { display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f5f2eb', borderRadius:8, padding:'10px 14px', marginBottom:14 },
  label:      { display:'block', fontSize:'0.83rem', fontWeight:500, color:'#6b6456', marginBottom:5 },
  input:      { width:'100%', padding:'10px 14px', border:'1px solid #d8d2c6', borderRadius:8, fontSize:'0.9rem', background:'#f5f2eb', boxSizing:'border-box' },
  btnAprobar: { padding:'9px 18px', background:'#e8f5ee', color:'#1a5c2e', border:'1px solid #a8d5b8', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.88rem' },
  btnRechazar:{ padding:'9px 18px', background:'#fdf0ee', color:'#8c2018', border:'1px solid #e8b0a8', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.88rem' },
  btnCancelar:{ padding:'9px 18px', background:'#f5f2eb', color:'#6b6456', border:'1px solid #d8d2c6', borderRadius:8, cursor:'pointer', fontSize:'0.88rem', marginLeft:'auto' },
  toast:      { position:'fixed', bottom:24, right:24, background:'#2d5a3d', color:'white', padding:'12px 20px', borderRadius:10, fontWeight:500, fontSize:'0.9rem', boxShadow:'0 4px 16px rgba(0,0,0,0.2)', zIndex:300 },
};
