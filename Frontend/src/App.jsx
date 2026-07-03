import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import Login from './pages/Login'
import Signup from './pages/Signup'
import StudentDashboard from './pages/StudentDashboard'
import InternshipRegistration from './pages/InternshipRegistration'
import ReportUpload from './pages/ReportUpload'
import ViewReports from './pages/ViewReports'
import SupervisorDashboard from './pages/SupervisorDashboard'
import ReportReview from './pages/ReportReview'
import SupervisorReports from './pages/SupervisorReports'
import InternAppraisal from './pages/InternAppraisal'
import AdminDashboard from './pages/AdminDashboard'
import Profile from './pages/Profile'
import Feedback from './pages/Feedback'
import AdminStudents from './pages/AdminStudents'
import AdminReports from './pages/AdminReports'
import Layout from './components/Layout'

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function RoleRedirect() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'supervisor') return <Navigate to="/supervisor" replace />
  if (user.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout><Profile /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/" element={<RoleRedirect />} />

          {/* Student routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['student']}>
              <Layout><StudentDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/internship/register" element={
            <ProtectedRoute roles={['student']}>
              <Layout><InternshipRegistration /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/reports/upload" element={
            <ProtectedRoute roles={['student']}>
              <Layout><ReportUpload /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute roles={['student']}>
              <Layout><ReportUpload /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute roles={['student']}>
              <Layout><ViewReports /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/feedback" element={
            <ProtectedRoute roles={['student']}>
              <Layout><Feedback /></Layout>
            </ProtectedRoute>
          } />

          {/* Supervisor routes */}
          <Route path="/supervisor" element={
            <ProtectedRoute roles={['supervisor']}>
              <Layout><SupervisorDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/supervisor/reports" element={
            <ProtectedRoute roles={['supervisor']}>
              <Layout><SupervisorReports /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/supervisor/review/:id" element={
            <ProtectedRoute roles={['supervisor']}>
              <Layout fullWidth><ReportReview /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/supervisor/appraisal" element={
            <ProtectedRoute roles={['supervisor']}>
              <Layout><InternAppraisal /></Layout>
            </ProtectedRoute>
          } />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/students" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><AdminStudents /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute roles={['admin']}>
              <Layout><AdminReports /></Layout>
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
