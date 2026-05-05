import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { inr } from '../utils/format';

/* ─── Chart data (garment measurements) ─── */
const CHARTS = {
  men: {
    label: "Men's Shirts & T-Shirts",
    headers: ['Size', 'Brand Size', 'Chest (in)', 'Front Length (in)', 'Across Shoulder (in)'],
    headersCm: ['Size', 'Brand Size', 'Chest (cm)', 'Front Length (cm)', 'Across Shoulder (cm)'],
    rows: [
      ['38','S', 38.0, 27.5, 17.5],
      ['40','M', 40.0, 28.0, 18.0],
      ['42','L', 42.0, 28.5, 18.5],
      ['44','XL',44.0, 29.0, 19.0],
      ['46','XXL',46.0,29.5, 19.5],
      ['48','XXXL',48.0,30.0,20.0],
    ],
    toCm: (r) => [r[0], r[1], (r[2]*2.54).toFixed(1), (r[3]*2.54).toFixed(1), (r[4]*2.54).toFixed(1)],
    tips: ['Chest — measure around the fullest part, under the arms.','Front Length — from highest shoulder point down to hem.','Across Shoulder — from shoulder seam to shoulder seam, across back.'],
    diagram: 'shirt',
  },
  women_tops: {
    label: "Women's Tops & Blouses",
    headers: ['Size','Bust (in)','Waist (in)','Hip (in)','Front Length (in)'],
    headersCm: ['Size','Bust (cm)','Waist (cm)','Hip (cm)','Front Length (cm)'],
    rows: [
      ['XS',30.0,24.0,33.0,23.0],
      ['S', 32.0,26.0,35.0,23.5],
      ['M', 34.0,28.0,37.0,24.0],
      ['L', 36.0,30.0,39.0,24.5],
      ['XL',38.0,32.0,41.0,25.0],
      ['XXL',40.0,34.0,43.0,25.5],
    ],
    toCm: (r) => [r[0], (r[1]*2.54).toFixed(1),(r[2]*2.54).toFixed(1),(r[3]*2.54).toFixed(1),(r[4]*2.54).toFixed(1)],
    tips: ['Bust — measure around the fullest part of the chest.','Waist — measure around the narrowest part.','Hip — measure around the widest part, ~20cm below waist.','Front Length — from shoulder to hem.'],
    diagram: 'top',
  },
  women_kurtis: {
    label: "Women's Kurtis",
    headers: ['Size','Bust (in)','Waist (in)','Hip (in)','Length (in)'],
    headersCm: ['Size','Bust (cm)','Waist (cm)','Hip (cm)','Length (cm)'],
    rows: [
      ['XS',32,26,34,42],['S',34,28,36,43],['M',36,30,38,44],
      ['L',38,32,40,44.5],['XL',40,34,42,45],['XXL',42,36,44,45.5],['XXXL',44,38,46,46],
    ],
    toCm: (r) => [r[0],(r[1]*2.54).toFixed(1),(r[2]*2.54).toFixed(1),(r[3]*2.54).toFixed(1),(r[4]*2.54).toFixed(1)],
    tips: ['Bust — measure around the fullest part of the chest.','Waist — measure around the narrowest part.','Hip — measure around the widest part.','Length — from shoulder point down to hem.'],
    diagram: 'kurti',
  },
  women_sarees: {
    label: "Women's Sarees — Blouse Size",
    headers: ['Blouse Size','Bust (in)','Waist (in)','Blouse Length (in)','Saree Length'],
    headersCm: ['Blouse Size','Bust (cm)','Waist (cm)','Blouse Length (cm)','Saree Length'],
    rows: [
      ['32',32,26,15,'5.5 m'],['34',34,28,15,'5.5 m'],['36',36,30,15.5,'5.5 m'],
      ['38',38,32,16,'5.5 m'],['40',40,34,16,'5.5 m'],['42',42,36,16.5,'5.5 m'],
    ],
    toCm: (r) => [r[0],(r[1]*2.54).toFixed(1),(r[2]*2.54).toFixed(1),(r[3]*2.54).toFixed(1),r[4]],
    tips: ['Bust — measure around the fullest part of the chest.','Waist — for petticoat sizing.','Blouse Length — from shoulder to bottom of blouse.'],
    diagram: 'top',
  },
  women_jeans: {
    label: "Women's Jeans & Trousers",
    headers: ['Size','Waist (in)','Hip (in)','Inseam (in)','Rise (in)'],
    headersCm: ['Size','Waist (cm)','Hip (cm)','Inseam (cm)','Rise (cm)'],
    rows: [
      ['26',26,35,30,9.5],['28',28,37,30,10],['30',30,39,30.5,10],
      ['32',32,41,31,10.5],['34',34,43,31,10.5],['36',36,45,31.5,11],
    ],
    toCm: (r) => [r[0],(r[1]*2.54).toFixed(1),(r[2]*2.54).toFixed(1),(r[3]*2.54).toFixed(1),(r[4]*2.54).toFixed(1)],
    tips: ['Waist — measure around the narrowest part.','Hip — measure around the widest part.','Inseam — from crotch to ankle.','Rise — from crotch seam to waistband top.'],
    diagram: 'jeans',
  },
};

function getChart(gender, category) {
  const cat = (category || '').toLowerCase();
  const g   = (gender   || '').toLowerCase();
  if (g === 'women') {
    if (['saree'].some(k => cat.includes(k)))   return CHARTS.women_sarees;
    if (['kurti','kurta','ethnic'].some(k => cat.includes(k))) return CHARTS.women_kurtis;
    if (['jean','trouser','pant','denim'].some(k => cat.includes(k))) return CHARTS.women_jeans;
    return CHARTS.women_tops;
  }
  return CHARTS.men;
}

/* ─── SVG Diagrams ─── */
function ShirtDiagram() {
  return (
    <svg viewBox="0 0 300 340" fill="none" style={{ width: '100%', maxWidth: 280, margin: '0 auto', display: 'block' }}>
      {/* Shirt body */}
      <path d="M95 40 L60 80 L30 70 L20 110 L55 120 L55 300 L245 300 L245 120 L280 110 L270 70 L240 80 L205 40 C205 40 185 60 150 60 C115 60 95 40 95 40Z" stroke="#333" strokeWidth="2" fill="white" />
      {/* Collar */}
      <path d="M130 40 L150 75 L170 40" stroke="#333" strokeWidth="1.5" fill="none"/>
      {/* Measurement lines */}
      <line x1="55" y1="140" x2="245" y2="140" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="5,3"/>
      <line x1="55" y1="200" x2="245" y2="200" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="5,3"/>
      <line x1="150" y1="60" x2="150" y2="300" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="5,3"/>
      <line x1="60" y1="80" x2="240" y2="80" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5,3"/>
      <line x1="245" y1="120" x2="280" y2="80" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3"/>
      {/* Labels */}
      <text x="152" y="136" fontSize="9" fill="#22c55e" fontWeight="700">Chest</text>
      <text x="152" y="196" fontSize="9" fill="#22c55e" fontWeight="700">Waist</text>
      <text x="155" y="185" fontSize="9" fill="#3b82f6" fontWeight="700">Length</text>
      <text x="100" y="72" fontSize="9" fill="#f59e0b" fontWeight="700">Across Shoulder</text>
      <text x="252" y="102" fontSize="9" fill="#ef4444" fontWeight="700">Sleeve</text>
    </svg>
  );
}

function TopDiagram() {
  return (
    <svg viewBox="0 0 300 300" fill="none" style={{ width: '100%', maxWidth: 260, margin: '0 auto', display: 'block' }}>
      <path d="M100 35 L70 75 L40 65 L30 100 L65 110 L65 260 L235 260 L235 110 L270 100 L260 65 L230 75 L200 35 C200 35 178 55 150 55 C122 55 100 35 100 35Z" stroke="#333" strokeWidth="2" fill="white"/>
      <line x1="65" y1="125" x2="235" y2="125" stroke="#ff6a9a" strokeWidth="1.5" strokeDasharray="5,3"/>
      <line x1="72" y1="175" x2="228" y2="175" stroke="#fb923c" strokeWidth="1.5" strokeDasharray="5,3"/>
      <line x1="65" y1="210" x2="235" y2="210" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="5,3"/>
      <line x1="150" y1="55" x2="150" y2="260" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="5,3"/>
      <text x="152" y="121" fontSize="9" fill="#ff6a9a" fontWeight="700">Bust</text>
      <text x="152" y="171" fontSize="9" fill="#fb923c" fontWeight="700">Waist</text>
      <text x="152" y="206" fontSize="9" fill="#a855f7" fontWeight="700">Hip</text>
      <text x="155" y="165" fontSize="9" fill="#3b82f6" fontWeight="700">Length</text>
    </svg>
  );
}

function JeansDiagram() {
  return (
    <svg viewBox="0 0 280 340" fill="none" style={{ width: '100%', maxWidth: 240, margin: '0 auto', display: 'block' }}>
      <path d="M50 40 L230 40 L230 80 L200 320 L155 320 L140 200 L125 320 L80 320 L50 80 Z" stroke="#333" strokeWidth="2" fill="white"/>
      <line x1="50" y1="40" x2="230" y2="40" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="5,3"/>
      <line x1="45" y1="100" x2="235" y2="100" stroke="#ff6a9a" strokeWidth="1.5" strokeDasharray="5,3"/>
      <line x1="155" y1="80" x2="205" y2="320" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="5,3"/>
      <line x1="50" y1="65" x2="140" y2="65" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5,3"/>
      <text x="232" y="43" fontSize="9" fill="#3b82f6" fontWeight="700">Waist</text>
      <text x="237" y="103" fontSize="9" fill="#ff6a9a" fontWeight="700">Hip</text>
      <text x="160" y="200" fontSize="9" fill="#22c55e" fontWeight="700">Inseam</text>
      <text x="55" y="60" fontSize="9" fill="#f59e0b" fontWeight="700">Rise</text>
    </svg>
  );
}

const DIAGRAMS = { shirt: ShirtDiagram, kurti: TopDiagram, top: TopDiagram, jeans: JeansDiagram };

/* ─── Modal ─── */
export default function SizeChartModal({ product, gender, category, onClose }) {
  const chart = getChart(gender, category);
  const [tab, setTab]     = useState('chart');   // 'chart' | 'measure'
  const [unit, setUnit]   = useState('in');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [onClose]);

  const headers = unit === 'in' ? chart.headers : chart.headersCm;
  const rows    = unit === 'in' ? chart.rows : chart.rows.map(chart.toCm);
  const Diagram = DIAGRAMS[chart.diagram] || ShirtDiagram;

  const accent = gender === 'women' ? '#e91e8c' : '#7c6aff';

  return (
    <div onClick={onClose}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'flex-end' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:'#fff', width:'100%', maxWidth:520, height:'100vh', display:'flex', flexDirection:'column', boxShadow:'-8px 0 40px rgba(0,0,0,0.2)', overflowY:'auto' }}>

        {/* Close */}
        <button onClick={onClose}
          style={{ position:'absolute', top:16, left:16, zIndex:10, width:32, height:32, borderRadius:'50%', border:'1px solid #e0e0e0', background:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <X size={16} color="#333" />
        </button>

        {/* Product header */}
        {product && (
          <div style={{ display:'flex', gap:14, padding:'18px 20px', borderBottom:'1px solid #f0f0f0', marginTop:0 }}>
            {product.images?.[0] && (
              <img src={product.images[0]} alt={product.name}
                style={{ width:70, height:84, objectFit:'cover', borderRadius:4, flexShrink:0, border:'1px solid #f0f0f0' }} />
            )}
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:13, fontWeight:700, color:'#333', margin:'0 0 4px', lineHeight:1.4 }}>{product.name}</p>
              <p style={{ fontSize:13, color:'#333', margin:'0 0 4px' }}>
                <strong>₹{product.price?.toLocaleString('en-IN')}</strong>{' '}
                {product.mrp && <span style={{ textDecoration:'line-through', color:'#999', fontSize:12 }}>₹{product.mrp?.toLocaleString('en-IN')}</span>}{' '}
                {product.discount && <span style={{ color:'#ff3f6c', fontSize:12, fontWeight:700 }}>({product.discount}% OFF)</span>}
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid #f0f0f0' }}>
          {[['chart','Size Chart'],['measure','How to measure']].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)}
              style={{ flex:1, padding:'14px 0', fontSize:14, fontWeight:600, cursor:'pointer', border:'none', background:'none', color: tab===val ? accent : '#666', borderBottom: tab===val ? `2px solid ${accent}` : '2px solid transparent', transition:'all 0.2s' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Size Chart Tab */}
        {tab === 'chart' && (
          <div style={{ flex:1, overflowY:'auto' }}>
            {/* in/cm toggle */}
            <div style={{ display:'flex', justifyContent:'flex-end', padding:'12px 20px 0', gap:2 }}>
              {['in','cm'].map(u => (
                <button key={u} onClick={() => setUnit(u)}
                  style={{ padding:'4px 14px', fontSize:12, fontWeight:700, border:`1px solid ${unit===u ? accent : '#ddd'}`, borderRadius:u==='in'?'20px 0 0 20px':'0 20px 20px 0', cursor:'pointer', background: unit===u ? accent : 'white', color: unit===u ? 'white' : '#666', transition:'all 0.2s' }}>
                  {u}
                </button>
              ))}
            </div>

            <p style={{ fontSize:11, color:'#999', textAlign:'right', padding:'4px 20px 0' }}>* Garment Measurements in {unit === 'in' ? 'Inches' : 'Centimetres'}</p>

            {/* Table */}
            <div style={{ overflowX:'auto', padding:'8px 16px 0' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:380 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid #f0f0f0' }}>
                    <th style={{ width:32 }}></th>
                    {headers.map((h,i) => (
                      <th key={i} style={{ padding:'10px 10px', fontSize:12, fontWeight:700, color:'#333', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => {
                    const isSelected = selected === ri;
                    return (
                      <tr key={ri} onClick={() => setSelected(ri)}
                        style={{ borderBottom:'1px solid #f5f5f5', cursor:'pointer', background: isSelected ? '#fff8fb' : 'white', transition:'background 0.15s' }}>
                        <td style={{ padding:'12px 8px', textAlign:'center' }}>
                          <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${isSelected ? accent : '#ccc'}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
                            {isSelected && <div style={{ width:8, height:8, borderRadius:'50%', background:accent }} />}
                          </div>
                        </td>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{ padding:'12px 10px', fontSize:13, color: isSelected ? '#333' : '#666', fontWeight: ci===0 ? 700 : 400, whiteSpace:'nowrap' }}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize:11, color:'#999', padding:'10px 20px 20px' }}>* Garment Measurements in {unit === 'in' ? 'Inches' : 'Centimetres'}</p>
          </div>
        )}

        {/* How to Measure Tab */}
        {tab === 'measure' && (
          <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
            <p style={{ fontSize:11, color:'#999', marginBottom:20 }}>* Garment Measurements in Inches</p>
            <h4 style={{ fontSize:14, fontWeight:700, color:'#333', marginBottom:16 }}>How to measure yourself</h4>

            <div style={{ background:'#f9f9f9', borderRadius:12, padding:'20px', marginBottom:20 }}>
              <Diagram />
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {chart.tips.map((tip, i) => (
                <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <div style={{ width:22, height:22, borderRadius:'50%', background:accent+'18', border:`1.5px solid ${accent}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, fontWeight:700, color:accent }}>
                    {i+1}
                  </div>
                  <p style={{ fontSize:13, color:'#555', margin:0, lineHeight:1.6 }}>{tip}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop:20, padding:'14px 16px', background:'#fff8fb', border:`1px solid ${accent}33`, borderRadius:10 }}>
              <p style={{ fontSize:12, color:'#666', margin:0, lineHeight:1.6 }}>
                💡 <strong>Tip:</strong> Use a soft measuring tape. Stand straight and keep the tape parallel to the floor. For the most accurate measurement, ask someone to help.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
