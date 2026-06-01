import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { path: '/studio', label: '传习', icon: '🎭' },
  { path: '/graph', label: '图谱', icon: '🔮' },
  { path: '/scripts', label: '剧本', icon: '📜' },
  { path: '/analysis', label: '分析', icon: '🔬' },
  { path: '/history', label: '记录', icon: '📊' },
  { path: '/diagrams', label: '图表', icon: '📐' },
]

export default function SideNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav style={{
      width: 56,
      height: '100vh',
      background: 'rgba(26, 18, 16, 0.95)',
      borderRight: '1px solid rgba(212, 168, 67, 0.2)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 16,
      gap: 4,
      zIndex: 100,
      backdropFilter: 'blur(10px)',
    }}>
      {/* Logo */}
      <div style={{
        width: 36, height: 36,
        background: 'linear-gradient(135deg, #c41e3a, #d4a843)',
        borderRadius: 8,
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1210',
      }}>
        淮
      </div>

      {NAV_ITEMS.map(item => {
        const active = location.pathname.startsWith(item.path)
        return (
          <motion.button
            key={item.path}
            onClick={() => navigate(item.path)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            role="tab"
            aria-selected={active}
            aria-label={`${item.label} — ${item.path === '/studio' ? '实时传习' : item.path === '/graph' ? '知识图谱' : item.path === '/scripts' ? '剧本浏览' : item.path === '/history' ? '历史记录' : '分析图表'}`}
            style={{
              width: 44, height: 44,
              border: active ? '1px solid rgba(212, 168, 67, 0.4)' : '1px solid transparent',
              borderRadius: 10,
              background: active ? 'rgba(212, 168, 67, 0.12)' : 'transparent',
              color: active ? '#d4a843' : '#8a7a6a',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              lineHeight: 1,
              transition: 'all 0.2s',
              position: 'relative',
            }}
          >
            <span>{item.icon}</span>
            <span style={{ fontSize: 9, marginTop: 1 }}>{item.label}</span>
          </motion.button>
        )
      })}
    </nav>
  )
}
