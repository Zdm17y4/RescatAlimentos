import { BrowserRouter, Link, Route, Routes, useNavigate } from 'react-router-dom'
import Header from './components/Header.jsx'
import HeroSection from './components/HeroSection.jsx'
import ProblemSection from './components/ProblemSection.jsx'
import HowWeHelp from './components/HowWeHelp.jsx'
import ImpactSection from './components/ImpactSection.jsx'
import ProcessSection from './components/ProcessSection.jsx'
import ParticipateSection from './components/ParticipateSection.jsx'
import PlatformViewsSection from './components/PlatformViewsSection.jsx'
import FaqSection from './components/FaqSection.jsx'
import InstagramSection from './components/InstagramSection.jsx'
import SiteFooter from './components/SiteFooter.jsx'
import {
  LoginPage,
  RegistrationPage,
  RegistrationSelectionPage,
} from './components/PublicAccessPages.jsx'
import './App.css'

function LandingPage() {
  const navigate = useNavigate()

  return (
    <main>
      <HeroSection onJoin={() => navigate('/registro')} />
      <ProblemSection />
      <HowWeHelp onJoin={() => navigate('/registro')} />
      <ProcessSection />
      <ImpactSection />
      <ParticipateSection />
      <PlatformViewsSection />
      <FaqSection />
      <InstagramSection />
    </main>
  )
}

function NotFoundPage() {
  return (
    <main className="access-page section-padding">
      <section className="login-panel">
        <p className="eyebrow">Página no encontrada</p>
        <h1>Esta ruta aún no está disponible</h1>
        <p>Vuelve al inicio para conocer RescatAlimentos.</p>
        <Link className="button button-primary" to="/">
          Volver al inicio
        </Link>
      </section>
    </main>
  )
}

function AppLayout() {
  const navigate = useNavigate()

  return (
    <>
      <Header
        onAuth={(mode) => navigate(mode === 'login' ? '/login' : '/registro')}
      />
      <Routes>
        <Route element={<LandingPage />} path="/" />
        <Route element={<LoginPage />} path="/login" />
        <Route element={<RegistrationSelectionPage />} path="/registro" />
        <Route element={<RegistrationPage />} path="/registro/:role" />
        <Route element={<NotFoundPage />} path="*" />
      </Routes>
      <SiteFooter onJoin={() => navigate('/registro')} />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App
