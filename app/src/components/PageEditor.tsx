import { useEffect, useRef, useState } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import webpagePreset from 'grapesjs-preset-webpage';
import { invoke } from '@tauri-apps/api/core';
import { generateContent } from '../services/ai';
import Editor from '@monaco-editor/react';
import TailwindPalette from './TailwindPalette';

interface PageEditorProps {
    projectPath: string;
    filename: string;
    neighbors?: { id: string; label: string }[];
    onNavigate?: (id: string) => void;
}

export default function PageEditor({ projectPath, filename, neighbors, onNavigate }: PageEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const editorInstance = useRef<any>(null);
    const [isTailwind, setIsTailwind] = useState(false);
    const [codeContent, setCodeContent] = useState("");

    const isHtml = filename.toLowerCase().endsWith('.html');
    const [loading, setLoading] = useState(false);
    const [showPalette, setShowPalette] = useState(false);

    // Determines language for Monaco
    const language = filename.endsWith('.json') ? 'json' :
        filename.endsWith('.css') ? 'css' :
            filename.endsWith('.html') ? 'html' :
                'javascript'; // jsx/tsx/vue

    // Load content for code mode
    useEffect(() => {
        if (!isHtml) {
            const load = async () => {
                setLoading(true);
                try {
                    const c = await invoke<string>('read_page_content', { path: projectPath, filename });
                    setCodeContent(c);
                } catch (e) {
                    setCodeContent(`// Error reading file: ${e}`);
                }
                setLoading(false);
            };
            load();
        }
    }, [projectPath, filename, isHtml]);

    const saveCode = async (value?: string) => {
        // If value passed (from Monaco onChange), use it, else use state
        const contentToSave = value !== undefined ? value : codeContent;
        try {
            await invoke('save_page_content', {
                path: projectPath,
                filename,
                content: contentToSave
            });
            // alert("Saved!"); // Optional toast
        } catch (err) {
            alert("Save failed: " + err);
        }
    };

    // GrapesJS Lifecycle
    useEffect(() => {
        if (!isHtml || !editorRef.current) return;

        // If instance exists, destroy it first to avoid conflicts
        if (editorInstance.current) {
            editorInstance.current.destroy();
            editorInstance.current = null;
        }

        // Synchronous init
        const editor = grapesjs.init({
            container: editorRef.current,
            fromElement: false,
            height: '100%',
            width: 'auto',
            storageManager: { type: 'none', autosave: false, autoload: false },
            plugins: [webpagePreset],
            pluginsOpts: {
                [webpagePreset as any]: {}
            },
            canvas: {
                styles: [
                    // Base styles if needed
                ],
                scripts: []
            }
        });

        editorInstance.current = editor;

        // Force the body to be a valid drop target with height on load
        editor.on('load', () => {
            const wrapper = editor.getWrapper();
            if (wrapper) {
                wrapper.set({
                    droppable: true,
                    stylable: true,
                    badgable: false,
                    selectable: true,
                    hoverable: true,
                });
                // Use proper style object
                wrapper.addStyle({
                    'min-height': '100vh',
                    'width': '100%',
                    'overflow-x': 'hidden',
                    'display': 'block',
                    'padding': '10px'
                });
            }
            editor.refresh();
        });

        // --- Editor Configuration ---
        editor.Panels.addButton('options', { id: 'save-db', className: 'fa fa-floppy-o', command: 'save-db', attributes: { title: 'Save Project' } });

        // Add Tailwind Button
        editor.Panels.addButton('options', {
            id: 'toggle-tailwind',
            className: 'fa fa-css3',
            command: 'toggle-tailwind',
            attributes: { title: 'Toggle Tailwind' }
        });

        editor.Panels.addButton('options', { id: 'open-palette', className: 'fa fa-paint-brush', command: 'open-palette', attributes: { title: 'Open Palette' } });
        editor.Commands.add('toggle-tailwind', {
            run: () => setIsTailwind(prev => !prev)
        });

        // Initialize Double-Click to Add
        // We need to wait for blocks to be rendered
        editor.on('load', () => {
            const blockManager = editor.BlockManager;
            const blocks = blockManager.getAll();
            const container = editor.getContainer();

            // --- Define Custom Blocks ---
            const addBlock = (id: string, label: string, content: any, attributes: any = {}) => {
                blockManager.add(id, {
                    label,
                    attributes: { ...attributes, title: label }, // Ensure title matches label for our double-click logic
                    content
                });
            }

            // 1. Link Block (Override/Fix)
            addBlock('link-block', 'Link Block', {
                tagName: 'a',
                classes: ['text-blue-500', 'underline'],
                content: 'Link Text',
                attributes: { href: '#' }
            }, { class: 'fa fa-link' });

            // 2. Input
            addBlock('input-block', 'Input Field', {
                tagName: 'input',
                classes: ['border', 'border-gray-300', 'p-2', 'rounded', 'w-full'],
                attributes: { placeholder: 'Type here...' }
            }, { class: 'fa fa-pencil' });

            // 3. Button
            addBlock('button-block', 'Button', {
                tagName: 'button',
                classes: ['bg-blue-600', 'text-white', 'px-4', 'py-2', 'rounded', 'hover:bg-blue-700', 'transition'],
                content: 'Click Me'
            }, { class: 'fa fa-square' });

            // 4. Dropdown
            addBlock('dropdown-block', 'Pop Down', {
                tagName: 'select',
                classes: ['border', 'border-gray-300', 'p-2', 'rounded'],
                components: [
                    { tagName: 'option', content: 'Option 1' },
                    { tagName: 'option', content: 'Option 2' }
                ]
            }, { class: 'fa fa-caret-down' });

            // 5. Scrolling Text (Marquee)
            addBlock('scrolling-text', 'Scrolling Text',
                `<div class="overflow-hidden whitespace-nowrap bg-gray-100 p-2">
                   <div class="animate-marquee inline-block font-bold text-lg text-blue-600">
                       Breaking News: This is a scrolling text example!
                   </div>
                 </div>
                 <style>
                   @keyframes marquee {
                       0% { transform: translateX(100%); }
                       100% { transform: translateX(-100%); }
                   }
                   .animate-marquee {
                       animation: marquee 10s linear infinite;
                   }
                 </style>`,
                { class: 'fa fa-exchange' });

            // 6. Card
            addBlock('card-block', 'Basic Card',
                `<div class="max-w-sm rounded overflow-hidden shadow-lg bg-white m-4">
                   <div class="h-48 bg-gray-300 flex items-center justify-center text-gray-500">Image Area</div>
                   <div class="px-6 py-4">
                       <div class="font-bold text-xl mb-2">Card Title</div>
                       <p class="text-gray-700 text-base">Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>
                   </div>
                 </div>`,
                { class: 'fa fa-id-card' });

            // 7. Hover Tilt Card
            addBlock('tilt-card', 'Hovering Tilt',
                `<div class="group perspective-1000 m-4">
                   <div class="transform transition-transform duration-500 hover:rotate-3 hover:scale-105 shadow-xl rounded-xl p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                       <h2 class="text-2xl font-bold mb-2">Hover Me!</h2>
                       <p>I tilt and scale when you hover over me.</p>
                   </div>
                 </div>`,
                { class: 'fa fa-paper-plane' });

            // Event Delegation for stability
            if (container) {
                container.addEventListener('dblclick', (e: any) => {
                    const target = e.target as HTMLElement;
                    const blockEl = target.closest('.gjs-block');
                    if (blockEl) {
                        // Robust lookup: Title, then text content, then ID
                        const title = blockEl.getAttribute('title');
                        const label = blockEl.textContent?.trim(); // This is often the visible label

                        // We iterate because we want to fuzzy match
                        const block = blocks.find((b: any) => {
                            const bLabel = b.get('label');
                            const bId = b.get('id');
                            return bLabel === title || bId === title || bLabel === label;
                        });

                        // Or if undefined, try strictly by ID if possible?

                        if (block) {
                            const content = block.get('content');
                            if (content) {
                                const newComps = editor.addComponents(content);
                                const component = newComps[0];

                                // Auto-scroll
                                const wrapper = editor.getWrapper();
                                const el = wrapper?.getEl();
                                if (el) el.scrollTop = el.scrollHeight;

                                if (component) editor.select(component);
                            }
                        }
                    }
                });
            }
        });

        editor.Panels.addButton('options', { id: 'open-palette', className: 'fa fa-paint-brush', command: 'open-palette', attributes: { title: 'Open Palette' } });
        editor.Panels.addButton('options', { id: 'ai-gen', className: 'fa fa-magic', command: 'ai-gen', attributes: { title: 'AI Gen' } });

        editor.Commands.add('open-palette', {
            run: () => {
                if (!isTailwind) {
                    // We check the refs inside the command execution to get latest state?
                    // Actually commands run in closure. But setIsTailwind triggers re-render,
                    // so we need to rely on the effect below to update UI.
                }
                setShowPalette(true);
            }
        });

        // Re-adding AI command fully to ensure it works
        editor.Commands.add('ai-gen', {
            run: async (edt) => {
                const userPrompt = prompt("What element do you want to add?");
                if (!userPrompt) return;
                try {
                    edt.Modal.setTitle('AI Generating...');
                    edt.Modal.setContent('Calling local LLM...');
                    edt.Modal.open();
                    const selected = edt.getSelected();
                    let contextHtml = edt.getHtml();
                    if (selected) contextHtml = selected.toHTML();

                    const tailwindEnabled = edt.Canvas.getDocument().getElementById('tailwind-css') !== null;

                    const html = await generateContent(userPrompt, contextHtml, tailwindEnabled);
                    edt.Modal.close();

                    if (html) {
                        if (selected) {
                            const lower = userPrompt.toLowerCase();
                            const isRep = lower.includes('change') || lower.includes('replace') || lower.includes('update');
                            if (isRep) selected.replaceWith(html);
                            else selected.append(html);
                        } else {
                            edt.addComponents(html);
                        }
                    }
                } catch (err) {
                    edt.Modal.close();
                    alert("AI Error: " + err);
                }
            }
        });

        // Save Command (same)
        editor.Commands.add('save-db', {
            run: async (editor) => {
                const html = editor.getHtml();
                const css = editor.getCss();
                const tailwindEnabled = editor.Canvas.getDocument().getElementById('tailwind-css') !== null;
                const fullContent = `<!DOCTYPE html>\n<html>\n<head>\n<style>${css}</style>\n${tailwindEnabled ? '<link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">' : ''}\n</head>\n<body>\n${html}\n</body>\n</html>`;
                invoke('save_page_content', { path: projectPath, filename, content: fullContent });
            }
        });

        // Async Content Load
        const loadContent = async () => {
            try {
                const content = await invoke<string>('read_page_content', { path: projectPath, filename });
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');

                // Standard way to set content
                editor.setComponents(doc.body.innerHTML);

                // Re-apply wrapper settings immediately after content load
                const wrapper = editor.getWrapper();
                if (wrapper) {
                    wrapper.set({
                        droppable: true,
                        stylable: true,
                        badgable: false,
                        hoverable: true
                    });
                    wrapper.addStyle({
                        'min-height': '100vh',
                        'width': '100%',
                        'overflow-x': 'hidden',
                        'display': 'block',
                        'padding': '10px'
                    });
                }

                doc.head.querySelectorAll('style').forEach(s => editor.addComponents(`<style>${s.innerHTML}</style>`));

                const hasTailwind = !!doc.head.querySelector('link[href*="tailwindcss"]');
                if (hasTailwind) {
                    setIsTailwind(true);
                }

                editor.UndoManager.clear();

                // 4. REFRESH Editor to recalculate drop zones
                setTimeout(() => {
                    editor.refresh();
                }, 100);
            } catch (e) { console.error(e); }
        };
        loadContent();

        return () => {
            if (editorInstance.current) {
                editorInstance.current.destroy();
                editorInstance.current = null;
            }
        };
    }, [projectPath, filename, isHtml]); // Removed isTailwind

    // Dynamic Tailwind Injection
    useEffect(() => {
        const injectTailwind = () => {
            if (!editorInstance.current) return;
            const editor = editorInstance.current;
            const doc = editor.Canvas.getDocument();
            if (!doc || !doc.head) return;

            const head = doc.head;
            const existing = head.querySelector('#tailwind-css');

            if (isTailwind) {
                if (!existing) {
                    const link = doc.createElement('link');
                    link.id = 'tailwind-css';
                    link.rel = 'stylesheet';
                    link.href = 'https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css';
                    head.appendChild(link);
                }
                const btn = editor.Panels.getButton('options', 'toggle-tailwind');
                if (btn) btn.set('label', 'TW: ON');
            } else {
                if (existing) existing.remove();
                const btn = editor.Panels.getButton('options', 'toggle-tailwind');
                if (btn) btn.set('label', 'TW: OFF');
            }
        };

        // Try immediately
        injectTailwind();

        // Also ensure we handle the case where canvas is not yet ready
        const editor = editorInstance.current;
        if (editor) {
            editor.on('canvas:frame:load', injectTailwind);
        }

        return () => {
            if (editor) editor.off('canvas:frame:load', injectTailwind);
        };
    }, [isTailwind]);

    if (!isHtml) {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1e1e1e', color: '#d4d4d4' }}>
                <div style={{ padding: 10, borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: 'monospace' }}>Editing: {filename}</span>
                        {/* Navigation Dropdown */}
                        {neighbors && neighbors.length > 0 && (
                            <select
                                onChange={(e) => onNavigate && onNavigate(e.target.value)}
                                style={{ background: '#333', color: 'white', border: '1px solid #555', padding: 2, borderRadius: 4, maxWidth: 200 }}
                                value=""
                            >
                                <option value="" disabled>Go to imported file...</option>
                                {neighbors.map(n => (
                                    <option key={n.id} value={n.id}>{n.label}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <button onClick={() => saveCode()} style={{ background: '#0d99ff', color: 'white', border: 'none', padding: '5px 15px', borderRadius: 4, cursor: 'pointer' }}>Save Code</button>
                </div>
                {loading ? (
                    <div style={{ padding: 20 }}>Loading...</div>
                ) : (
                    <div style={{ flex: 1 }}>
                        <Editor
                            height="100%"
                            theme="vs-dark"
                            path={filename}
                            defaultLanguage={language}
                            value={codeContent}
                            onChange={(value) => {
                                if (value !== undefined) setCodeContent(value);
                            }}
                            options={{
                                minimap: { enabled: true },
                                fontSize: 14,
                            }}
                        />
                    </div>
                )}
            </div>
        );
    }

    // Moved to top

    // ... (rest of logic)

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div ref={editorRef} style={{ width: '100%', height: '100%' }} />
            {isTailwind && showPalette && editorInstance.current && (
                <TailwindPalette
                    editor={editorInstance.current}
                    onClose={() => setShowPalette(false)}
                />
            )}
        </div>
    );
}
