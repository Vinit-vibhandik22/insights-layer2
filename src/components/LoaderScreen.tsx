'use client';

interface LoaderState {
  text: string;
  sub: string;
  progress: number;
  stage: number;
}

interface Props {
  loader: LoaderState;
}

const STAGES = [
  'Querying arXiv, IEEE, GitHub',
  'Knowledge Clustering',
  'Web Intelligence Scan',
  'Generating Architecture',
  'Finalizing Blueprint',
];

export default function LoaderScreen({ loader }: Props) {
  return (
    <div className="loader-page">
      <div className="loader-content">
        <div className="copilot-spinner">
          <svg className="spin-svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
          </svg>
        </div>

        <h2>{loader.text}</h2>

        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${loader.progress}%` }} />
        </div>

        <p className="mono-text">{loader.sub}</p>

        <div className="stage-list" style={{ marginTop: 20 }}>
          {STAGES.map((s, i) => {
            const stageNum = i + 1;
            const status = stageNum < loader.stage ? 'done' : stageNum === loader.stage ? 'active' : 'pending';
            return (
              <div className={`stage-item ${status}`} key={s}>
                <div className={`stage-dot ${status}`} />
                <span style={{ fontSize: '0.1rem', color: 'inherit' }}>
                  {status === 'done' ? '✓ ' : status === 'active' ? '⟳ ' : '○ '}
                </span>
                <span>{s}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
