
import type { Editor } from 'grapesjs';

export const reactEditorConfig = (editor: Editor) => {
    const bm = editor.BlockManager;

    // 1. Define React-friendly blocks
    bm.add('react-text', {
        label: 'Text',
        content: '<div class="p-2">Text</div>',
        attributes: { class: 'fa fa-font' }
    });

    bm.add('react-container', {
        label: 'Container',
        content: '<div class="p-4 border border-dashed border-gray-300 min-h-[50px]"></div>',
        attributes: { class: 'fa fa-square-o' }
    });

    bm.add('react-button', {
        label: 'Button',
        content: '<button class="px-4 py-2 bg-blue-500 text-white rounded">Button</button>',
        attributes: { class: 'fa fa-square' }
    });

    bm.add('react-image', {
        label: 'Image',
        content: '<img src="https://via.placeholder.com/150" class="max-w-full h-auto" />',
        attributes: { class: 'fa fa-picture-o' }
    });

    // 2. JSX Serializer (Basic)
    // We override the default HTML generator locally if needed, or provide a helper function
};

export const serializeToJSX = (editor: Editor): string => {
    const html = editor.getHtml();
    // const css = editor.getCss(); // minimal use

    // Quick regex replacer for common JSX diffs
    // 1. class -> className
    // 2. for -> htmlFor
    // 3. style string -> style object (harder, maybe skip for now or warn)
    // 4. self-closing tags

    let jsx = html
        .replace(/class="/g, 'className="')
        .replace(/for="/g, 'htmlFor="');

    // Basic self-closing fix (img, br, input, hr)
    jsx = jsx.replace(/<(img|br|input|hr)([^>]*)(?<!\/)>/g, '<$1$2 />');

    // Return as a functional component wrapper
    return `export default function GeneratedComponent() {
  return (
    <>
${jsx}
    </>
  );
}`;
};

/**
 * Best-effort parsing of a React Functional Component code string to HTML for GrapesJS.
 * LIMITATIONS: 
 * - Only finds the first `return (...);` block.
 * - Converts `className` -> `class`.
 * - Attempts to convert simple `style={{ key: 'val' }}` to `style="key: val;"`.
 * - LOSES all logic (hooks, handlers) if you save back!
 */
export const parseJSXToHtml = (code: string): string => {
    try {
        // 1. Extract the return body. 
        // Heuristic: match `return (` ... `)` or `return <` ... `; `

        let jsxContent = "";

        // Match return (...);
        const parenMatch = code.match(/return\s*\(([\s\S]*?)\);/);
        if (parenMatch) {
            jsxContent = parenMatch[1];
        } else {
            // Match return <...>;
            const directMatch = code.match(/return\s*(<[\s\S]*?>);/);
            if (directMatch) {
                jsxContent = directMatch[1];
            }
        }

        if (!jsxContent) return '<div class="p-4 text-red-500">Could not auto-parse JSX return statement.</div>';

        // 2. Transform JSX to HTML

        let html = jsxContent;

        // A. Handle simple curly interpolations {p.title} -> p.title
        html = html.replace(/\{([a-zA-Z0-9_.]+)\}/g, '$1');

        // B. Handle Component substitutions (Visual Only)
        // <Link ... to=...> -> <a ... href=...>
        html = html.replace(/<Link\s+([^>]*?)to=/g, '<a $1href=');
        html = html.replace(/<\/Link>/g, '</a>');

        // C. Heuristic: Unwrap .map(...)
        // Logic: {projects.map((p, i) => ( ... ))} -> ...
        // 1. Remove start: {projects.map((p, i) => (
        html = html.replace(/\{[a-zA-Z0-9_.]+\.map[^=]+=>\s*\(\s*/g, '');

        // 2. Remove end: ))}
        html = html.replace(/\s*\)\)\s*\}/g, '');

        // D. Handle Ternaries: { cond ? ( A ) : ( B ) }
        // 1. Ternary start: {p.route ? (
        html = html.replace(/\{[a-zA-Z0-9_.]+\s*\?\s*\(\s*/g, '');

        // 2. Ternary middle: ) : ( -> just strip so both render stacked
        html = html.replace(/\)\s*:\s*\(\s*/g, '');

        // 3. Ternary end: )}
        html = html.replace(/\)\s*\}/g, '');

        // className -> class
        html = html.replace(/className=/g, 'class=');

        // style={{ ... }} -> style="..."
        // This is tricky regex. We'll try to find `style = {{ ` and the closing ` }}`.
        // A simple regex approach for *simple* styles (single line or well formatted):
        html = html.replace(/style=\{\{([\s\S]*?)\}\}/g, (_, inner) => {
            // inner might be "color: 'red', fontSize: '12px'"
            // We need to parse this loosely
            const props = inner.split(',').map((p: string) => p.trim()).filter((p: string) => p);
            const styleStr = props.map((p: string) => {
                const parts = p.split(':');
                if (parts.length < 2) return '';
                let key = parts[0].trim();
                let val = parts.slice(1).join(':').trim();

                // key: camelCase -> kebab-case
                key = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();

                // val: remove quotes ' ' or " "
                val = val.replace(/^['"]|['"]$/g, '');

                return `${key}:${val} `;
            }).join(';');

            return `style = "${styleStr}"`;
        });

        // Remove event handlers like onClick={...}
        // Match on\w+={...} - balancing braces is hard with regex. 
        // We will do a generic "onEvent={...}" stripper assuming no nested braces for now or distinct patterns.
        // Actually, just stripping `onClick = {() => ...}` is common.
        html = html.replace(/on[A-Z]\w+=\{[^}]+\}/g, ''); // Simple single-level strip

        // Remove curly braces for variables {variable} -> variable (text)
        // Be careful not to break tags.
        // html = html.replace(/\{([^{}]+)\}/g, '$1'); 

        return html;

    } catch (e) {
        console.error(e);
        return `< div class="text-red-500" > Error parsing JSX: ${e} </div>`;
    }
};
