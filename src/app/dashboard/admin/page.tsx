export default function AdminDashboard() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: '#fff' }}>
        Panel de Control: <span style={{ color: 'var(--brand-primary)' }}>Administrador</span>
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', lineHeight: '1.6' }}>
        Bienvenido al balance general de la empresa. Aquí podrás visualizar ingresos, egresos, métricas de producción y el rendimiento financiero global.
      </p>
    </div>
  )
}
