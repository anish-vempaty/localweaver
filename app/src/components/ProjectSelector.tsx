import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { FolderPlus, FolderOpen, BookOpen } from 'lucide-react';

interface ProjectSelectorProps {
    onSelect: (path: string) => void;
}

const ProjectSelector = ({ onSelect }: ProjectSelectorProps) => {
    const [mode, setMode] = useState<'initial' | 'new'>('initial');
    const [projectName, setProjectName] = useState('');
    const [parentDir, setParentDir] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateProject = async () => {
        if (!projectName.trim()) {
            setError('Project name cannot be empty');
            return;
        }
        if (!parentDir) {
            setError('Please select a folder location');
            return;
        }

        setIsLoading(true);
        setError(null);

        // Normalize path separator
        const fullPath = `${parentDir.replace(/\\$/, '')}\\${projectName.trim()}`;

        try {
            await invoke('create_project_folder', { path: fullPath });
            // Create a default index.html to make it useful
            try {
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

    const handleBrowseParent = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: "Select Location for New Project"
            });
            if (selected && typeof selected === 'string') {
                setParentDir(selected);
            }
        } catch (err) {
            console.error("Failed to open dialog:", err);
        }
    };

    const handleBrowseExisting = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
            });
            if (selected && typeof selected === 'string') {
                onSelect(selected);
            }
        } catch (err) {
            console.error("Failed to open dialog:", err);
        }
    };

    const handleOpenExample = async () => {
        setIsLoading(true);
        try {
            const path = await invoke<string>('ensure_example_project');
            onSelect(path);
        } catch (err: any) {
            console.error(err);
            setError("Failed to load example: " + err.toString());
        } finally {
            setIsLoading(false);
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
                        <button onClick={handleBrowseExisting} style={buttonStyle}>
                            <FolderOpen size={32} style={{ marginBottom: 10 }} />
                            <div>Open Existing</div>
                            <div style={{ fontSize: 10, color: '#666', marginTop: 5 }}>(HTML, CSS / JSX)</div>
                        </button>
                        <button onClick={handleOpenExample} style={buttonStyle} disabled={isLoading}>
                            <BookOpen size={32} style={{ marginBottom: 10 }} />
                            <div>{isLoading ? 'Loading...' : 'Open Example'}</div>
                            <div style={{ fontSize: 10, color: '#666', marginTop: 5 }}>(Ready to Use)</div>
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
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 5 }}>Location</label>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <input
                                    readOnly
                                    value={parentDir}
                                    placeholder="Select a folder..."
                                    style={{
                                        flex: 1, padding: '10px 15px', borderRadius: 6,
                                        border: '1px solid #444', background: '#252525', color: '#aaa',
                                        fontSize: 14, cursor: 'not-allowed'
                                    }}
                                />
                                <button onClick={handleBrowseParent} style={secondaryButtonStyle}>Browse</button>
                            </div>
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
    whiteSpace: 'nowrap'
};

export default ProjectSelector;
