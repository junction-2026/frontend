import { createRoot } from 'react-dom/client'
import App from './App'

// No StrictMode: its dev-only double effect would send the health check twice.
createRoot(document.getElementById('root')!).render(<App />)
