import ScriptBrowser from '../components/scripts/ScriptBrowser'

export default function ScriptsPage() {
  return (
    <div style={{ padding: 24, height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{
        fontSize: 28, color: '#d4a843', margin: 0, fontFamily: 'var(--font-opera)',
      }}>
        剧本工坊
      </h1>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ScriptBrowser />
      </div>
    </div>
  )
}
