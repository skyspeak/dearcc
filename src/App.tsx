import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { DataProvider } from './data/DataContext'
import { PlanProvider } from './data/PlanContext'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { ResultsPage } from './pages/ResultsPage'
import { MapPage } from './pages/MapPage'
import { PlanConnectPage } from './pages/PlanConnectPage'
import { PlanBuildingPage } from './pages/PlanBuildingPage'
import { PlanAnalysisPage } from './pages/PlanAnalysisPage'
import { PlanRoadmapPage } from './pages/PlanRoadmapPage'
import { PlanWaitlistPage } from './pages/PlanWaitlistPage'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <DataProvider>
      <PlanProvider>
        <BrowserRouter basename={basename}>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/results/:cipCode" element={<ResultsPage />} />
              <Route path="/map/:socCode" element={<MapPage />} />

              <Route path="/v2" element={<HomePage aiMode="eloundou" />} />
              <Route
                path="/v2/results/:cipCode"
                element={<ResultsPage aiMode="eloundou" />}
              />
              <Route path="/v2/map/:socCode" element={<MapPage aiMode="eloundou" />} />

              <Route path="/plan" element={<PlanConnectPage />} />
              <Route path="/plan/building" element={<PlanBuildingPage />} />
              <Route path="/plan/analysis" element={<PlanAnalysisPage />} />
              <Route path="/plan/roadmap" element={<PlanRoadmapPage />} />
              <Route path="/plan/waitlist" element={<PlanWaitlistPage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </PlanProvider>
    </DataProvider>
  )
}
