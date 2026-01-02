
import { useEffect, useState } from 'react';
import { Editor } from 'grapesjs';
import { Check } from 'lucide-react';
import DraggableWindow from './DraggableWindow';

interface TailwindPaletteProps {
    editor: Editor | null;
    onClose: () => void;
}

// const colors = ... (removed)
const basicColors = ['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink', 'gray'];
const intensities = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];

export default function TailwindPalette({ editor, onClose }: TailwindPaletteProps) {
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'layout' | 'effects'>('colors');
    const [modifier, setModifier] = useState<'' | 'hover:' | 'focus:'>('');

    // For color picker logic
    const [colorMode, setColorMode] = useState<'bg' | 'text' | 'border' | 'from' | 'to'>('bg');
    const [selectedColorFamily, setSelectedColorFamily] = useState<string | null>(null);

    useEffect(() => {
        if (!editor) return;
        const update = () => {
            const selected = editor.getSelected();
            setSelectedClasses(selected ? selected.getClasses() : []);
        };
        editor.on('component:selected', update);
        editor.on('component:styleUpdate', update);
        editor.on('component:update:classes', update);
        return () => {
            editor.off('component:selected', update);
            editor.off('component:styleUpdate', update);
            editor.off('component:update:classes', update);
        };
    }, [editor]);

    const toggleClass = (cls: string) => {
        const selected = editor?.getSelected();
        if (!selected) return;

        const finalClass = modifier + cls;
        const isAdding = !selectedClasses.includes(finalClass);

        if (isAdding) {
            selected.addClass(finalClass);

            // --- Smart Dependency Injection ---
            // If adding a transform-related class, ensure 'transform' exists.
            // If using a modifier (hover/focus), also ensure a transition exists.

            const isTransform = cls.startsWith('scale') || cls.startsWith('rotate') || cls.startsWith('translate') || cls.startsWith('skew');

            if (isTransform) {
                // 1. Ensure base 'transform' class is present
                const currentClasses = selected.getClasses();
                if (!currentClasses.includes('transform')) {
                    selected.addClass('transform');
                }

                // 2. If hovering/focusing, ensure transition
                // We prefer 'transition-transform' for performance, or generic 'transition'
                if (modifier) {
                    const hasTransition = currentClasses.some((c: string) => c.startsWith('transition'));
                    if (!hasTransition) {
                        selected.addClass('transition-transform');
                        // Also good default duration/ease?
                        // Let's not be too aggressive, but transition-transform usually implies a default duration in standard tailwind (none), 
                        // actually standard tailwind 'transition' sets all. 'transition-transform' sets property. 
                        // It needs a duration. Default is usually 150ms if not specified? 
                        // Actually explicit duration is better. 
                        // Let's just add 'duration-300' if no duration exists.
                        const hasDuration = currentClasses.some((c: string) => c.startsWith('duration-'));
                        if (!hasDuration) selected.addClass('duration-300');
                    }
                }
            }
        } else {
            selected.removeClass(finalClass);
        }
        setSelectedClasses(selected.getClasses());
    };

    if (!editor) return null;

    return (
        <DraggableWindow title="Tailwind Assistant" onClose={onClose} initialWidth={500} initialHeight={600}>
            {/* Modifier Toggles (Hover/Focus) */}

            {/* Modifier Toggles (Hover/Focus) */}
            <div style={{ padding: '10px 20px', background: '#252525', borderBottom: '1px solid #333', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>STATE:</span>
                <button onClick={() => setModifier('')} style={{ padding: '4px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', background: modifier === '' ? '#3b82f6' : '#333', color: 'white', fontSize: 12 }}>Normal</button>
                <button onClick={() => setModifier('hover:')} style={{ padding: '4px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', background: modifier === 'hover:' ? '#3b82f6' : '#333', color: 'white', fontSize: 12 }}>Hover</button>
                <button onClick={() => setModifier('focus:')} style={{ padding: '4px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', background: modifier === 'focus:' ? '#3b82f6' : '#333', color: 'white', fontSize: 12 }}>Focus</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #333' }}>
                <Tab label="Colors" active={activeTab === 'colors'} onClick={() => setActiveTab('colors')} />
                <Tab label="Typography" active={activeTab === 'typography'} onClick={() => setActiveTab('typography')} />
                <Tab label="Layout" active={activeTab === 'layout'} onClick={() => setActiveTab('layout')} />
                <Tab label="Effects" active={activeTab === 'effects'} onClick={() => setActiveTab('effects')} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>

                {/* Active Classes Summary */}
                <div style={{ marginBottom: 20, padding: 10, background: '#252525', borderRadius: 4 }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', color: '#666', marginBottom: 5 }}>Active Classes</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {selectedClasses.length === 0 && <span style={{ color: '#555', fontSize: 13 }}>No classes selected</span>}
                        {selectedClasses.map(c => (
                            <span key={c} onClick={() => {
                                // removing logic needs to be aware of the exact string value
                                const selected = editor?.getSelected();
                                if (selected) { selected.removeClass(c); setSelectedClasses(selected.getClasses()); }
                            }} style={{ background: '#333', color: '#ccc', borderRadius: 12, padding: '2px 8px', fontSize: 12, cursor: 'pointer', border: '1px solid #444' }}>
                                {c} &times;
                            </span>
                        ))}
                    </div>
                </div>

                {/* Colors Tab */}
                {activeTab === 'colors' && (
                    <div>
                        <div style={{ display: 'flex', marginBottom: 15, gap: 10 }}>
                            <button onClick={() => setColorMode('bg')} style={{ flex: 1, padding: 8, background: colorMode === 'bg' ? '#3b82f6' : '#333', color: 'white', border: 'none', borderRadius: 4 }}>Background</button>
                            <button onClick={() => setColorMode('text')} style={{ flex: 1, padding: 8, background: colorMode === 'text' ? '#3b82f6' : '#333', color: 'white', border: 'none', borderRadius: 4 }}>Text</button>
                            <button onClick={() => setColorMode('border')} style={{ flex: 1, padding: 8, background: colorMode === 'border' ? '#3b82f6' : '#333', color: 'white', border: 'none', borderRadius: 4 }}>Border</button>
                            <button onClick={() => setColorMode('from')} style={{ flex: 1, padding: 8, background: colorMode === 'from' ? '#8b5cf6' : '#333', color: 'white', border: 'none', borderRadius: 4 }}>From</button>
                            <button onClick={() => setColorMode('to')} style={{ flex: 1, padding: 8, background: colorMode === 'to' ? '#ec4899' : '#333', color: 'white', border: 'none', borderRadius: 4 }}>To</button>
                        </div>

                        {(colorMode === 'from' || colorMode === 'to') && (
                            <div style={{ marginBottom: 15, padding: 10, background: '#2a2a2a', borderRadius: 4 }}>
                                <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 5 }}>Gradient Direction</div>
                                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                    {['bg-gradient-to-t', 'bg-gradient-to-tr', 'bg-gradient-to-r', 'bg-gradient-to-br', 'bg-gradient-to-b', 'bg-gradient-to-bl', 'bg-gradient-to-l', 'bg-gradient-to-tl', 'bg-none'].map(d => (
                                        <Chip key={d} label={d.replace('bg-gradient-', '')} active={selectedClasses.includes(modifier + d)} onClick={() => toggleClass(d)} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ marginBottom: 10, fontWeight: 'bold', fontSize: 13 }}>
                            {colorMode === 'from' ? 'Gradient Start Color' : colorMode === 'to' ? 'Gradient End Color' : 'Basic Colors'}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                            {basicColors.map(c => (
                                <div key={c}
                                    onClick={() => setSelectedColorFamily(c)}
                                    style={{
                                        width: 32, height: 32, borderRadius: '50%',
                                        background: getCssColor(c, '500'),
                                        cursor: 'pointer',
                                        border: selectedColorFamily === c ? '2px solid white' : '2px solid transparent',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                    }}
                                    title={c}
                                />
                            ))}
                        </div>

                        {selectedColorFamily && (
                            <div style={{ animation: 'fadeIn 0.2s' }}>
                                <div style={{ marginBottom: 10, fontWeight: 'bold', fontSize: 13, textTransform: 'capitalize' }}>{selectedColorFamily} Shades</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
                                    {intensities.map(i => {
                                        let prefix = colorMode === 'bg' ? 'bg' : colorMode === 'text' ? 'text' : colorMode === 'border' ? 'border' : colorMode;
                                        const cls = `${prefix} -${selectedColorFamily} -${i} `;
                                        const isActive = selectedClasses.includes(modifier + cls);
                                        return (
                                            <div key={i} onClick={() => toggleClass(cls)}
                                                style={{
                                                    height: 40, borderRadius: 4,
                                                    background: getCssColor(selectedColorFamily, i),
                                                    cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    border: isActive ? '2px solid white' : '1px solid #333',
                                                    color: parseInt(i) > 400 ? 'white' : 'black',
                                                    fontSize: 11
                                                }}>
                                                {isActive && <Check size={14} />}
                                                {!isActive && i}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Typography Tab */}
                {activeTab === 'typography' && (
                    <div>
                        <ControlGroup title="Size">
                            {['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl'].map(c => (
                                <Chip key={c} label={c.replace('text-', '')} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>
                        <ControlGroup title="Weight">
                            {['font-thin', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black'].map(c => (
                                <Chip key={c} label={c.replace('font-', '')} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>
                        <ControlGroup title="Alignment & Decoration">
                            {['text-left', 'text-center', 'text-right', 'text-justify', 'underline', 'line-through', 'no-underline', 'uppercase', 'lowercase', 'capitalize'].map(c => (
                                <Chip key={c} label={c.replace('text-', '')} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>
                        <ControlGroup title="Letter Spacing">
                            {['tracking-tighter', 'tracking-normal', 'tracking-widest'].map(c => (
                                <Chip key={c} label={c.replace('tracking-', '')} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>
                    </div>
                )}

                {/* Layout Tab */}
                {activeTab === 'layout' && (
                    <div>
                        <ControlGroup title="Sizing (Fit to Page)">
                            {['w-full', 'h-full', 'w-screen', 'h-screen', 'min-h-screen', 'max-w-screen-sm', 'max-w-screen-md', 'max-w-screen-lg', 'max-w-screen-xl', 'max-w-full'].map(c => (
                                <Chip key={c} label={c} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>
                        <ControlGroup title="Padding (All Sides)">
                            {['p-0', 'p-1', 'p-2', 'p-4', 'p-6', 'p-8', 'p-12', 'p-16'].map(c => (
                                <Chip key={c} label={c} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>
                        <ControlGroup title="Margin (All Sides)">
                            {['m-0', 'm-1', 'm-2', 'm-4', 'm-6', 'm-8', 'm-12', 'm-16', 'mx-auto', 'my-auto'].map(c => (
                                <Chip key={c} label={c} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>
                        <ControlGroup title="Display">
                            {['block', 'flex', 'grid', 'inline-block', 'hidden'].map(c => (
                                <Chip key={c} label={c} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>
                        <ControlGroup title="Flex Alignment">
                            {['items-center', 'items-start', 'items-end', 'justify-center', 'justify-between', 'justify-start', 'justify-end', 'flex-col', 'flex-row', 'flex-wrap', 'gap-2', 'gap-4', 'gap-8'].map(c => (
                                <Chip key={c} label={c} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>
                        <ControlGroup title="Border Radius">
                            {['rounded-none', 'rounded-sm', 'rounded', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full'].map(c => (
                                <Chip key={c} label={c.replace('rounded-', '') || 'md'} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>
                        <ControlGroup title="Border Width">
                            {['border', 'border-0', 'border-2', 'border-4', 'border-8'].map(c => (
                                <Chip key={c} label={c} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>
                    </div>
                )}

                {/* EFFECTS TAB */}
                {activeTab === 'effects' && (
                    <div>
                        <ControlGroup title="Shadows">
                            {['shadow-none', 'shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl', 'shadow-inner'].map(c => (
                                <Chip key={c} label={c} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>

                        <ControlGroup title="Opacity">
                            {['opacity-0', 'opacity-25', 'opacity-50', 'opacity-75', 'opacity-100'].map(c => (
                                <Chip key={c} label={c} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>

                        <ControlGroup title="Transitions">
                            {['transition', 'transition-all', 'transition-colors', 'transition-opacity', 'transition-transform', 'transform'].map(c => (
                                <Chip key={c} label={c} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>

                        <ControlGroup title="Duration (Speed)">
                            {['duration-75', 'duration-100', 'duration-150', 'duration-200', 'duration-300', 'duration-500', 'duration-700', 'duration-1000'].map(c => (
                                <Chip key={c} label={c.replace('duration-', '') + 'ms'} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>

                        <ControlGroup title="Feel (Ease)">
                            {['ease-linear', 'ease-in', 'ease-out', 'ease-in-out'].map(c => (
                                <Chip key={c} label={c.replace('ease-', '')} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>

                        <ControlGroup title="Animations">
                            {['animate-none', 'animate-spin', 'animate-ping', 'animate-pulse', 'animate-bounce'].map(c => (
                                <Chip key={c} label={c.replace('animate-', '')} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>

                        <ControlGroup title="Transform: Scale">
                            {['scale-50', 'scale-75', 'scale-90', 'scale-95', 'scale-100', 'scale-105', 'scale-110', 'scale-125', 'scale-150'].map(c => (
                                <Chip key={c} label={c.replace('scale-', '') + '%'} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>

                        <ControlGroup title="Transform: Rotate">
                            {['rotate-0', 'rotate-1', 'rotate-2', 'rotate-3', 'rotate-6', 'rotate-12', 'rotate-45', 'rotate-90', 'rotate-180'].map(c => (
                                <Chip key={c} label={c.replace('rotate-', '') + '°'} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>

                        <ControlGroup title="Transform: Translate (Move)">
                            {['translate-x-1', 'translate-x-4', 'translate-y-1', 'translate-y-4', '-translate-y-1', '-translate-y-4'].map(c => (
                                <Chip key={c} label={c} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>

                        <ControlGroup title="Transform: Skew">
                            {['skew-x-3', 'skew-y-3', '-skew-x-3', '-skew-y-3'].map(c => (
                                <Chip key={c} label={c} active={selectedClasses.includes(modifier + c)} onClick={() => toggleClass(c)} />
                            ))}
                        </ControlGroup>
                    </div>
                )}

                {/* Content ... */}
            </div>
        </DraggableWindow>
    );
}

const Tab = ({ label, active, onClick }: any) => (
    <div onClick={onClick} style={{ flex: 1, textAlign: 'center', padding: '12px 0', borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent', color: active ? '#fff' : '#888', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
        {label}
    </div>
);

const ControlGroup = ({ title, children }: any) => (
    <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>
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

const tailwindColors: Record<string, Record<string, string>> = {
    slate: { '50': '#f8fafc', '100': '#f1f5f9', '200': '#e2e8f0', '300': '#cbd5e1', '400': '#94a3b8', '500': '#64748b', '600': '#475569', '700': '#334155', '800': '#1e293b', '900': '#0f172a', '950': '#020617' },
    gray: { '50': '#f9fafb', '100': '#f3f4f6', '200': '#e5e7eb', '300': '#d1d5db', '400': '#9ca3af', '500': '#6b7280', '600': '#4b5563', '700': '#374151', '800': '#1f2937', '900': '#111827', '950': '#030712' },
    red: { '50': '#fef2f2', '100': '#fee2e2', '200': '#fecaca', '300': '#fca5a5', '400': '#f87171', '500': '#ef4444', '600': '#dc2626', '700': '#b91c1c', '800': '#991b1b', '900': '#7f1d1d', '950': '#450a0a' },
    orange: { '50': '#fff7ed', '100': '#ffedd5', '200': '#fed7aa', '300': '#fdba74', '400': '#fb923c', '500': '#f97316', '600': '#ea580c', '700': '#c2410c', '800': '#9a3412', '900': '#7c2d12', '950': '#431407' },
    amber: { '50': '#fffbeb', '100': '#fef3c7', '200': '#fde68a', '300': '#fcd34d', '400': '#fbbf24', '500': '#f59e0b', '600': '#d97706', '700': '#b45309', '800': '#92400e', '900': '#78350f', '950': '#451a03' },
    yellow: { '50': '#fefce8', '100': '#fef9c3', '200': '#fef08a', '300': '#fde047', '400': '#facc15', '500': '#eab308', '600': '#ca8a04', '700': '#a16207', '800': '#854d0e', '900': '#713f12', '950': '#422006' },
    lime: { '50': '#f7fee7', '100': '#ecfccb', '200': '#d9f99d', '300': '#bef264', '400': '#a3e635', '500': '#84cc16', '600': '#65a30d', '700': '#4d7c0f', '800': '#3f6212', '900': '#365314', '950': '#1a2e05' },
    green: { '50': '#f0fdf4', '100': '#dcfce7', '200': '#bbf7d0', '300': '#86efac', '400': '#4ade80', '500': '#22c55e', '600': '#16a34a', '700': '#15803d', '800': '#166534', '900': '#14532d', '950': '#052e16' },
    emerald: { '50': '#ecfdf5', '100': '#d1fae5', '200': '#a7f3d0', '300': '#6ee7b7', '400': '#34d399', '500': '#10b981', '600': '#059669', '700': '#047857', '800': '#065f46', '900': '#064e3b', '950': '#022c22' },
    teal: { '50': '#f0fdfa', '100': '#ccfbf1', '200': '#99f6e4', '300': '#5eead4', '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488', '700': '#0f766e', '800': '#115e59', '900': '#134e4a', '950': '#042f2e' },
    cyan: { '50': '#ecfeff', '100': '#cffafe', '200': '#a5f3fc', '300': '#67e8f9', '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2', '700': '#0e7490', '800': '#155f75', '900': '#164e63', '950': '#083344' },
    sky: { '50': '#f0f9ff', '100': '#e0f2fe', '200': '#bae6fd', '300': '#7dd3fc', '400': '#38bdf8', '500': '#0ea5e9', '600': '#0284c7', '700': '#0369a1', '800': '#075985', '900': '#0c4a6e', '950': '#082f49' },
    blue: { '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a', '950': '#172554' },
    indigo: { '50': '#eef2ff', '100': '#e0e7ff', '200': '#c7d2fe', '300': '#a5b4fc', '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca', '800': '#3730a3', '900': '#312e81', '950': '#1e1b4b' },
    violet: { '50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe', '300': '#c4b5fd', '400': '#a78bfa', '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9', '800': '#5b21b6', '900': '#4c1d95', '950': '#2e1065' },
    purple: { '50': '#faf5ff', '100': '#f3e8ff', '200': '#e9d5ff', '300': '#d8b4fe', '400': '#c084fc', '500': '#a855f7', '600': '#9333ea', '700': '#7e22ce', '800': '#6b21a8', '900': '#581c87', '950': '#3b0764' },
    fuchsia: { '50': '#fdf4ff', '100': '#fae8ff', '200': '#f5d0fe', '300': '#f0abfc', '400': '#e879f9', '500': '#d946ef', '600': '#c026d3', '700': '#a21caf', '800': '#86198f', '900': '#701a75', '950': '#4a044e' },
    pink: { '50': '#fdf2f8', '100': '#fce7f3', '200': '#fbcfe8', '300': '#f9a8d4', '400': '#f472b6', '500': '#ec4899', '600': '#db2777', '700': '#be185d', '800': '#9d174d', '900': '#831843', '950': '#500724' },
    rose: { '50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3', '300': '#fda4af', '400': '#fb7185', '500': '#f43f5e', '600': '#e11d48', '700': '#be123c', '800': '#9f1239', '900': '#881337', '950': '#4c0519' },
};

function getCssColor(name: string, intensity: string) {
    if (tailwindColors[name] && tailwindColors[name][intensity]) {
        return tailwindColors[name][intensity];
    }
    // Fallback for unknown colors
    return '#ccc';
}

