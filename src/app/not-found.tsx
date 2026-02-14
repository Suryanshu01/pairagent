import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0f',
      color: '#e0e0e8',
      fontFamily: 'Space Grotesk, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '600px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.9), rgba(15, 15, 28, 0.95))',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '16px',
        padding: '40px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔍</div>
        <h2 style={{
          fontSize: '24px',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #00ff9d, #00b4ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          404 - Page Not Found
        </h2>
        <p style={{
          color: '#888',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          The page you're looking for doesn't exist.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #00ff9d, #00b4ff)',
            border: 'none',
            borderRadius: '8px',
            color: '#0a0a0f',
            fontWeight: 'bold',
            textDecoration: 'none',
            fontSize: '14px',
            fontFamily: 'Space Grotesk, sans-serif'
          }}
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
