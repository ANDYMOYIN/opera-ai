import { useState, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import GraphNode3D from './GraphNode3D'
import GraphEdge3D from './GraphEdge3D'
import { useGraphStore } from '../../store'
import { CATEGORY_COLORS } from '../../utils/constants'

function GraphScene() {
  const { nodes, edges, selectedNode, selectNode } = useGraphStore()

  const positions = useMemo(() => {
    const map = new Map<string, [number, number, number]>()
    if (nodes.length === 0) return map
    const radius = 4
    nodes.forEach((n, i) => {
      const phi = Math.acos(-1 + (2 * i) / (nodes.length + 1))
      const theta = Math.sqrt(nodes.length * Math.PI) * phi
      map.set(n.id, [
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi),
      ])
    })
    return map
  }, [nodes])

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.6} color="#d4a843" />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#c41e3a" />
      {edges.map((e, i) => {
        const sp = positions.get(e.source)
        const tp = positions.get(e.target)
        if (!sp || !tp) return null
        return <GraphEdge3D key={`e-${i}`} start={sp} end={tp} label={e.label} />
      })}
      {nodes.map(n => {
        const p = positions.get(n.id)
        if (!p) return null
        return (
          <GraphNode3D
            key={n.id} id={n.id} name={n.name} category={n.category}
            position={p} onSelect={selectNode} isSelected={selectedNode === n.id}
          />
        )
      })}
      <OrbitControls enableDamping dampingFactor={0.1} />
    </>
  )
}

// ── 山水画卷详情面板 ──

function ScrollDetailPanel({ node, onClose }: { node: any; onClose: () => void }) {
  const { nodes, edges } = useGraphStore()

  // 找出该节点的所有关系
  const relatedEdges = edges.filter(e => e.source === node.id || e.target === node.id)
  const relatedNodeIds = new Set<string>()
  relatedEdges.forEach(e => { relatedNodeIds.add(e.source); relatedNodeIds.add(e.target) })
  relatedNodeIds.delete(node.id)
  const relatedNodes = nodes.filter(n => relatedNodeIds.has(n.id))

  const nodeColor = CATEGORY_COLORS[node.category] || '#d4a843'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        background: 'rgba(13,10,8,0.92)',
        backdropFilter: 'blur(16px)',
        overflow: 'auto',
        padding: 40,
        display: 'flex', justifyContent: 'center',
      }}
    >
      <div style={{ maxWidth: 680, width: '100%' }} onPointerDown={e => e.stopPropagation()}>
        {/* 关闭按钮 — 固定右上角，不受内容流影响 */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 20, right: 20,
          width: 40, height: 40, zIndex: 100,
          background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.3)',
          borderRadius: '50%', color: '#d4a843', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>✕</button>

        {/* 标题 — 水墨画风格 */}
        <div style={{
          textAlign: 'center', padding: '24px 0 32px',
          background: 'linear-gradient(180deg, rgba(212,168,67,0.06) 0%, transparent 100%)',
          borderRadius: 12, marginBottom: 24,
          position: 'relative',
        }}>
          {/* 装饰性印章 */}
          <div style={{
            position: 'absolute', top: 8, right: 60,
            width: 48, height: 48,
            border: '2px solid rgba(196,30,58,0.5)',
            borderRadius: 4, transform: 'rotate(8deg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#c41e3a', fontSize: 20, fontWeight: 'bold',
            fontFamily: 'var(--font-opera)',
          }}>曲</div>
          <h2 style={{
            color: nodeColor, fontSize: 36, margin: 0,
            fontFamily: 'var(--font-opera)',
            letterSpacing: '0.15em',
            textShadow: `0 0 40px ${nodeColor}40`,
          }}>
            {node.name}
          </h2>
          <div style={{ color: '#8a7a6a', fontSize: 13, marginTop: 4 }}>
            〔{node.category}〕
          </div>
          {/* 水平装饰线 */}
          <div style={{
            width: 120, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.5), transparent)',
            margin: '12px auto 0',
          }} />
        </div>

        {/* 属性 — 水墨卷轴风格 */}
        {Object.keys(node.properties).length > 0 && (
          <div style={{
            padding: 20, marginBottom: 24,
            background: 'linear-gradient(135deg, rgba(26,18,16,0.8) 0%, rgba(26,18,16,0.4) 100%)',
            borderLeft: '3px solid rgba(212,168,67,0.2)',
            borderRadius: '0 8px 8px 0',
          }}>
            <div style={{
              color: '#8a7a6a', fontSize: 10, letterSpacing: '0.2em',
              marginBottom: 12, textTransform: 'uppercase',
            }}>▼ 艺谱</div>
            {Object.entries(node.properties).map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', marginBottom: 8, gap: 12,
                borderBottom: '1px dotted rgba(212,168,67,0.08)',
                paddingBottom: 6,
              }}>
                <span style={{
                  color: '#8a7a6a', fontSize: 12, minWidth: 60,
                  fontFamily: 'var(--font-opera)',
                }}>{k}</span>
                <span style={{ color: '#e8dcc8', fontSize: 13, fontFamily: 'var(--font-opera)' }}>
                  {String(v)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 关联节点 — 山水画式排列 */}
        {relatedNodes.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{
              color: '#8a7a6a', fontSize: 10, letterSpacing: '0.2em',
              marginBottom: 16, textTransform: 'uppercase',
            }}>▼ 艺缘 · {relatedNodes.length} 条脉络</div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 12,
            }}>
              {relatedNodes.map(rn => {
                const rnEdge = relatedEdges.find(e =>
                  (e.source === node.id && e.target === rn.id) ||
                  (e.target === node.id && e.source === rn.id)
                )
                const relationLabel = rnEdge?.label || '关联'
                const dir = rnEdge?.source === node.id ? '→' : '←'
                return (
                  <motion.div
                    key={rn.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    style={{
                      padding: 14,
                      background: 'linear-gradient(135deg, rgba(26,18,16,0.7), rgba(26,18,16,0.3))',
                      border: '1px solid rgba(212,168,67,0.12)',
                      borderRadius: 10,
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                    {/* 关系箭头装饰 */}
                    <div style={{
                      position: 'absolute', top: 8, right: 12,
                      color: CATEGORY_COLORS[rn.category] || '#8a7a6a',
                      fontSize: 11, opacity: 0.6,
                    }}>{dir}</div>
                    <div style={{
                      color: CATEGORY_COLORS[rn.category] || '#d4a843',
                      fontSize: 15, fontWeight: 'bold',
                      fontFamily: 'var(--font-opera)', marginBottom: 4,
                    }}>{rn.name}</div>
                    <div style={{
                      display: 'inline-block', padding: '2px 8px',
                      background: 'rgba(212,168,67,0.08)',
                      borderRadius: 10, color: '#8a7a6a', fontSize: 10,
                      fontFamily: 'var(--font-opera)',
                    }}>{relationLabel}</div>
                    <div style={{
                      color: '#8a7a6a', fontSize: 10, marginTop: 4,
                      fontFamily: 'var(--font-opera)',
                    }}>〔{rn.category}〕</div>
                    {Object.entries(rn.properties).slice(0, 2).map(([k, v]) => (
                      <div key={k} style={{ color: '#9a8a7a', fontSize: 9, lineHeight: 1.5, fontFamily: 'var(--font-opera)' }}>
                        {k}: {String(v).substring(0, 30)}
                      </div>
                    ))}
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* 装饰落款 */}
        <div style={{
          textAlign: 'right', padding: '16px 0',
          color: '#5a4a3a', fontSize: 11,
          fontFamily: 'var(--font-opera)',
          borderTop: '1px solid rgba(212,168,67,0.06)',
        }}>
          戏曲多模态知识图谱 · 淮剧
          <br />
          {new Date().toLocaleDateString('zh-CN')}
        </div>
      </div>
    </motion.div>
  )
}

// ── 主组件 ──

export default function KnowledgeGraph3D() {
  const { nodes, edges, selectedNode, selectNode, searchNodes } = useGraphStore()
  const [search, setSearch] = useState('')

  const selected = nodes.find(n => n.id === selectedNode)
  const detailOpen = !!selected

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* 画卷打开时隐藏全景图，防止 Canvas Html 标签穿透 */}
      {!detailOpen && (
        <>
          <div style={{ width: '100%', height: '100%' }}>
            <Canvas camera={{ position: [0, 0, 8], fov: 55 }} gl={{ antialias: true, alpha: true }}>
              <color attach="background" args={['#0d0a08']} />
              <GraphScene />
            </Canvas>
          </div>

          <div style={{
            position: 'absolute', top: 16, left: 16, right: 16,
            display: 'flex', gap: 8, alignItems: 'center',
          }}>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchNodes(search)}
              placeholder="搜索节点..." aria-label="搜索知识图谱节点"
              style={{
                padding: '6px 12px', background: 'rgba(26, 18, 16, 0.8)',
                border: '1px solid rgba(212, 168, 67, 0.3)', borderRadius: 8,
                color: '#f5f0e8', fontSize: 13, fontFamily: 'var(--font-opera)',
                width: 200, outline: 'none',
              }}
            />
            <button onClick={() => searchNodes(search)} style={{
              padding: '6px 12px', background: 'rgba(212, 168, 67, 0.15)',
              border: '1px solid rgba(212, 168, 67, 0.3)', borderRadius: 8,
              color: '#d4a843', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-opera)',
            }}>搜索</button>
            <div style={{ flex: 1 }} />
            <span style={{ color: '#8a7a6a', fontSize: 12 }}>{nodes.length} 节点 · {edges.length} 关系</span>
          </div>
        </>
      )}

      {/* 山水画卷详情 — 点节点直接打开 */}
      <AnimatePresence>
        {selected && (
          <ScrollDetailPanel node={selected} onClose={() => selectNode(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
