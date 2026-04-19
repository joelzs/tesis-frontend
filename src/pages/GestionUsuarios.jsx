import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config';

function validarCedula(cedula) {
  if (!/^\d{10}$/.test(cedula)) return false;
  const prov = parseInt(cedula.substring(0, 2));
  if (prov < 1 || prov > 24) return false;
  if (parseInt(cedula[2]) >= 6) return false;
  const coef = [2,1,2,1,2,1,2,1,2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let v = parseInt(cedula[i]) * coef[i];
    if (v >= 10) v -= 9;
    suma += v;
  }
  const res = suma % 10;
  return (res === 0 ? 0 : 10 - res) === parseInt(cedula[9]);
}

export default function GestionUsuarios() {
  const { token, usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [usuarios, setUsuarios]     = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [busqueda, setBusqueda]     = useState('');
  const [modalEliminar, setModalEliminar] = useState(null);
  const [modalCrear, setModalCrear] = useState(false);
  const [toast, setToast]           = useState({ msg:'', tipo:'' });
  const [procesando, setProcesando] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({ cedula:'', nombre:'', email:'', password:'' });
  const [erroresNuevo, setErroresNuevo] = useState({});

  useEffect(() => { cargarUsuarios(); }, []);

  async function cargarUsuarios() {
    setCargando(true);
    try {
      const res = await axios.get(`${API_URL}/auth/usuarios`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(res.data.usuarios);
    } catch { mostrarToast('Error al cargar usuarios', 'error'); }
    finally { setCargando(false); }
  }

  async function eliminarUsuario() {
    setProcesando(true);
    try {
      await axios.delete(`${API_URL}/auth/usuarios/${modalEliminar.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      mostrarToast(`Usuario ${modalEliminar.nombre} eliminado correctamente`);
      setModalEliminar(null);
      cargarUsuarios();
    } catch (err) {
      mostrarToast(err.response?.data?.error || 'Error al eliminar', 'error');
    } finally { setProcesando(false); }
  }

  async function crearUsuario(e) {
    e.preventDefault();
    const errs = {};
    if (!validarCedula(nuevoUsuario.cedula)) errs.cedula = 'Cédula ecuatoriana inválida';
    if (!nuevoUsuario.nombre.trim())         errs.nombre = 'Nombre obligatorio';
    if (nuevoUsuario.email && !nuevoUsuario.email.endsWith('@unesum.edu.ec'))
      errs.email = 'Solo correos @unesum.edu.ec';
    if (!nuevoUsuario.password || nuevoUsuario.password.length < 6)
      errs.password = 'Mínimo 6 caracteres';
    setErroresNuevo(errs);
    if (Object.keys(errs).length > 0) return;

    setProcesando(true);
    try {
      await axios.post(`${API_URL}/auth/usuarios`, nuevoUsuario, {
        headers: { Authorization: `Bearer ${token}` }
      });
      mostrarToast('Usuario creado correctamente');
      setModalCrear(false);
      setNuevoUsuario({ cedula:'', nombre:'', email:'', password:'' });
      setErroresNuevo({});
      cargarUsuarios();
    } catch (err) {
      mostrarToast(err.response?.data?.error || 'Error al crear usuario', 'error');
    } finally { setProcesando(false); }
  }

  function mostrarToast(msg, tipo='ok') {
    setToast({ msg, tipo });
    setTimeout(() => setToast({ msg:'', tipo:'' }), 3500);
  }

  const badgeTesis = {
    pendiente: { bg:'#fef3cd', color:'#8a6914', label:'Pendiente' },
    aprobado:  { bg:'#d4edda', color:'#1a5c2e', label:'Aprobado' },
    rechazado: { bg:'#fde8e6', color:'#8c2018', label:'Rechazado' },
    null:      { bg:'#f0ece4', color:'#9a9288', label:'Sin tesis' },
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.cedula.includes(busqueda) ||
    (u.email || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f5f2eb' }}>
      {/* Navbar */}
      <nav style={S.nav}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={S.navLogo}>Tesis<span style={{color:'#e8b84b'}}>TIC</span></span>
          <span style={S.adminBadge}>ADMIN</span>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button style={S.navLink} onClick={() => navigate('/admin')}>&#8592; Panel principal</button>
          <button style={S.navBtn} onClick={() => { logout(); navigate('/login'); }}>Cerrar sesión</button>
        </div>
      </nav>

      <div style={{ maxWidth:1050, margin:'0 auto', padding:32 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={S.titulo}>Gestión de Usuarios</h1>
            <p style={S.subtitulo}>Administra los estudiantes registrados en el sistema</p>
          </div>
          <button style={S.btnCrear} onClick={() => setModalCrear(true)}>
            + Crear usuario
          </button>
        </div>

        {/* Stats rápidas */}
        <div style={S.statsRow}>
          <div style={S.statChip}>
            <strong>{usuarios.length}</strong> estudiantes registrados
          </div>
          <div style={S.statChip}>
            <strong>{usuarios.filter(u => u.estado_tesis === 'aprobado').length}</strong> con tesis aprobada
          </div>
          <div style={S.statChip}>
            <strong>{usuarios.filter(u => u.estado_tesis === 'pendiente').length}</strong> pendientes de revisión
          </div>
          <div style={S.statChip}>
            <strong>{usuarios.filter(u => !u.estado_tesis).length}</strong> sin tesis subida
          </div>
        </div>

        {/* Buscador */}
        <div style={S.card}>
          <input
            style={S.inputBuscar}
            type="text"
            placeholder="Buscar por nombre, cédula o correo..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        {/* Tabla de usuarios */}
        <div style={S.card}>
          {cargando ? (
            <p style={{ color:'#6b6456', padding:20 }}>Cargando usuarios...</p>
          ) : usuariosFiltrados.length === 0 ? (
            <p style={{ color:'#6b6456', padding:20, textAlign:'center' }}>
              {busqueda ? 'No hay resultados para esa búsqueda.' : 'No hay estudiantes registrados aún.'}
            </p>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['Cédula','Nombre','Correo','Estado tesis','Registrado','Acciones'].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map(u => {
                    const badge = badgeTesis[u.estado_tesis] || badgeTesis['null'];
                    return (
                      <tr key={u.id} style={{ borderBottom:'1px solid #f0ece4' }}>
                        <td style={S.td}>
                          <code style={{ fontSize:'0.85rem', background:'#f0ece4', padding:'2px 6px', borderRadius:4 }}>
                            {u.cedula}
                          </code>
                        </td>
                        <td style={S.td}>
                          <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{u.nombre}</div>
                          {u.titulo && (
                            <div style={{ fontSize:'0.75rem', color:'#9a9288', marginTop:2, maxWidth:200 }}>
                              {u.titulo.substring(0, 60)}{u.titulo.length > 60 ? '...' : ''}
                            </div>
                          )}
                        </td>
                        <td style={{ ...S.td, fontSize:'0.85rem', color:'#6b6456' }}>{u.email || '—'}</td>
                        <td style={S.td}>
                          <span style={{
                            display:'inline-block', padding:'3px 10px', borderRadius:20,
                            fontSize:'0.78rem', fontWeight:600,
                            background: badge.bg, color: badge.color
                          }}>
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ ...S.td, fontSize:'0.82rem', color:'#9a9288' }}>
                          {new Date(u.created_at).toLocaleDateString('es-EC')}
                        </td>
                        <td style={S.td}>
                          <button
                            style={S.btnEliminar}
                            onClick={() => setModalEliminar(u)}
                          >
                            &#128465; Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal eliminar */}
      {modalEliminar && (
        <div style={S.overlay} onClick={e => { if(e.target === e.currentTarget) setModalEliminar(null); }}>
          <div style={S.modal}>
            <div style={{ fontSize:'2.5rem', textAlign:'center', marginBottom:12 }}>&#9888;</div>
            <h2 style={{ ...S.modalTitulo, textAlign:'center' }}>¿Eliminar usuario?</h2>
            <div style={{ background:'#fdf0ee', border:'1px solid #f0c0b8', borderRadius:10, padding:16, marginBottom:20 }}>
              <div style={{ fontWeight:700, marginBottom:4 }}>{modalEliminar.nombre}</div>
              <div style={{ fontSize:'0.85rem', color:'#6b6456' }}>Cédula: {modalEliminar.cedula}</div>
              {modalEliminar.email && <div style={{ fontSize:'0.85rem', color:'#6b6456' }}>Correo: {modalEliminar.email}</div>}
              {modalEliminar.estado_tesis && (
                <div style={{ fontSize:'0.85rem', color:'#c0392b', marginTop:6, fontWeight:500 }}>
                  &#9888; Este usuario tiene una tesis en estado "{modalEliminar.estado_tesis}" que también será eliminada.
                </div>
              )}
            </div>
            <p style={{ color:'#6b6456', fontSize:'0.88rem', marginBottom:20, textAlign:'center' }}>
              Esta acción no se puede deshacer. Se eliminarán el usuario, su tesis y el archivo PDF del servidor.
            </p>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button
                style={{ ...S.btnEliminarConfirm, opacity: procesando ? 0.7 : 1 }}
                onClick={eliminarUsuario} disabled={procesando}
              >
                {procesando ? 'Eliminando...' : '&#128465; Sí, eliminar'}
              </button>
              <button style={S.btnCancelar} onClick={() => setModalEliminar(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear usuario */}
      {modalCrear && (
        <div style={S.overlay} onClick={e => { if(e.target === e.currentTarget) { setModalCrear(false); setErroresNuevo({}); }}}>
          <div style={{ ...S.modal, maxWidth:480 }}>
            <h2 style={S.modalTitulo}>Crear nuevo usuario</h2>
            <p style={{ color:'#6b6456', fontSize:'0.85rem', marginBottom:16 }}>
              Crea la cuenta del estudiante manualmente desde el panel admin.
            </p>
            <form onSubmit={crearUsuario}>
              {[
                { name:'cedula',   label:'Cédula (10 dígitos)',  type:'text',     placeholder:'1312345678', max:10 },
                { name:'nombre',   label:'Nombres y apellidos',  type:'text',     placeholder:'Jefferson Joel Zavala Suárez' },
                { name:'email',    label:'Correo institucional', type:'email',    placeholder:'estudiante@unesum.edu.ec' },
                { name:'password', label:'Contraseña temporal',  type:'password', placeholder:'Mínimo 6 caracteres' },
              ].map(f => (
                <div key={f.name} style={{ marginBottom:12 }}>
                  <label style={S.label}>{f.label}</label>
                  <input
                    style={{ ...S.inputForm, borderColor: erroresNuevo[f.name] ? '#c0392b' : '#d8d2c6' }}
                    name={f.name} type={f.type}
                    placeholder={f.placeholder}
                    maxLength={f.max}
                    value={nuevoUsuario[f.name]}
                    onChange={e => {
                      setNuevoUsuario({ ...nuevoUsuario, [e.target.name]: e.target.value });
                      if (erroresNuevo[e.target.name]) setErroresNuevo({ ...erroresNuevo, [e.target.name]: '' });
                    }}
                  />
                  {erroresNuevo[f.name] && (
                    <div style={{ fontSize:'0.78rem', color:'#c0392b', marginTop:3 }}>{erroresNuevo[f.name]}</div>
                  )}
                </div>
              ))}
              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <button style={{ ...S.btnCrearConfirm, opacity: procesando ? 0.7 : 1 }} type="submit" disabled={procesando}>
                  {procesando ? 'Creando...' : '+ Crear usuario'}
                </button>
                <button type="button" style={S.btnCancelar} onClick={() => { setModalCrear(false); setErroresNuevo({}); }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.msg && (
        <div style={{ ...S.toast, background: toast.tipo === 'error' ? '#c0392b' : '#2d5a3d' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const S = {
  nav:         { background:'#2d5a3d', padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', height:60 },
  navLogo:     { fontFamily:'Georgia,serif', fontSize:'1.2rem', fontWeight:700, color:'white' },
  adminBadge:  { background:'rgba(255,255,255,0.2)', color:'white', fontSize:'0.72rem', fontWeight:700, padding:'2px 10px', borderRadius:12 },
  navLink:     { background:'none', border:'none', color:'rgba(255,255,255,0.8)', cursor:'pointer', fontSize:'0.85rem' },
  navBtn:      { padding:'6px 16px', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:8, color:'white', cursor:'pointer', fontSize:'0.85rem' },
  titulo:      { fontFamily:'Georgia,serif', fontSize:'2rem', color:'#1a1814', marginBottom:4 },
  subtitulo:   { color:'#6b6456', fontSize:'0.95rem' },
  statsRow:    { display:'flex', gap:10, flexWrap:'wrap', marginBottom:16 },
  statChip:    { background:'#fff', border:'1px solid #e0dbd0', borderRadius:20, padding:'6px 16px', fontSize:'0.85rem', color:'#6b6456' },
  card:        { background:'#fff', borderRadius:14, border:'1px solid #e0dbd0', padding:20, marginBottom:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)' },
  inputBuscar: { width:'100%', padding:'10px 16px', border:'1px solid #d8d2c6', borderRadius:10, fontSize:'0.95rem', background:'#f5f2eb', boxSizing:'border-box' },
  th:          { textAlign:'left', padding:'10px 14px', fontSize:'0.75rem', fontWeight:700, color:'#9a9288', borderBottom:'2px solid #e0dbd0', textTransform:'uppercase', letterSpacing:'0.05em' },
  td:          { padding:'12px 14px', verticalAlign:'middle' },
  btnEliminar: { padding:'5px 12px', background:'#fde8e6', color:'#8c2018', border:'1px solid #f0b8b0', borderRadius:7, cursor:'pointer', fontSize:'0.82rem', fontWeight:500 },
  btnCrear:    { padding:'10px 20px', background:'#2d5a3d', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontSize:'0.9rem', fontWeight:600 },
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  modal:       { background:'#fff', borderRadius:14, padding:28, maxWidth:520, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
  modalTitulo: { fontFamily:'Georgia,serif', fontSize:'1.3rem', marginBottom:8 },
  btnEliminarConfirm: { padding:'10px 20px', background:'#c0392b', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.9rem' },
  btnCrearConfirm: { padding:'10px 20px', background:'#2d5a3d', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.9rem' },
  btnCancelar: { padding:'10px 20px', background:'#f5f2eb', color:'#6b6456', border:'1px solid #d8d2c6', borderRadius:8, cursor:'pointer', fontSize:'0.9rem' },
  label:       { display:'block', fontSize:'0.83rem', fontWeight:500, color:'#6b6456', marginBottom:5 },
  inputForm:   { width:'100%', padding:'9px 14px', border:'2px solid', borderRadius:8, fontSize:'0.9rem', background:'#f5f2eb', boxSizing:'border-box' },
  toast:       { position:'fixed', bottom:24, right:24, color:'white', padding:'12px 20px', borderRadius:10, fontWeight:500, fontSize:'0.9rem', boxShadow:'0 4px 16px rgba(0,0,0,0.2)', zIndex:300 },
};
