'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';

export default function HubScreen() {
  const [data, setData] = useState<{ workspaces: any[], unassigned: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [creating, setCreating] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    fetchHubData();
  }, []);

  const fetchHubData = async () => {
    try {
      const res = await fetch('/api/hub');
      if (!res.ok) {
        if (res.status === 401) {
          setError('Please sign in to view your Hub.');
        } else {
          setError('Failed to load hub data.');
        }
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError('An error occurred while loading your hub.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/workspaces/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName })
      });
      if (res.ok) {
        setNewWorkspaceName('');
        await fetchHubData();
      }
    } finally {
      setCreating(false);
    }
  };

  const assignBlueprint = async (blueprintId: string, workspaceId: string) => {
    try {
      const res = await fetch('/api/workspaces/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blueprintId, workspaceId })
      });
      if (res.ok) {
        await fetchHubData();
      }
    } catch (err) {
      console.error(err);
    }
  };
  
  const inviteCollaborator = async (workspaceId: string) => {
    const email = prompt("Enter the collaborator's email address:");
    if (!email || !email.trim()) return;
    
    try {
      const res = await fetch('/api/workspaces/collaborators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, email: email.trim() })
      });
      if (res.ok) {
        alert('Collaborator invited successfully!');
      } else {
        alert('Failed to invite collaborator.');
      }
    } catch (err) {
      alert('An error occurred.');
    }
  };

  if (loading) {
    return (
      <main>
        <div className="grid-bg" />
        <Navbar />
        <div style={{ padding: '120px 40px', textAlign: 'center', color: 'var(--text-soft)' }}>Loading your Hub...</div>
      </main>
    );
  }

  return (
    <main>
      <div className="grid-bg" />
      <Navbar />
      
      <div style={{ maxWidth: 1200, margin: '100px auto', padding: '0 20px', zIndex: 10, position: 'relative' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Project <span className="text-gradient">HUB</span></h1>
        <p style={{ color: 'var(--text-soft)', marginBottom: '40px' }}>Manage your workspaces and blueprints.</p>
        
        {error ? (
          <div style={{ padding: '20px', background: 'rgba(255,50,50,0.1)', color: '#ff6b6b', borderRadius: '8px' }}>
            {error}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            
            {/* Create Workspace */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="New Workspace Name..." 
                value={newWorkspaceName}
                onChange={e => setNewWorkspaceName(e.target.value)}
                style={{ padding: '12px 16px', background: 'var(--alpha-5)', border: '1px solid var(--alpha-10)', color: 'var(--text)', borderRadius: '8px', minWidth: '250px' }}
              />
              <button 
                onClick={handleCreateWorkspace} 
                disabled={creating || !newWorkspaceName.trim()}
                style={{ padding: '12px 24px', background: 'var(--primary)', color: '#fff', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >
                {creating ? 'Creating...' : '+ Create Workspace'}
              </button>
            </div>

            {/* Workspaces List */}
            {data?.workspaces.length === 0 && data?.unassigned.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', background: 'var(--alpha-2)', borderRadius: '12px', border: '1px solid var(--alpha-5)' }}>
                <p style={{ color: 'var(--text-soft)' }}>You don't have any workspaces or blueprints yet.</p>
              </div>
            )}

            {data?.workspaces.map(ws => (
              <div key={ws.id} style={{ background: 'var(--alpha-3)', borderRadius: '12px', border: '1px solid var(--alpha-8)', overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--alpha-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--alpha-2)' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    📁 {ws.name}
                  </h3>
                  <button 
                    onClick={() => inviteCollaborator(ws.id)}
                    style={{ padding: '6px 12px', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    + Invite Collaborator
                  </button>
                </div>
                
                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {ws.blueprints.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>No blueprints in this workspace.</p>
                  ) : (
                    ws.blueprints.map((bp: any) => (
                      <div key={bp.id} style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--alpha-5)' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: 'var(--text)' }}>{bp.query}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(bp.created_at).toLocaleDateString()}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}

            {/* Unassigned Blueprints */}
            {data && data.unassigned.length > 0 && (
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: 'var(--text-soft)' }}>Unassigned Blueprints</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {data.unassigned.map(bp => (
                    <div key={bp.id} style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--alpha-5)' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: 'var(--text)' }}>{bp.query}</h4>
                      
                      {data.workspaces.length > 0 && (
                        <select 
                          onChange={(e) => assignBlueprint(bp.id, e.target.value)}
                          value=""
                          style={{ marginTop: '10px', width: '100%', padding: '6px', background: 'var(--bg-panel)', color: 'var(--text)', border: '1px solid var(--alpha-10)', borderRadius: '4px' }}
                        >
                          <option value="" disabled>Move to Workspace...</option>
                          {data.workspaces.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        )}
      </div>
    </main>
  );
}
