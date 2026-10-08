import App from '../App'

/**
 * Canonical clinical workspace entry point.
 *
 * App owns the mode-aware consultation workflow so the dashboard does not
 * duplicate the established demo/live integrations.
 */
export default function DoctorDashboard() {
  return <App />
}