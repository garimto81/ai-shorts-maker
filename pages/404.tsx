export default function Custom404() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>404</h1>
      <p style={{ fontSize: '18px', color: '#666' }}>Page Not Found</p>
      <a href="/" style={{ marginTop: '20px', color: '#0070f3' }}>
        Go back home
      </a>
    </div>
  );
}