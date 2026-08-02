export default function NotFound() {
  return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
      <h2>404 - Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
      <a href="/" style={{ color: '#3b82f6', textDecoration: 'underline', display: 'inline-block', marginTop: '20px' }}>
        Return Home
      </a>
    </div>
  );
}
