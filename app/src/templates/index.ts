export interface Template {
    id: string;
    name: string;
    description: string;
    category: 'General' | 'Marketing' | 'Personal' | 'App' | 'Content';
    thumbnail: {
        type: 'icon' | 'image';
        value: string; // Icon class or Image URL
        bg: string; // Background color/gradient
    };
    content: string;
}

import { portfolioTemplate } from './portfolio';
import { landingTemplate } from './landing';
import { contactTemplate } from './contact';
import { blogTemplate } from './blog';
import { appTemplate } from './app';

export const templates: Template[] = [
    {
        id: 'blank',
        name: 'Blank Page',
        description: 'Start from scratch with an empty page.',
        category: 'General',
        thumbnail: { type: 'icon', value: 'fa-file-code', bg: 'linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 100%)' },
        content: `<!DOCTYPE html>
<html>
<head>
    <title>New Page</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen p-8">
    <h1 class="text-3xl font-bold underline">Hello World</h1>
</body>
</html>`
    },
    portfolioTemplate,
    landingTemplate,
    contactTemplate,
    blogTemplate,
    appTemplate
];
