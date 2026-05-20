'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { scrollState } from '@/app/lib/scrollState'

const SONGS = [
  { src: '/audio/out-is-through.mp3', title: 'Out is Through', color: '#E0E0E8', rgb: [0.88, 0.88, 0.91] },
  { src: '/audio/is-your-heart-big-enough.mp3', title: 'Is Your Heart Big Enough for Them', color: '#E53935', rgb: [0.90, 0.22, 0.21] },
  { src: '/audio/sincerity.mp3', title: 'Sincerity', color: '#EC407A', rgb: [0.93, 0.25, 0.48] },
  { src: '/audio/wheres-my-dignity-now.mp3', title: "Where's My Dignity Now", color: '#FF7043', rgb: [1.0, 0.44, 0.26] },
  { src: '/audio/good-talk.mp3', title: 'Good Talk', color: '#AB47BC', rgb: [0.67, 0.28, 0.74] },
]

const FFT_SIZE = 2048
const BEAT_COOLDOWN_MS = 200
const BEAT_THRESHOLD_MULT = 1.4
const FLUX_HISTORY_SIZE = 50

/* ScalesMixer grid dimensions */
const GRID_COLS = 10
const GRID_ROWS = 10
const DOT_SPACING = 6
const DOT_R_MIN = 0.8
const DOT_R_MAX = 2.4

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/* ── useRafLoop ─────────────────────────────────────── */
function useRafLoop(callback: (dt: number) => void, active: boolean) {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    if (!active) return
    let prev = performance.now()
    let id: number
    function loop(now: number) {
      const dt = (now - prev) / 1000
      prev = now
      cbRef.current(dt)
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [active])
}

/* ── ScalesMixer ────────────────────────────────────── */
function ScalesMixer({
  getFreqData,
  color,
  isPlaying,
}: {
  getFreqData: () => Uint8Array | null
  color: string
  isPlaying: boolean
}) {
  const dotsRef = useRef<(SVGCircleElement | null)[]>([])
  const svgW = GRID_COLS * DOT_SPACING
  const svgH = GRID_ROWS * DOT_SPACING

  useRafLoop(() => {
    const data = getFreqData()
    if (!data) return
    const len = data.length // 1024 bins for FFT_SIZE=2048

    for (let row = 0; row < GRID_ROWS; row++) {
      // Map each row to a frequency band — logarithmic spread
      // Row 0 = lowest freq, Row 9 = highest
      const frac = row / GRID_ROWS
      const binStart = Math.floor(Math.pow(frac, 2) * len * 0.5)
      const binEnd = Math.floor(Math.pow((row + 1) / GRID_ROWS, 2) * len * 0.5)
      const count = Math.max(1, binEnd - binStart)

      // Average energy in this band
      let sum = 0
      for (let b = binStart; b < binStart + count && b < len; b++) {
        sum += data[b]
      }
      const energy = sum / (count * 255) // 0..1

      for (let col = 0; col < GRID_COLS; col++) {
        const dot = dotsRef.current[row * GRID_COLS + col]
        if (!dot) continue

        // Each column adds phase variation
        const phase = (col / GRID_COLS) * Math.PI
        const wave = 0.5 + 0.5 * Math.sin(phase + performance.now() * 0.003 + row * 0.7)
        const r = DOT_R_MIN + (DOT_R_MAX - DOT_R_MIN) * energy * wave
        const opacity = 0.15 + 0.85 * energy * wave

        dot.setAttribute('r', r.toFixed(2))
        dot.setAttribute('opacity', opacity.toFixed(2))
      }
    }
  }, isPlaying)

  const dots: React.ReactNode[] = []
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const idx = row * GRID_COLS + col
      dots.push(
        <circle
          key={idx}
          ref={(el) => { dotsRef.current[idx] = el }}
          cx={col * DOT_SPACING + DOT_SPACING / 2}
          cy={row * DOT_SPACING + DOT_SPACING / 2}
          r={DOT_R_MIN}
          fill={color}
          opacity={0.15}
        />
      )
    }
  }

  return (
    <svg
      className="mp-scales"
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {dots}
    </svg>
  )
}

/* ── Disc ───────────────────────────────────────────── */
function Disc({ color, isPlaying }: { color: string; isPlaying: boolean }) {
  const angleRef = useRef(0)
  const discRef = useRef<HTMLDivElement>(null)
  const velocityRef = useRef(0)

  useRafLoop((dt) => {
    const target = isPlaying ? 45 : 0 // degrees per second
    velocityRef.current = lerp(velocityRef.current, target, dt * (isPlaying ? 3 : 1.5))
    angleRef.current = (angleRef.current + velocityRef.current * dt) % 360
    if (discRef.current) {
      discRef.current.style.transform = `rotate(${angleRef.current}deg)`
    }
  }, true)

  return (
    <div className="mp-disc-wrap">
      <div ref={discRef} className="mp-disc">
        {/* Grooves */}
        <div className="mp-disc-groove mp-disc-groove-1" />
        <div className="mp-disc-groove mp-disc-groove-2" />
        <div className="mp-disc-groove mp-disc-groove-3" />
        {/* Center color gradient */}
        <div
          className="mp-disc-center"
          style={{
            background: `radial-gradient(circle, ${color} 0%, ${color}88 40%, transparent 70%)`,
          }}
        />
        {/* Center dot */}
        <div className="mp-disc-dot" />
      </div>
    </div>
  )
}

/* ── Main MusicPlayer ───────────────────────────────── */
export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [songIndex, setSongIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audiosRef = useRef<HTMLAudioElement[]>([])
  const gainsRef = useRef<GainNode[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const freqDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const fluxHistoryRef = useRef<number[]>([])
  const lastBeatRef = useRef(0)
  const lastRippleRef = useRef(0)
  const [volume, setVolume] = useState(0.7)
  const volumeRef = useRef(0.7)

  const playingRef = useRef(false)
  const indexRef = useRef(0)
  const bassRangeRef = useRef({ start: 0, end: 0 })

  /* ── Audio init ────────────────────────────────────── */
  useEffect(() => {
    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = FFT_SIZE
    analyser.smoothingTimeConstant = 0.4
    analyser.connect(ctx.destination)

    audioCtxRef.current = ctx
    analyserRef.current = analyser
    freqDataRef.current = new Uint8Array(analyser.frequencyBinCount)

    const sr = ctx.sampleRate
    bassRangeRef.current = {
      start: Math.floor(60 * FFT_SIZE / sr),
      end: Math.floor(200 * FFT_SIZE / sr),
    }

    audiosRef.current = SONGS.map(song => {
      const audio = new Audio(song.src)
      audio.loop = true
      audio.preload = 'auto'
      const source = ctx.createMediaElementSource(audio)
      const gain = ctx.createGain()
      gain.gain.value = 0
      source.connect(gain)
      gain.connect(analyser)
      gainsRef.current.push(gain)
      return audio
    })

    return () => {
      audiosRef.current.forEach(a => { a.pause(); a.src = '' })
      ctx.close()
    }
  }, [])

  /* ── Main rAF loop: beat detection, section colors, gain crossfade ── */
  useEffect(() => {
    let rafId: number
    let lastTickTime = performance.now()
    function tick() {
      const now = performance.now()
      const dt = (now - lastTickTime) / 1000
      lastTickTime = now
      for (let ri = 0; ri < 12; ri++) scrollState.rippleAges[ri] += dt

      if (audiosRef.current.length === 0) {
        rafId = requestAnimationFrame(tick)
        return
      }

      // Update section color
      const songIdx = Math.max(0, Math.min(Math.floor((scrollState.offset || 0) * SONGS.length), SONGS.length - 1))
      const rgb = SONGS[songIdx].rgb
      scrollState.sectionColor[0] = rgb[0]
      scrollState.sectionColor[1] = rgb[1]
      scrollState.sectionColor[2] = rgb[2]

      const offset = scrollState.offset || 0
      const newIndex = Math.max(0, Math.min(Math.floor((offset + 0.08) * SONGS.length), SONGS.length - 1))

      if (newIndex !== indexRef.current) {
        indexRef.current = newIndex
        setSongIndex(newIndex)
        if (playingRef.current) {
          audiosRef.current[newIndex]?.play().catch(() => {})
        }
      }

      gainsRef.current.forEach((gain, i) => {
        const audio = audiosRef.current[i]
        if (!gain || !audio) return
        const target = (i === indexRef.current && playingRef.current) ? volumeRef.current : 0
        gain.gain.value = Math.max(0, Math.min(1, lerp(gain.gain.value, target, 0.06)))
        if (target > 0 && audio.paused && playingRef.current) {
          audio.play().catch(() => {})
        }
        if (gain.gain.value < 0.005 && !audio.paused && target === 0) {
          audio.pause()
          gain.gain.value = 0
        }
      })

      const analyser = analyserRef.current
      const freqData = freqDataRef.current
      if (analyser && freqData && playingRef.current) {
        analyser.getByteFrequencyData(freqData)

        const { start, end } = bassRangeRef.current
        let bassEnergy = 0
        for (let i = start; i <= end; i++) {
          bassEnergy += freqData[i]
        }
        const binCount = end - start + 1
        const normalized = bassEnergy / (binCount * 255)

        scrollState.beatIntensity = lerp(scrollState.beatIntensity, normalized, 0.25)

        const history = fluxHistoryRef.current
        history.push(normalized)
        if (history.length > FLUX_HISTORY_SIZE) history.shift()

        if (history.length > 10) {
          const mean = history.reduce((a, b) => a + b) / history.length
          const variance = history.reduce((a, b) => a + (b - mean) ** 2, 0) / history.length
          const threshold = mean + Math.sqrt(variance) * BEAT_THRESHOLD_MULT

          if (normalized > threshold && now - lastBeatRef.current > BEAT_COOLDOWN_MS) {
            lastBeatRef.current = now
            scrollState.beatPulse = Math.min(1, (normalized - mean) / (1 - mean + 0.01))
          }
          const rippleThreshold = mean + Math.sqrt(variance) * 3.0
          if (normalized > rippleThreshold && now - lastRippleRef.current > 1200) {
            lastRippleRef.current = now
            scrollState.rippleAges[scrollState.rippleIdx] = 0
            scrollState.rippleIntensities[scrollState.rippleIdx] = scrollState.rippleIdx % 2 === 0 ? 1.0 : 0.35
            scrollState.rippleIdx = (scrollState.rippleIdx + 1) % 12
          }
        }
      }

      // Update progress & times
      if (playingRef.current) {
        const currentAudio = audiosRef.current[indexRef.current]
        if (currentAudio && currentAudio.duration && isFinite(currentAudio.duration)) {
          setProgress(currentAudio.currentTime / currentAudio.duration)
          setCurrentTime(currentAudio.currentTime)
          setDuration(currentAudio.duration)
        }
      }

      scrollState.beatPulse *= 0.88
      if (!playingRef.current) {
        scrollState.beatIntensity *= 0.95
        scrollState.beatPulse *= 0.9
      }

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  /* ── Toggle play/pause ─────────────────────────────── */
  const toggle = useCallback(() => {
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    const next = !playingRef.current
    playingRef.current = next
    scrollState.isPlaying = next
    setIsPlaying(next)
    if (next) {
      gainsRef.current[indexRef.current].gain.value = volumeRef.current
      audiosRef.current[indexRef.current].play().catch(() => {})
    } else {
      audiosRef.current.forEach(a => a.pause())
    }
  }, [])

  /* ── Next / Prev ───────────────────────────────────── */
  const nextTrack = useCallback(() => {
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    audiosRef.current[indexRef.current]?.pause()
    const next = (indexRef.current + 1) % SONGS.length
    indexRef.current = next
    setSongIndex(next)
    setProgress(0)
    setCurrentTime(0)
    if (playingRef.current) {
      audiosRef.current[next].currentTime = 0
      audiosRef.current[next].play().catch(() => {})
      gainsRef.current[next].gain.value = volumeRef.current
    }
  }, [])

  const prevTrack = useCallback(() => {
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    audiosRef.current[indexRef.current]?.pause()
    const prev = (indexRef.current - 1 + SONGS.length) % SONGS.length
    indexRef.current = prev
    setSongIndex(prev)
    setProgress(0)
    setCurrentTime(0)
    if (playingRef.current) {
      audiosRef.current[prev].currentTime = 0
      audiosRef.current[prev].play().catch(() => {})
      gainsRef.current[prev].gain.value = volumeRef.current
    }
  }, [])

  /* ── Seek ──────────────────────────────────────────── */
  const seek = useCallback((pct: number) => {
    const audio = audiosRef.current[indexRef.current]
    if (audio && audio.duration && isFinite(audio.duration)) {
      audio.currentTime = pct * audio.duration
      setProgress(pct)
      setCurrentTime(audio.currentTime)
    }
  }, [])

  /* ── Freq data reader for ScalesMixer ──────────────── */
  const getFreqData = useCallback((): Uint8Array | null => {
    const analyser = analyserRef.current
    const data = freqDataRef.current
    if (!analyser || !data) return null
    analyser.getByteFrequencyData(data)
    return data
  }, [])

  const songColor = SONGS[songIndex].color

  return (
    <div className="mp-card">
      {/* Color bleed behind entire card */}
      <div
        className="mp-cover-bg"
        style={{ background: `linear-gradient(180deg, ${songColor}90 0%, ${songColor}20 60%, transparent 100%)` }}
      />

      {/* Large disc area filling top of card */}
      <div className="mp-disc-area">
        <Disc color={songColor} isPlaying={isPlaying} />
        <ScalesMixer getFreqData={getFreqData} color={songColor} isPlaying={isPlaying} />
      </div>

      {/* Card body */}
      <div className="mp-body">
      <div className="mp-info">
        <AnimatePresence mode="wait">
          <motion.span
            key={songIndex}
            className="mp-title"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {SONGS[songIndex].title}
          </motion.span>
        </AnimatePresence>
        <span className="mp-artist">ROZSA</span>
      </div>

      {/* Progress bar */}
      <div className="mp-progress-wrap">
        <span className="mp-time">{formatTime(currentTime)}</span>
        <div
          className="mp-bar"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
            seek(pct)
          }}
        >
          <div
            className="mp-bar-fill"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: songColor,
            }}
          />
          <div
            className="mp-bar-thumb"
            style={{
              left: `${progress * 100}%`,
              borderColor: songColor,
            }}
          />
        </div>
        <span className="mp-time">{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="mp-controls">
        <button
          className="mp-ctrl mp-ctrl-sm"
          onClick={prevTrack}
          aria-label="Previous track"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
          </svg>
        </button>

        <button
          className="mp-ctrl mp-ctrl-play"
          onClick={toggle}
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
          style={{
            borderColor: `${songColor}50`,
            boxShadow: isPlaying ? `0 0 16px ${songColor}30` : 'none',
          }}
        >
          <AnimatePresence mode="wait">
            {isPlaying ? (
              <motion.svg
                key="pause"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                width={18} height={18} viewBox="0 0 24 24" fill="currentColor"
              >
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </motion.svg>
            ) : (
              <motion.svg
                key="play"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                width={18} height={18} viewBox="0 0 24 24" fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </motion.svg>
            )}
          </AnimatePresence>
        </button>

        <button
          className="mp-ctrl mp-ctrl-sm"
          onClick={nextTrack}
          aria-label="Next track"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>

      {/* Volume */}
      <div className="mp-volume">
        <svg width={12} height={12} viewBox="0 0 24 24" fill="currentColor" className="mp-vol-icon">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
        </svg>
        <input
          type="range"
          className="mp-vol-slider"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            setVolume(v)
            volumeRef.current = v
          }}
          style={{
            background: `linear-gradient(to right, ${songColor} ${volume * 100}%, rgba(255,255,255,0.12) ${volume * 100}%)`,
          }}
        />
      </div>
      </div>
    </div>
  )
}
