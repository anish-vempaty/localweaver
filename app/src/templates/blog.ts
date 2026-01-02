import { Template } from './index';

export const blogTemplate: Template = {
    id: 'blog',
    name: 'Modern Blog',
    description: 'Clean, readable layout for writers.',
    category: 'Content',
    thumbnail: { type: 'icon', value: 'fa-pen-nib', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Blog</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700&family=Open+Sans:wght@400;600&display=swap');
        h1, h2, h3 { family: 'Merriweather', serif; }
        body { font-family: 'Open Sans', sans-serif; }
    </style>
</head>
<body class="bg-stone-50 text-stone-800">

    <!-- Header -->
    <header class="py-12 border-b border-stone-200 bg-white">
        <div class="max-w-4xl mx-auto px-6 text-center">
            <h1 class="text-5xl font-bold mb-4">The Daily Journal</h1>
            <p class="text-xl text-stone-500 italic">Thoughts on technology, design, and life.</p>
            <div class="flex justify-center gap-6 mt-8">
                <a href="#" class="text-stone-500 hover:text-stone-900 border-b-2 border-transparent hover:border-stone-900 transition">Latest</a>
                <a href="#" class="text-stone-500 hover:text-stone-900 border-b-2 border-transparent hover:border-stone-900 transition">Culture</a>
                <a href="#" class="text-stone-500 hover:text-stone-900 border-b-2 border-transparent hover:border-stone-900 transition">Tech</a>
                <a href="#" class="text-stone-500 hover:text-stone-900 border-b-2 border-transparent hover:border-stone-900 transition">About</a>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-6 py-16">
        
        <!-- Featured Post -->
        <article class="mb-20">
            <div class="relative h-96 rounded-2xl overflow-hidden mb-8 shadow-lg">
                <img src="https://images.unsplash.com/photo-1499750310159-a52f33187239?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80" class="w-full h-full object-cover transition duration-500 hover:scale-105">
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div class="absolute bottom-0 left-0 p-8 text-white">
                    <span class="bg-indigo-600 px-3 py-1 rounded text-xs font-bold uppercase tracking-wide mb-3 inline-block">Featured</span>
                    <h2 class="text-4xl font-bold mb-2">The Art of Minimalist Living</h2>
                    <div class="flex items-center gap-2 text-sm text-gray-200">
                        <span><i class="fa-regular fa-clock"></i> 5 min read</span>
                        <span>&bull;</span>
                        <span>Oct 12, 2024</span>
                    </div>
                </div>
            </div>
            <p class="text-xl text-stone-600 leading-relaxed mb-6">
                Minimalism isn't just about owning less stuff. It's about making room for what truly matters. In a world of constant noise, finding silence is a radical act...
            </p>
            <a href="#" class="text-indigo-600 font-bold hover:underline">Read full story &rarr;</a>
        </article>

        <!-- Post Grid -->
        <div class="grid md:grid-cols-2 gap-12">
            <!-- Article 1 -->
            <article>
                <div class="h-64 rounded-xl overflow-hidden mb-6 shadow-sm">
                    <img src="https://images.unsplash.com/photo-1593642532400-2682810df593?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" class="w-full h-full object-cover hover:opacity-90 transition">
                </div>
                <span class="text-indigo-600 text-sm font-bold uppercase tracking-wide">Technology</span>
                <h3 class="text-2xl font-bold mt-2 mb-3 hover:text-indigo-600 transition cursor-pointer">The Future of AI Design</h3>
                <p class="text-stone-500 leading-relaxed mb-4">How artificial intelligence is reshaping the way we interact with digital interfaces.</p>
                <a href="#" class="text-indigo-600 font-semibold text-sm hover:underline">Read Article</a>
            </article>

            <!-- Article 2 -->
            <article>
                <div class="h-64 rounded-xl overflow-hidden mb-6 shadow-sm">
                    <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" class="w-full h-full object-cover hover:opacity-90 transition">
                </div>
                <span class="text-indigo-600 text-sm font-bold uppercase tracking-wide">Productivity</span>
                <h3 class="text-2xl font-bold mt-2 mb-3 hover:text-indigo-600 transition cursor-pointer">Deep Work in a Distracted World</h3>
                <p class="text-stone-500 leading-relaxed mb-4">Strategies for maintaining focus and achieving flow states.</p>
                <a href="#" class="text-indigo-600 font-semibold text-sm hover:underline">Read Article</a>
            </article>
        </div>

    </main>

    <!-- Footer -->
    <footer class="bg-stone-900 text-stone-400 py-12 text-center">
        <div class="max-w-4xl mx-auto px-6">
            <h2 class="text-2xl font-serif text-white mb-6">Subscribe to our newsletter</h2>
            <div class="flex max-w-md mx-auto gap-2 mb-12">
                <input type="email" placeholder="Enter your email" class="flex-1 bg-stone-800 border-none rounded px-4 py-3 focus:ring-2 focus:ring-indigo-500 text-white">
                <button class="bg-indigo-600 text-white px-6 py-3 rounded font-bold hover:bg-indigo-700 transition">Join</button>
            </div>
            <p>&copy; 2024 The Daily Journal. Built with LocalWeaver.</p>
        </div>
    </footer>

</body>
</html>`
};
