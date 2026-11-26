import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import Header from './components/Header.jsx'
import HeroSection from './components/HeroSection.jsx'
import ProblemSection from './components/ProblemSection.jsx'
import HowWeHelp from './components/HowWeHelp.jsx'
import ImpactSection from './components/ImpactSection.jsx'
import ProcessSection from './components/ProcessSection.jsx'
import ParticipateSection from './components/ParticipateSection.jsx'
import FaqSection from './components/FaqSection.jsx'
import InstagramSection from './components/InstagramSection.jsx'
import SiteFooter from './components/SiteFooter.jsx'
import {
  LoginPage,
  RegistrationPage,
  RegistrationSelectionPage,
} from './components/PublicAccessPages.jsx'
import PublicarLotePage from './components/PublicarLotePage.jsx'
import ComedorDashboardPage from './components/ComedorDashboardPage.jsx'
import LogisticaDashboardPage from './components/LogisticaDashboardPage.jsx'
import AdminDashboardPage from './components/AdminDashboardPage.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { useAuth } from './context/useAuth.js'
import './styles/site.css'
import './styles/access.css'
import './styles/landing.css'
import './styles/auth-dialog.css'
import './styles/prototype.css'
import './styles/responsive.css'

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

function ProtectedRoute({ role, children }) {
  const { session, routesByRole } = useAuth()
  const location = useLocation()

  if (!session) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }
  if (role && session.role !== role) {
    return <Navigate replace to={routesByRole[session.role]} />
  }
  return children
}

function AppLayout() {
  const navigate = useNavigate()
  const { session, logout } = useAuth()

  function cerrarSesion() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <>
      <Header
        sesionActiva={Boolean(session)}
        onAuth={(mode) => navigate(mode === 'login' ? '/login' : '/registro')}
        onLogout={cerrarSesion}
      />
      <Routes>
        <Route element={<LandingPage />} path="/" />
        <Route element={<LoginPage />} path="/login" />
        <Route element={<RegistrationSelectionPage />} path="/registro" />
        <Route element={<RegistrationPage />} path="/registro/:role" />
        <Route
          element={
            <ProtectedRoute role="DONANTE">
              <PublicarLotePage />
            </ProtectedRoute>
          }
          path="/donante/publicar-lote"
        />
        <Route
          element={
            <ProtectedRoute role="COMEDOR">
              <ComedorDashboardPage />
            </ProtectedRoute>
          }
          path="/comedor/dashboard"
        />
        <Route
          element={
            <ProtectedRoute role="COMEDOR">
              <ComedorDashboardPage />
            </ProtectedRoute>
          }
          path="/comedor/lote/:id"
        />
        <Route
          element={
            <ProtectedRoute role="DRIVER">
              <LogisticaDashboardPage />
            </ProtectedRoute>
          }
          path="/logistica/dashboard"
        />
        <Route
          element={
            <ProtectedRoute role="ADMIN">
              <AdminDashboardPage />
            </ProtectedRoute>
          }
          path="/admin/usuarios"
        />
        <Route element={<NotFoundPage />} path="*" />
      </Routes>
      <SiteFooter onJoin={() => navigate('/registro')} />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
