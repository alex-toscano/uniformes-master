export default function SuperAdminDashboard() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: '#fff' }}>
        Panel de Control: <span style={{ color: 'var(--brand-primary)' }}>Super Admin</span>
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', lineHeight: '1.6' }}>
        Bienvenido, Desarrollador. Desde aquí tendrás control absoluto sobre el sistema, configuraciones estructurales del ERP, manejo de roles, y logs del servidor.
      </p>
    </div>
  )
}
