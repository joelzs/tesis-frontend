import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_URL from '../config';

const PDFJS_URL    = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export default function Tablets() {
  const [fechaSel, setFechaSel]         = useState('');
  const [estudiantes, setEstudiantes]   = useState([]);
  const [cargando, setCargando]         = useState(false);
  const [buscado, setBuscado]           = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const PDF_BASE = `${API_URL}/tesis/pdf`;

  async function buscarPorFecha() {
    if (!fechaSel) return;
    setCargando(true); setBuscado(true); setSeleccionado(null);
    try {
      const res = await axios.get(`${API_URL}/tesis/por-fecha?fecha=${fechaSel}`);
      setEstudiantes(res.data.estudiantes);
    } catch { setEstudiantes([]); }
    finally { setCargando(false); }
  }

  function formatFecha(f) {
    if (!f) return '';
    return new Date(f).toLocaleDateString('es-EC',{weekday:'long',year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});
  }
  function formatHora(h) { return String(h).slice(0,5); }

  return (
    <div style={{minHeight:'100vh',background:'#f5f2eb'}}>
      <nav style={S.nav}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={S.logo}>Tesis<span style={{color:'#e8b84b'}}>TIC</span></span>
          <span style={S.kiosk}>MODO KIOSK</span>
        </div>
        {seleccionado && (
          <button style={S.navBtn} onClick={()=>{setSeleccionado(null);setPantallaCompleta(false);}}>
            &#8592; Volver a la lista
          </button>
        )}
      </nav>

      {!seleccionado && (
        <div style={{maxWidth:900,margin:'0 auto',padding:32}}>
          <h1 style={S.titulo}>Sustentaciones</h1>
          <p style={S.sub}>Selecciona una fecha para ver los estudiantes que sustentan ese día</p>
          <div style={S.card}>
            <h2 style={S.h2}>Seleccionar fecha</h2>
            <div style={{display:'flex',gap:12,alignItems:'flex-end',flexWrap:'wrap'}}>
              <div style={{flex:1,minWidth:200}}>
                <label style={S.lbl}>Fecha de sustentación</label>
                <input type="date" style={S.inputFecha} value={fechaSel}
                  onChange={e=>{setFechaSel(e.target.value);setBuscado(false);}} />
              </div>
              <button style={{...S.btnBuscar,opacity:fechaSel?1:0.5,cursor:fechaSel?'pointer':'not-allowed'}}
                onClick={buscarPorFecha} disabled={!fechaSel}>
                Buscar sustentaciones
              </button>
            </div>
            {fechaSel && (
              <div style={S.fechaLabel}>Fecha: {formatFecha(fechaSel)}</div>
            )}
          </div>

          {buscado && (
            <div>
              <h2 style={S.h2}>{cargando?'Buscando...':`Estudiantes — ${formatFecha(fechaSel)}`}</h2>
              {!cargando && estudiantes.length === 0 && (
                <div style={{...S.card,textAlign:'center',color:'#6b6456',padding:40}}>
                  No hay sustentaciones programadas para esta fecha.
                </div>
              )}
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {estudiantes.map(e=>(
                  <div key={e.id} style={S.estudCard} onClick={()=>setSeleccionado(e)}>
                    <div style={{display:'flex',alignItems:'center',gap:14}}>
                      <div style={S.avatar}>{e.nombre.charAt(0)}</div>
                      <div>
                        <h3 style={{margin:'0 0 3px',fontSize:'1.05rem',fontWeight:700}}>{e.nombre}</h3>
                        <p style={{margin:'0 0 2px',fontSize:'0.88rem',color:'#1a1814'}}>{e.titulo}</p>
                        <p style={{margin:0,fontSize:'0.8rem',color:'#9a9288'}}>Tutor: {e.tutor}</p>
                      </div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <div style={S.hora}>{formatHora(e.hora_sustentacion)}</div>
                      <div style={{fontSize:'0.75rem',color:'#9a9288'}}>hrs</div>
                      <div style={{fontSize:'0.78rem',color:'#2d5a3d',fontWeight:600,marginTop:3}}>Ver tesis &#8594;</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {seleccionado && !pantallaCompleta && (
        <div style={{maxWidth:1000,margin:'0 auto',padding:'24px 32px'}}>
          <div style={S.card}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
              <div style={{display:'flex',alignItems:'center',gap:14}}>
                <div style={S.avatarGrande}>{seleccionado.nombre.charAt(0)}</div>
                <div>
                  <div style={{fontSize:'0.72rem',color:'#9a9288',fontWeight:700,letterSpacing:'0.06em',marginBottom:2}}>SUSTENTANTE</div>
                  <div style={{fontWeight:700,fontSize:'1.05rem'}}>{seleccionado.nombre}</div>
                  <div style={{fontSize:'0.85rem',color:'#6b6456'}}>{seleccionado.titulo}</div>
                  <div style={{fontSize:'0.8rem',color:'#9a9288',marginTop:2}}>Tutor: {seleccionado.tutor}</div>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'0.72rem',color:'#9a9288',fontWeight:700}}>HORA</div>
                  <div style={{fontFamily:'Georgia,serif',fontSize:'1.8rem',color:'#2d5a3d',fontWeight:700}}>
                    {formatHora(seleccionado.hora_sustentacion)}
                  </div>
                </div>
                <button style={S.btnFS} onClick={()=>setPantallaCompleta(true)}>&#9974; Pantalla completa</button>
              </div>
            </div>
          </div>
          <VisorPDF url={`${PDF_BASE}/${seleccionado.id}`} altura="650px" />
        </div>
      )}

      {seleccionado && pantallaCompleta && (
        <div style={S.fsOverlay}>
          <div style={S.fsTop}>
            <div>
              <div style={{fontWeight:700,color:'white',fontSize:'0.95rem'}}>{seleccionado.nombre}</div>
              <div style={{color:'#aaa',fontSize:'0.8rem'}}>{seleccionado.titulo}</div>
            </div>
            <button style={S.fsCerrar} onClick={()=>setPantallaCompleta(false)}>&#10005; Salir</button>
          </div>
          <VisorPDF url={`${PDF_BASE}/${seleccionado.id}`} altura="100%" fullscreen={true} />
        </div>
      )}
    </div>
  );
}

function VisorPDF({ url, altura, fullscreen }) {
  const [paginas, setPaginas]       = useState([]);
  const [totalPags, setTotalPags]   = useState(0);
  const [pagActual, setPagActual]   = useState(1);
  const [busqueda, setBusqueda]     = useState('');
  const [resultados, setResultados] = useState([]);
  const [resultIdx, setResultIdx]   = useState(0);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState('');
  const [zoom, setZoom]             = useState(1.4);
  const [pdfDoc, setPdfDoc]         = useState(null);

  useEffect(() => {
    if (window.pdfjsLib) { cargarPDF(); return; }
    const s = document.createElement('script');
    s.src = PDFJS_URL;
    s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; cargarPDF(); };
    s.onerror = () => setError('No se pudo cargar el visor PDF');
    document.head.appendChild(s);
  }, [url]);

  async function cargarPDF() {
    setCargando(true); setError('');
    try {
      const doc = await window.pdfjsLib.getDocument(url).promise;
      setPdfDoc(doc); setTotalPags(doc.numPages);
      await renderPaginas(doc, zoom);
    } catch { setError('No se pudo cargar el documento PDF'); }
    finally { setCargando(false); }
  }

  async function renderPaginas(doc, escala) {
    const arr = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const vp   = page.getViewport({ scale: escala });
      const cv   = document.createElement('canvas');
      cv.width = vp.width; cv.height = vp.height;
      const ctx = cv.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, cv.width, cv.height);
      await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
      arr.push({ num:i, dataUrl:cv.toDataURL(), width:vp.width, height:vp.height });
    }
    setPaginas(arr);
  }

  async function buscarTexto(termino) {
    setBusqueda(termino);
    if (!pdfDoc || termino.trim().length < 2) { setResultados([]); return; }
    const encontrados = [];
    const tLower = termino.toLowerCase();
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page    = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const texto   = content.items.map(it=>it.str).join(' ');
      if (texto.toLowerCase().includes(tLower)) {
        const idx  = texto.toLowerCase().indexOf(tLower);
        const s    = Math.max(0, idx-60), e = Math.min(texto.length, idx+termino.length+60);
        encontrados.push({ pagina:i, contexto:'...'+texto.slice(s,e)+'...' });
      }
    }
    setResultados(encontrados); setResultIdx(0);
    if (encontrados.length > 0) irAPagina(encontrados[0].pagina);
  }

  function irAPagina(num) {
    const el = document.getElementById(`p-${num}`);
    if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
    setPagActual(num);
  }

  function navResultado(dir) {
    const n = (resultIdx + dir + resultados.length) % resultados.length;
    setResultIdx(n); irAPagina(resultados[n].pagina);
  }

  function cambiarZoom(z) { setZoom(z); if (pdfDoc) renderPaginas(pdfDoc, z); }

  return (
    <div style={{display:'flex',flexDirection:'column',height:fullscreen?'calc(100vh - 60px)':altura,background:'#1a1a1a',borderRadius:fullscreen?0:12,overflow:'hidden'}}>
      <div style={S.toolbar}>
        <span style={{color:'#aaa',fontSize:'0.85rem'}}>&#128269;</span>
        <input style={S.searchInput} type="text" placeholder="Buscar texto en el documento..."
          value={busqueda} onChange={e=>buscarTexto(e.target.value)} />
        {resultados.length > 0 && <>
          <span style={{color:'#aaa',fontSize:'0.82rem',whiteSpace:'nowrap'}}>{resultIdx+1}/{resultados.length}</span>
          <button style={S.navBtn} onClick={()=>navResultado(-1)}>&#8593;</button>
          <button style={S.navBtn} onClick={()=>navResultado(1)}>&#8595;</button>
        </>}
        {busqueda.length>=2 && resultados.length===0 && (
          <span style={{color:'#e87a7a',fontSize:'0.8rem',whiteSpace:'nowrap'}}>Sin resultados</span>
        )}
        <div style={{display:'flex',alignItems:'center',gap:6,marginLeft:'auto'}}>
          <button style={S.navBtn} onClick={()=>cambiarZoom(Math.max(0.7,zoom-0.2))}>&#8722;</button>
          <span style={{color:'#aaa',fontSize:'0.8rem',minWidth:36,textAlign:'center'}}>{Math.round(zoom*100)}%</span>
          <button style={S.navBtn} onClick={()=>cambiarZoom(Math.min(2.5,zoom+0.2))}>+</button>
          <span style={{color:'#888',fontSize:'0.78rem',marginLeft:6}}>Pág {pagActual}/{totalPags}</span>
        </div>
      </div>

      {resultados.length > 0 && (
        <div style={S.resBar}>
          <span style={{color:'#e8b84b',fontWeight:600,fontSize:'0.82rem'}}>
            &#10003; "{busqueda}" encontrado en {resultados.length} página(s):
          </span>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:4}}>
            {resultados.map((r,i)=>(
              <button key={i} style={{...S.pagBadge,background:i===resultIdx?'#e8b84b':'#3a3a3a',color:i===resultIdx?'#1a1814':'#ccc'}}
                onClick={()=>{setResultIdx(i);irAPagina(r.pagina);}}>
                Pág {r.pagina}
              </button>
            ))}
          </div>
          <div style={{color:'#888',fontSize:'0.78rem',marginTop:4,fontStyle:'italic'}}>{resultados[resultIdx]?.contexto}</div>
        </div>
      )}

      <div style={{flex:1,overflowY:'auto',padding:20,display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
        {cargando && <div style={{color:'#aaa',padding:40,textAlign:'center'}}>&#128196; Cargando documento...</div>}
        {error && <div style={{color:'#e87a7a',padding:40,textAlign:'center'}}>&#9888; {error}</div>}
        {paginas.map(p=>(
          <div key={p.num} id={`p-${p.num}`} style={{
            border:resultados.some(r=>r.pagina===p.num)?'3px solid #e8b84b':'2px solid transparent',
            borderRadius:6,overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.5)',transition:'border 0.3s'
          }}>
            <img src={p.dataUrl} width={p.width} height={p.height} style={{display:'block',maxWidth:'100%'}} alt={`Página ${p.num}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

const S = {
  nav:{background:'#2d5a3d',padding:'0 32px',display:'flex',alignItems:'center',justifyContent:'space-between',height:60},
  logo:{fontFamily:'Georgia,serif',fontSize:'1.2rem',fontWeight:700,color:'white'},
  kiosk:{background:'#e8b84b',color:'#1a1814',fontSize:'0.72rem',fontWeight:700,padding:'2px 10px',borderRadius:20,letterSpacing:'0.05em'},
  navBtn:{padding:'6px 16px',background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.3)',borderRadius:8,color:'white',cursor:'pointer',fontSize:'0.85rem'},
  titulo:{fontFamily:'Georgia,serif',fontSize:'2rem',color:'#1a1814',marginBottom:4},
  sub:{color:'#6b6456',fontSize:'0.95rem',marginBottom:24},
  h2:{fontFamily:'Georgia,serif',fontSize:'1.3rem',color:'#1a1814',marginBottom:14},
  card:{background:'#fff',borderRadius:14,border:'1px solid #e0dbd0',padding:24,marginBottom:20,boxShadow:'0 2px 12px rgba(0,0,0,0.06)'},
  lbl:{display:'block',fontSize:'0.83rem',fontWeight:500,color:'#6b6456',marginBottom:6},
  inputFecha:{width:'100%',padding:'11px 14px',border:'2px solid #d8d2c6',borderRadius:10,fontSize:'1rem',background:'#f5f2eb',color:'#1a1814',cursor:'pointer',boxSizing:'border-box'},
  btnBuscar:{padding:'11px 24px',background:'#2d5a3d',color:'white',border:'none',borderRadius:10,fontSize:'0.95rem',fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'},
  fechaLabel:{marginTop:12,padding:'8px 14px',background:'#f0faf4',borderRadius:8,color:'#1a5c2e',fontSize:'0.9rem',fontWeight:500,border:'1px solid #a8d5b8',textTransform:'capitalize'},
  estudCard:{background:'#fff',borderRadius:12,border:'1px solid #e0dbd0',padding:'18px 22px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'},
  avatar:{width:46,height:46,borderRadius:'50%',background:'#2d5a3d',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Georgia,serif',fontSize:'1.3rem',fontWeight:700,flexShrink:0},
  avatarGrande:{width:52,height:52,borderRadius:'50%',background:'#2d5a3d',color:'white',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Georgia,serif',fontSize:'1.5rem',fontWeight:700,flexShrink:0},
  hora:{fontFamily:'Georgia,serif',fontSize:'1.8rem',color:'#2d5a3d',fontWeight:700},
  btnFS:{padding:'8px 16px',background:'#2d5a3d',color:'white',border:'none',borderRadius:8,cursor:'pointer',fontSize:'0.85rem',fontWeight:500},
  fsOverlay:{position:'fixed',inset:0,zIndex:500,background:'#1a1a1a',display:'flex',flexDirection:'column'},
  fsTop:{background:'#2a2a2a',padding:'10px 24px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid #3a3a3a',flexShrink:0,height:60},
  fsCerrar:{padding:'7px 18px',background:'rgba(255,255,255,0.1)',border:'1px solid rgba(255,255,255,0.2)',color:'white',borderRadius:8,cursor:'pointer',fontSize:'0.85rem'},
  toolbar:{background:'#2a2a2a',padding:'10px 16px',display:'flex',alignItems:'center',gap:8,borderBottom:'1px solid #3a3a3a',flexShrink:0,flexWrap:'wrap'},
  searchInput:{flex:1,background:'#3a3a3a',border:'1px solid #4a4a4a',color:'white',padding:'7px 14px',borderRadius:8,fontSize:'0.9rem',minWidth:200,outline:'none'},
  navBtn:{background:'#3a3a3a',border:'1px solid #5a5a5a',color:'white',padding:'5px 10px',borderRadius:6,cursor:'pointer',fontSize:'0.85rem'},
  resBar:{background:'#2f2f2f',padding:'10px 16px',borderBottom:'1px solid #3a3a3a',flexShrink:0},
  pagBadge:{padding:'3px 10px',borderRadius:12,border:'none',cursor:'pointer',fontSize:'0.8rem',fontWeight:600},
};
