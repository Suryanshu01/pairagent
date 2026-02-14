'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
        <h2 style={{
          fontSize: '24px',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #ff6b00, #ff4444)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Something went wrong!
        </h2>
        <p style={{
          color: '#888',
          marginBottom: '24px',
          fontSize: '14px'
        }}>
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={() => reset()}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #00ff9d, #00b4ff)',
            border: 'none',
            borderRadius: '8px',
            color: '#0a0a0f',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'Space Grotesk, sans-serif'
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
