import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface AnalysisItem {
  id: string
  filename: string
  kind: string
  error?: string
  features: Record<string, string>
}

export default function AnalysisPage() {
  const [items, setItems] = useState<AnalysisItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; item: AnalysisItem } | null>(null)
  const [downloading, setDownloading] = useState<Set<string>>(new Set())

  const loadList = async () => {
    try {
      const res = await fetch('/api/import/list')
      const data = await res.json()
      setItems(data.items || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadList() }, [])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === items.length) setSelected(new Set())
    else setSelected(new Set(items.map(it => it.id)))
  }

  const deleteItems = async (ids: string[]) => {
    await Promise.all(ids.map(id => fetch(`/api/import/${id}`, { method: 'DELETE' })))
    setSelected(new Set())
    loadList()
  }

  const downloadItem = async (id: string, filename?: string) => {
    if (downloading.has(id)) return
    setDownloading(prev => { const next = new Set(prev); next.add(id); return next })
    try {
      const res = await fetch(`/api/import/download/${id}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'unknown' }))
        console.error('下载失败:', err)
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = (filename ? filename + '.zip' : `analysis-${id}.zip`)
      document.body.appendChild(a)
      a.click()
      // Delay revoke to let browser start the download
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 1000)
    } catch (e) {
      console.error('下载异常:', e)
    } finally {
      setDownloading(prev => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const downloadAll = async () => {
    const ids = selected.size > 0 ? [...selected] : items.map(it => it.id)
    for (const id of ids) {
      await downloadItem(id)
      await new Promise(r => setTimeout(r, 300))
    }
  }

  const shareItem = async (item: AnalysisItem) => {
    const url = `${window.location.origin}/api/import/download/${item.id}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const input = document.createElement('input'); input.value = url
      document.body.appendChild(input); input.select()
      document.execCommand('copy'); document.body.removeChild(input)
    }
  }

  const handleContextMenu = (e: React.MouseEvent, item: AnalysisItem) => {
    e.preventDefault()
    setCtxMenu({ x: e.clientX, y: e.clientY, item })
  }

  const closeCtxMenu = () => setCtxMenu(null)

  const kindIcon = (k: string) => k === 'audio' ? '🎵' : k === 'video' ? '🎬' : '🖼️'
  const kindLabel = (k: string) => k === 'audio' ? '声腔' : k === 'video' ? '骨架' : '纹样'

  const anySelected = selected.size > 0

  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}
      onClick={closeCtxMenu}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ fontSize: 26, color: '#d4a843', margin: 0, fontFamily: 'var(--font-opera)', flex: 1 }}>🔬 识别分析</h1>
        <span style={{ color: '#8a7a6a', fontSize: 10 }}>右键项目查看更多操作</span>
      </div>

      {/* Upload + Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: 10,
        background: 'rgba(26,18,16,0.4)', borderRadius: 10,
        border: '1px solid rgba(212,168,67,0.12)',
      }}>
        <UploadBtn kind="audio" label="🎵 音频" accept=".wav,.mp3,.flac,.ogg,.m4a" onDone={loadList} />
        <UploadBtn kind="video" label="🎬 视频" accept=".mp4,.avi,.mov,.mkv,.webm" onDone={loadList} />
        <UploadBtn kind="image" label="🖼️ 图像" accept=".jpg,.jpeg,.png,.bmp,.webp" onDone={loadList} />

        <div style={{ width: 1, height: 24, background: 'rgba(212,168,67,0.15)', margin: '0 4px' }} />

        {/* Batch actions */}
        <ToolbarBtn label="☐ 全选" onClick={selectAll}
          active={selected.size === items.length && items.length > 0}
          title="全选 / 取消全选" />
        {anySelected && (
          <>
            <ToolbarBtn label={`📥 下载 (${selected.size})`} onClick={downloadAll} />
            <ToolbarBtn label={`🗑 删除 (${selected.size})`} onClick={() => deleteItems([...selected])}
              color="#c41e3a" />
          </>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ color: '#5a4a3a', fontSize: 9 }}>{items.length} 条记录</span>
      </div>

      {/* List */}
      <div style={{
        flex: 1, overflow: 'auto',
        background: 'rgba(26,18,16,0.3)', borderRadius: 12,
        border: '1px solid rgba(212,168,67,0.1)', padding: 8,
      }}>
        {loading ? (
          <div style={{ color: '#8a7a6a', textAlign: 'center', padding: 50 }}>加载中...</div>
        ) : items.length === 0 ? (
          <div style={{ color: '#8a7a6a', textAlign: 'center', padding: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔬</div>
            <div style={{ fontSize: 15, fontFamily: 'var(--font-opera)' }}>暂无分析记录</div>
            <div style={{ fontSize: 12, marginTop: 8 }}>点击上方按钮导入文件开始分析</div>
          </div>
        ) : (
          items.map((item, i) => {
            const sel = selected.has(item.id)
            const hasError = item.error && item.error !== 'None' && item.error !== ''
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onContextMenu={e => handleContextMenu(e, item)}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '8px 12px', marginBottom: 4,
                  background: sel ? 'rgba(212,168,67,0.08)' : 'rgba(26,18,16,0.3)',
                  border: `1px solid ${sel ? 'rgba(212,168,67,0.3)' : 'rgba(212,168,67,0.06)'}`,
                  borderRadius: 8, gap: 10, cursor: 'pointer',
                  transition: 'background 0.15s, border 0.15s',
                }}>
                {/* Checkbox */}
                <div onClick={e => { e.stopPropagation(); toggleSelect(item.id) }}
                  style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${sel ? '#d4a843' : 'rgba(255,255,255,0.12)'}`,
                    background: sel ? '#d4a843' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#1a1210', fontWeight: 'bold',
                    transition: 'all 0.15s',
                  }}>
                  {sel && '✓'}
                </div>
                {/* Icon */}
                <div style={{ fontSize: 20, minWidth: 30, textAlign: 'center' }}>
                  {kindIcon(item.kind)}
                </div>
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    color: hasError ? '#c41e3a' : '#f5f0e8', fontSize: 13,
                    fontFamily: 'var(--font-opera)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{item.filename}</div>
                  <div style={{ color: '#8a7a6a', fontSize: 9, marginTop: 1 }}>
                    {kindLabel(item.kind)} · 点击复选框多选 · 右键菜单
                  </div>
                </div>
                {/* Error badge */}
                {hasError && (
                  <span style={{
                    padding: '2px 8px', background: 'rgba(196,30,58,0.1)',
                    border: '1px solid rgba(196,30,58,0.2)', borderRadius: 8,
                    color: '#c41e3a', fontSize: 9, whiteSpace: 'nowrap',
                  }}>格式错误</span>
                )}
                {/* Feature chips */}
                {!hasError && Object.entries(item.features || {}).slice(0, 2).map(([k, v]) => (
                  <span key={k} style={{
                    padding: '2px 8px', background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8,
                    color: '#8a7a6a', fontSize: 9, whiteSpace: 'nowrap',
                  }}>
                    {String(v).substring(0, 18)}
                  </span>
                ))}
                {/* Quick download */}
                {downloading.has(item.id) ? (
                  <span style={{
                    padding: '4px 10px', borderRadius: 6,
                    background: 'rgba(212,168,67,0.1)',
                    border: '1px solid rgba(212,168,67,0.3)',
                    color: '#d4a843', fontSize: 11,
                    fontFamily: 'var(--font-opera)', whiteSpace: 'nowrap',
                  }}>⏳</span>
                ) : (
                  <button onClick={e => { e.stopPropagation(); downloadItem(item.id, item.filename.replace(/\.[^.]+$/, '') + '-分析报告') }}
                    style={{
                      padding: '4px 10px', borderRadius: 6,
                      background: 'rgba(45,139,110,0.15)',
                      border: '1px solid rgba(45,139,110,0.35)',
                      color: '#2d8b6e', cursor: 'pointer', fontSize: 11,
                      fontFamily: 'var(--font-opera)', whiteSpace: 'nowrap',
                    }}>
                    📥 ZIP
                  </button>
                )}
              </motion.div>
            )
          })
        )}
      </div>

      {/* Right-click context menu */}
      <AnimatePresence>
        {ctxMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'fixed', left: ctxMenu.x + 4, top: ctxMenu.y + 4, zIndex: 300,
              background: 'rgba(26,18,16,0.97)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(212,168,67,0.3)', borderRadius: 10,
              padding: 6, minWidth: 180, boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            }}>
            <CtxItem icon="📥" label="下载分析报告" onClick={() => { downloadItem(ctxMenu.item.id, ctxMenu.item.filename.replace(/\.[^.]+$/, '') + '-分析报告'); closeCtxMenu() }} />
            <CtxItem icon="📋" label="复制下载链接" onClick={() => { shareItem(ctxMenu.item); closeCtxMenu() }} />
            <CtxItem icon="⬜" label={selected.has(ctxMenu.item.id) ? '取消选择' : '选择此项'}
              onClick={() => { toggleSelect(ctxMenu.item.id); closeCtxMenu() }} />
            <div style={{ height: 1, background: 'rgba(212,168,67,0.1)', margin: '4px 0' }} />
            <CtxItem icon="🗑" label="删除此记录" color="#c41e3a"
              onClick={() => { deleteItems([ctxMenu.item.id]); closeCtxMenu() }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CtxItem({ icon, label, onClick, color = '#e8dcc8' }: { icon: string; label: string; onClick: () => void; color?: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6,
        cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-opera)',
        background: hovered ? 'rgba(212,168,67,0.1)' : 'transparent',
        color,
      }}>
      <span>{icon}</span> {label}
    </div>
  )
}

function ToolbarBtn({ label, onClick, active, title, color }: {
  label: string; onClick: () => void; active?: boolean; title?: string; color?: string
}) {
  return (
    <button onClick={onClick} title={title} style={{
      padding: '5px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
      fontFamily: 'var(--font-opera)', border: 'none',
      background: active ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.03)',
      color: color || (active ? '#d4a843' : '#8a7a6a'),
    }}>{label}</button>
  )
}

function UploadBtn({ kind, label, accept, onDone }: { kind: string; label: string; accept: string; onDone: () => void }) {
  const [uploading, setUploading] = useState(false)

  const upload = async (file: File) => {
    setUploading(true)
    try {
      const form = new FormData(); form.append('file', file)
      await fetch(`/api/import/${kind}`, { method: 'POST', body: form })
      onDone()
    } catch (e) { console.error(e) }
    finally { setUploading(false) }
  }

  return (
    <label style={{
      padding: '5px 12px', cursor: uploading ? 'wait' : 'pointer',
      background: uploading ? 'rgba(212,168,67,0.1)' : 'rgba(255,255,255,0.03)',
      border: `1px solid ${uploading ? 'rgba(212,168,67,0.3)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 7, color: uploading ? '#d4a843' : '#8a7a6a',
      fontSize: 12, fontFamily: 'var(--font-opera)',
      opacity: uploading ? 0.7 : 1,
    }}>
      {uploading ? '⏳' : label}
      <input type="file" hidden accept={accept} disabled={uploading}
        onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }} />
    </label>
  )
}
