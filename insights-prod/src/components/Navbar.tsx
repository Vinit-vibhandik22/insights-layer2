'use client';

import dynamic from 'next/dynamic';

// Lazy-load Clerk components only when available
const ClerkNav = dynamic(() => import('./ClerkNav'), { ssr: false, loading: () => null });

export default function Navbar() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="top-nav">
      <div className="logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 17L12 22L22 17" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 12L12 17L22 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        iNSIGHTS <span>Layer 2</span>
      </div>
      <div className="nav-links">
        <a href="#" className="active" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</a>
        <a href="#" onClick={e => { e.preventDefault(); scrollTo('featuresSection'); }}>Features</a>
        <a href="#" onClick={e => { e.preventDefault(); scrollTo('archSection'); }}>Architecture</a>
        <a href="#" onClick={e => { e.preventDefault(); scrollTo('roadmapSection'); }}>Roadmap</a>
      </div>
      <div className="nav-actions">
        <ClerkNav />
        <div className="badge-nav">ISAG-404</div>
      </div>
    </nav>
  );
}
