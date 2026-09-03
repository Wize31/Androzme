import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Moon, Sun, Trash2, Plus, Shuffle, Snowflake, Thermometer, CloudSun, CloudRain, Flame, Bomb, Flower2, Bug, Heart, Sword, Sparkles } from 'lucide-react'
import './styles.css'

const colors = ['#ef8354', '#72bda3', '#7aa7d9', '#c084fc', '#e8c547', '#ec6b88']
const initialDice = [
  { id: 1, title: 'Jet d’attaque', faces: 20, color: colors[0], result: null, recent: [] },
  { id: 2, title: 'Dégâts rapides', faces: 8, color: colors[1], result: null, recent: [] },
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

function ColorControl({ color, onChange }) {
  return <label className="color-picker" style={{ background: color }} title="Modifier la couleur"><input type="color" value={color} onChange={event => onChange(event.target.value)} aria-label="Modifier la couleur" /></label>
}

function SafeDie({ faces, color, result, rolling, symbol, onClick }) {
  const shape = faces === 4 ? 'd4' : faces === 6 ? 'd6' : faces === 8 ? 'd8' : faces === 10 ? 'd10' : 'd20'
  const [rotation, setRotation] = useState({ x: -22, y: -34, z: 0 })
  const front = symbol?.front ?? result ?? `d${faces}`
  const side = symbol?.side ?? Math.max(1, (result ?? 1) % faces + 1)
  const top = symbol?.top ?? Math.max(1, ((result ?? 1) + 1) % faces + 1)
  const launch = () => { const tilt = Math.random() * 70 - 35; const lean = Math.random() * 42 - 21; const roll = Math.random() * 24 - 12; setRotation({ x: 1440 + lean, y: 1800 + tilt, z: roll }); onClick() }
  return <button className={`safe-die safe-${shape} ${rolling ? 'is-rolling' : ''}`} style={{ '--die-color': color, '--rotate-x': `${rotation.x}deg`, '--rotate-y': `${rotation.y}deg`, '--rotate-z': `${rotation.z}deg` }} onClick={launch} aria-label="Lancer le dé"><span className="die-solid"><strong className="die-plane front">{front}</strong><strong className="die-plane back">{side}</strong><strong className="die-plane right">{side}</strong><strong className="die-plane left">{top}</strong><strong className="die-plane top">{top}</strong><strong className="die-plane bottom">{side}</strong></span></button>
}

function CustomDie({ die, onChange, onDelete }) {
  const [rolling, setRolling] = useState(false)
  const [editing, setEditing] = useState(false)
  const roll = () => {
    const result = Math.floor(Math.random() * die.faces) + 1
    setRolling(true)
    window.setTimeout(() => { onChange({ result, recent: [result, ...die.recent].slice(0, 10) }); setRolling(false) }, 700)
  }
  return <article className="roll-card" style={{ '--die-color': die.color }}>
    <div className="roll-card-top"><div className="die-actions"><ColorControl color={die.color} onChange={color => onChange({ color })} /><button className="icon-button" onClick={onDelete} title="Supprimer"><Trash2 size={16} /></button></div></div>
    {editing ? <input className="title-editor" value={die.title} autoFocus onChange={event => onChange({ title: event.target.value })} onBlur={() => setEditing(false)} onKeyDown={event => event.key === 'Enter' && setEditing(false)} /> : <button className="die-title" onClick={() => setEditing(true)}>{die.title}</button>}
    <span className="die-subtitle">d{die.faces}</span>
    <SafeDie faces={die.faces} color={die.color} result={die.result} rolling={rolling} onClick={roll} />
    <div className="die-history"><span className="history-label">Derniers jets</span><div className="mini-results">{die.recent.length ? die.recent.map((result, index) => <span key={`${result}-${index}`} className={index === 0 ? 'latest' : ''}>{result}</span>) : <span className="no-result">-</span>}</div></div>
  </article>
}

function OmenDie({ title, faces, initialColor, day, kind }) {
  const [color, setColor] = useState(() => readStorage(`androzyme-${kind}-color`, initialColor))
  const [recent, setRecent] = useState([])
  const [result, setResult] = useState(null)
  const [rolling, setRolling] = useState(false)
  useEffect(() => localStorage.setItem(`androzyme-${kind}-color`, JSON.stringify(color)), [color, kind])
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
  return <article className="symbol-card"><div className="symbol-heading"><h3>{title}</h3><div className="die-actions"><ColorControl color={color} onChange={setColor} /><button className="icon-button" onClick={() => { setResult(null); setRecent([]) }} title="Effacer l’historique"><Trash2 size={16} /></button></div></div><SafeDie faces={6} color={color} rolling={rolling} symbol={symbol} onClick={launch} /><div className="die-history symbol-history"><span className="history-label">Derniers jets</span><div className="mini-results">{recent.length ? recent.map((index, position) => { const Icon = marks[index]; return <span key={`${index}-${position}`} className={position === 0 ? 'latest symbol-result' : 'symbol-result'}>{Icon ? <Icon size={15} /> : '/'}</span> }) : <span className="no-result">-</span>}</div></div></article>
}

function Header({ day, setDay, time, setTime, campaignDay, setCampaignDay, page, setPage }) {
  const [open, setOpen] = useState(false)
  return <header className="topbar"><div className="brand"><span className="brand-mark"><Sparkles size={18} /></span><div><strong>ANDROZME</strong><small>Quêtes & Aventures</small></div></div><div className="time-control"><Sun size={18} /><span>Jour</span><input type="range" min="0" max="100" value={time} onChange={event => { const value = Number(event.target.value); setTime(value); setDay(value < 55) }} aria-label="Jour ou nuit" /><span>Nuit</span><Moon size={18} /></div><label className="day-counter">Jour <input type="range" min="1" max="10" step="1" value={campaignDay} onChange={event => setCampaignDay(Number(event.target.value))} aria-label="Jour de la quête" /><strong>{campaignDay}/10</strong>{campaignDay === 10 && <b>Burst</b>}</label><div className="page-navigation"><button className="page-count page-switcher" onClick={() => setOpen(!open)}>0{page} <span>/ 06</span></button>{open && <div className="page-menu"><button className={page === 1 ? 'active' : ''} onClick={() => { setPage(1); setOpen(false) }}>01 · Rolls and Omens</button><button className={page === 2 ? 'active' : ''} onClick={() => { setPage(2); setOpen(false) }}>02 · Board</button></div>}</div></header>
}

function App() {
  const savedTime = Number(readStorage('androzyme-time', 35)) || 35
  const [time, setTime] = useState(savedTime)
  const [day, setDay] = useState(savedTime < 55)
  const [campaignDay, setCampaignDay] = useState(() => Number(readStorage('androzyme-campaign-day', 1)) || 1)
  const [page, setPage] = useState(1)
  const [showMenu, setShowMenu] = useState(false)
  const [dice, setDice] = useState(() => { const saved = readStorage('androzyme-dice', initialDice); return Array.isArray(saved) ? saved.map(die => ({ ...die, recent: Array.isArray(die.recent) ? die.recent : [] })) : initialDice })
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
