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

        // Sanitize node labels to prevent parsing errors like 'TAGEND' (e.g. A[User] -->|Login| B[Auth Service])
        // If the LLM generates A[Auth Service] it can break if it has special chars. 
        // More importantly, the LLM might generate A[Auth Service] instead of A["Auth Service"]
        // This regex finds content inside brackets [ ] and wraps it in quotes if not already quoted, 
        // while stripping out HTML-like brackets < > that break mermaid.
        cleanCode = cleanCode.replace(/\[([^\]]+)\]/g, (match, p1) => {
           // If it's already properly quoted like ["Something"], just return it (maybe stripping < >)
           if (p1.startsWith('"') && p1.endsWith('"')) {
               const inner = p1.slice(1, -1).replace(/[<>]/g, '');
               return `["${inner}"]`;
           }
           // Otherwise, strip bad characters and wrap in quotes
           const sanitized = p1.replace(/[<>"]/g, '');
           return `["${sanitized}"]`;
        });
        
        // Also sanitize arrow labels |Label| to remove < > just in case
        cleanCode = cleanCode.replace(/\|([^\|]+)\|/g, (match, p1) => {
             const sanitized = p1.replace(/[<>]/g, '');
             return `|${sanitized}|`;
        });
        
        // Remove stray > characters that LLMs sometimes hallucinate right after a label pipe 
        // Example hallucination: A -->|Label|> B
        cleanCode = cleanCode.replace(/\|>/g, '| ');

        // Fix invalid flowchart arrows that LLMs hallucinate from sequence diagrams
        cleanCode = cleanCode.replace(/->>/g, '-->');
        cleanCode = cleanCode.replace(/=>/g, '==>');
        cleanCode = cleanCode.replace(/([^->=])->([^->=])/g, '$1-->$2');

        console.log("Sanitized Mermaid Code:", cleanCode);

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
