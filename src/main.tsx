import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/jetbrains-mono'
import './styles/base.css'
import './styles/site.css'
import './styles/app.css'
import { SettingsProvider } from './lib/store'
import Landing from './pages/Landing'
import Download from './pages/Download'
import Harness from './pages/Harness'
import Settings from './pages/Settings'
import Onboarding from './pages/Onboarding'

function Root() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/download" element={<Download />} />
          <Route path="/app" element={<Harness />} />
          <Route path="/setup" element={<Onboarding />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Landing />} />
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
