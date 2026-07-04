export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
      <div style={{
        width: 40, height: 40,
        border: '4px solid #e5e7eb',
        borderTopColor: '#4f46e5',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} role="status" aria-label="Loading" />
    </div>
  )
}
