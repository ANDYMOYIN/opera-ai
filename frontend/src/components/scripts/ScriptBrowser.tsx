import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScriptStore } from '../../store'
import { API_BASE } from '../../utils/constants'

export default function ScriptBrowser() {
  const { tiers, selectedCategory, selectedPlay, selectedAct, scriptDetail, loading, loadTiers, selectCategory, selectPlay, selectAct, loadDetail } = useScriptStore()
  const [expandedCat, setExpandedCat] = useState('')
  const [sceneData, setSceneData] = useState<any>(null)
  const [sceneLoading, setSceneLoading] = useState(false)

  useEffect(() => { loadTiers() }, [loadTiers])

  useEffect(() => {
    if (selectedAct) {
      setSceneLoading(true)
      fetch(`${API_BASE}/scripts/scene/${selectedAct}`)
        .then(r => r.json())
        .then(d => { setSceneData(d); setSceneLoading(false) })
        .catch(() => setSceneLoading(false))
    } else {
      setSceneData(null)
    }
  }, [selectedAct])

  const cat = tiers.find(t => t.id === expandedCat)

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      {/* Tier 1 */}
      <div style={{ width: 160, background: 'rgba(26, 18, 16, 0.6)', borderRadius: 12, border: '1px solid rgba(212, 168, 67, 0.15)', padding: 12, overflow: 'auto' }}>
        <div style={{ color: '#8a7a6a', fontSize: 11, marginBottom: 8 }}>第一层·剧种</div>
        {tiers.map(t => (
          <div key={t.id} onClick={() => { setExpandedCat(t.id); selectCategory(t.id) }}
            style={{ padding: '8px 12px', marginBottom: 4, background: expandedCat === t.id ? 'rgba(212, 168, 67, 0.12)' : 'transparent', border: expandedCat === t.id ? '1px solid rgba(212, 168, 67, 0.4)' : '1px solid transparent', borderRadius: 8, color: expandedCat === t.id ? '#d4a843' : '#e8dcc8', fontSize: 14, cursor: 'pointer', fontFamily: 'var(--font-opera)', transition: 'all 0.2s' }}>
            {t.name}
          </div>
        ))}
      </div>

      {/* Tier 2 */}
      <AnimatePresence>
        {cat && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            style={{ width: 180, background: 'rgba(26, 18, 16, 0.6)', borderRadius: 12, border: '1px solid rgba(212, 168, 67, 0.15)', padding: 12, overflow: 'auto' }}>
            <div style={{ color: '#8a7a6a', fontSize: 11, marginBottom: 8 }}>第二层·剧目</div>
            {cat.children?.map(play => (
              <div key={play.id}>
                <div onClick={() => { selectPlay(play.id); loadDetail(play.id) }}
                  style={{ padding: '8px 12px', marginBottom: 4, background: selectedPlay === play.id ? 'rgba(196, 30, 58, 0.1)' : 'transparent', border: selectedPlay === play.id ? '1px solid rgba(196, 30, 58, 0.35)' : '1px solid transparent', borderRadius: 8, color: selectedPlay === play.id ? '#f5f0e8' : '#8a7a6a', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-opera)', transition: 'all 0.2s' }}>
                  {play.name}
                </div>
                {selectedPlay === play.id && play.children?.length > 0 && (
                  <div style={{ paddingLeft: 16, marginBottom: 8 }}>
                    <div style={{ color: '#8a7a6a', fontSize: 10, marginBottom: 4 }}>第三层·场次</div>
                    {play.children.map(act => (
                      <div key={act.id} onClick={() => selectAct(act.id)}
                        style={{ padding: '4px 8px', marginBottom: 2, background: selectedAct === act.id ? 'rgba(196, 30, 58, 0.1)' : 'transparent', borderRadius: 4, color: selectedAct === act.id ? '#c41e3a' : '#8a7a6a', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-opera)' }}>
                        {act.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Panel */}
      <div style={{ flex: 1, background: 'rgba(26, 18, 16, 0.6)', borderRadius: 12, border: '1px solid rgba(212, 168, 67, 0.15)', padding: 20, overflow: 'auto' }}>
        {loading || sceneLoading ? (
          <div style={{ color: '#8a7a6a' }}>加载中...</div>
        ) : sceneData?.found ? (
          <SceneContentPanel data={sceneData} />
        ) : scriptDetail ? (
          <ScriptDetailPanel detail={scriptDetail} />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a7a6a', fontSize: 16, fontFamily: 'var(--font-opera)', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📜</div>
              选择剧种 → 剧目 → 场次<br />
              <span style={{ fontSize: 12 }}>选中场次后可查看完整唱词与参考资源</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ScriptDetailPanel({ detail }: { detail: any }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 600 }}>
      <h2 style={{ color: '#d4a843', fontSize: 24, fontFamily: 'var(--font-opera)', marginBottom: 8 }}>{detail.name}</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Tag label={detail.category} color="#c41e3a" />
        <Tag label={`难度: ${detail.difficulty || '中级'}`} color="#d4a843" />
        <Tag label={detail.era || '未知'} color="#2d8b6e" />
      </div>
      <p style={{ color: '#e8dcc8', fontSize: 14, lineHeight: 1.8, marginBottom: 16 }}>{detail.description}</p>
      {detail.characters?.length > 0 && <Section title="角色人物">{detail.characters.map((c: string) => <Tag key={c} label={c} color="#e74c3c" />)}</Section>}
      {detail.vocal_styles?.length > 0 && <Section title="唱腔风格">{detail.vocal_styles.map((v: string) => <Tag key={v} label={v} color="#2d8b6e" />)}</Section>}
      {detail.movements?.length > 0 && <Section title="身段动作">{detail.movements.map((m: string) => <Tag key={m} label={m} color="#f39c12" />)}</Section>}
      {detail.instruments?.length > 0 && <Section title="伴奏乐器">{detail.instruments.map((i: string) => <Tag key={i} label={i} color="#9b59b6" />)}</Section>}
    </motion.div>
  )
}

function SceneContentPanel({ data }: { data: any }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: 700 }}>
      <h2 style={{ color: '#d4a843', fontSize: 22, fontFamily: 'var(--font-opera)', marginBottom: 4 }}>{data.name}</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Tag label={`约 ${data.duration_min} 分钟`} color="#2d8b6e" />
        {(data.key_vocals || []).map((v: string) => <Tag key={v} label={v} color="#d4a843" />)}
        {(data.key_movements || []).map((m: string) => <Tag key={m} label={m} color="#f39c12" />)}
      </div>
      <div style={{ background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.15)', borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <div style={{ color: '#8a7a6a', fontSize: 11, marginBottom: 4 }}>剧情概要</div>
        <div style={{ color: '#e8dcc8', fontSize: 13, lineHeight: 1.7 }}>{data.summary}</div>
      </div>
      <div style={{ background: 'rgba(26,18,16,0.8)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div style={{ color: '#d4a843', fontSize: 11, marginBottom: 8 }}>唱词脚本</div>
        <pre style={{ color: '#f5f0e8', fontSize: 13, lineHeight: 2, fontFamily: 'var(--font-opera)', whiteSpace: 'pre-wrap', margin: 0 }}>{data.lyrics}</pre>
      </div>
      {data.references?.length > 0 && (
        <div>
          <div style={{ color: '#8a7a6a', fontSize: 11, marginBottom: 6 }}>参考资源</div>
          {data.references.map((ref: any, i: number) => (
            <a key={i} href={ref.url} target="_blank" rel="noopener"
              style={{ display: 'block', padding: '6px 10px', marginBottom: 4, color: '#d4a843', fontSize: 12, fontFamily: 'var(--font-opera)', textDecoration: 'none', background: 'rgba(212,168,67,0.05)', borderRadius: 4, border: '1px solid rgba(212,168,67,0.1)' }}>
              {ref.title}
            </a>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function Tag({ label, color }: { label: string; color: string }) {
  return <span style={{ display: 'inline-block', padding: '3px 10px', background: `${color}20`, border: `1px solid ${color}40`, borderRadius: 12, color, fontSize: 12, fontFamily: 'var(--font-opera)', marginRight: 6, marginBottom: 4 }}>{label}</span>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ color: '#8a7a6a', fontSize: 12, marginBottom: 6 }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>{children}</div>
    </div>
  )
}
