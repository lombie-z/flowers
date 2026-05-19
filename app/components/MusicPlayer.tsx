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

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [songIndex, setSongIndex] = useState(0)
  const [barHeights, setBarHeights] = useState([0.3, 0.3, 0.3, 0.3, 0.3])
  const audiosRef = useRef<HTMLAudioElement[]>([])
  const playingRef = useRef(false)
  const indexRef = useRef(0)

  useEffect(() => {
    audiosRef.current = SONGS.map(song => {
      const audio = new Audio(song.src)
      audio.loop = true
      audio.preload = 'auto'
      audio.volume = 0
      return audio
    })
    return () => {
      audiosRef.current.forEach(a => {
        a.pause()
        a.src = ''
      })
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

      audiosRef.current.forEach((audio, i) => {
        const target = (i === indexRef.current && playingRef.current) ? 1 : 0
        audio.volume = Math.max(0, Math.min(1, lerp(audio.volume, target, 0.06)))
        if (target > 0 && audio.paused && playingRef.current) {
          audio.play().catch(() => {})
        }
        if (audio.volume < 0.005 && !audio.paused && target === 0) {
          audio.pause()
          audio.volume = 0
        }
      })

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
      setBarHeights(Array.from({ length: 5 }, () => 0.2 + Math.random() * 0.8))
    }, 120)
    return () => clearInterval(id)
  }, [isPlaying])

  const toggle = useCallback(() => {
    const next = !playingRef.current
    playingRef.current = next
    scrollState.isPlaying = next
    setIsPlaying(next)
    if (next) {
      const audio = audiosRef.current[indexRef.current]
      audio.volume = 1
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
