'use client'

import { useEffect, useState } from 'react'

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Detectar si ya está instalada
    const isStandAlone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    setIsStandalone(isStandAlone)

    if (isStandAlone) return;

    // Detectar iOS
    const ua = window.navigator.userAgent
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Capturar el evento de instalación nativa (Android / Desktop Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
      }
    }
  }

  if (isStandalone) return null
  if (!deferredPrompt && !isIOS) return null

  return (
    <div className="install-banner">
      <div className="install-content">
        <div className="install-icon">📱</div>
        <div className="install-text">
          <strong>Instala el ERP en tu teléfono</strong>
          <p>Para un acceso rápido como una App Nativa.</p>
        </div>
      </div>
      
      {isIOS ? (
        <div className="ios-instructions">
          Toca el ícono de <strong>Compartir</strong> en Safari y luego selecciona <strong>"Agregar a inicio"</strong>.
        </div>
      ) : (
        <button className="btn-install" onClick={handleInstallClick}>
          Instalar App
        </button>
      )}

      <style>{`
        .install-banner {
          background: rgba(212, 255, 0, 0.1);
          border: 1px solid rgba(212, 255, 0, 0.2);
          padding: 1rem;
          border-radius: 12px;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          animation: slideDown 0.5s ease-out;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .install-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .install-icon { font-size: 2rem; }
        .install-text strong { color: white; display: block; margin-bottom: 0.2rem; font-size: 1.1rem; }
        .install-text p { color: rgba(255, 255, 255, 0.7); margin: 0; font-size: 0.9rem; }
        .btn-install { background: var(--brand-primary); color: black; font-weight: 800; border: none; padding: 0.8rem; border-radius: 6px; cursor: pointer; text-transform: uppercase; }
        .ios-instructions { background: rgba(0,0,0,0.5); padding: 1rem; border-radius: 6px; color: white; font-size: 0.9rem; border: 1px dashed rgba(255,255,255,0.2); }
      `}</style>
    </div>
  )
}
