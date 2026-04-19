import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

export default function Login() {
  const [cedula, setCedula]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  async function handleLogin(e) {
    e.preventDefault(); setError(''); setCargando(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { cedula, password });
      login(res.data.token, res.data.usuario);
      if (res.data.usuario.rol === 'admin') navigate('/admin');
      else navigate('/estudiante');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally { setCargando(false); }
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>Tesis<span style={{color:'#e8b84b'}}>TIC</span></div>
        <h2 style={S.titulo}>Iniciar sesión</h2>
        <p style={S.sub}>Sistema de Gestión Documental — UNESUM</p>
        {error && <div style={S.err}>{error}</div>}
        <form onSubmit={handleLogin}>
          <div style={S.g}><label style={S.lbl}>Cédula</label>
            <input style={S.inp} type="text" maxLength={10} placeholder="1712345678" value={cedula} onChange={e=>setCedula(e.target.value)} required />
          </div>
          <div style={S.g}><label style={S.lbl}>Contraseña</label>
            <input style={S.inp} type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required />
          </div>
          <button style={S.btn} type="submit" disabled={cargando}>{cargando?'Ingresando...':'Ingresar →'}</button>
        </form>
        <p style={{textAlign:'center',marginTop:14,fontSize:'0.85rem',color:'#6b6456'}}>
          ¿No tienes cuenta?{' '}
          <span style={{color:'#2d5a3d',fontWeight:600,cursor:'pointer'}} onClick={()=>navigate('/registro')}>Regístrate aquí</span>
        </p>
        <div style={S.hint}><strong>Admin:</strong> cédula 0000000000 · clave admin1234</div>
      </div>
    </div>
  );
}
const S = {
  page:{minHeight:'100vh',background:'#f5f2eb',display:'flex',alignItems:'center',justifyContent:'center',padding:16},
  card:{background:'#fff',borderRadius:16,padding:'40px 36px',width:'100%',maxWidth:420,boxShadow:'0 4px 24px rgba(0,0,0,0.1)',border:'1px solid #e0dbd0'},
  logo:{fontFamily:'Georgia,serif',fontSize:'1.6rem',fontWeight:700,color:'#2d5a3d',marginBottom:8},
  titulo:{fontSize:'1.4rem',fontWeight:600,color:'#1a1814',marginBottom:4},
  sub:{fontSize:'0.85rem',color:'#6b6456',marginBottom:24},
  err:{background:'#fde8e6',color:'#8c2018',border:'1px solid #f0b8b0',borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:'0.88rem'},
  g:{marginBottom:16},
  lbl:{display:'block',fontSize:'0.83rem',fontWeight:500,color:'#6b6456',marginBottom:5},
  inp:{width:'100%',padding:'10px 14px',border:'1px solid #d8d2c6',borderRadius:8,fontSize:'0.95rem',background:'#f5f2eb',color:'#1a1814',boxSizing:'border-box'},
  btn:{width:'100%',padding:'11px',background:'#2d5a3d',color:'white',border:'none',borderRadius:8,fontSize:'0.95rem',fontWeight:600,cursor:'pointer',marginTop:4},
  hint:{marginTop:14,padding:'8px 12px',background:'#f0f4ff',borderRadius:8,fontSize:'0.78rem',color:'#3a5fa0',textAlign:'center'},
};
