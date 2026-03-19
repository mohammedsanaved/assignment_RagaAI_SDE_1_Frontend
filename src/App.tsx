import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetails from './pages/PatientDetails';
import Analytics from './pages/Analytics';
import { useAuthStore } from './app/store/authStore';
import { initPatientListener } from './app/store/patientStore';
import { initActivityListener } from './app/store/activityStore';
import { useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { app } from './services/firebase';

export default function App() {
  const { user, isAuthReady } = useAuthStore();

  useEffect(() => {
    let unsubscribePatients: (() => void) | undefined;
    let unsubscribeActivities: (() => void) | undefined;
    
    if (user) {
      unsubscribePatients = initPatientListener();
      unsubscribeActivities = initActivityListener();
    }
    
    return () => {
      if (unsubscribePatients) unsubscribePatients();
      if (unsubscribeActivities) unsubscribeActivities();
    };
  }, [user]);

  if (!isAuthReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Initializing HealSync...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/patients/:id" element={<PatientDetails />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
