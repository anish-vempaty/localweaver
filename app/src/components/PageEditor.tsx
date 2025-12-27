import { useEffect, useRef } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import webpagePreset from 'grapesjs-preset-webpage';
import { invoke } from '@tauri-apps/api/core';
import { generateContent } from '../services/ai';

interface PageEditorProps {
    projectPath: string;
    filename: string;
}

export default function PageEditor({ projectPath, filename }: PageEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const editorInstance = useRef<any>(null);

    useEffect(() => {
        if (!editorRef.current) return;

        // Synchronous init
        const editor = grapesjs.init({
            container: editorRef.current,
            fromElement: false,
            height: '100%',
            width: 'auto',
            storageManager: { type: 'none', autosave: false, autoload: false }, // Explicitly disable
            plugins: [webpagePreset],
            pluginsOpts: {
                [webpagePreset as any]: {}
            },
            canvas: {
                styles: []
            }
        });

        editorInstance.current = editor;

        // Custom Buttons with descriptive tooltips
        editor.Panels.addButton('options', {
            id: 'save-db',
            className: 'fa fa-floppy-o',
            command: 'save-db',
            attributes: {
                title: 'Save Project: Persists your changes to the file system.'
            }
        });

        editor.Panels.addButton('options', {
            id: 'ai-gen',
            className: 'fa fa-magic',
            command: 'ai-gen',
            attributes: {
                title: 'AI Gen: Generate or modify elements using local AI.'
            }
        });

        // Update standard button tooltips for better UX
        editor.Panels.getButton('options', 'sw-visibility')?.set('attributes', { title: 'Show/Hide Borders: Toggle visibility of component outlines.' });
        editor.Panels.getButton('options', 'preview')?.set('attributes', { title: 'Preview: View the page as it will appear in a browser.' });
        editor.Panels.getButton('options', 'fullscreen')?.set('attributes', { title: 'Fullscreen: Toggle full screen mode.' });
        editor.Panels.getButton('options', 'export-template')?.set('attributes', { title: 'View Code: See the raw HTML/CSS.' });


        // AI Command
        editor.Commands.add('ai-gen', {
            run: async (editor) => {
                const userPrompt = prompt("What element do you want to add? (e.g. 'A contact form with blue button')");
                if (!userPrompt) return;

                try {
                    editor.Modal.setTitle('AI Generating...');
                    editor.Modal.setContent('Please wait, calling local LLM...');
                    editor.Modal.open();

                    // Get current context
                    const currentHtml = editor.getHtml();
                    const currentCss = editor.getCss();
                    const context = `<style>${currentCss}</style>\n${currentHtml}`;

                    const html = await generateContent(userPrompt, context);

                    editor.Modal.close();

                    if (html) {
                        editor.addComponents(html);
                    } else {
                        alert("AI returned empty content.");
                    }
                } catch (err) {
                    editor.Modal.close();
                    alert("AI Error: " + err + "\nMake sure llama-server is running on port 8081.");
                }
            }
        });

        // Save Command
        editor.Commands.add('save-db', {
            run: async (editor) => {
                const html = editor.getHtml();
                const css = editor.getCss();
                const fullContent = `<!DOCTYPE html>
<html>
<head>
<style>${css}</style>
</head>
<body>
${html}
</body>
</html>`;

                try {
                    await invoke('save_page_content', {
                        path: projectPath,
                        filename,
                        content: fullContent
                    });
                    alert("Saved!");
                } catch (err) {
                    alert("Save failed: " + err);
                }
            }
        });

        // Async Content Load
        const loadContent = async () => {
            try {
                const content = await invoke<string>('read_page_content', { path: projectPath, filename });

                // Parse and set content
                const parser = new DOMParser();
                const doc = parser.parseFromString(content, 'text/html');
                const bodyContent = doc.body.innerHTML;

                // We set content strictly AFTER init
                editor.setComponents(bodyContent);

                // Inject Styles
                const styles = doc.head.querySelectorAll('style');
                styles.forEach(style => {
                    editor.addComponents(`<style>${style.innerHTML}</style>`);
                });

                // Clear undo history so the "load" isn't undoable
                editor.UndoManager.clear();

            } catch (err) {
                console.error("Failed to read file:", err);
            }
        };

        loadContent();

        return () => {
            if (editorInstance.current) {
                editorInstance.current.destroy();
                editorInstance.current = null;
            }
        };
    }, [projectPath, filename]);

    return <div ref={editorRef} style={{ height: '100%' }} />;
}
