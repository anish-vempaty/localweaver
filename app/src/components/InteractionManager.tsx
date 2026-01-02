
import { useEffect, useState } from 'react';
import { Editor } from 'grapesjs';
import { MousePointer, Trash2 } from 'lucide-react';
import DraggableWindow from './DraggableWindow';

interface InteractionManagerProps {
    editor: Editor;
    onClose: () => void;
}

export interface Interaction {
    id: string;
    trigger: 'click' | 'mouseenter' | 'mouseleave' | 'change' | 'submit' | 'load';
    actionType: 'custom' | 'animate' | 'utility' | 'nav';
    presetName?: string;
    code: string;
}

const ANIMATION_PRESETS = [
    { name: 'Bounce', code: `e.target.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-$INTENSITYpx)' }, { transform: 'translateY(0)' }], { duration: $DURATION, easing: 'ease-in-out' }); ` },
    { name: 'Shake', code: `e.target.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-$INTENSITYpx)' }, { transform: 'translateX($INTENSITYpx)' }, { transform: 'translateX(0)' }], { duration: $DURATION }); ` },
    { name: 'Pulse', code: `e.target.animate([{ transform: 'scale(1)' }, { transform: 'scale($j_scale)' }, { transform: 'scale(1)' }], { duration: $DURATION }); ` },
    { name: 'Levitate (Loop)', code: `e.target.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-$INTENSITYpx)' }, { transform: 'translateY(0)' }], { duration: $DURATION, iterations: Infinity, easing: 'ease-in-out' }); ` },
    { name: 'Magnify (Hover)', code: `e.target.style.transition = 'transform $DURATIONms ease'; e.target.style.transform = 'scale($j_scale)'; ` },
    { name: 'Reset Scale (MouseOut)', code: `e.target.style.transform = 'scale(1)'; ` },
];

const UTILITY_PRESETS = [
    { name: 'Scroll to Top', code: `window.scrollTo({ top: 0, behavior: 'smooth' }); ` },
    { name: 'Toggle Visibility', code: `e.target.style.display = e.target.style.display === 'none' ? 'block' : 'none'; ` },
    { name: 'Alert Message', code: `alert('Hello from LocalWeaver!'); ` },
    { name: 'Log to Console', code: `console.log('Interaction triggered on:', e.target); ` },
];

export default function InteractionManager({ editor, onClose }: InteractionManagerProps) {
    const [selectedComponent, setSelectedComponent] = useState<any>(null);
    const [interactions, setInteractions] = useState<Interaction[]>([]);
    const [activeTab, setActiveTab] = useState<'manage' | 'create'>('manage');

    // New Interaction Form State
    const [trigger, setTrigger] = useState<'click' | 'mouseenter' | 'mouseleave' | 'change' | 'load'>('click');
    const [actionType, setActionType] = useState<'animate' | 'utility' | 'nav' | 'custom'>('animate');
    const [selectedPreset, setSelectedPreset] = useState<string>('Bounce');
    const [customCode, setCustomCode] = useState('');

    // Parameters
    const [duration, setDuration] = useState(500);
    const [intensity, setIntensity] = useState(10);
    const [scaleFactor, setScaleFactor] = useState(1.1);

    useEffect(() => {
        const update = () => {
            const selected = editor.getSelected();
            setSelectedComponent(selected);
            if (selected) {
                const existing = selected.getAttributes()['data-interactions'];
                if (existing) {
                    try {
                        setInteractions(JSON.parse(existing));
                    } catch (e) { setInteractions([]); }
                } else {
                    setInteractions([]);
                }
            } else {
                setInteractions([]);
            }
        };

        editor.on('component:selected', update);
        update();
        return () => { editor.off('component:selected', update); };
    }, [editor]);

    const saveInteractions = (newInteractions: Interaction[]) => {
        if (!selectedComponent) return;
        selectedComponent.addAttributes({ 'data-interactions': JSON.stringify(newInteractions) });
        setInteractions(newInteractions);
        editor.trigger('component:update');
    };

    const addInteraction = () => {
        let finalCode = '';

        if (actionType === 'animate') {
            const preset = ANIMATION_PRESETS.find(p => p.name === selectedPreset);
            if (preset) {
                finalCode = preset.code
                    .replace(/\$DURATION/g, duration.toString())
                    .replace(/\$INTENSITY/g, intensity.toString())
                    .replace(/\$j_scale/g, scaleFactor.toString());
            }
        } else if (actionType === 'utility') {
            const preset = UTILITY_PRESETS.find(p => p.name === selectedPreset);
            if (preset) finalCode = preset.code;
        } else if (actionType === 'custom') {
            finalCode = customCode;
        }

        const newInt: Interaction = {
            id: Date.now().toString(),
            trigger,
            actionType,
            presetName: actionType === 'animate' || actionType === 'utility' ? selectedPreset : undefined,
            code: finalCode
        };

        const updated = [...interactions, newInt];

        saveInteractions(updated);
        setActiveTab('manage'); // Switch back after adding
    };

    const removeInteraction = (id: string) => {
        saveInteractions(interactions.filter(i => i.id !== id));
    };

    if (!selectedComponent) {
        return (
            <DraggableWindow title="Interaction Studio" onClose={onClose} initialWidth={500} initialHeight={250}>
                <div style={{
                    padding: 30,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    height: '100%', justifyContent: 'center'
                }}>
                    <MousePointer size={48} className="text-gray-500 mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Element Selected</h3>
                    <p className="text-gray-400 text-center mb-6">Select an element on the canvas to add animations or interactions.</p>
                </div>
            </DraggableWindow>
        );
    }

    return (
        <DraggableWindow title="Interaction Studio" onClose={onClose} initialWidth={500} initialHeight={650}>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
                <Tab label="Active Interactions" active={activeTab === 'manage'} onClick={() => setActiveTab('manage')} />
                <Tab label="Add New" active={activeTab === 'create'} onClick={() => setActiveTab('create')} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>

                {activeTab === 'manage' && (
                    <div>
                        {interactions.length === 0 ? (
                            <div style={{ textAlign: 'center', color: '#666', padding: 20, fontStyle: 'italic', border: '1px dashed #333', borderRadius: 4 }}>
                                No interactions added yet.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {interactions.map(int => (
                                    <div key={int.id} style={{ background: '#252525', border: '1px solid #333', padding: '10px 15px', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                background: '#1e3a8a', color: '#93c5fd', border: '1px solid #1e40af',
                                                padding: '2px 6px', borderRadius: 4, fontSize: 10, textTransform: 'uppercase', fontFamily: 'monospace'
                                            }}>
                                                {int.trigger}
                                            </div>
                                            <div style={{ fontSize: 13, color: '#ccc', fontWeight: 500 }}>
                                                {int.presetName || 'Custom Script'}
                                            </div>
                                        </div>
                                        <button onClick={() => removeInteraction(int.id)} style={{ color: '#666', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div style={{ marginTop: 20 }}>
                            <button
                                onClick={() => setActiveTab('create')}
                                style={{ width: '100%', padding: 10, background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 500 }}
                            >
                                Create New Interaction
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'create' && (
                    <div>
                        <ControlGroup title="1. Trigger (When)">
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {['click', 'mouseenter', 'mouseleave', 'load', 'change'].map(t => (
                                    <Chip key={t} label={t} active={trigger === t} onClick={() => setTrigger(t as any)} />
                                ))}
                            </div>
                        </ControlGroup>

                        <ControlGroup title="2. Action Type">
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {['animate', 'utility', 'custom'].map(t => (
                                    <Chip key={t} label={t} active={actionType === t} onClick={() => setActionType(t as any)} />
                                ))}
                            </div>
                        </ControlGroup>

                        {actionType === 'animate' && (
                            <div style={{ animation: 'fadeIn 0.2s' }}>
                                <ControlGroup title="3. Choose Effect">
                                    <select
                                        value={selectedPreset}
                                        onChange={(e) => setSelectedPreset(e.target.value)}
                                        style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #444', borderRadius: 4 }}
                                    >
                                        {ANIMATION_PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                    </select>
                                </ControlGroup>

                                <ControlGroup title="4. Customize">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                        <div>
                                            <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Duration ({duration}ms)</div>
                                            <input
                                                type="range" min="100" max="3000" step="100"
                                                value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                                                style={{ width: '100%' }}
                                            />
                                        </div>
                                        {selectedPreset.includes('Magnify') || selectedPreset.includes('Pulse') ? (
                                            <div>
                                                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Scale (x{scaleFactor})</div>
                                                <input
                                                    type="range" min="0.5" max="2.0" step="0.1"
                                                    value={scaleFactor} onChange={(e) => setScaleFactor(Number(e.target.value))}
                                                    style={{ width: '100%' }}
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Intensity ({intensity}px)</div>
                                                <input
                                                    type="range" min="5" max="100" step="5"
                                                    value={intensity} onChange={(e) => setIntensity(Number(e.target.value))}
                                                    style={{ width: '100%' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </ControlGroup>
                            </div>
                        )}

                        {actionType === 'utility' && (
                            <ControlGroup title="3. Utility Function">
                                <select
                                    value={selectedPreset}
                                    onChange={(e) => setSelectedPreset(e.target.value)}
                                    style={{ width: '100%', padding: 8, background: '#333', color: 'white', border: '1px solid #444', borderRadius: 4 }}
                                >
                                    {UTILITY_PRESETS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                </select>
                            </ControlGroup>
                        )}

                        {actionType === 'custom' && (
                            <ControlGroup title="3. Custom JavaScript">
                                <textarea
                                    value={customCode}
                                    onChange={(e) => setCustomCode(e.target.value)}
                                    placeholder="e.target.style.color = 'red';"
                                    style={{ width: '100%', height: 100, padding: 8, background: '#333', color: 'white', border: '1px solid #444', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 }}
                                />
                            </ControlGroup>
                        )}

                        <button
                            onClick={addInteraction}
                            style={{ width: '100%', marginTop: 20, padding: 10, background: '#22c55e', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                        >
                            Add Interaction
                        </button>

                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ padding: 10, borderTop: '1px solid #333', background: '#252525', borderRadius: '0 0 8px 8px', fontSize: 11, color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                <span>Selected: {selectedComponent.get('tagName')}</span>
                <span>Auto-Save Enabled</span>
            </div>
        </DraggableWindow>
    );
}

// Re-using the exact same sub-components to match the visual style
const Tab = ({ label, active, onClick }: any) => (
    <div onClick={onClick} style={{ flex: 1, textAlign: 'center', padding: '12px 0', borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent', color: active ? '#fff' : '#888', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
        {label}
    </div>
);

const ControlGroup = ({ title, children }: any) => (
    <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
        <div>{children}</div>
    </div>
);

const Chip = ({ label, active, onClick }: any) => (
    <button onClick={onClick} style={{
        background: active ? '#3b82f6' : '#333', color: 'white',
        border: 'none', padding: '6px 12px', borderRadius: 4, fontSize: 13, cursor: 'pointer'
    }}>
        {label}
    </button>
);
