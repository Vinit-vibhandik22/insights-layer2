'use client';

import { useEffect, useRef, useState } from 'react';

import { sanitizeMermaid } from '../lib/sanitizeMermaid';

interface Props {
  chart: string;
}

export default function SafeMermaid({ chart }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    if (!chart || typeof window === 'undefined') return;

    let cancelled = false;

    const render = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          suppressErrorRendering: true,
          theme: 'base',
          themeVariables: {
            primaryColor: '#e11d48',
            primaryTextColor: '#fff',
            primaryBorderColor: '#c01040',
            lineColor: '#555',
            secondaryColor: '#f0f0f0',
            background: '#ffffff',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px'
          },
          flowchart: { curve: 'basis', padding: 20 },
          securityLevel: 'loose'
        });

        const cleanCode = sanitizeMermaid(chart);

        await mermaid.parse(cleanCode);

        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg: renderedSvg } = await mermaid.render(id, cleanCode);

        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(`Diagram error: ${err.message || 'Invalid Mermaid syntax'}`);
        }
      }
    };

    render();
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <div style={{ padding: '32px 20px', textAlign: 'center', background: 'var(--bg-panel2)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: '2.5rem', opacity: 0.8 }}>🗺️</div>
        <div>
           <h4 style={{ color: 'var(--text)', marginBottom: 6, fontSize: '0.95rem' }}>Complex Architecture Diagram</h4>
           <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
             The AI generated a highly complex architectural blueprint that cannot be previewed in this interactive window.
           </p>
        </div>
      </div>
    );
  }

  if (!svg) {
    return (
      <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        Rendering diagram...
      </div>
    );
  }

  return (
    <div
      className="mermaid-container"
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
