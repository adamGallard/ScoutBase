import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ParentSessionProvider } from '@/helpers/SessionContext';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <ParentSessionProvider>
            <App />
        </ParentSessionProvider>
    </StrictMode>,
)
