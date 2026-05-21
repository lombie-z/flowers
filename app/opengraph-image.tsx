import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ROZSA — Good Talk'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 300,
            color: 'white',
            letterSpacing: '0.15em',
            marginBottom: 20,
          }}
        >
          ROZSA
        </div>
        <div
          style={{
            fontSize: 36,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
          }}
        >
          Good Talk
        </div>
        <div
          style={{
            fontSize: 18,
            color: 'rgba(255,255,255,0.25)',
            letterSpacing: '0.2em',
            marginTop: 16,
          }}
        >
          Independent Album
        </div>
      </div>
    ),
    { ...size }
  )
}
