import { useState, useMemo } from 'react';
import { templates } from '../templates';
import { invoke } from '@tauri-apps/api/core';
import { generateContent } from '../services/ai';

interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (filename: string, content: string) => void;
    existingFiles?: string[];
    projectPath?: string;
}

export default function TemplateModal({ isOpen, onClose, onCreate, existingFiles = [], projectPath = "" }: TemplateModalProps) {
    const [mode, setMode] = useState<'presets' | 'ai'>('presets');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('blank');
    const [fileName, setFileName] = useState('');
    const [filter, setFilter] = useState('All');

    // AI State
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiContextFile, setAiContextFile] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const categories = ['All', ...Array.from(new Set(templates.map(t => t.category)))];

    const filteredTemplates = useMemo(() => {
        if (filter === 'All') return templates;
        return templates.filter(t => t.category === filter);
    }, [filter]);


    if (!isOpen) return null;

    const handleCreate = async () => {
        if (!fileName.trim()) return;

        // Ensure filename has extension
        let finalName = fileName.trim();
        if (!finalName.endsWith('.html')) finalName += '.html';

        if (mode === 'presets') {
            const template = templates.find(t => t.id === selectedTemplateId);
            if (template) {
                onCreate(finalName, template.content);
            }
        } else {
            // AI Mode
            if (!aiPrompt.trim()) return;

            setIsGenerating(true);
            try {
                let context = "";
                if (aiContextFile && projectPath) {
                    try {
                        context = await invoke('read_page_content', { path: projectPath, filename: aiContextFile });
                    } catch (err) {
                        console.error("Failed to read context file:", err);
                        // Continue without context or alert? Let's continue but warn
                    }
                }

                // If context is provided, we use Type 2 (Context Aware), otherwise Type 1
                // We ask for a full page since this is "Create New Page"
                const fullPrompt = context
                    ? `Create a FULL HTML page based on the following request: "${aiPrompt}".\nCoordinate the style and structure with the provided existing page code.`
                    : `Create a FULL HTML page based on the following request: "${aiPrompt}". Include all necessary tags (html, head, body).`;

                const generatedHtml = await generateContent(fullPrompt, context, true);

                onCreate(finalName, generatedHtml);
            } catch (error) {
                alert("Failed to generate template: " + error);
            } finally {
                setIsGenerating(false);
            }
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                background: '#1e1e1e',
                width: 900,
                maxHeight: '90vh',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                border: '1px solid #333'
            }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                        <h2 style={{ margin: 0, color: 'white', fontSize: 20 }}>Create New Page</h2>
                        {/* Tabs */}
                        <div style={{ display: 'flex', background: '#333', borderRadius: 6, padding: 2 }}>
                            <button
                                onClick={() => setMode('presets')}
                                style={{
                                    background: mode === 'presets' ? '#3b82f6' : 'transparent',
                                    color: mode === 'presets' ? 'white' : '#aaa',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: '500'
                                }}
                            >
                                Presets
                            </button>
                            <button
                                onClick={() => setMode('ai')}
                                style={{
                                    background: mode === 'ai' ? '#8b5cf6' : 'transparent',
                                    color: mode === 'ai' ? 'white' : '#aaa',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: 4,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6
                                }}
                            >
                                <i className="fa-solid fa-wand-magic-sparkles"></i>
                                AI Generator
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: 24 }}>&times;</button>
                </div>

                {/* Body */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 400 }}>
                    {mode === 'presets' ? (
                        <>
                            {/* Sidebar / Filters */}
                            <div style={{ width: 200, background: '#252525', padding: 20, borderRight: '1px solid #333' }}>
                                <h3 style={{ color: '#888', textTransform: 'uppercase', fontSize: 12, marginBottom: 10 }}>Categories</h3>
                                {categories.map(cat => (
                                    <div
                                        key={cat}
                                        onClick={() => setFilter(cat)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                            color: filter === cat ? 'white' : '#aaa',
                                            background: filter === cat ? '#3b82f6' : 'transparent',
                                            marginBottom: 4,
                                            fontSize: 14
                                        }}
                                    >
                                        {cat}
                                    </div>
                                ))}
                            </div>

                            {/* Grid */}
                            <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
                                    {filteredTemplates.map(template => (
                                        <div
                                            key={template.id}
                                            onClick={() => setSelectedTemplateId(template.id)}
                                            style={{
                                                border: `2px solid ${selectedTemplateId === template.id ? '#3b82f6' : '#444'}`,
                                                borderRadius: 8,
                                                overflow: 'hidden',
                                                cursor: 'pointer',
                                                background: '#2a2a2a',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {/* Thumbnail */}
                                            <div style={{
                                                height: 120,
                                                background: template.thumbnail.bg,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: 40,
                                                textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                                            }}>
                                                {template.thumbnail.type === 'icon' ? (
                                                    <i className={`fa-solid ${template.thumbnail.value}`} style={{ fontFamily: '"Font Awesome 6 Free", FontAwesome, sans-serif' }}></i>
                                                ) : null}
                                            </div>
                                            <div style={{ padding: 12 }}>
                                                <div style={{ color: 'white', fontWeight: 'bold', marginBottom: 4 }}>{template.name}</div>
                                                <div style={{ color: '#888', fontSize: 12, lineHeight: 1.4 }}>{template.description}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* AI Mode UI */
                        <div style={{ flex: 1, padding: 40, display: 'flex', flexDirection: 'column', gap: 24, background: '#252525', overflowY: 'auto' }}>
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <div style={{
                                    width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                                    margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'white'
                                }}>
                                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                                </div>
                                <h3 style={{ color: 'white', fontSize: 24, margin: '0 0 8px' }}>Generate with AI</h3>
                                <p style={{ color: '#aaa', margin: 0 }}>Describe the page you want, and let the local AI build it for you.</p>
                            </div>

                            {/* Prompt Input */}
                            <div>
                                <label style={{ display: 'block', color: '#ccc', marginBottom: 8, fontSize: 14 }}>Prompt</label>
                                <textarea
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    placeholder="e.g. A modern landing page for a coffee shop with a hero section, 3 feature cards, and a newsletter signup form."
                                    style={{
                                        width: '100%',
                                        height: 120,
                                        background: '#333',
                                        border: '1px solid #444',
                                        borderRadius: 8,
                                        color: 'white',
                                        padding: 16,
                                        resize: 'none',
                                        fontSize: 16,
                                        outline: 'none',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </div>

                            {/* Context Selector */}
                            <div>
                                <label style={{ display: 'block', color: '#ccc', marginBottom: 8, fontSize: 14 }}>
                                    Context Reference (Optional)
                                    <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>Select an existing file to match style</span>
                                </label>
                                <select
                                    value={aiContextFile}
                                    onChange={(e) => setAiContextFile(e.target.value)}
                                    style={{
                                        width: '100%',
                                        background: '#333',
                                        border: '1px solid #444',
                                        borderRadius: 8,
                                        color: 'white',
                                        padding: '12px 16px',
                                        outline: 'none',
                                        fontSize: 14
                                    }}
                                >
                                    <option value="">-- No Context (Fresh Generation) --</option>
                                    {existingFiles.filter(f => f.endsWith('.html')).map(f => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ padding: 20, borderTop: '1px solid #333', background: '#252525', display: 'flex', gap: 15, alignItems: 'center', justifyContent: 'flex-end' }}>
                    <input
                        type="text"
                        placeholder="Enter filename (e.g. about)"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        style={{
                            background: '#333',
                            border: '1px solid #555',
                            color: 'white',
                            padding: '10px 15px',
                            borderRadius: 6,
                            flex: 1,
                            maxWidth: 300,
                            outline: 'none'
                        }}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    />
                    <button
                        onClick={onClose}
                        style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: 'transparent', color: '#aaa', cursor: 'pointer' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!fileName.trim() || (mode === 'ai' && (!aiPrompt.trim() || isGenerating))}
                        style={{
                            padding: '10px 24px',
                            borderRadius: 6,
                            border: 'none',
                            background: fileName.trim() && (mode !== 'ai' || aiPrompt.trim()) ? (mode === 'ai' ? '#8b5cf6' : '#3b82f6') : '#555',
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: fileName.trim() && (mode !== 'ai' || aiPrompt.trim()) && !isGenerating ? 'pointer' : 'not-allowed',
                            opacity: isGenerating ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}
                    >
                        {isGenerating ? (
                            <>
                                <i className="fa-solid fa-spinner fa-spin"></i> Generating...
                            </>
                        ) : (
                            mode === 'ai' ? 'Generate Page' : 'Create Page'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
