import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { API_BASE } from '../../utils/constants'

// ── 图表类型定义 ──

interface DiagramType {
  key: string
  label: string
  icon: string
  desc: string
  hint: string
  standards: string[]
  detailPoints: { label: string; desc: string; range: string }[]
}

const DIAGRAM_TYPES: DiagramType[] = [
  {
    key: '系统架构', label: '系统架构', icon: '🏗️',
    desc: '六层递进架构图',
    hint: '标准: 分层清晰、箭头衔接',
    standards: ['每层边界清楚无重叠', '层间箭头方向一致', '颜色由底到顶逐渐变暖', '标签可读性良好'],
    detailPoints: [
      { label: '采集层', desc: '多机位视频、高保真音频、戏服扫描、剧本OCR', range: '数据规模: 1TB+/剧目' },
      { label: '特征层', desc: 'MFCC/F0音频特征、MediaPipe 33关节、YOLOv8纹样', range: '特征维度: 13-50维' },
      { label: '关联层', desc: '剧目ID-唱段ID-艺人ID统一映射', range: '关联覆盖率: ≥95%' },
      { label: '存储层', desc: 'MySQL + Neo4j + NAS/OSS混合存储', range: '查询延迟: <100ms' },
      { label: '展示层', desc: 'React 3D Web前端、D3力导向图谱', range: '首屏加载: <2s' },
      { label: '传习层', desc: 'DTW唱腔比对、骨架余弦相似度打分', range: '评分精度: ±5%' },
    ],
  },
  {
    key: '姿态热力图', label: '姿态热力', icon: '🔥',
    desc: '33关节点偏差分布',
    hint: '标准: 红=偏差大, 绿=标准',
    standards: ['全身33个关键点全覆盖', '热力色阶从深绿到深红', '每个点标注偏差数值(mm)', '侧边栏按偏差排序'],
    detailPoints: [
      { label: '右腕', desc: '水袖动作的关键发力点，偏差过大说明手腕僵硬', range: '标准偏差: <20mm' },
      { label: '左肘', desc: '云手亮相时肘部必须保持圆润弧线', range: '标准偏差: <15mm' },
      { label: '颈椎', desc: '身段姿态的中轴线，影响整体平衡感和气质', range: '标准偏差: <10mm' },
      { label: '右膝', desc: '台步蹲起时膝盖角度决定下盘稳定性', range: '标准偏差: <18mm' },
      { label: '左肩', desc: '亮相时双肩必须水平对称', range: '标准偏差: <12mm' },
      { label: '腰脊', desc: '整体重心所在，偏差过大会显得拖沓', range: '标准偏差: <15mm' },
    ],
  },
  {
    key: '声腔频谱', label: '声腔频谱', icon: '🎵',
    desc: 'F0基频曲线 vs 大师',
    hint: '标准: DTW对齐, 偏差<5Hz',
    standards: ['F0基频包络线光滑连续', '与大师模板DTW距离<0.3', '各音高段覆盖完整', '滑音斜率偏差<15%'],
    detailPoints: [
      { label: '低音区', desc: '淮剧唱腔的低音铺垫，需要沉稳有力', range: '80-200Hz, 偏差<3Hz' },
      { label: '中音区', desc: '主要叙事音域，咬字清晰度在此区间最明显', range: '200-500Hz, 偏差<4Hz' },
      { label: '高音区', desc: '淮调标志性高亢段落，需要充足气息支撑', range: '500-1000Hz, 偏差<5Hz' },
      { label: '滑音段', desc: '润腔时音高连续滑动，不能有阶梯跳跃', range: '斜率偏差<15%' },
      { label: '颤音段', desc: '拖腔时的小幅快速音高波动', range: '颤音幅度 3-8Hz' },
      { label: '休止段', desc: '唱句间换气，时长和位置影响节奏感', range: '休止时长 300-800ms' },
    ],
  },
  {
    key: '进度雷达', label: '能力雷达', icon: '🎯',
    desc: '6维传习评估',
    hint: '标准: 六边形越饱满越好',
    standards: ['每个维度有独立基准分', '历史曲线叠加对比', '强弱项用颜色区分', '总分环比趋势箭头'],
    detailPoints: [
      { label: '身段', desc: '骨骼关键点与大师模板的整体余弦相似度', range: '得分率: 72% (中等偏上)' },
      { label: '唱腔', desc: 'F0基频、MFCC特征、滑音颤音综合评分', range: '得分率: 65% (基础过关)' },
      { label: '节奏', desc: '拍点对齐精度、拖腔时长匹配', range: '得分率: 80% (良好)' },
      { label: '表情', desc: '面部关键点活跃度和情绪匹配度', range: '得分率: 55% (需加强)' },
      { label: '记忆力', desc: '连续唱段不中断、不遗忘的比例', range: '得分率: 70% (中等)' },
      { label: '台风', desc: '整体气质、亮相气势、舞台气场', range: '得分率: 60% (有提升空间)' },
    ],
  },
]

// ── 缩放状态 hook ──

function useZoom() {
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const zoom = useCallback((dir: number) => setScale(s => Math.max(0.5, Math.min(5, s + dir * 0.3))), [])
  const reset = useCallback(() => { setScale(1); setPan({ x: 0, y: 0 }) }, [])
  const isPanning = useRef(false)
  const lastPan = useRef({ x: 0, y: 0 })
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isPanning.current = true; lastPan.current = { x: e.clientX, y: e.clientY }
  }, [])
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return
    const dx = e.clientX - lastPan.current.x
    const dy = e.clientY - lastPan.current.y
    setPan(p => ({ x: p.x + dx, y: p.y + dy }))
    lastPan.current = { x: e.clientX, y: e.clientY }
  }, [])
  const onMouseUp = useCallback(() => { isPanning.current = false }, [])
  return { scale, pan, zoom, reset, onMouseDown, onMouseMove, onMouseUp }
}

// ── 主组件 ──

export default function DiagramViewer() {
  const [svgData, setSvgData] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeType, setActiveType] = useState('')
  const [error, setError] = useState('')
  const [viewLevel, setViewLevel] = useState<'overview' | 'full' | 'detail'>('overview')
  const [detailTarget, setDetailTarget] = useState<{ label: string; desc: string; range: string } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { scale, pan, zoom, reset, onMouseDown, onMouseMove, onMouseUp } = useZoom()

  // SVG 注入
  useEffect(() => {
    if (!svgData || !containerRef.current) return
    const el = containerRef.current
    el.innerHTML = svgData
    const svg = el.querySelector('svg')
    if (svg) {
      svg.style.width = '100%'
      svg.style.height = '100%'
      svg.style.display = 'block'
      svg.style.pointerEvents = 'auto'
    }
  }, [svgData])

  const generate = async (type: string) => {
    setActiveType(type)
    setLoading(true)
    setError('')
    setSvgData('')
    try {
      const res = await fetch(`${API_BASE}/diagrams/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data.svg_data || data.svg_data.length < 100) throw new Error('返回的图表数据为空')
      setSvgData(data.svg_data)
      setViewLevel('full')  // 生成后直接进入全屏查看
    } catch (e: any) {
      setError(e.message || '生成失败')
    } finally { setLoading(false) }
  }

  const openDetail = (point: { label: string; desc: string; range: string }) => {
    setDetailTarget(point)
    setViewLevel('detail')
  }

  const backToOverview = () => { setViewLevel('overview'); setSvgData(''); setDetailTarget(null); reset() }
  const backToFull = () => { setViewLevel('full'); setDetailTarget(null); reset() }

  const typeInfo = DIAGRAM_TYPES.find(t => t.key === activeType)

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      {/* === 左侧导航 === */}
      <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ color: '#d4a843', fontSize: 12, fontFamily: 'var(--font-opera)', fontWeight: 'bold' }}>
          {viewLevel === 'overview' ? '图表类型' : `当前: ${typeInfo?.label || ''}`}
        </div>

        {viewLevel === 'overview' ? (
          // Level 1: 概览卡片
          DIAGRAM_TYPES.map(t => (
            <motion.button key={t.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => generate(t.key)}
              style={{
                padding: 12, textAlign: 'left',
                background: 'rgba(26, 18, 16, 0.6)',
                border: '1px solid rgba(212, 168, 67, 0.2)',
                borderRadius: 10, color: '#f5f0e8', cursor: 'pointer',
                fontFamily: 'var(--font-opera)',
              }}>
              <div style={{ fontSize: 20, marginBottom: 2 }}>{t.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 'bold' }}>{t.label}</div>
              <div style={{ fontSize: 11, color: '#8a7a6a', marginTop: 1 }}>{t.desc}</div>
            </motion.button>
          ))
        ) : (
          <>
            {/* Level 2/3: 回退按钮 + 详情列表 */}
            <button onClick={backToOverview}
              style={{
                padding: '8px 12px', background: 'rgba(212,168,67,0.1)',
                border: '1px solid rgba(212,168,67,0.2)', borderRadius: 8,
                color: '#d4a843', cursor: 'pointer', fontSize: 12,
                fontFamily: 'var(--font-opera)', textAlign: 'left', marginBottom: 4,
              }}>
              ← 返回概览
            </button>

            {viewLevel === 'full' && typeInfo && (
              <div style={{ overflow: 'auto', flex: 1 }}>
                <div style={{ color: '#8a7a6a', fontSize: 10, marginBottom: 6 }}>点击细节查看 ▼</div>
                {typeInfo.detailPoints.map(pt => (
                  <button key={pt.label}
                    onClick={() => openDetail(pt)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '8px 10px', marginBottom: 4,
                      background: 'rgba(26,18,16,0.6)',
                      border: '1px solid rgba(212,168,67,0.1)',
                      borderRadius: 6, cursor: 'pointer',
                      color: '#e8dcc8', fontSize: 12, fontFamily: 'var(--font-opera)',
                    }}>
                    <div style={{ color: '#d4a843' }}>{pt.label}</div>
                    <div style={{ color: '#8a7a6a', fontSize: 10 }}>{pt.desc.substring(0, 30)}...</div>
                  </button>
                ))}
              </div>
            )}

            {viewLevel === 'detail' && detailTarget && (
              <button onClick={backToFull}
                style={{
                  padding: '8px 12px', background: 'rgba(196,30,58,0.1)',
                  border: '1px solid rgba(196,30,58,0.2)', borderRadius: 8,
                  color: '#c41e3a', cursor: 'pointer', fontSize: 12,
                  fontFamily: 'var(--font-opera)', textAlign: 'left',
                }}>
                ← 返回图表
              </button>
            )}
          </>
        )}

        {/* 专业标准 */}
        {typeInfo && viewLevel !== 'overview' && (
          <div style={{
            marginTop: 4, padding: 10,
            background: 'rgba(45,139,110,0.08)',
            border: '1px solid rgba(45,139,110,0.2)',
            borderRadius: 8, fontSize: 11, color: '#2d8b6e',
            fontFamily: 'var(--font-opera)', lineHeight: 1.6,
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#d4a843' }}>专业评分标准</div>
            {typeInfo.standards.map((s, i) => (
              <div key={i} style={{ fontSize: 10, paddingLeft: 8 }}>• {s}</div>
            ))}
          </div>
        )}
      </div>

      {/* === 右侧主视图 === */}
      <div style={{
        flex: 1,
        background: 'rgba(13, 10, 8, 0.7)',
        borderRadius: 12,
        border: '1px solid rgba(212, 168, 67, 0.15)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* 缩放控件 */}
        {viewLevel === 'full' && svgData && (
          <div style={{
            position: 'absolute', top: 12, right: 12, zIndex: 10,
            display: 'flex', gap: 4,
          }}>
            {[{ label: '+', dir: 1 }, { label: '−', dir: -1 }, { label: '⟲', dir: 0 }].map(btn => (
              <button key={btn.label}
                onClick={() => btn.dir === 0 ? reset() : zoom(btn.dir)}
                style={{
                  width: 32, height: 32,
                  background: 'rgba(26,18,16,0.9)',
                  border: '1px solid rgba(212,168,67,0.3)',
                  borderRadius: 8, color: '#d4a843', fontSize: 16,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {btn.label}
              </button>
            ))}
            <span style={{
              padding: '4px 8px', color: '#8a7a6a', fontSize: 11,
              display: 'flex', alignItems: 'center',
            }}>
              {Math.round(scale * 100)}%
            </span>
          </div>
        )}

        {/* 内容区 */}
        {loading && (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 12, color: '#8a7a6a',
          }}>
            <motion.div animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: 48 }}>🎭</motion.div>
            正在生成图表...
          </div>
        )}

        {error && !svgData && (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: '#c41e3a', gap: 8,
          }}>
            <div style={{ fontSize: 40 }}>⚠️</div>
            <div>{error}</div>
            <div style={{ fontSize: 11, color: '#8a7a6a' }}>请确认后端运行在 127.0.0.1:8090</div>
          </div>
        )}

        {!loading && !error && !svgData && (
          <div style={{
            width: '100%', height: '100%', display: 'flex',
            flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', color: '#8a7a6a',
            fontFamily: 'var(--font-opera)', gap: 12,
          }}>
            <div style={{ fontSize: 48 }}>📊</div>
            <div style={{ fontSize: 16 }}>选择左侧图表类型开始分析</div>
            <div style={{ fontSize: 12, maxWidth: 300, textAlign: 'center', lineHeight: 1.8 }}>
              每个图表都支持缩放/拖拽查看<br />
              点击左侧细节列表可查看各维度专业分析
            </div>
          </div>
        )}

        {/* Level 2: 全屏图表 */}
        {viewLevel === 'full' && svgData && (
          <div
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            style={{
              width: '100%', height: '100%',
              overflow: 'hidden',
              cursor: scale > 1 ? 'grab' : 'default',
            }}>
            <div
              ref={containerRef}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: 'center center',
                width: '100%', height: '100%',
              }}
            />
          </div>
        )}

        {/* Level 3: 细节分析 */}
        <AnimatePresence>
          {viewLevel === 'detail' && detailTarget && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                width: '100%', height: '100%',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: 40, gap: 16,
              }}>
              <div style={{
                fontSize: 48, marginBottom: 8,
                filter: 'drop-shadow(0 0 16px rgba(212,168,67,0.3))',
              }}>
                {typeInfo?.icon}
              </div>
              <h2 style={{
                color: '#d4a843', fontSize: 26, margin: 0,
                fontFamily: 'var(--font-opera)',
              }}>
                {detailTarget.label}
              </h2>
              <div style={{
                display: 'inline-block',
                padding: '4px 12px',
                background: 'rgba(212,168,67,0.1)',
                border: '1px solid rgba(212,168,67,0.3)',
                borderRadius: 16,
                color: '#d4a843', fontSize: 13,
                fontFamily: 'var(--font-opera)',
              }}>
                {detailTarget.range}
              </div>
              <div style={{
                maxWidth: 480, padding: 20,
                background: 'rgba(26,18,16,0.8)',
                border: '1px solid rgba(212,168,67,0.2)',
                borderRadius: 12,
                color: '#e8dcc8', fontSize: 14, lineHeight: 2,
                fontFamily: 'var(--font-opera)', textAlign: 'center',
              }}>
                {detailTarget.desc}
              </div>
              <div style={{
                display: 'flex', gap: 12,
                color: '#8a7a6a', fontSize: 12,
                fontFamily: 'var(--font-opera)',
              }}>
                <span>状态: 需要关注</span>
                <span style={{ color: '#c41e3a' }}>●</span>
                <span>建议: 重点针对此项加强练习</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
