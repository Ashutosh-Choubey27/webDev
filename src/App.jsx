import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PlantifyApp() {
  // Growth stages: 0..8 (max)
  const MAX_GROWTH = 8
  const [growth, setGrowth] = useState(() => {
    const saved = localStorage.getItem('plantify-growth')
    return saved ? Number(saved) : 0
  })

  // Timer state (in seconds)
  const DEFAULT_MINUTES = 25
  const [minutes, setMinutes] = useState(25)
  const [remaining, setRemaining] = useState(minutes * 60)
  const [running, setRunning] = useState(false)
  const intervalRef = useRef(null)

  // Wind state for gusts
  const [wind, setWind] = useState(false)
  const windTimeoutRef = useRef(null)
  const windActiveRef = useRef(false)

  // Keep remaining synced when minutes changes
  useEffect(() => {
    setRemaining(minutes * 60)
  }, [minutes])

  // Persist growth
  useEffect(() => {
    localStorage.setItem('plantify-growth', String(growth))
  }, [growth])

  // Timer effect
  useEffect(() => {
    if (running && intervalRef.current === null) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => prev - 1)
      }, 1000)
    }
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [running])

  useEffect(() => {
    if (remaining <= 0 && running) {
      // session finished
      setRunning(false)
      setRemaining(minutes * 60) // reset
      addGrowth(1)
      // small celebratory animation could go here
    }
  }, [remaining, running, minutes])

  function toggleStart() {
    setRunning(r => !r)
  }

  function resetTimer() {
    setRunning(false)
    setRemaining(minutes * 60)
  }

  function addGrowth(n = 1) {
    setGrowth(g => Math.min(MAX_GROWTH, g + n))
  }

  function removeGrowth(n = 1) {
    setGrowth(g => Math.max(0, g - n))
  }

  function resetGrowth() {
    if (confirm('Reset plant growth to 0?')) setGrowth(0)
  }

  // format time
  function formatTime(sec) {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const progress = 1 - remaining / (minutes * 60 || 1)

  // WIND: trigger random gusts
  useEffect(() => {
    let mounted = true
    function scheduleNextGust() {
      if (!mounted) return
      // random delay between 4s and 10s
      const delay = 4000 + Math.random() * 6000
      windTimeoutRef.current = setTimeout(() => {
        triggerGust()
        scheduleNextGust()
      }, delay)
    }

    function triggerGust() {
      if (windActiveRef.current) return
      windActiveRef.current = true
      setWind(true)
      // gust duration 800ms - 1600ms
      const dur = 800 + Math.random() * 800
      setTimeout(() => {
        setWind(false)
        windActiveRef.current = false
      }, dur)
    }

    scheduleNextGust()

    return () => {
      mounted = false
      if (windTimeoutRef.current) clearTimeout(windTimeoutRef.current)
    }
  }, [])

  return (
    
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-green-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl p-6 grid md:grid-cols-2 gap-6 relative">
        {/* Left: Plant canvas */}
        <div className="flex flex-col items-center justify-center space-y-4 relative">
          <h1 className="text-2xl font-extrabold text-emerald-800">Plantify</h1>
          <p className="text-sm text-emerald-600">Grow a virtual plant when you focus — sessions add growth</p>

          <div className="w-64 h-64 flex items-end justify-center relative">
            <SunSVG />
            <PlantSVG growth={growth} wind={wind} />
          </div>

          <div className="w-full">
            <div className="flex items-center justify-between mb-2 text-sm">
              <div>Growth: <strong>{growth}/{MAX_GROWTH}</strong></div>
              <div className="text-emerald-700">Stage {growth}</div>
            </div>
            <div className="w-full bg-emerald-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 shadow-inner transition-width duration-300"
                style={{ width: `${(growth / MAX_GROWTH) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => addGrowth(1)} className="px-3 py-1 bg-emerald-600 text-white rounded-md shadow">Add Growth</button>
            <button onClick={() => removeGrowth(1)} className="px-3 py-1 bg-amber-300 rounded-md">Remove</button>
            <button onClick={resetGrowth} className="px-3 py-1 bg-red-200 rounded-md">Reset</button>
          </div>
        </div>

        {/* Right: Focus timer and controls */}
        <div className="flex flex-col justify-center items-stretch p-2">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-emerald-800">Focus Session</h2>
            <p className="text-sm text-emerald-600">Start the timer and work — when it ends your plant grows.</p>
          </div>

          <div className="bg-emerald-50 rounded-xl p-4 shadow-inner flex flex-col items-center gap-4">
            <div className="text-5xl font-mono text-emerald-800">{formatTime(remaining)}</div>
            <div className="w-full">
              <label className="text-sm text-emerald-700">Duration (minutes)</label>
              <input
                type="number"
                min="1"
                max="120"
                value={minutes}
                onChange={e => setMinutes(Math.max(1, Number(e.target.value) || 1))}
                className="w-full mt-1 p-2 rounded-md border border-emerald-200"
              />
            </div>

            <div className="w-full flex gap-2">
              <button onClick={toggleStart} className={`flex-1 py-2 rounded-md font-semibold ${running ? 'bg-red-400 text-white' : 'bg-emerald-600 text-white'}`}>
                {running ? 'Pause' : 'Start'}
              </button>
              <button onClick={resetTimer} className="py-2 px-4 rounded-md bg-emerald-100">Reset</button>
            </div>

            <div className="w-full">
              <div className="text-xs text-emerald-700 mb-1">Session progress</div>
              <div className="w-full bg-emerald-100 h-3 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-width duration-300" style={{ width: `${progress * 100}%` }} />
              </div>
            </div>

            <div className="w-full flex gap-2 mt-2">
              <button onClick={() => { addGrowth(1) }} className="flex-1 py-2 rounded-md bg-emerald-200">Complete Session (manual)</button>
              <button onClick={() => { setGrowth(g => Math.min(MAX_GROWTH, g + 2)) }} className="py-2 px-3 rounded-md bg-emerald-300">Bonus +2</button>
            </div>

            <div className="text-xs text-emerald-600 mt-2">Tip: Use short sessions to grow faster — every finished session increases plant growth.</div>
          </div>

          <div className="mt-4 text-sm text-emerald-700">
            <strong>Persistence:</strong> Growth is saved in localStorage. You can also manually adjust the minutes above.
          </div>
        </div>
      </div>
    </div>
  )
}


function SunSVG() {
  return (
    <svg className="absolute top-2 left-8 w-16 h-16" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sunGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <motion.g initial={{ scale: 0.95 }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: 'linear', duration: 20 }} style={{ originX: '50%', originY: '50%' }}>
        <circle cx="32" cy="24" r="10" fill="url(#sunGrad)" />
        {/* rays */}
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2
          const x1 = 32 + Math.cos(angle) * 16
          const y1 = 24 + Math.sin(angle) * 16
          const x2 = 32 + Math.cos(angle) * 22
          const y2 = 24 + Math.sin(angle) * 22
          return <motion.line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" opacity={0.9} />
        })}
      </motion.g>
    </svg>
  )
}

function PlantSVG({ growth = 0, wind = false }) {
  // We'll render leaves depending on growth stage. 0: seed, 1-2: sprout, 3-5: small plant, 6-8: tall plant
  const leaves = []
  // define leaf positions (x, y, rotation)
  const leafPositions = [
    { x: 0, y: -10, r: -10 },
    { x: 0, y: -20, r: 10 },
    { x: 0, y: -34, r: -18 },
    { x: 0, y: -48, r: 18 },
    { x: 0, y: -64, r: -10 },
    { x: 0, y: -82, r: 12 },
    { x: 0, y: -100, r: -6 },
    { x: 0, y: -118, r: 8 }
  ]

  const visibleLeaves = Math.min(growth, leafPositions.length)

  for (let i = 0; i < visibleLeaves; i++) {
    leaves.push(
      <motion.g
        key={i}
        initial={{ opacity: 0, scale: 0.6, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: i * 0.06, type: 'spring', stiffness: 120 }}
        style={{ transformOrigin: 'center bottom' }}
      >
        <motion.path
          d={`M${leafPositions[i].x - 18},${leafPositions[i].y} C${leafPositions[i].x - 10},${leafPositions[i].y - 10} ${leafPositions[i].x + 10},${leafPositions[i].y - 10} ${leafPositions[i].x + 18},${leafPositions[i].y}`}
          transform={`translate(80,140) rotate(${leafPositions[i].r})`}
          fill="url(#leafGrad)"
        />
      </motion.g>
    )
  }

  // pot bounce based on growth using spring
  const potScale = 0.95 + (growth / 40)

  // wind animation for a gentle sway: when wind=true, apply a quick sequence of rotation/translate to the leaves group
  const windAnim = wind
    ? { rotate: [0, -8, 6, -4, 3, 0], x: [0, -3, 2, -1, 0, 0] }
    : { rotate: 0, x: 0 }

  return (
    <svg viewBox="0 0 160 180" width="100%" height="100%" className="overflow-visible">
      <defs>
        <linearGradient id="leafGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="potGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      {/* Soil and pot */}
      <motion.g initial={{ y: 6 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 80 }}>
        <motion.ellipse cx="80" cy="160" rx="38" ry="9" fill="#6B7280" opacity="0.15" />

        <motion.g animate={{ scale: potScale }} transition={{ type: 'spring', stiffness: 100 }} style={{ transformOrigin: '80px 150px' }}>
          <rect x="48" y="128" width="64" height="28" rx="6" fill="url(#potGrad)" />
          <rect x="56" y="116" width="48" height="16" rx="8" fill="#F3E8FF" opacity="0.15" />
        </motion.g>

        {/* stem */}
        <motion.path d="M80 140 C80 120 80 100 80 80" stroke="#064E3B" strokeWidth="3" strokeLinecap="round" fill="none" />

        {/* leaves --> wrap in a motion.g that reacts to wind */}
<motion.g animate={windAnim} transition={{ duration: 1, ease: 'easeInOut' }} style={{ transformOrigin: '80px 140px' }}>
          <g>{leaves}</g>
        </motion.g>

        {/* seed / sprout indicator */}
        <AnimatePresence>
          {growth === 0 && (
            <motion.circle key="seed" cx="80" cy="146" r="6" fill="#A16207" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} />
          )}
        </AnimatePresence>
      </motion.g>
    </svg>
  )
}
