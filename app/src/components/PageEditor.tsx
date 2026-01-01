import { useEffect, useRef, useState } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import webpagePreset from 'grapesjs-preset-webpage';
import { invoke } from '@tauri-apps/api/core';
import { generateContent } from '../services/ai';
import Editor from '@monaco-editor/react';
import TailwindPalette from './TailwindPalette';
import { reactEditorConfig, serializeToJSX, parseJSXToHtml } from '../services/react-editor-config';
import InteractionManager from './InteractionManager';

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
    const [isVisualMode, setIsVisualMode] = useState(false); // Toggle for React/Vue

    const isHtml = filename.toLowerCase().endsWith('.html');
    const [loading, setLoading] = useState(false);
    const [showPalette, setShowPalette] = useState(false);
    const [showInteractionManager, setShowInteractionManager] = useState(false);

    // Determines language for Monaco
    const language = filename.endsWith('.json') ? 'json' :
        filename.endsWith('.css') ? 'css' :
            filename.endsWith('.html') ? 'html' :
                'javascript'; // jsx/tsx/vue

    // Load content for code mode
    useEffect(() => {
        // ALWAYS load content for code mode, even for HTML
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
    }, [projectPath, filename]);

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
        // Condition: Run if it IS HTML OR (Not HTML and Visual Mode IS ON)
        const shouldRunGrapes = isHtml || isVisualMode;
        if (!shouldRunGrapes || !editorRef.current) return;

        // If instance exists, destroy it first to avoid conflicts
        if (editorInstance.current) {
            editorInstance.current.destroy();
            editorInstance.current = null;
        }

        // Config based on mode
        const plugins = isHtml ? [webpagePreset] : [reactEditorConfig];
        const pluginsOpts = isHtml ? { [webpagePreset as any]: {} } : {};

        // Synchronous init
        const editor = grapesjs.init({
            container: editorRef.current,
            fromElement: false,
            height: '100%',
            width: 'auto',
            storageManager: { type: 'none', autosave: false, autoload: false },
            plugins: plugins as any[],
            pluginsOpts,
            canvas: {
                styles: [
                    isHtml
                        ? 'https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css'
                        : 'https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css'
                ],
                scripts: []
            }
        });

        editorInstance.current = editor;

        // Force the body to be a valid drop target with height on load
        editor.on('load', () => {
            const doc = editor.Canvas.getDocument();
            if (doc && doc.head) {
                // ... existing style injection code ...
            }

            // ENABLE RESIZING GLOBALLY
            const defaultType = editor.DomComponents.getType('default');
            const defaultModel = defaultType.model;
            editor.DomComponents.addType('default', {
                model: {
                    defaults: {
                        ...defaultModel.prototype.defaults,
                        resizable: {
                            // Options for resizing
                            tl: 1, // Top-left
                            tc: 1, // Top-center
                            tr: 1, // Top-right
                            cl: 1, // Center-left
                            cr: 1, // Center-right
                            bl: 1, // Bottom-left
                            bc: 1, // Bottom-center
                            br: 1, // Bottom-right
                        },
                        draggable: true,
                        droppable: true,
                    }
                }
            });

            // Force update existing components to be resizable
            editor.DomComponents.getComponents().forEach((comp: any) => {
                comp.set('resizable', { tl: 1, tc: 1, tr: 1, cl: 1, cr: 1, bl: 1, bc: 1, br: 1 });
            });

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
        editor.Panels.addButton('options', { id: 'open-interactions', className: 'fa fa-bolt', command: 'open-interactions', attributes: { title: 'JS Interactions' } });

        editor.Commands.add('toggle-tailwind', {
            run: () => setIsTailwind(prev => !prev)
        });

        editor.Commands.add('open-interactions', {
            run: () => {
                setShowPalette(false); // Close other panels
                setShowInteractionManager(true);
            }
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
                // Enhanced AI Interaction
                // 1. Show options first using GrapesJS modal or simple prompt?
                // GrapesJS modal is better but for speed we'll use a custom overlay in React if possible, 
                // but commands are outside react render.
                // We'll use a quick native-like UI injected into the modal.

                const modal = edt.Modal;
                modal.setTitle('AI Assistant');

                const content = document.createElement('div');
                content.innerHTML = `
                    <div style="display: flex; flex-direction: column; gap: 10px; padding: 10px;">
                        <button id="btn-append" style="padding: 10px; background: #2ea44f; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fa fa-plus"></i> Append New Element
                        </button>
                        <button id="btn-style" style="padding: 10px; background: #0d99ff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            <i class="fa fa-paint-brush"></i> Change Styles / Layout
                        </button>
                        <button id="btn-replace" style="padding: 10px; background: #d73a49; color: white; border: none; border-radius: 4px; cursor: pointer;">
                             <i class="fa fa-refresh"></i> Replace Selection
                        </button>
                        <button id="btn-all" style="padding: 10px; background: #6f42c1; color: white; border: none; border-radius: 4px; cursor: pointer;">
                             <i class="fa fa-magic"></i> Generate Whole Page (Overwrite)
                        </button>
                    </div>
                `;

                modal.setContent(content);
                modal.open();

                const handleSelection = async (mode: string) => {
                    modal.close();

                    let promptMsg = "Describe what you want to create:";
                    if (mode === 'style') promptMsg = "Describe the style changes (e.g., 'make background dark blue'):";
                    if (mode === 'replace') promptMsg = "Describe what should replace the selected element:";

                    const userPrompt = prompt(promptMsg);
                    if (!userPrompt) return;

                    try {
                        // Show Loading
                        modal.setTitle('AI Generating...');
                        modal.setContent('<div style="padding:20px; text-align:center;">Thinking...</div>');
                        modal.open();

                        const selected = edt.getSelected();
                        let contextHtml = edt.getHtml();
                        if (selected && mode !== 'all') contextHtml = selected.toHTML();
                        if (mode === 'all') contextHtml = "<body></body>"; // Reset context if overwriting

                        const tailwindEnabled = edt.Canvas.getDocument().getElementById('tailwind-css') !== null;

                        // Append instruction to prompt based on mode
                        let fullPrompt = userPrompt;
                        if (mode === 'style') fullPrompt += " (Update styles/classes only)";
                        if (mode === 'replace') fullPrompt += " (Replace content completely)";
                        if (mode === 'append') fullPrompt += " (Create new element)";
                        if (mode === 'all') fullPrompt += " (Create full page body content)";

                        const html = await generateContent(fullPrompt, contextHtml, tailwindEnabled);
                        modal.close();

                        if (html) {
                            if (mode === 'all') {
                                edt.setComponents(html);
                            } else if (mode === 'replace' && selected) {
                                selected.replaceWith(html);
                            } else if (mode === 'style' && selected) {
                                // For style, maybe we try to merge attributes? 
                                // Simple replace is safer for now as AI returns full tag.
                                selected.replaceWith(html);
                            } else {
                                // Append
                                if (selected) selected.append(html);
                                else edt.addComponents(html);
                            }
                        }
                    } catch (err) {
                        modal.close();
                        alert("AI Error: " + err);
                    }
                };

                content.querySelector('#btn-append')?.addEventListener('click', () => handleSelection('append'));
                content.querySelector('#btn-style')?.addEventListener('click', () => handleSelection('style'));
                content.querySelector('#btn-replace')?.addEventListener('click', () => handleSelection('replace'));
                content.querySelector('#btn-all')?.addEventListener('click', () => handleSelection('all'));
            }
        });

        // Save Command (same)
        editor.Commands.add('save-db', {
            run: async (editor) => {
                // Pre-process interactions
                // We iterate over all components and inject onclick attributes if data-interactions exist
                // This is a destructive operation for the VIEW, but fine for saving.
                // Actually, let's clone via getHtml logic if possible.
                // Better strategy: We assume the data-interactions are there. 
                // We let getHtml() return them. Then we post-process the string.

                let html = editor.getHtml();
                const css = editor.getCss();

                // 1. Parse HTML to inject events
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const elementsWithInteractions = doc.querySelectorAll('[data-interactions]');

                elementsWithInteractions.forEach(el => {
                    const raw = el.getAttribute('data-interactions');
                    if (raw) {
                        try {
                            const interactions = JSON.parse(raw);
                            interactions.forEach((int: any) => {
                                // For MVP we map:
                                // click -> onclick
                                // mouseover -> onmouseover
                                // mouseout -> onmouseout
                                // change -> onchange
                                // load -> onload (tricky on div, usually needs body or script)

                                const eventName = 'on' + int.trigger;
                                const existing = el.getAttribute(eventName) || '';
                                el.setAttribute(eventName, existing + int.code);
                            });
                            // Clean up attribute so it doesn't pollute production HTML too much (optional)
                            // el.removeAttribute('data-interactions'); 
                        } catch (e) { }
                    }
                });

                let finalHtml = doc.body.innerHTML;

                // --- Simple Formatter ---
                try {
                    // Add newlines between block tags for better readability
                    finalHtml = finalHtml.replace(/>\s*</g, '>\n<');
                    // Indent (Basic)
                    const lines = finalHtml.split('\n');
                    let formatted = '';
                    let indent = 0;
                    for (let i = 0; i < lines.length; i++) {
                        const l = lines[i].trim();
                        if (!l) continue;
                        if (l.match(/^<\//)) indent = Math.max(0, indent - 1);
                        formatted += '  '.repeat(indent) + l + '\n';
                        if (l.match(/^<[^/!].*>/) && !l.match(/<\//) && !l.match(/<br/) && !l.match(/<img/) && !l.match(/<input/) && !l.match(/<hr/)) indent++;
                    }
                    finalHtml = formatted;
                } catch (e) { console.error("Formatting error", e); }

                // Reconstruct Body Tag with Attributes
                const wrapper = editor.getWrapper();
                let bodyAttrsStr = '';
                if (wrapper) {
                    const attrs = wrapper.getAttributes();
                    // GrapesJS separates classes from attributes
                    const classes = wrapper.getClasses().join(' ');

                    Object.entries(attrs).forEach(([k, v]) => {
                        if (k !== 'class' && k !== 'id' && !k.startsWith('data-gjs')) {
                            bodyAttrsStr += ` ${k}="${v}"`;
                        }
                    });

                    if (classes) bodyAttrsStr += ` class="${classes}"`;
                    // ID
                    const id = wrapper.getId();
                    // Careful: GrapesJS sometimes assigns auto IDs. We only want user IDs.
                    if (id && !id.startsWith('wrapper')) bodyAttrsStr += ` id="${id}"`;
                }

                const tailwindEnabled = editor.Canvas.getDocument().getElementById('tailwind-css') !== null;
                const fullContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>${css}</style>
    ${tailwindEnabled ? '<link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">' : ''}
</head>
<body${bodyAttrsStr}>
${finalHtml}
</body>
</html>`;
                invoke('save_page_content', { path: projectPath, filename, content: fullContent });
            }
        });

        // Async Content Load
        const loadContent = async () => {
            try {
                // --- INJECT PROJECT CSS ---
                const injectProjectCss = async () => {
                    const cssFiles = ['src/index.css', 'src/App.css', 'index.css', 'App.css'];
                    let projectCss = "";
                    for (const file of cssFiles) {
                        try {
                            const content = await invoke<string>('read_page_content', { path: projectPath, filename: file });
                            if (content && !content.includes("File does not exist")) {
                                projectCss += `\n/* ${file} */\n${content}`;
                            }
                        } catch (e) { }
                    }

                    const doc = editorInstance.current?.Canvas.getDocument();
                    if (doc && doc.head && projectCss) {
                        const existing = doc.head.querySelector('#project-css');
                        if (existing) existing.remove();
                        const style = doc.createElement('style');
                        style.id = 'project-css';
                        style.innerHTML = projectCss;
                        doc.head.appendChild(style);
                        // Auto-Dark Mode trigger
                        if (projectCss.includes('dark')) editorInstance.current?.getWrapper().addClass('dark');
                    }
                };

                // Run after load
                setTimeout(injectProjectCss, 500);

                // If it's HTML, we load the file content and parse it into blocks
                if (isHtml) {
                    const content = await invoke<string>('read_page_content', { path: projectPath, filename });
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(content, 'text/html');

                    editor.setComponents(doc.body.innerHTML);
                    doc.head.querySelectorAll('style').forEach(s => editor.addComponents(`<style>${s.innerHTML}</style>`));

                    // Fix: Apply body attributes (classes, IDs, styles) to the canvas body
                    const bodyAttrs = doc.body.attributes;
                    const wrapper = editor.getWrapper(); // The 'Body' component in GrapesJS
                    if (wrapper) {
                        // Clear existing classes first to avoid duplication/conflicts
                        wrapper.setClass([]);

                        for (let i = 0; i < bodyAttrs.length; i++) {
                            const attr = bodyAttrs[i];
                            if (attr.name === 'class') {
                                // GrapesJS addClass handles space-separated strings
                                const classes = attr.value.split(/\s+/).filter(c => c);
                                wrapper.addClass(classes);
                            } else if (attr.name === 'id') {
                                // wrapper.set('attributes', { ...wrapper.getAttributes(), id: attr.value });
                                wrapper.setId(attr.value);
                            } else {
                                wrapper.addAttributes({ [attr.name]: attr.value });
                            }
                        }
                    }

                    const hasTailwind = !!doc.head.querySelector('link[href*="tailwindcss"]');
                    if (hasTailwind) {
                        setIsTailwind(true);
                        const btn = editor.Panels.getButton('options', 'toggle-tailwind');
                        if (btn) btn.set('label', 'TW: ON');
                    } else {
                        setIsTailwind(false);
                        const btn = editor.Panels.getButton('options', 'toggle-tailwind');
                        if (btn) btn.set('label', 'TW: OFF');
                    }
                } else {
                    // React/Vue Mode via AST Bridge
                    try {
                        const nodes = await invoke<any[]>('get_component_tree', { path: projectPath, filename });

                        if (nodes && nodes.length > 0) {
                            // Helper to convert AST tree to HTML string
                            const convertAstToHtml = (nodes: any[]): string => {
                                return nodes.map(node => {
                                    if (node.name === '#text') return node.text_content || '';
                                    if (node.name === '#expression') return `<span data-gjs-type="text">${node.text_content}</span>`; // Render expression content as plain text, allowing parent styles (e.g. pre) to apply

                                    // Props to Attributes
                                    let attrs = ` data-ast-id="${node.id}"`;
                                    if (node.props) {
                                        Object.entries(node.props).forEach(([k, v]) => {
                                            if (k === 'className' || k === 'class') {
                                                attrs += ` class="${v}"`;
                                            } else if (k === 'style' && typeof v === 'string') {
                                                // Simple style string support
                                                attrs += ` style="${v}"`;
                                            } else if (typeof v === 'string') {
                                                attrs += ` ${k}="${v}"`;
                                            }
                                            // TODO: Handle complex objects/bools
                                        });
                                    }

                                    // Tag mappings
                                    let apiTag = node.name;
                                    // Simply using div for unknown components for now, or the name itself if it's standard HTML
                                    // HTML5 tags: 
                                    const isHtmlTag = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'button', 'input', 'form', 'section', 'header', 'footer', 'nav', 'article', 'main', 'aside', 'pre', 'code', 'blockquote', 'br', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'].includes(apiTag.toLowerCase());
                                    const finalTag = isHtmlTag ? apiTag : 'div';

                                    if (!isHtmlTag) {
                                        attrs += ` data-component-name="${apiTag}"`;
                                        // Visual cue for custom component
                                        if (!attrs.includes('class=')) attrs += ` class="border border-dashed border-blue-300 p-2"`;
                                        else attrs = attrs.replace('class="', 'class="border border-dashed border-blue-300 p-2 ');
                                    }

                                    const childrenHtml = node.children ? convertAstToHtml(node.children) : '';

                                    return `<${finalTag}${attrs}>${childrenHtml}</${finalTag}>`;
                                }).join('');
                            };

                            const generatedHtml = convertAstToHtml(nodes);
                            editor.setComponents(generatedHtml);
                            setIsTailwind(true);
                        } else {
                            // Fallback or Empty
                            editor.setComponents(`<div class="p-10 text-center">No content found or empty AST.</div>`);
                        }

                    } catch (e) {
                        console.error("AST Bridge Error:", e);
                        // Fallback to old regex method
                        const content = await invoke<string>('read_page_content', { path: projectPath, filename });
                        const parsedHtml = parseJSXToHtml(content);
                        if (parsedHtml && !parsedHtml.includes("Could not auto-parse")) {
                            editor.setComponents(parsedHtml);
                            setIsTailwind(true);
                        } else {
                            editor.setComponents(`<div class="p-10 text-center text-red-400">Error parsing JSX: ${e}</div>`);
                        }
                    }
                }

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

        // Handle React Save
        if (!isHtml) {
            editor.Panels.addButton('options', {
                id: 'save-react',
                className: 'fa fa-floppy-o',
                command: 'save-react',
                attributes: { title: 'Save to Code' }
            });

            editor.Commands.add('save-react', {
                run: async (edt) => {
                    const jsx = serializeToJSX(edt);
                    await invoke('save_page_content', {
                        path: projectPath,
                        filename,
                        content: jsx
                    });
                    setCodeContent(jsx); // Sync local state
                    alert("Saved JSX!");
                }
            });
        }

    }, [projectPath, filename, isHtml, isVisualMode]); // Added isVisualMode

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

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#1e1e1e', color: '#d4d4d4' }}>
            <div style={{ padding: 10, borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'monospace' }}>Editing: {filename}</span>
                    {/* Toggle Mode */}
                    <div style={{ display: 'flex', background: '#333', borderRadius: 4, overflow: 'hidden' }}>
                        <button
                            onClick={() => setIsVisualMode(false)}
                            style={{
                                background: !isVisualMode ? '#0d99ff' : 'transparent',
                                color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer'
                            }}
                        >
                            Code
                        </button>
                        <button
                            onClick={() => setIsVisualMode(true)}
                            style={{
                                background: isVisualMode ? '#0d99ff' : 'transparent',
                                color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer'
                            }}
                        >
                            Visual
                        </button>
                    </div>

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
                {!isVisualMode && (
                    <button onClick={() => saveCode()} style={{ background: '#0d99ff', color: 'white', border: 'none', padding: '5px 15px', borderRadius: 4, cursor: 'pointer' }}>Save Code</button>
                )}
            </div>
            {loading ? (
                <div style={{ padding: 20 }}>Loading...</div>
            ) : (
                <div style={{ flex: 1, position: 'relative' }}>
                    {/* We need to keep the editorRef mounted for GrapesJS, but hidden if not in VisualMode? 
                        Actually, GrapesJS needs the container. If we unmount it, we destroy the instance.
                        Better to keep it mounted and hide it if we want to preserve state, 
                        BUT we purposefully destroy/re-init heavily in this app.
                        Let's just conditionally render.
                    */}
                    {isVisualMode && (
                        <>
                            <div ref={editorRef} style={{ width: '100%', height: '100%' }} />
                            {isTailwind && showPalette && editorInstance.current && (
                                <TailwindPalette
                                    editor={editorInstance.current}
                                    onClose={() => setShowPalette(false)}
                                />
                            )}
                            {isVisualMode && showInteractionManager && editorInstance.current && (
                                <InteractionManager
                                    editor={editorInstance.current}
                                    onClose={() => setShowInteractionManager(false)}
                                />
                            )}
                        </>
                    )}

                    {!isVisualMode && (
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
                    )}
                </div>
            )}
        </div>
    );
}
