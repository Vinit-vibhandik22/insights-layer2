'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import LandingScreen from '@/components/LandingScreen';
import LoaderScreen from '@/components/LoaderScreen';
import DashboardScreen from '@/components/DashboardScreen';

type Screen = 'landing' | 'loader' | 'dashboard';

interface LoaderState {
  text: string;
  sub: string;
  progress: number;
  stage: number;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [blueprint, setBlueprint] = useState<any>(null);
  const [query, setQuery] = useState('');
  const [loader, setLoader] = useState<LoaderState>({ text: 'Initializing AI Copilot...', sub: 'Connecting...', progress: 0, stage: 0 });

  async function generateBlueprint(inputQuery: string) {
    setQuery(inputQuery);
    setScreen('loader');
    setLoader({ text: 'Connecting to AI Copilot...', sub: 'Initializing RAG pipeline...', progress: 0, stage: 0 });

    try {
      const response = await fetch('/api/generate-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inputQuery })
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let bp: any = null;
      let currentEvent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
            continue;
          }
          if (line.startsWith('data: ')) {
            // Separate JSON parsing from event handling
            let data: any;
            try {
              data = JSON.parse(line.slice(6));
            } catch {
              currentEvent = '';
              continue; // Skip unparseable lines silently
            }

            // Event-name dispatch — reliable across all LLMs
            if (currentEvent === 'blueprint' || (data.title !== undefined)) {
              bp = data;
            } else if (currentEvent === 'stage' || data.stage !== undefined) {
              setLoader({ text: data.label || '', sub: data.sub || '', progress: data.progress || 0, stage: data.stage || 0 });
            } else if (currentEvent === 'done' || data.success === true) {
              setLoader(prev => ({ ...prev, progress: 100 }));
            } else if (currentEvent === 'error' || (data.message && !data.title)) {
              // Throw OUTSIDE try/catch — must propagate to outer catch
              const errorMsg = data.message || 'Unknown server error';
              console.error('[SSE] Server error event:', errorMsg);
              throw new Error(errorMsg);
            }

            currentEvent = '';
          }
        }
      }

      if (!bp) throw new Error('No blueprint received. Please try again.');

      setBlueprint(bp);
      setScreen('dashboard');

    } catch (err: any) {
      console.error('[Generate]', err.message);
      setLoader({ text: 'Generation failed', sub: err.message, progress: 0, stage: 0 });
      setTimeout(() => setScreen('landing'), 3000);
    }
  }

  return (
    <>
      <div className="grid-bg" />
      <div className="ambient-glow" />
      <div className="ambient-glow-2" />

      {screen !== 'dashboard' && <Navbar />}

      {screen === 'landing' && (
        <LandingScreen onGenerate={generateBlueprint} />
      )}
      {screen === 'loader' && (
        <LoaderScreen loader={loader} />
      )}
      {screen === 'dashboard' && blueprint && (
        <DashboardScreen
          blueprint={blueprint}
          query={query}
          onNewQuery={() => { setBlueprint(null); setScreen('landing'); }}
          onRegenerate={(q: string) => generateBlueprint(q)}
        />
      )}
    </>
  );
}
