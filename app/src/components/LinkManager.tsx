import { useState, useEffect } from 'react';
import { Editor } from 'grapesjs';
import { ExternalLink } from 'lucide-react';
import DraggableWindow from './DraggableWindow';

interface LinkManagerProps {
    editor: Editor;
    onClose: () => void;
}

export default function LinkManager({ editor, onClose }: LinkManagerProps) {
    const [selectedComponent, setSelectedComponent] = useState<any>(null);
    const [href, setHref] = useState('');
    const [target, setTarget] = useState('_self');

    useEffect(() => {
        const selected = editor.getSelected();
        setSelectedComponent(selected);
        if (selected) {
            const attrs = selected.getAttributes();
            setHref(attrs.href || '#');
            setTarget(attrs.target || '_self');
        }
    }, [editor]);

    const handleSave = () => {
        if (selectedComponent) {
            selectedComponent.addAttributes({ href, target });
            editor.trigger('component:update');
        }
        onClose();
    };

    if (!selectedComponent) return null;

    return (
        <DraggableWindow title="Configure Link" onClose={onClose} initialWidth={400} initialHeight={300}>

            {/* Content */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 5 }}>URL / Destination</label>
                    <input
                        type="text"
                        value={href}
                        onChange={(e) => setHref(e.target.value)}
                        placeholder="https://example.com or #section"
                        style={{
                            width: '100%', padding: '8px 10px',
                            background: '#252525', border: '1px solid #444',
                            color: 'white', borderRadius: 4
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 5 }}>Open In</label>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button
                            onClick={() => setTarget('_self')}
                            style={{
                                flex: 1, padding: 8, borderRadius: 4, border: '1px solid',
                                background: target === '_self' ? '#3b82f6' : '#252525',
                                borderColor: target === '_self' ? '#3b82f6' : '#444',
                                color: 'white', cursor: 'pointer'
                            }}
                        >
                            Same Tab
                        </button>
                        <button
                            onClick={() => setTarget('_blank')}
                            style={{
                                flex: 1, padding: 8, borderRadius: 4, border: '1px solid',
                                background: target === '_blank' ? '#3b82f6' : '#252525',
                                borderColor: target === '_blank' ? '#3b82f6' : '#444',
                                color: 'white', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
                            }}
                        >
                            New Tab <ExternalLink size={12} />
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: 10 }}>
                    <button
                        onClick={handleSave}
                        style={{
                            width: '100%', padding: 10,
                            background: '#22c55e', color: 'white',
                            border: 'none', borderRadius: 4,
                            cursor: 'pointer', fontWeight: 600
                        }}
                    >
                        Save Link
                    </button>
                </div>
            </div>

        </DraggableWindow >
    );
}
