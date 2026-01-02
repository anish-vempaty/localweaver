import { useState, useMemo } from 'react';
import { templates, Template } from '../templates';

interface TemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (filename: string, content: string) => void;
}

export default function TemplateModal({ isOpen, onClose, onCreate }: TemplateModalProps) {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('blank');
    const [fileName, setFileName] = useState('');
    const [filter, setFilter] = useState('All');

    const categories = ['All', ...Array.from(new Set(templates.map(t => t.category)))];

    const filteredTemplates = useMemo(() => {
        if (filter === 'All') return templates;
        return templates.filter(t => t.category === filter);
    }, [filter]);



    if (!isOpen) return null;

    const handleCreate = () => {
        if (!fileName.trim()) return;
        const template = templates.find(t => t.id === selectedTemplateId);
        if (template) {
            // Ensure filename has extension
            let finalName = fileName.trim();
            if (!finalName.endsWith('.html')) finalName += '.html';
            onCreate(finalName, template.content);
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
                    <h2 style={{ margin: 0, color: 'white', fontSize: 20 }}>Create New Page</h2>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: 24 }}>&times;</button>
                </div>

                {/* Body */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
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
                                            // We just use a class string, assuming font awesome is loaded globally in the app or we render it simpler
                                            // Since this is react, let's try to render an <i> if we can, or just text
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
                        disabled={!fileName.trim()}
                        style={{
                            padding: '10px 24px',
                            borderRadius: 6,
                            border: 'none',
                            background: fileName.trim() ? '#3b82f6' : '#555',
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: fileName.trim() ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Create Page
                    </button>
                </div>
            </div>
        </div>
    );
}
