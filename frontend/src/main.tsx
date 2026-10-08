import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import DoctorDashboard from './pages/DoctorDashboard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DoctorDashboard />
  </StrictMode>,
)
