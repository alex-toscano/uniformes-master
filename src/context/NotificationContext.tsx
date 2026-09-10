'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  title?: string
  duration?: number
}

export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'primary'
}

export interface PromptOptions {
  title: string
  message: string
  defaultValue?: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
  inputType?: string
}

interface NotificationContextType {
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void
  showConfirm: (options: ConfirmOptions) => Promise<boolean>
  showPrompt: (options: PromptOptions) => Promise<string | null>
}

const NotificationContext = createContext<NotificationContextType | null>(null)

// Singleton handlers for static usage
let globalShowToast: ((message: string, type?: ToastType, title?: string, duration?: number) => void) | null = null
let globalShowConfirm: ((options: ConfirmOptions) => Promise<boolean>) | null = null
let globalShowPrompt: ((options: PromptOptions) => Promise<string | null>) | null = null

export const toast = {
  success: (message: string, title?: string, duration?: number) => {
    if (globalShowToast) globalShowToast(message, 'success', title, duration)
    else console.log('[Toast Success]:', message)
  },
  error: (message: string, title?: string, duration?: number) => {
    if (globalShowToast) globalShowToast(message, 'error', title, duration)
    else console.error('[Toast Error]:', message)
  },
  warning: (message: string, title?: string, duration?: number) => {
    if (globalShowToast) globalShowToast(message, 'warning', title, duration)
    else console.warn('[Toast Warning]:', message)
  },
  info: (message: string, title?: string, duration?: number) => {
    if (globalShowToast) globalShowToast(message, 'info', title, duration)
    else console.info('[Toast Info]:', message)
  }
}

export const confirmModal = (options: ConfirmOptions): Promise<boolean> => {
  if (globalShowConfirm) return globalShowConfirm(options)
  return Promise.resolve(window.confirm(options.message))
}

export const promptModal = (options: PromptOptions): Promise<string | null> => {
  if (globalShowPrompt) return globalShowPrompt(options)
  return Promise.resolve(window.prompt(options.message, options.defaultValue || ''))
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  
  // Confirm state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    options: ConfirmOptions
    resolve: (val: boolean) => void
  } | null>(null)

  // Prompt state
  const [promptState, setPromptState] = useState<{
    isOpen: boolean
    options: PromptOptions
    value: string
    resolve: (val: string | null) => void
  } | null>(null)

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastItem = { id, type, message, title, duration }
    setToasts((prev) => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }, [removeToast])

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve
      })
    })
  }, [])

  const showPrompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setPromptState({
        isOpen: true,
        options,
        value: options.defaultValue || '',
        resolve
      })
    })
  }, [])

  useEffect(() => {
    globalShowToast = showToast
    globalShowConfirm = showConfirm
    globalShowPrompt = showPrompt

    // Intercept native browser alert to prevent ugly browser popups
    if (typeof window !== 'undefined') {
      const originalAlert = window.alert
      window.alert = (msg?: any) => {
        const str = String(msg || '')
        if (str.startsWith('✅')) {
          showToast(str, 'success')
        } else if (str.toLowerCase().includes('error') || str.toLowerCase().includes('falló')) {
          showToast(str, 'error')
        } else {
          showToast(str, 'info')
        }
      }

      return () => {
        window.alert = originalAlert
      }
    }
  }, [showToast, showConfirm, showPrompt])

  const handleConfirmClose = (confirmed: boolean) => {
    if (confirmState) {
      confirmState.resolve(confirmed)
      setConfirmState(null)
    }
  }

  const handlePromptClose = (submit: boolean) => {
    if (promptState) {
      promptState.resolve(submit ? promptState.value : null)
      setPromptState(null)
    }
  }

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm, showPrompt }}>
      {children}

      {/* TOAST CONTAINER */}
      <div className="toast-viewport" aria-live="polite">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success'
          const isError = t.type === 'error'
          const isWarning = t.type === 'warning'
          const isInfo = t.type === 'info'

          const accentColor = isSuccess
            ? 'var(--brand-primary, #d4ff00)'
            : isError
            ? '#ef4444'
            : isWarning
            ? '#f59e0b'
            : '#3b82f6'

          const icon = isSuccess ? '✓' : isError ? '✕' : isWarning ? '⚠' : 'ℹ'

          return (
            <div
              key={t.id}
              className={`toast-item toast-${t.type}`}
              style={{
                borderLeft: `4px solid ${accentColor}`,
                boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 0 15px -3px ${accentColor}25`
              }}
            >
              <div
                className="toast-icon"
                style={{
                  background: `${accentColor}20`,
                  color: accentColor,
                  border: `1px solid ${accentColor}40`
                }}
              >
                {icon}
              </div>

              <div className="toast-content">
                {t.title && <h4 className="toast-title">{t.title}</h4>}
                <p className="toast-message">{t.message}</p>
              </div>

              <button
                type="button"
                className="toast-close"
                onClick={() => removeToast(t.id)}
                aria-label="Cerrar notificación"
              >
                ×
              </button>
            </div>
          )
        })}
      </div>

      {/* CONFIRM MODAL */}
      {confirmState && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-backdrop" onClick={() => handleConfirmClose(false)} />
          <div className="confirm-modal-box">
            <div className="confirm-modal-header">
              <div
                className="confirm-badge"
                style={{
                  background:
                    confirmState.options.type === 'danger'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : confirmState.options.type === 'warning'
                      ? 'rgba(245, 158, 11, 0.15)'
                      : 'rgba(212, 255, 0, 0.15)',
                  color:
                    confirmState.options.type === 'danger'
                      ? '#ef4444'
                      : confirmState.options.type === 'warning'
                      ? '#f59e0b'
                      : 'var(--brand-primary, #d4ff00)',
                  border: `1px solid ${
                    confirmState.options.type === 'danger'
                      ? '#ef444440'
                      : confirmState.options.type === 'warning'
                      ? '#f59e0b40'
                      : 'var(--brand-primary, #d4ff00)40'
                  }`
                }}
              >
                {confirmState.options.type === 'danger' ? '🗑' : confirmState.options.type === 'warning' ? '⚠' : 'ℹ'}
              </div>
              <h3 className="confirm-title">{confirmState.options.title || 'Confirmación requerida'}</h3>
            </div>

            <div className="confirm-body">
              <p className="confirm-text">{confirmState.options.message}</p>
            </div>

            <div className="confirm-actions">
              <button
                type="button"
                className="btn-confirm-cancel"
                onClick={() => handleConfirmClose(false)}
              >
                {confirmState.options.cancelText || 'Cancelar'}
              </button>
              <button
                type="button"
                className={
                  confirmState.options.type === 'danger'
                    ? 'btn-confirm-danger'
                    : 'btn-confirm-primary'
                }
                onClick={() => handleConfirmClose(true)}
              >
                {confirmState.options.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMPT MODAL */}
      {promptState && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-backdrop" onClick={() => handlePromptClose(false)} />
          <div className="confirm-modal-box">
            <div className="confirm-modal-header">
              <div
                className="confirm-badge"
                style={{
                  background: 'rgba(212, 255, 0, 0.15)',
                  color: 'var(--brand-primary, #d4ff00)',
                  border: '1px solid var(--brand-primary, #d4ff00)40'
                }}
              >
                ✏
              </div>
              <h3 className="confirm-title">{promptState.options.title}</h3>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handlePromptClose(true)
              }}
            >
              <div className="confirm-body">
                <p className="confirm-text">{promptState.options.message}</p>
                <input
                  type={promptState.options.inputType || 'text'}
                  className="prompt-input"
                  value={promptState.value}
                  placeholder={promptState.options.placeholder || ''}
                  autoFocus
                  onChange={(e) =>
                    setPromptState({
                      ...promptState,
                      value: e.target.value
                    })
                  }
                />
              </div>

              <div className="confirm-actions">
                <button
                  type="button"
                  className="btn-confirm-cancel"
                  onClick={() => handlePromptClose(false)}
                >
                  {promptState.options.cancelText || 'Cancelar'}
                </button>
                <button type="submit" className="btn-confirm-primary">
                  {promptState.options.confirmText || 'Aceptar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        /* TOAST STYLES */
        .toast-viewport {
          position: fixed;
          top: 1.25rem;
          right: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          z-index: 999999;
          pointer-events: none;
          max-width: 420px;
          width: calc(100% - 2.5rem);
        }

        .toast-item {
          pointer-events: auto;
          background: rgba(18, 18, 18, 0.96);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 0.85rem 1rem;
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          color: white;
          animation: toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: all 0.2s ease;
        }

        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        .toast-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 0.85rem;
          flex-shrink: 0;
        }

        .toast-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          overflow-wrap: break-word;
        }

        .toast-title {
          font-size: 0.9rem;
          font-weight: 800;
          margin: 0;
          color: white;
        }

        .toast-message {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.85);
          margin: 0;
          line-height: 1.4;
          white-space: pre-wrap;
        }

        .toast-close {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          font-size: 1.3rem;
          cursor: pointer;
          padding: 0 0.2rem;
          line-height: 1;
          transition: color 0.15s;
        }

        .toast-close:hover {
          color: white;
        }

        /* CONFIRM / PROMPT MODAL STYLES */
        .confirm-modal-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999998;
          padding: 1rem;
        }

        .confirm-modal-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.82);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          animation: modalFadeIn 0.2s ease;
        }

        .confirm-modal-box {
          position: relative;
          background: #0d0d0d;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 0, 0, 0.5);
          border-radius: 14px;
          max-width: 480px;
          width: 100%;
          padding: 1.6rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          animation: modalPopIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 1;
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalPopIn {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .confirm-modal-header {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .confirm-badge {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.15rem;
          flex-shrink: 0;
        }

        .confirm-title {
          color: white;
          font-size: 1.15rem;
          font-weight: 800;
          margin: 0;
        }

        .confirm-body {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .confirm-text {
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.92rem;
          line-height: 1.5;
          margin: 0;
          white-space: pre-wrap;
        }

        .prompt-input {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          color: white;
          font-size: 1rem;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }

        .prompt-input:focus {
          border-color: var(--brand-primary, #d4ff00);
          box-shadow: 0 0 0 2px rgba(212, 255, 0, 0.2);
        }

        .confirm-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .btn-confirm-cancel {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.65rem 1.25rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-confirm-cancel:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
        }

        .btn-confirm-danger {
          background: #ef4444;
          color: white;
          border: none;
          padding: 0.65rem 1.35rem;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
        }

        .btn-confirm-danger:hover {
          background: #dc2626;
          box-shadow: 0 6px 16px rgba(239, 68, 68, 0.5);
          transform: translateY(-1px);
        }

        .btn-confirm-primary {
          background: var(--brand-primary, #d4ff00);
          color: black;
          border: none;
          padding: 0.65rem 1.35rem;
          border-radius: 8px;
          font-weight: 900;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 4px 12px rgba(212, 255, 0, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .btn-confirm-primary:hover {
          background: var(--brand-primary-hover, #b8e600);
          box-shadow: 0 6px 16px rgba(212, 255, 0, 0.45);
          transform: translateY(-1px);
        }
      `}</style>
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return ctx
}
