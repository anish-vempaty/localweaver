import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { FolderPlus, FolderOpen, ArrowRight, BookOpen } from 'lucide-react';

interface ProjectSelectorProps {
    onSelect: (path: string) => void;
}

const ProjectSelector = ({ onSelect }: ProjectSelectorProps) => {
    const [mode, setMode] = useState<'initial' | 'new'>('initial');
    const [projectName, setProjectName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Hardcoded workspace root as per context
    const WORKSPACE_ROOT = 'c:\\PROJECTS\\localweaver';

    const handleCreateProject = async () => {
        if (!projectName.trim()) {
            setError('Project name cannot be empty');
            return;
        }

        setIsLoading(true);
        setError(null);

        const fullPath = `${WORKSPACE_ROOT}\\${projectName.trim()}`;

        try {
            await invoke('create_project_folder', { path: fullPath });
            // Create a default index.html to make it useful
            try {
                // Initialize with a basic index.html so it's not empty
                await invoke('create_page', { path: fullPath, filename: 'index.html' });
            } catch (e) {
                console.warn('Failed to create default index.html', e);
            }
            onSelect(fullPath);
        } catch (err: any) {
            setError(err.toString() || 'Failed to create project');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBrowse = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                defaultPath: WORKSPACE_ROOT,
            });
            if (selected && typeof selected === 'string') {
                onSelect(selected);
            }
        } catch (err) {
            console.error("Failed to open dialog:", err);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                background: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: 12,
                padding: 40,
                width: 500,
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                color: 'white',
                textAlign: 'center'
            }}>
                <h1 style={{ marginTop: 0, marginBottom: 10, fontSize: 24 }}>LocalWeaver</h1>
                <p style={{ color: '#888', marginBottom: 30 }}>Select an option to get started</p>

                {mode === 'initial' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                        <button onClick={() => setMode('new')} style={buttonStyle}>
                            <FolderPlus size={32} style={{ marginBottom: 10 }} />
                            <div>New Project</div>
                            <div style={{ fontSize: 10, color: '#666', marginTop: 5 }}>(HTML, CSS)</div>
                        </button>
                        <button onClick={handleBrowse} style={buttonStyle}>
                            <FolderOpen size={32} style={{ marginBottom: 10 }} />
                            <div>Open Existing</div>
                            <div style={{ fontSize: 10, color: '#666', marginTop: 5 }}>(HTML, CSS / JSX / TSX)</div>
                        </button>
                        <button onClick={() => onSelect(`${WORKSPACE_ROOT}\\test-site`)} style={buttonStyle}>
                            <BookOpen size={32} style={{ marginBottom: 10 }} />
                            <div>Open Example</div>
                            <div style={{ fontSize: 10, color: '#666', marginTop: 5 }}>(HTML)</div>
                        </button>
                    </div>
                )}

                {mode === 'new' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15, textAlign: 'left' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 5 }}>Project Name</label>
                            <input
                                autoFocus
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                placeholder="my-awesome-site"
                                style={{
                                    width: '100%', padding: '10px 15px', borderRadius: 6,
                                    border: '1px solid #444', background: '#252525', color: 'white',
                                    fontSize: 16
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                            />
                        </div>

                        <div style={{ fontSize: 12, color: '#666' }}>
                            Location: {WORKSPACE_ROOT}\{projectName || '...'}
                        </div>

                        {error && <div style={{ color: '#ef4444', fontSize: 13 }}>{error}</div>}

                        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                            <button onClick={() => setMode('initial')} style={{ ...secondaryButtonStyle, flex: 1 }}>Back</button>
                            <button onClick={handleCreateProject} disabled={isLoading} style={{ ...primaryButtonStyle, flex: 1 }}>
                                {isLoading ? 'Creating...' : 'Create Project'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const buttonStyle: React.CSSProperties = {
    background: '#252525',
    border: '1px solid #333',
    borderRadius: 8,
    padding: '30px 20px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'all 0.2s',
};

const primaryButtonStyle: React.CSSProperties = {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: 6,
    cursor: 'pointer',
    fontWeight: 500
};

const secondaryButtonStyle: React.CSSProperties = {
    background: 'transparent',
    color: '#aaa',
    border: '1px solid #444',
    padding: '10px 20px',
    borderRadius: 6,
    cursor: 'pointer',
};

export default ProjectSelector;
