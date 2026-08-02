'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
      <h2>500 - Server Error</h2>
      <p>{error.message || 'Something went wrong.'}</p>
      <button
        onClick={() => reset()}
        style={{ marginTop: '20px', padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        Try again
      </button>
    </div>
  );
}
