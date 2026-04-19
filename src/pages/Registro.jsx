import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config';

// Validar cédula ecuatoriana (algoritmo oficial)
function validarCedulaEcuatoriana(cedula) {
  if (!/^\d{10}$/.test(cedula)) return false;

  const provincia = parseInt(cedula.substring(0, 2));
  if (provincia < 1 || provincia > 24) return false;

  const tercerDigito = parseInt(cedula[2]);
  if (tercerDigito >= 6) return false; // personas naturales: tercer dígito 0-5

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(cedula[i]) * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }

  const digitoVerificador = parseInt(cedula[9]);
  const residuo = suma % 10;
  const resultado = residuo === 0 ? 0 : 10 - residuo;

  return resultado === digitoVerificador;
}

export default function Registro() {
  const [form, setForm]     = useState({ cedula:'', nombre:'', email:'', password:'', confirmar:'' });
  const [errores, setErrores] = useState({});
  const [exito, setExito]   = useState('');
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    // Limpiar error del campo al escribir
    if (errores[name]) setErrores({ ...errores, [name]: '' });
  }

  function validarFormulario() {
    const nuevosErrores = {};

    // Validar cédula
    if (!form.cedula) {
      nuevosErrores.cedula = 'La cédula es obligatoria';
    } else if (!validarCedulaEcuatoriana(form.cedula)) {
      nuevosErrores.cedula = 'Cédula ecuatoriana inválida. Verifica los 10 dígitos.';
    }

    // Validar nombre
    if (!form.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    } else if (form.nombre.trim().length < 5) {
      nuevosErrores.nombre = 'Ingresa tu nombre completo';
    }

    // Validar correo institucional
    if (!form.email) {
      nuevosErrores.email = 'El correo es obligatorio';
    } else if (!form.email.endsWith('@unesum.edu.ec')) {
      nuevosErrores.email = 'Solo se permite el correo institucional @unesum.edu.ec';
    }

    // Validar contraseña
    if (!form.password) {
      nuevosErrores.password = 'La contraseña es obligatoria';
    } else if (form.password.length < 6) {
      nuevosErrores.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    // Validar confirmación
    if (form.password !== form.confirmar) {
      nuevosErrores.confirmar = 'Las contraseñas no coinciden';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setExito('');

    if (!validarFormulario()) return;

    setCargando(true);
    try {
      await axios.post(`${API_URL}/auth/registro`, {
        cedula:   form.cedula,
        nombre:   form.nombre.trim(),
        email:    form.email.toLowerCase(),
        password: form.password,
      });
      setExito('Cuenta creada correctamente. Redirigiendo al inicio de sesión...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setErrores({ general: err.response?.data?.error || 'Error al registrarse. Intenta de nuevo.' });
    } finally {
      setCargando(false);
    }
  }

  // Mostrar indicador en tiempo real de la cédula
  const cedulaValida = validarCedulaEcuatoriana(form.cedula);
  const cedulaIngresada = form.cedula.length === 10;

  // Mostrar indicador en tiempo real del correo
  const correoValido = form.email.endsWith('@unesum.edu.ec');
  const correoIngresado = form.email.includes('@');

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>Tesis<span style={{ color:'#e8b84b' }}>TIC</span></div>
        <h2 style={S.titulo}>Crear cuenta</h2>
        <p style={S.subtitulo}>Estudiante — Carrera Tecnologías de la Información</p>

        {errores.general && <div style={S.errorBox}>{errores.general}</div>}
        {exito && <div style={S.exitoBox}>{exito}</div>}

        <form onSubmit={handleSubmit} noValidate>

          {/* CÉDULA */}
          <div style={S.grupo}>
            <label style={S.label}>
              Número de cédula
              {cedulaIngresada && (
                <span style={{ marginLeft:8, fontSize:'0.78rem', fontWeight:600,
                  color: cedulaValida ? '#1a5c2e' : '#8c2018' }}>
                  {cedulaValida ? '✓ Válida' : '✗ Inválida'}
                </span>
              )}
            </label>
            <input
              style={{ ...S.input, borderColor: errores.cedula ? '#c0392b' : cedulaIngresada ? (cedulaValida ? '#2d5a3d' : '#c0392b') : '#d8d2c6' }}
              name="cedula" type="text" maxLength={10}
              placeholder="Ej: 1312345678"
              value={form.cedula}
              onChange={handleChange}
            />
            {errores.cedula && <div style={S.errorMsg}>{errores.cedula}</div>}
            <div style={S.hint}>10 dígitos — cédula ecuatoriana válida</div>
          </div>

          {/* NOMBRE */}
          <div style={S.grupo}>
            <label style={S.label}>Nombres y apellidos completos</label>
            <input
              style={{ ...S.input, borderColor: errores.nombre ? '#c0392b' : '#d8d2c6' }}
              name="nombre" type="text"
              placeholder="Ej: Jefferson Joel Zavala Suárez"
              value={form.nombre}
              onChange={handleChange}
            />
            {errores.nombre && <div style={S.errorMsg}>{errores.nombre}</div>}
          </div>

          {/* CORREO INSTITUCIONAL */}
          <div style={S.grupo}>
            <label style={S.label}>
              Correo institucional
              {correoIngresado && (
                <span style={{ marginLeft:8, fontSize:'0.78rem', fontWeight:600,
                  color: correoValido ? '#1a5c2e' : '#8c2018' }}>
                  {correoValido ? '✓ Correo válido' : '✗ Debe ser @unesum.edu.ec'}
                </span>
              )}
            </label>
            <input
              style={{ ...S.input, borderColor: errores.email ? '#c0392b' : correoIngresado ? (correoValido ? '#2d5a3d' : '#c0392b') : '#d8d2c6' }}
              name="email" type="email"
              placeholder="tunombre@unesum.edu.ec"
              value={form.email}
              onChange={handleChange}
            />
            {errores.email && <div style={S.errorMsg}>{errores.email}</div>}
            <div style={S.hint}>Solo se acepta correo institucional <strong>@unesum.edu.ec</strong></div>
          </div>

          {/* CONTRASEÑA */}
          <div style={S.formGrid}>
            <div style={S.grupo}>
              <label style={S.label}>Contraseña</label>
              <input
                style={{ ...S.input, borderColor: errores.password ? '#c0392b' : '#d8d2c6' }}
                name="password" type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={handleChange}
              />
              {errores.password && <div style={S.errorMsg}>{errores.password}</div>}
              {/* Indicador de seguridad */}
              {form.password.length > 0 && (
                <div style={{ marginTop:5 }}>
                  <div style={{ height:4, borderRadius:2, background:'#e0dbd0', overflow:'hidden' }}>
                    <div style={{
                      height:'100%', borderRadius:2, transition:'width 0.3s',
                      width: form.password.length < 6 ? '30%' : form.password.length < 10 ? '65%' : '100%',
                      background: form.password.length < 6 ? '#c0392b' : form.password.length < 10 ? '#e8b84b' : '#2d5a3d'
                    }}/>
                  </div>
                  <span style={{ fontSize:'0.75rem', color:'#9a9288' }}>
                    {form.password.length < 6 ? 'Débil' : form.password.length < 10 ? 'Moderada' : 'Fuerte'}
                  </span>
                </div>
              )}
            </div>
            <div style={S.grupo}>
              <label style={S.label}>Confirmar contraseña</label>
              <input
                style={{ ...S.input, borderColor: errores.confirmar ? '#c0392b' : form.confirmar && form.confirmar === form.password ? '#2d5a3d' : '#d8d2c6' }}
                name="confirmar" type="password"
                placeholder="Repite la contraseña"
                value={form.confirmar}
                onChange={handleChange}
              />
              {errores.confirmar && <div style={S.errorMsg}>{errores.confirmar}</div>}
              {form.confirmar && form.confirmar === form.password && (
                <div style={{ fontSize:'0.78rem', color:'#1a5c2e', marginTop:4 }}>✓ Contraseñas coinciden</div>
              )}
            </div>
          </div>

          <button style={{ ...S.btn, opacity: cargando ? 0.7 : 1 }} type="submit" disabled={cargando}>
            {cargando ? 'Creando cuenta...' : 'Crear cuenta →'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:16, fontSize:'0.85rem', color:'#6b6456' }}>
          ¿Ya tienes cuenta?{' '}
          <span style={{ color:'#2d5a3d', fontWeight:600, cursor:'pointer' }} onClick={() => navigate('/login')}>
            Inicia sesión aquí
          </span>
        </p>
      </div>
    </div>
  );
}

const S = {
  page:     { minHeight:'100vh', background:'#f5f2eb', display:'flex', alignItems:'center', justifyContent:'center', padding:16 },
  card:     { background:'#fff', borderRadius:16, padding:'36px', width:'100%', maxWidth:520, boxShadow:'0 4px 24px rgba(0,0,0,0.1)', border:'1px solid #e0dbd0' },
  logo:     { fontFamily:'Georgia,serif', fontSize:'1.6rem', fontWeight:700, color:'#2d5a3d', marginBottom:8 },
  titulo:   { fontSize:'1.4rem', fontWeight:600, color:'#1a1814', marginBottom:4 },
  subtitulo:{ fontSize:'0.85rem', color:'#6b6456', marginBottom:20 },
  errorBox: { background:'#fde8e6', color:'#8c2018', border:'1px solid #f0b8b0', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:'0.88rem' },
  exitoBox: { background:'#d4edda', color:'#1a5c2e', border:'1px solid #a8d5b8', borderRadius:8, padding:'10px 14px', marginBottom:14, fontSize:'0.88rem' },
  formGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  grupo:    { marginBottom:14 },
  label:    { display:'block', fontSize:'0.83rem', fontWeight:500, color:'#6b6456', marginBottom:5 },
  input:    { width:'100%', padding:'10px 14px', border:'2px solid', borderRadius:8, fontSize:'0.95rem', background:'#f5f2eb', color:'#1a1814', boxSizing:'border-box', outline:'none', transition:'border-color 0.2s' },
  errorMsg: { fontSize:'0.78rem', color:'#c0392b', marginTop:4, fontWeight:500 },
  hint:     { fontSize:'0.76rem', color:'#9a9288', marginTop:4 },
  btn:      { width:'100%', padding:'11px', background:'#2d5a3d', color:'white', border:'none', borderRadius:8, fontSize:'0.95rem', fontWeight:600, cursor:'pointer', marginTop:4 },
};
