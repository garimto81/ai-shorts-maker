export default function Custom500() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>500</h1>
      <p style={{ fontSize: '18px', color: '#666' }}>Server-side error occurred</p>
      <a href="/" style={{ marginTop: '20px', color: '#0070f3' }}>
        Go back home
      </a>
    </div>
  );
}