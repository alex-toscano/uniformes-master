export default function VendedorDashboard() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', color: '#fff' }}>
        Panel de Control: <span style={{ color: 'var(--brand-primary)' }}>Ventas y Seguimiento</span>
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', lineHeight: '1.6' }}>
        Bienvenida al módulo de atención. Aquí podrás registrar nuevos pedidos, revisar la trazabilidad y el estado de producción de los clientes actuales en tiempo real.
      </p>
    </div>
  )
}
