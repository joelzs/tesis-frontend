import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

export default function PanelEstudiante() {
  const { usuario, token, logout } = useAuth();
  const navigate = useNavigate();
  const [tesis, setTesis]         = useState(null);
  const [cargando, setCargando]   = useState(true);
  const [enviando, setEnviando]   = useState(false);
  const [titulo, setTitulo]       = useState('');
  const [tutor, setTutor]         = useState('');
  const [archivo, setArchivo]     = useState(null);
  const [mensaje, setMensaje]     = useState('');
  const [error, setError]         = useState('');
  const inputRef = useRef();

  useEffect(() => {
    cargarMiTesis();
  }, []);

  async function cargarMiTesis() {
    try {
      const res = await axios.get(`${API_URL}/tesis/mi-tesis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTesis(res.data.tesis);
    } catch {
      setError('Error al cargar tu tesis');
    } finally {
      setCargando(false);
    }
  }

  async function handleSubir(e) {
    e.preventDefault();
    setError(''); setMensaje('');

    if (!archivo) return setError('Selecciona un archivo PDF');
    if (!titulo.trim() || !tutor.trim()) return setError('Completa el título y el tutor');

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('tutor', tutor);
    formData.append('pdf', archivo);

    setEnviando(true);
    try {
      await axios.post(`${API_URL}/tesis/subir`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setMensaje('✅ Tesis enviada correctamente. En espera de revisión del administrador.');
      setTitulo(''); setTutor(''); setArchivo(null);
      cargarMiTesis();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir la tesis');
    } finally {
      setEnviando(false);
    }
  }

  const badgeEstilo = {
    pendiente: { bg:'#fef3cd', color:'#8a6914', texto:'⏳ Pendiente de revisión' },
    aprobado:  { bg:'#d4edda', color:'#1a5c2e', texto:'✅ Aprobado' },
    rechazado: { bg:'#fde8e6', color:'#8c2018', texto:'❌ Rechazado — necesita correcciones' },
  };

  const estado = tesis ? badgeEstilo[tesis.estado] : null;

  return (
    <div style={styles.page}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <span style={styles.navLogo}>Tesis<span style={{color:'#e8b84b'}}>TIC</span></span>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <span style={{color:'rgba(255,255,255,0.8)', fontSize:'0.85rem'}}>
            {usuario?.nombre}
          </span>
          <button style={styles.navBtn} onClick={() => { logout(); navigate('/login'); }}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div style={styles.contenido}>
        <h1 style={styles.titulo}>Mi Tesis</h1>
        <p style={styles.subtitulo}>Portal del estudiante — Carrera Tecnologías de la Información</p>

        {cargando && <p style={{color:'#6b6456'}}>Cargando...</p>}

        {/* Estado actual de la tesis */}
        {!cargando && tesis && (
          <div style={styles.card}>
            <h2 style={styles.cardTitulo}>Estado de tu documento</h2>
            <div style={{
              display:'inline-block', padding:'5px 14px', borderRadius:20,
              background: estado.bg, color: estado.color,
              fontWeight:600, fontSize:'0.88rem', marginBottom:16
            }}>
              {estado.texto}
            </div>

            <div style={styles.infoGrid}>
              <div>
                <div style={styles.infoLabel}>TÍTULO</div>
                <div style={styles.infoValor}>{tesis.titulo}</div>
              </div>
              <div>
                <div style={styles.infoLabel}>TUTOR</div>
                <div style={styles.infoValor}>{tesis.tutor}</div>
              </div>
              {tesis.fecha_sustentacion && (
                <div>
                  <div style={styles.infoLabel}>FECHA DE SUSTENTACIÓN</div>
                  <div style={{...styles.infoValor, color:'#2d5a3d', fontWeight:700}}>
                    {new Date(tesis.fecha_sustentacion).toLocaleDateString('es-EC', {
                      year:'numeric', month:'long', day:'numeric', timeZone:'UTC'
                    })} · {String(tesis.hora_sustentacion).slice(0,5)}
                  </div>
                </div>
              )}
            </div>

            {/* Comentario de rechazo */}
            {tesis.estado === 'rechazado' && tesis.comentario_rechazo && (
              <div style={styles.rechazoBox}>
                <div style={styles.rechazoTitulo}>COMENTARIO DEL ADMINISTRADOR</div>
                <p style={{margin:0, fontSize:'0.9rem'}}>{tesis.comentario_rechazo}</p>
              </div>
            )}
          </div>
        )}

        {/* Formulario de subida */}
        {!cargando && (!tesis || tesis.estado === 'rechazado') && (
          <div style={styles.card}>
            <h2 style={styles.cardTitulo}>
              {tesis?.estado === 'rechazado' ? 'Volver a enviar documento corregido' : 'Subir documento de tesis'}
            </h2>
            <p style={styles.alerta}>Solo se aceptan archivos PDF. Tamaño máximo: 20 MB.</p>

            {error   && <div style={styles.error}>{error}</div>}
            {mensaje && <div style={styles.exito}>{mensaje}</div>}

            <form onSubmit={handleSubir}>
              <div style={styles.formGrid}>
                <div style={styles.grupo}>
                  <label style={styles.label}>Título de la tesis</label>
                  <input
                    style={styles.input}
                    type="text"
                    placeholder="Escribe el título completo de tu tesis"
                    value={titulo}
                    onChange={e => setTitulo(e.target.value)}
                    required
                  />
                </div>
                <div style={styles.grupo}>
                  <label style={styles.label}>Tutor / Director</label>
                  <input
                    style={styles.input}
                    type="text"
                    placeholder="Nombres y apellidos del tutor"
                    value={tutor}
                    onChange={e => setTutor(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={styles.grupo}>
                <label style={styles.label}>Archivo PDF</label>
                <div
                  style={{
                    ...styles.dropZone,
                    borderColor: archivo ? '#2d5a3d' : '#d8d2c6'
                  }}
                  onClick={() => inputRef.current.click()}
                >
                  <div style={{fontSize:'2rem', marginBottom:6}}>📄</div>
                  {archivo
                    ? <p style={{color:'#2d5a3d', fontWeight:600}}>{archivo.name}</p>
                    : <p style={{color:'#6b6456'}}>
                        <strong style={{color:'#2d5a3d'}}>Clic aquí</strong> para seleccionar el PDF
                      </p>
                  }
                  <p style={{fontSize:'0.78rem', color:'#9a9288', marginTop:4}}>PDF — máx. 20 MB</p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  style={{display:'none'}}
                  onChange={e => setArchivo(e.target.files[0])}
                />
              </div>

              <button style={{...styles.btnPrimario, opacity: enviando ? 0.7 : 1}} type="submit" disabled={enviando}>
                {enviando ? 'Subiendo archivo...' : 'Enviar para revisión →'}
              </button>
            </form>
          </div>
        )}

        {/* Tesis pendiente o aprobada — no mostrar formulario */}
        {!cargando && tesis && tesis.estado !== 'rechazado' && (
          <div style={{...styles.card, background:'#f8faf8', textAlign:'center', padding:24}}>
            <p style={{color:'#6b6456', fontSize:'0.9rem'}}>
              {tesis.estado === 'pendiente'
                ? 'Tu documento está siendo revisado. Recibirás una notificación cuando sea aprobado.'
                : '¡Tu tesis fue aprobada! Prepárate para la sustentación.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page:        { minHeight:'100vh', background:'#f5f2eb' },
  nav:         { background:'#2d5a3d', padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', height:60 },
  navLogo:     { fontFamily:'Georgia,serif', fontSize:'1.2rem', fontWeight:700, color:'white' },
  navBtn:      { padding:'6px 16px', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:8, color:'white', cursor:'pointer', fontSize:'0.85rem' },
  contenido:   { maxWidth:800, margin:'0 auto', padding:32 },
  titulo:      { fontFamily:'Georgia,serif', fontSize:'2rem', color:'#1a1814', marginBottom:4 },
  subtitulo:   { color:'#6b6456', fontSize:'0.95rem', marginBottom:24 },
  card:        { background:'#fff', borderRadius:14, border:'1px solid #e0dbd0', padding:28, marginBottom:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' },
  cardTitulo:  { fontFamily:'Georgia,serif', fontSize:'1.3rem', color:'#1a1814', marginBottom:16 },
  infoGrid:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  infoLabel:   { fontSize:'0.72rem', fontWeight:700, color:'#9a9288', letterSpacing:'0.06em', marginBottom:3 },
  infoValor:   { fontSize:'0.95rem', color:'#1a1814' },
  rechazoBox:  { marginTop:16, padding:14, background:'#fdf0ee', borderRadius:8, borderLeft:'3px solid #c0392b' },
  rechazoTitulo: { fontSize:'0.72rem', fontWeight:700, color:'#c0392b', letterSpacing:'0.06em', marginBottom:6 },
  alerta:      { padding:'10px 14px', background:'#e8f0fe', color:'#1a4fa0', border:'1px solid #b8d0f8', borderRadius:8, fontSize:'0.85rem', marginBottom:16 },
  error:       { background:'#fde8e6', color:'#8c2018', border:'1px solid #f0b8b0', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:'0.88rem' },
  exito:       { background:'#d4edda', color:'#1a5c2e', border:'1px solid #a8d5b8', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:'0.88rem' },
  formGrid:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  grupo:       { marginBottom:16 },
  label:       { display:'block', fontSize:'0.83rem', fontWeight:500, color:'#6b6456', marginBottom:5 },
  input:       { width:'100%', padding:'10px 14px', border:'1px solid #d8d2c6', borderRadius:8, fontSize:'0.95rem', background:'#f5f2eb', color:'#1a1814', boxSizing:'border-box' },
  dropZone:    { border:'2px dashed', borderRadius:10, padding:28, textAlign:'center', cursor:'pointer', transition:'all 0.2s', background:'#f5f2eb' },
  btnPrimario: { padding:'11px 28px', background:'#2d5a3d', color:'white', border:'none', borderRadius:8, fontSize:'0.95rem', fontWeight:600, cursor:'pointer' },
};
