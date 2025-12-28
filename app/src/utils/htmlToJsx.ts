
export function convertHtmlToJsx(html: string, componentName: string): string {
    // 1. Basic replacements
    let jsx = html
        .replace(/class=/g, "className=")
        .replace(/for=/g, "htmlFor=")
        .replace(/<!--/g, "{/*")
        .replace(/-->/g, "*/}")
        .replace(/tabindex=/g, "tabIndex=")
        .replace(/readonly=/g, "readOnly=")
        .replace(/autocomplete=/g, "autoComplete=")
        .replace(/autofocus=/g, "autoFocus=");

    // 2. Styles: GrapesJS usually outputs class names if we use Tailwind.
    // If there are inline styles, we need to convert them to objects. 
    // For this MVP, we assume Tailwind usage primarily.

    // 3. Self-closing tags
    // This is a naive regex approach. For robust parsing, we'd need a DOM parser, 
    // but in a browser env without full DOM access to the string *as text* it's tricky.
    // Actually, we are in a browser env, so we could use DOMParser?
    // But we are generating text.

    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link'];
    selfClosingTags.forEach(tag => {
        // Find tags that don't end with />
        // Logic: <img src="..."> but not <img src="..." />
        // This regex is tricky. 
        // Simpler: Replace <tag ... > with <tag ... /> if not already closed
        const regex = new RegExp(`<${tag}([^>]*[^/])>`, 'g');
        jsx = jsx.replace(regex, `<${tag}$1 />`);
    });

    // Fix: If the regex replaced > with />, check if it duplicated it? 
    // <img src="..."> -> <img src="..." /> 
    // If it was <img src="..." /> -> <img src="..." /> (no match for [^/])

    // 4. Wrap
    return `import React from 'react';

export default function ${componentName}() {
  return (
    <>
${indent(jsx, 6)}
    </>
  );
}
`;
}

function indent(str: string, spaces: number): string {
    return str.split('\n').map(line => ' '.repeat(spaces) + line).join('\n');
}
