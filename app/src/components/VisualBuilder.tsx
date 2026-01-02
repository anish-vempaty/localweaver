import { useEffect, useRef } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { invoke } from '@tauri-apps/api/core';
import { convertHtmlToJsx } from '../utils/htmlToJsx';

import webpagePreset from 'grapesjs-preset-webpage';

// Simple Tailwind Preset (We can expand this later)
const tailwindBlocks = [
    {
        id: 'section',
        label: 'Section',
        content: '<section class="py-12 bg-white"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><h2 class="text-3xl font-extrabold text-gray-900">Section Title</h2></div></section>'
    },
    {
        id: 'button-primary',
        label: 'Primary Button',
        content: '<button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Click Me</button>'
    },
    {
        id: 'card',
        label: 'Card',
        content: '<div class="bg-white shadow rounded-lg p-6"><h3 class="text-lg font-medium text-gray-900">Card Title</h3><p class="mt-2 text-gray-500">Card content goes here.</p></div>'
    },
    {
        id: 'hero',
        label: 'Hero',
        content: '<div class="bg-gray-50 py-20"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"><h1 class="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">Hero Title</h1><p class="mt-5 max-w-xl mx-auto text-xl text-gray-500">Subtext goes here.</p></div></div>'
    }
];

interface VisualBuilderProps {
    projectPath: string;
}

export default function VisualBuilder({ projectPath }: VisualBuilderProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const editorInstance = useRef<any>(null);

    useEffect(() => {
        if (!editorRef.current) return;

        if (editorInstance.current) {
            editorInstance.current.destroy();
        }

        const editor = grapesjs.init({
            container: editorRef.current,
            height: '100%',
            width: 'auto',
            storageManager: false,
            plugins: [webpagePreset],
            pluginsOpts: {
                [webpagePreset as any]: {
                    // Start with defaults to ensure it works
                    blocks: [], // Clear default blocks so we only see ours
                }
            },
            canvas: {
                styles: [
                    'https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css',
                    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css'
                ]
            }
        });

        // Add Blocks to DEFAULT Manager
        const bm = editor.BlockManager;
        tailwindBlocks.forEach(block => {
            bm.add(block.id, {
                label: block.label,
                content: block.content,
                attributes: { class: 'fa fa-cube' } // Simple icon
            });
        });

        editorInstance.current = editor;

        // LOAD PROJECT CSS (to fix missing styles)
        const loadProjectCss = async () => {
            try {
                const cssContent = await invoke<string>('read_page_content', {
                    path: projectPath,
                    filename: 'src/index.css'
                });

                // Inject into Canvas via standard DOM manipulation
                // This is more reliable than addComponents for global styles
                const iframe = editor.Canvas.getFrameEl();
                if (!iframe || !iframe.contentWindow) return;

                const doc = iframe.contentWindow.document;
                const head = doc.head;

                // 1. Inject Project CSS
                const style = doc.createElement('style');
                style.id = 'project-css';
                style.innerHTML = cssContent;
                head.appendChild(style);

                // 2. Inject Fixes for Editor Compatibility
                // The user's index.css has 'span { display: block }' which is destructive for rich text editing.
                // We must override this with high specificity.
                const fixStyle = doc.createElement('style');
                fixStyle.id = 'editor-fixes';
                fixStyle.innerHTML = `
                    span, b, strong, i, em, mark, small, del, ins, sub, sup { 
                        display: inline !important; 
                        line-height: inherit !important;
                    }
                `;
                head.appendChild(fixStyle);

                console.log("Project CSS loaded into Canvas");
            } catch (e) {
                console.warn("Could not load project CSS:", e);
            }
        };

        // Wait for editor to load fully
        editor.on('load', loadProjectCss);

        return () => {
            if (editorInstance.current) {
                editorInstance.current.destroy();
                editorInstance.current = null;
            }
        };
    }, [projectPath]);

    const handleSave = async () => {
        if (!editorInstance.current) return;

        const componentName = prompt("Enter Component Name (e.g. HeroSection):");
        if (!componentName) return;

        const cleanName = componentName.replace(/[^a-zA-Z0-9]/g, '');
        const fileName = `${cleanName}.jsx`;

        const html = editorInstance.current.getHtml();
        const jsxContent = convertHtmlToJsx(html, cleanName);

        try {
            const targetPath = `src/components/${fileName}`;
            await invoke('save_page_content', {
                path: projectPath,
                filename: targetPath,
                content: jsxContent
            });
            alert(`Saved ${targetPath}!`);
        } catch (err) {
            alert("Error saving component: " + err);
        }
    };

    return (
        <div style={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
            {/* Toolbar */}
            <div style={{ padding: 10, background: '#333', color: 'white', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>Visual Component Builder</span>
                <div style={{ flex: 1 }} />
                <button onClick={handleSave} style={{ background: '#2ea44f', color: 'white', border: 'none', padding: '5px 15px', borderRadius: 4 }}>
                    Save as Component
                </button>
            </div>

            {/* Editor Canvas Container - Full Width */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <div ref={editorRef} style={{ height: '100%', border: 'none' }} />
            </div>
        </div>
    );
}
