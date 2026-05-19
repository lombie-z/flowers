'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { scrollState } from '@/app/lib/scrollState'

const SONGS = [
  { src: '/audio/out-is-through.mp3', title: 'Out is Through' },
  { src: '/audio/is-your-heart-big-enough.mp3', title: 'Is Your Heart Big Enough for Them' },
  { src: '/audio/sincerity.mp3', title: 'Sincerity' },
  { src: '/audio/wheres-my-dignity-now.mp3', title: "Where's My Dignity Now" },
  { src: '/audio/good-talk.mp3', title: 'Good Talk' },
]

const FFT_SIZE = 2048
const BEAT_COOLDOWN_MS = 180
const BEAT_THRESHOLD_MULT = 1.4
const FLUX_HISTORY_SIZE = 50

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [songIndex, setSongIndex] = useState(0)
  const [barHeights, setBarHeights] = useState([0.3, 0.3, 0.3, 0.3, 0.3])
  const audiosRef = useRef<HTMLAudioElement[]>([])
  const gainsRef = useRef<GainNode[]>([])
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const freqDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const fluxHistoryRef = useRef<number[]>([])
  const lastBeatRef = useRef(0)
  const playingRef = useRef(false)
  const indexRef = useRef(0)
  const bassRangeRef = useRef({ start: 0, end: 0 })

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
      audio.crossOrigin = 'anonymous'

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

  useEffect(() => {
    let rafId: number
    function tick() {
      if (audiosRef.current.length === 0) {
        rafId = requestAnimationFrame(tick)
        return
      }

      const offset = scrollState.offset || 0
      const newIndex = Math.max(0, Math.min(Math.floor(offset * SONGS.length), SONGS.length - 1))

      if (newIndex !== indexRef.current) {
        indexRef.current = newIndex
        setSongIndex(newIndex)
        if (playingRef.current) {
          audiosRef.current[newIndex]?.play().catch(() => {})
        }
      }

      // Crossfade via GainNodes
      gainsRef.current.forEach((gain, i) => {
        const audio = audiosRef.current[i]
        if (!gain || !audio) return
        const target = (i === indexRef.current && playingRef.current) ? 1 : 0
        gain.gain.value = Math.max(0, Math.min(1, lerp(gain.gain.value, target, 0.06)))
        if (target > 0 && audio.paused && playingRef.current) {
          audio.play().catch(() => {})
        }
        if (gain.gain.value < 0.005 && !audio.paused && target === 0) {
          audio.pause()
          gain.gain.value = 0
        }
      })

      // Beat detection
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

          const now = performance.now()
          if (normalized > threshold && now - lastBeatRef.current > BEAT_COOLDOWN_MS) {
            lastBeatRef.current = now
            scrollState.beatPulse = Math.min(1, (normalized - mean) / (1 - mean + 0.01))
          }
        }
      }

      // Decay beat pulse
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

  useEffect(() => {
    if (!isPlaying) {
      setBarHeights([0.3, 0.3, 0.3, 0.3, 0.3])
      return
    }
    const id = setInterval(() => {
      const pulse = scrollState.beatPulse
      setBarHeights(Array.from({ length: 5 }, () =>
        0.2 + Math.random() * 0.5 + pulse * 0.5
      ))
    }, 120)
    return () => clearInterval(id)
  }, [isPlaying])

  const toggle = useCallback(() => {
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    const next = !playingRef.current
    playingRef.current = next
    scrollState.isPlaying = next
    setIsPlaying(next)
    if (next) {
      const audio = audiosRef.current[indexRef.current]
      gainsRef.current[indexRef.current].gain.value = 1
      audio.play().catch(() => {})
    } else {
      audiosRef.current.forEach(a => a.pause())
    }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      right: 24,
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      width: 100,
    }}>
      <motion.button
        onClick={toggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={isPlaying ? {} : {
          boxShadow: [
            '0 0 0 0 rgba(255,255,255,0.3)',
            '0 0 0 8px rgba(255,255,255,0)',
            '0 0 0 0 rgba(255,255,255,0.3)',
          ],
        }}
        transition={isPlaying ? { type: 'spring', stiffness: 300, damping: 20 } : { duration: 2, repeat: Infinity }}
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.2)',
          background: 'rgba(0,0,0,0.2)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          outline: 'none',
          padding: 0,
        }}
        aria-label={isPlaying ? 'Pause music' : 'Play music'}
      >
        {barHeights.map((h, i) => (
          <motion.div
            key={i}
            animate={{ scaleY: h }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            style={{
              width: 3,
              height: 16,
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: 2,
              transformOrigin: 'center',
            }}
          />
        ))}
      </motion.button>

      <div style={{ height: 44, width: 100, overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.p
            key={songIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 0.7, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3 }}
            style={{
              color: 'white',
              fontSize: 11,
              fontWeight: 500,
              textAlign: 'center',
              width: 100,
              lineHeight: 1.3,
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              margin: 0,
              letterSpacing: '0.02em',
            }}
          >
            {SONGS[songIndex].title}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
