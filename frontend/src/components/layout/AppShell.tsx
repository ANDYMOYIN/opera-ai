import { type ReactNode } from 'react'
import SideNav from './SideNav'
import Background from './Background'

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '56px 1fr',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <Background />
      <SideNav />
      <main style={{
        position: 'relative',
        zIndex: 1,
        overflow: 'auto',
        height: '100vh',
      }}>
        {children}
      </main>
    </div>
  )
}
