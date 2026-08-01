'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  code: string;
}

export default function MermaidDiagram({ code }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    if (!code || typeof window === 'undefined') return;

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

        // Clean up LLM markdown artifacts if they exist
        let cleanCode = code.trim();
        if (cleanCode.startsWith('```mermaid')) {
          cleanCode = cleanCode.replace(/^```mermaid\n?/, '').replace(/\n?```$/, '');
        } else if (cleanCode.startsWith('```')) {
          cleanCode = cleanCode.replace(/^```\n?/, '').replace(/\n?```$/, '');
        }
        
        // Remove numbered lists that LLMs sometimes hallucinate
        cleanCode = cleanCode.replace(/^\d+\.\s*/gm, '');

        // 1. First parse the code to validate it. If this fails, it throws an error 
        // and we never call render(), completely preventing the bomb SVG injection!
        await mermaid.parse(cleanCode);

        // 2. If it's valid, render it
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
      <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: 14 }}>
        <p style={{ color: '#ef4444', fontSize: '0.82rem' }}>{error}</p>
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
