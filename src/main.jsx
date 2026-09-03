import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Moon, Sun, Trash2, Plus, Shuffle, Snowflake, Thermometer, CloudSun, CloudRain, Flame, Bomb, Flower2, Bug, Heart, Sword, Sparkles } from 'lucide-react'
import './styles.css'

const colors = ['#ef8354', '#72bda3', '#7aa7d9', '#c084fc', '#e8c547', '#ec6b88']
const initialDice = [
  { id: 1, title: 'Jet d’attaque', faces: 20, color: colors[0], textColor: '#ffffff', result: null, recent: [] },
  { id: 2, title: 'Dégâts rapides', faces: 8, color: colors[1], textColor: '#ffffff', result: null, recent: [] },
]

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const value = JSON.parse(raw)
    return value ?? fallback
  } catch {
    localStorage.removeItem(key)
    return fallback
  }
}

function ColorControl({ color, textColor, onColorChange, onTextColorChange }) {
  return <div className="color-control"><label className="color-option">Fond<input type="color" value={color} onChange={event => onColorChange(event.target.value)} aria-label="Couleur de fond du dé" /><span style={{ background: color }} /></label><label className="color-option">Trait<input type="color" value={textColor} onChange={event => onTextColorChange(event.target.value)} aria-label="Couleur des chiffres ou symboles" /><span style={{ background: textColor }} /></label></div>
}

const legacyPolyhedra = {
  4: { faces: [[50,10,18,70,82,70], [50,10,82,70,68,88], [50,10,68,88,32,88], [18,70,32,88,68,88,82,70]], centers: [[50,50],[67,61],[42,67],[50,79]] },
  8: { faces: [[50,8,92,50,50,50], [50,8,50,50,8,50], [8,50,50,50,50,92], [50,50,92,50,50,92], [50,8,92,50,50,50], [50,8,50,50,8,50], [8,50,50,50,50,92], [50,50,92,50,50,92]], centers: [[64,36],[36,36],[32,64],[68,64],[64,36],[36,36],[32,64],[68,64]] },
  10: { faces: [[50,5,78,28,65,58,35,58,22,28], [50,5,78,28,88,62,65,58,35,58], [88,62,78,90,50,96,35,72,65,58], [50,96,22,90,12,62,35,58,65,58], [12,62,22,28,50,5,35,58,65,58]], centers: [[50,34],[64,44],[64,72],[36,72],[36,44]] },
  12: { faces: [[50,5,76,24,66,55,34,55,24,24], [50,5,76,24,95,50,78,80,66,55], [95,50,78,80,50,96,22,80,34,55], [50,96,22,80,5,50,24,24,34,55], [5,50,24,24,50,5,66,55,34,55]], centers: [[50,34],[71,48],[50,70],[29,70],[29,48]] },
  20: { faces: [[50,4,77,20,64,47], [50,4,64,47,36,47], [50,4,36,47,23,20], [23,20,36,47,10,61], [36,47,64,47,50,77], [64,47,77,20,90,61], [10,61,36,47,23,86], [36,47,50,77,23,86], [50,77,64,47,77,86], [64,47,90,61,77,86]], centers: [[64,24],[50,33],[36,24],[23,43],[50,57],[77,43],[23,65],[36,70],[64,70],[77,65]] },
}

function LegacyPolyDie({ faces, color, textColor, result, rolling, onClick }) {
  const [rotation, setRotation] = useState(0)
  const model = polyhedra[faces]
  const values = Array.from({ length: faces }, (_, index) => index + 1)
  const launch = () => { setRotation(Math.floor(Math.random() * 3 + 2) * 360 + Math.floor(Math.random() * 40 - 20)); onClick() }
  return <button className={`poly-die poly-d${faces} ${rolling ? 'is-rolling' : ''}`} style={{ '--die-color': color, '--face-text': textColor, '--poly-rotation': `${rotation}deg` }} onClick={launch} aria-label="Lancer le dé"><svg viewBox="0 0 100 100" role="img">{model.faces.map((points, index) => <polygon key={index} points={points.join(',')} className={`poly-face face-${index % 4}`} />)}{model.centers.map((center, index) => <text key={`label-${index}`} x={center[0]} y={center[1]} className="poly-number">{rolling ? values[index] : index === 0 && result ? result : values[index]}</text>)}</svg></button>
}

function polyModel(sides) {
  if (sides === 4) return { vertices: [[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]], faces: [[0,1,2],[0,3,1],[0,2,3],[1,3,2]] }
  if (sides === 8) return { vertices: [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]], faces: [[0,2,4],[2,1,4],[1,3,4],[3,0,4],[2,0,5],[1,2,5],[3,1,5],[0,3,5]] }
  if (sides === 10) { const vertices = [[0, 1.7, 0], [0, -1.7, 0]]; for (let index = 0; index < 5; index += 1) { const angle = index / 5 * Math.PI * 2 + Math.PI / 2; vertices.push([Math.cos(angle) * 1.42, 0, Math.sin(angle) * 1.42]) } const faces = []; for (let index = 0; index < 5; index += 1) { const next = (index + 1) % 5; faces.push([0, 2 + index, 2 + next], [1, 2 + next, 2 + index]) } return { vertices, faces } }
  if (sides === 12) { const phi = (1 + Math.sqrt(5)) / 2; return { vertices: [[-1,-1,-1],[-1,-1,1],[-1,1,-1],[-1,1,1],[1,-1,-1],[1,-1,1],[1,1,-1],[1,1,1],[0,-1/phi,-phi],[0,-1/phi,phi],[0,1/phi,-phi],[0,1/phi,phi],[-1/phi,-phi,0],[-1/phi,phi,0],[1/phi,-phi,0],[1/phi,phi,0],[-phi,0,-1],[-phi,0,1],[phi,0,-1],[phi,0,1]], faces: [[0,8,10,2,16],[0,16,17,1,12],[0,12,14,4,8],[1,17,3,11,9],[1,9,5,14,12],[2,10,6,15,13],[2,13,3,17,16],[3,13,15,7,11],[4,14,5,19,18],[4,18,6,10,8],[5,9,11,7,19],[6,18,19,7,15]] } }
  const phi = (1 + Math.sqrt(5)) / 2; return { vertices: [[-1,phi,0],[1,phi,0],[-1,-phi,0],[1,-phi,0],[0,-1,phi],[0,1,phi],[0,-1,-phi],[0,1,-phi],[phi,0,-1],[phi,0,1],[-phi,0,-1],[-phi,0,1]], faces: [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]] }
}

function PolyDie({ faces, color, textColor, result, rolling, onClick }) {
  const canvasRef = useRef(null); const model = polyModel(faces); const rotation = useRef({ x: -.35, y: .45, z: 0 })
  useEffect(() => { const canvas = canvasRef.current; const context = canvas.getContext('2d'); const start = { ...rotation.current }; const end = rolling ? { x: start.x + Math.PI * (4 + Math.random() * 2), y: start.y + Math.PI * (5 + Math.random() * 2), z: start.z + Math.PI * (2 + Math.random()) } : start; let frame; let started; const draw = now => { if (!started) started = now; const progress = rolling ? Math.min((now - started) / 700, 1) : 1; const ease = 1 - Math.pow(1 - progress, 3); const angles = { x: start.x + (end.x - start.x) * ease, y: start.y + (end.y - start.y) * ease, z: start.z + (end.z - start.z) * ease }; const points = model.vertices.map(([x,y,z]) => { const cx = Math.cos(angles.x), sx = Math.sin(angles.x), cy = Math.cos(angles.y), sy = Math.sin(angles.y), cz = Math.cos(angles.z), sz = Math.sin(angles.z); const y1 = y * cx - z * sx; const z1 = y * sx + z * cx; const x2 = x * cy + z1 * sy; const z2 = -x * sy + z1 * cy; return [x2 * cz - y1 * sz, x2 * sz + y1 * cz, z2] }); context.clearRect(0, 0, 240, 240); const projected = points.map(([x,y,z]) => [120 + x * 280 / (z + 4.5), 120 - y * 280 / (z + 4.5), z]); const drawFaces = model.faces.map((face, index) => ({ face, index, depth: face.reduce((sum, point) => sum + projected[point][2], 0) / face.length })).sort((left, right) => left.depth - right.depth); const frontFace = drawFaces[drawFaces.length - 1]; drawFaces.forEach(({ face, index, depth }) => { context.beginPath(); face.forEach((point, position) => { const [x,y] = projected[point]; position ? context.lineTo(x,y) : context.moveTo(x,y) }); context.closePath(); context.fillStyle = color; context.globalAlpha = Math.max(.52, Math.min(1, .82 + depth * .1)); context.fill(); context.globalAlpha = 1; context.strokeStyle = 'rgba(255,255,255,.58)'; context.lineWidth = 1.5; context.stroke(); if (!rolling && index === frontFace.index) { const center = face.reduce(([x,y], point) => [x + projected[point][0] / face.length, y + projected[point][1] / face.length], [0,0]); context.fillStyle = textColor; context.font = `700 ${faces >= 20 ? 16 : 21}px Georgia`; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(result ?? index + 1, center[0], center[1]) } }); if (rolling && progress < 1) frame = requestAnimationFrame(draw); else rotation.current = end }; frame = requestAnimationFrame(draw); return () => cancelAnimationFrame(frame) }, [faces, color, textColor, rolling, result])
  return <button className={`poly-canvas poly-d${faces}`} onClick={onClick} aria-label="Lancer le dé"><canvas ref={canvasRef} width="240" height="240" /></button>
}

function NumberedPolyDie({ faces, color, textColor, result, rolling, onClick }) {
  const canvasRef = useRef(null)
  const rotation = useRef({ x: -.35, y: .45, z: 0 })
  const resultRef = useRef(result)
  if (result) resultRef.current = result
  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const model = polyModel(faces)
    const start = { ...rotation.current }
    const end = rolling ? { x: start.x + Math.PI * (10 + Math.random() * 3) + (Math.random() * .7 - .35), y: start.y + Math.PI * (12 + Math.random() * 4) + (Math.random() * .9 - .45), z: start.z + Math.PI * (3 + Math.random() * 2) + (Math.random() * .4 - .2) } : start
    let frame
    let started
    const draw = now => {
      if (!started) started = now
      const progress = rolling ? Math.min((now - started) / 620, 1) : 1
      const ease = 1 - Math.pow(1 - progress, 3)
      const angles = { x: start.x + (end.x - start.x) * ease, y: start.y + (end.y - start.y) * ease, z: start.z + (end.z - start.z) * ease }
      const points = model.vertices.map(([x, y, z]) => { const cx = Math.cos(angles.x); const sx = Math.sin(angles.x); const cy = Math.cos(angles.y); const sy = Math.sin(angles.y); const cz = Math.cos(angles.z); const sz = Math.sin(angles.z); const y1 = y * cx - z * sx; const z1 = y * sx + z * cx; const x2 = x * cy + z1 * sy; const z2 = -x * sy + z1 * cy; return [x2 * cz - y1 * sz, x2 * sz + y1 * cz, z2] })
      const projected = points.map(([x, y, z]) => [120 + x * 280 / (z + 4.5), 120 - y * 280 / (z + 4.5), z])
      const drawFaces = model.faces.map((face, index) => ({ face, index, depth: face.reduce((sum, point) => sum + projected[point][2], 0) / face.length })).sort((left, right) => left.depth - right.depth)
      const frontFace = drawFaces[drawFaces.length - 1]
      context.clearRect(0, 0, 240, 240)
      drawFaces.forEach(({ face, index, depth }) => {
        context.beginPath(); face.forEach((point, position) => { const [x, y] = projected[point]; position ? context.lineTo(x, y) : context.moveTo(x, y) }); context.closePath()
        const isResultFace = !rolling && index === frontFace.index
        context.fillStyle = color; context.globalAlpha = isResultFace ? 1 : Math.max(.48, Math.min(.86, .78 + depth * .1)); context.fill(); context.globalAlpha = 1; if (isResultFace) { context.fillStyle = 'rgba(255,255,255,.15)'; context.fill() }; context.strokeStyle = isResultFace ? textColor : 'rgba(255,255,255,.5)'; context.lineWidth = isResultFace ? 2.7 : 1.25; context.stroke()
        const center = face.reduce(([x, y], point) => [x + projected[point][0] / face.length, y + projected[point][1] / face.length], [0, 0])
        const number = resultRef.current && index === frontFace.index ? resultRef.current : index + 1 === resultRef.current ? frontFace.index + 1 : index + 1
        const [startX, startY] = projected[face[0]]; const [endX, endY] = projected[face[1]]; let angle = Math.atan2(endY - startY, endX - startX); if (angle > Math.PI / 2 || angle < -Math.PI / 2) angle += Math.PI; context.save(); context.clip(); context.translate(center[0], center[1]); context.rotate(angle); context.fillStyle = textColor; context.font = `700 ${isResultFace ? (faces >= 20 ? 20 : 26) : (faces >= 20 ? 16 : 21)}px Georgia`; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(number, 0, 0); context.restore()
      })
      if (rolling && progress < 1) frame = requestAnimationFrame(draw); else rotation.current = end
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [faces, color, textColor, result, rolling])
  return <button className={`poly-canvas poly-d${faces}`} onClick={onClick} aria-label="Lancer le dé"><canvas ref={canvasRef} width="240" height="240" /></button>
}

function SafeDie({ faces, color, textColor = '#ffffff', result, rolling, symbol, onClick }) {
  if (faces !== 6) return <NumberedPolyDie faces={faces} color={color} textColor={textColor} result={result} rolling={rolling} onClick={onClick} />
  const shape = faces === 4 ? 'd4' : faces === 6 ? 'd6' : faces === 8 ? 'd8' : faces === 10 ? 'd10' : 'd20'
  const [rotation, setRotation] = useState({ x: -22, y: -34, z: 0 })
  const front = symbol?.front ?? result ?? `d${faces}`
  const side = symbol?.side ?? Math.max(1, (result ?? 1) % faces + 1)
  const top = symbol?.top ?? Math.max(1, ((result ?? 1) + 1) % faces + 1)
  const launch = () => { const tilt = Math.random() * 70 - 35; const lean = Math.random() * 42 - 21; const roll = Math.random() * 24 - 12; setRotation(current => { const x = current.x + 1440 + lean; const y = current.y + 1800 + tilt; const z = current.z + roll; return { startX: current.x, startY: current.y, startZ: current.z, midX: current.x + (x - current.x) * .72, midY: current.y + (y - current.y) * .72, midZ: current.z + (z - current.z) * .72, x, y, z } }); onClick() }
  return <button className={`safe-die safe-${shape} ${rolling ? 'is-rolling' : ''}`} style={{ '--die-color': color, '--face-text': textColor, '--start-x': `${rotation.startX ?? rotation.x}deg`, '--start-y': `${rotation.startY ?? rotation.y}deg`, '--start-z': `${rotation.startZ ?? rotation.z}deg`, '--mid-x': `${rotation.midX ?? rotation.x}deg`, '--mid-y': `${rotation.midY ?? rotation.y}deg`, '--mid-z': `${rotation.midZ ?? rotation.z}deg`, '--rotate-x': `${rotation.x}deg`, '--rotate-y': `${rotation.y}deg`, '--rotate-z': `${rotation.z}deg` }} onClick={launch} aria-label="Lancer le dé"><span className="die-solid"><strong className="die-plane front result-face">{front}</strong><strong className="die-plane back">{side}</strong><strong className="die-plane right">{side}</strong><strong className="die-plane left">{top}</strong><strong className="die-plane top">{top}</strong><strong className="die-plane bottom">{side}</strong></span></button>
}

function CustomDie({ die, onChange, onDelete }) {
  const [rolling, setRolling] = useState(false)
  const [editing, setEditing] = useState(false)
  const roll = () => {
    const result = Math.floor(Math.random() * die.faces) + 1
    onChange({ result, recent: [result, ...die.recent].slice(0, 10) })
    setRolling(true)
    window.setTimeout(() => setRolling(false), 700)
  }
  return <article className="roll-card" style={{ '--die-color': die.color }}>
    {editing ? <input className="title-editor" value={die.title} autoFocus onChange={event => onChange({ title: event.target.value })} onBlur={() => setEditing(false)} onKeyDown={event => event.key === 'Enter' && setEditing(false)} /> : <button className="die-title" onClick={() => setEditing(true)}>{die.title}</button>}
    <div className="die-meta"><span className="die-subtitle">d{die.faces}</span><div className="die-actions"><ColorControl color={die.color} textColor={die.textColor || '#ffffff'} onColorChange={color => onChange({ color })} onTextColorChange={textColor => onChange({ textColor })} /><button className="icon-button" onClick={() => window.confirm(`Supprimer le dé « ${die.title} » ?`) && onDelete()} title="Supprimer"><Trash2 size={16} /></button></div></div>
    <SafeDie faces={die.faces} color={die.color} textColor={die.textColor || '#ffffff'} result={die.result} rolling={rolling} onClick={roll} />
    <div className="die-history"><span className="history-label">Derniers jets</span><div className="mini-results">{die.recent.length ? die.recent.map((result, index) => <span key={`${result}-${index}`} className={index === 0 ? 'latest' : ''}>{result}</span>) : <span className="no-result">-</span>}</div></div>
  </article>
}

function OmenDie({ title, faces, initialColor, day, kind }) {
  const savedOmen = readStorage(`androzyme-${kind}`, {})
  const [color, setColor] = useState(() => savedOmen.color ?? readStorage(`androzyme-${kind}-color`, initialColor))
  const [textColor, setTextColor] = useState(() => savedOmen.textColor ?? readStorage(`androzyme-${kind}-face-color`, '#ffffff'))
  const [recent, setRecent] = useState(() => Array.isArray(savedOmen.recent) ? savedOmen.recent : [])
  const [result, setResult] = useState(() => Number.isInteger(savedOmen.result) ? savedOmen.result : null)
  const [rolling, setRolling] = useState(false)
  useEffect(() => localStorage.setItem(`androzyme-${kind}-color`, JSON.stringify(color)), [color, kind])
  useEffect(() => localStorage.setItem(`androzyme-${kind}-face-color`, JSON.stringify(textColor)), [textColor, kind])
  useEffect(() => localStorage.setItem(`androzyme-${kind}`, JSON.stringify({ color, textColor, recent, result })), [color, textColor, recent, result, kind])
  const marks = kind === 'climate'
    ? [Snowflake, Thermometer, CloudSun, CloudSun, CloudSun, CloudRain]
    : kind === 'runes'
      ? [Flame, Flame, Bomb, Flower2, Flower2, Flower2]
      : day ? [Bug, Sword, Heart, Heart, null, null] : [Bug, Bug, Heart, Sword, Sword, null]
  const launch = () => {
    const next = Math.floor(Math.random() * 6)
    setRolling(true)
    window.setTimeout(() => { setResult(next); setRecent(current => [next, ...current].slice(0, 3)); setRolling(false) }, 700)
  }
  const FaceIcon = result === null ? null : marks[result]
  const currentFace = result ?? 0
  const sideIcon = marks[(currentFace + 1) % 6]
  const topIcon = marks[(currentFace + 2) % 6]
  const SideIcon = sideIcon
  const TopIcon = topIcon
  const symbol = {
    front: FaceIcon ? <FaceIcon size={42} strokeWidth={1.7} /> : '/',
    side: SideIcon ? <SideIcon size={22} strokeWidth={1.7} /> : '/',
    top: TopIcon ? <TopIcon size={20} strokeWidth={1.7} /> : '/',
  }
  return <article className="symbol-card"><div className="symbol-heading"><h3>{title}</h3><div className="die-actions"><ColorControl color={color} textColor={textColor} onColorChange={setColor} onTextColorChange={setTextColor} /><button className="icon-button" onClick={() => window.confirm(`Effacer l’historique de ${title} ?`) && (setResult(null), setRecent([]))} title="Effacer l’historique"><Trash2 size={16} /></button></div></div><SafeDie faces={6} color={color} textColor={textColor} rolling={rolling} symbol={symbol} onClick={launch} /><div className="die-history symbol-history"><span className="history-label">Derniers jets</span><div className="mini-results">{recent.length ? recent.map((index, position) => { const Icon = marks[index]; return <span key={`${index}-${position}`} className={position === 0 ? 'latest symbol-result' : 'symbol-result'}>{Icon ? <Icon size={15} /> : '/'}</span> }) : <span className="no-result">-</span>}</div></div></article>
}

function Header({ day, setDay, time, setTime, campaignDay, setCampaignDay, page, setPage }) {
  const [open, setOpen] = useState(false)
  return <header className="topbar"><div className="brand"><span className="brand-mark"><Sparkles size={18} /></span><div><strong>ANDROZME</strong><small>Quêtes & Aventures</small></div></div><button className={`theme-toggle ${day ? 'is-day' : 'is-night'}`} onClick={() => { const nextDay = !day; setDay(nextDay); setTime(nextDay ? 0 : 100) }} aria-label={day ? 'Passer en mode nuit' : 'Passer en mode jour'}><Sun size={15} /><span className="theme-knob" /><Moon size={15} /></button><div className="day-counter"><span>Jour</span><div className="day-slider"><input type="range" min="1" max="10" step="1" value={campaignDay} onChange={event => setCampaignDay(Number(event.target.value))} aria-label="Jour de la quête" /><div className="day-marks" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <span key={index + 1} className={campaignDay === index + 1 ? 'active' : ''} />)}</div></div><strong>{campaignDay}/10</strong>{campaignDay === 10 && <b>Burst</b>}</div><div className="page-navigation"><button className="page-count page-switcher" onClick={() => setOpen(!open)}>0{page} <span>/ 06</span></button>{open && <div className="page-menu"><button className={page === 1 ? 'active' : ''} onClick={() => { setPage(1); setOpen(false) }}>01 · Rolls and Omens</button><button className={page === 2 ? 'active' : ''} onClick={() => { setPage(2); setOpen(false) }}>02 · Board</button></div>}</div></header>
}

function App() {
  const savedTime = Number(readStorage('androzyme-time', 35)) || 35
  const [time, setTime] = useState(savedTime)
  const [day, setDay] = useState(savedTime < 55)
  const [campaignDay, setCampaignDay] = useState(() => Number(readStorage('androzyme-campaign-day', 1)) || 1)
  const [page, setPage] = useState(1)
  const [showMenu, setShowMenu] = useState(false)
  const [dice, setDice] = useState(() => { const saved = readStorage('androzyme-dice', initialDice); return Array.isArray(saved) ? saved.map(die => ({ ...die, color: die.color || colors[0], textColor: die.textColor || '#ffffff', recent: Array.isArray(die.recent) ? die.recent : [] })) : initialDice })
  const nextId = useRef(Math.max(0, ...dice.map(die => die.id || 0)) + 1)
  const dragId = useRef(null)
  useEffect(() => localStorage.setItem('androzyme-time', JSON.stringify(time)), [time])
  useEffect(() => localStorage.setItem('androzyme-campaign-day', JSON.stringify(campaignDay)), [campaignDay])
  useEffect(() => localStorage.setItem('androzyme-dice', JSON.stringify(dice)), [dice])
  const updateDie = (id, changes) => setDice(current => current.map(die => die.id === id ? { ...die, ...changes } : die))
  const moveDie = overId => { if (!dragId.current || dragId.current === overId) return; setDice(current => { const from = current.findIndex(die => die.id === dragId.current); const to = current.findIndex(die => die.id === overId); if (from < 0 || to < 0) return current; const result = [...current]; result.splice(to, 0, result.splice(from, 1)[0]); return result }) }
  if (page === 2) return <main className={day ? 'app day' : 'app night'}><Header {...{ day, setDay, time, setTime, campaignDay, setCampaignDay, page, setPage }} /><section className="board-page"><h1>Board</h1></section></main>
  return <main className={day ? 'app day' : 'app night'}><Header {...{ day, setDay, time, setTime, campaignDay, setCampaignDay, page, setPage }} /><section className="simple-hero"><h1>Rolls <em>and Omens</em></h1></section><section className="rituals"><div className="section-heading"><div><span className="eyebrow">Les inévitables</span><h2>Les présages</h2></div></div><div className="symbol-grid"><OmenDie title="Climat" kind="climate" initialColor={colors[2]} day={day} /><OmenDie title="Runes" kind="runes" initialColor={colors[5]} day={day} /><OmenDie title="Rencontres" kind="encounters" initialColor={colors[0]} day={day} /></div></section><section className="workspace"><div className="section-heading"><h2>Vos dés</h2><div className="add-die-wrap"><button className="add-button" onClick={() => setShowMenu(!showMenu)}><Plus size={18} /> Ajouter un dé</button>{showMenu && <div className="die-menu">{[4, 6, 8, 10, 20].map(faces => <button key={faces} onClick={() => { setDice(current => [...current, { id: nextId.current++, title: `Nouveau d${faces}`, faces, color: colors[nextId.current % colors.length], result: null, recent: [] }]); setShowMenu(false) }}>d{faces}</button>)}</div>}</div></div><div className="dice-grid" onPointerMove={event => { if (!dragId.current) return; const item = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-die-id]'); if (item) moveDie(Number(item.dataset.dieId)) }} onPointerUp={() => { dragId.current = null }}>{dice.map(die => <div className="draggable-die" data-die-id={die.id} key={die.id} onPointerDown={() => { dragId.current = die.id }}><CustomDie die={die} onChange={changes => updateDie(die.id, changes)} onDelete={() => setDice(current => current.filter(item => item.id !== die.id))} /></div>)}</div></section><section className="creatures"><div className="deck-copy"><h2>Créatures</h2><p>Le paquet attend les fiches de monstres de votre bestiaire.</p><button className="deck-button"><Shuffle size={17} /> Mélanger le paquet</button></div><button className="deck" aria-label="Paquet Créatures"><div className="card-back"><span>✦</span><strong>Créatures</strong></div></button></section></main>
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
