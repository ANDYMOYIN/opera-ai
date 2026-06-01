import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import StudioPage from './routes/StudioPage'
import GraphPage from './routes/GraphPage'
import ScriptsPage from './routes/ScriptsPage'
import AnalysisPage from './routes/AnalysisPage'
import HistoryPage from './routes/HistoryPage'
import DiagramsPage from './routes/DiagramsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/studio" replace />} />
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/graph" element={<GraphPage />} />
          <Route path="/scripts/*" element={<ScriptsPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/diagrams" element={<DiagramsPage />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
