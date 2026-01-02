import { Template } from './index';

export const portfolioTemplate: Template = {
    id: 'portfolio',
    name: 'Modern Portfolio',
    description: 'Showcase your work with a hero, skills section, and gallery.',
    category: 'Personal',
    thumbnail: { type: 'icon', value: 'fa-user-astronaut', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Portfolio</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap');
        body { font-family: 'Outfit', sans-serif; }
    </style>
</head>
<body class="bg-gray-900 text-white antialiased">

    <!-- Navbar -->
    <nav class="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Anish.Design
        </div>
        <div class="space-x-8 text-gray-300 hidden md:block">
            <a href="#" class="hover:text-white transition">Work</a>
            <a href="#" class="hover:text-white transition">About</a>
            <a href="#" class="hover:text-white transition">Contact</a>
        </div>
        <a href="#" class="px-6 py-2 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-200 transition">Hire Me</a>
    </nav>

    <!-- Hero -->
    <section class="max-w-7xl mx-auto px-8 py-32 grid md:grid-cols-2 gap-12 items-center">
        <div>
            <h1 class="text-6xl font-bold leading-tight mb-6">
                Designing the <br>
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Future Experience.</span>
            </h1>
            <p class="text-xl text-gray-400 mb-8 max-w-lg">
                I create digital products that blend aesthetics with functionality. 
                Product Designer based in San Francisco.
            </p>
            <div class="flex gap-4">
                <button class="px-8 py-4 bg-blue-600 rounded-full font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">
                    View Projects
                </button>
                <button class="px-8 py-4 border border-gray-700 rounded-full font-semibold hover:bg-gray-800 transition">
                    Contact Me
                </button>
            </div>
        </div>
        <div class="relative">
            <div class="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-3xl opacity-20 rounded-full"></div>
            <img src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
                 alt="Portrait" 
                 class="relative rounded-2xl shadow-2xl grayscale hover:grayscale-0 transition duration-700 transform hover:-translate-y-2 object-cover h-[500px] w-full">
        </div>
    </section>

    <!-- Skills -->
    <section class="bg-gray-800/50 py-20">
        <div class="max-w-7xl mx-auto px-8">
            <h2 class="text-4xl font-bold mb-12 text-center">My Expertise</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Card 1 -->
                <div class="p-8 bg-gray-900 rounded-2xl border border-gray-700 hover:border-blue-500 transition group">
                    <div class="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition">
                        <i class="fa-solid fa-layer-group"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">UI/UX Design</h3>
                    <p class="text-gray-400">Crafting intuitive interfaces and delightful user journeys with precision and empathy.</p>
                </div>
                <!-- Card 2 -->
                <div class="p-8 bg-gray-900 rounded-2xl border border-gray-700 hover:border-purple-500 transition group">
                    <div class="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-lg flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition">
                        <i class="fa-solid fa-code"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Development</h3>
                    <p class="text-gray-400">Bringing designs to life with clean, semantic HTML, CSS, and modern JavaScript frameworks.</p>
                </div>
                <!-- Card 3 -->
                <div class="p-8 bg-gray-900 rounded-2xl border border-gray-700 hover:border-pink-500 transition group">
                    <div class="w-12 h-12 bg-pink-500/20 text-pink-400 rounded-lg flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition">
                        <i class="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4">Branding</h3>
                    <p class="text-gray-400">Developing unique visual identities that resonate with audiences and stand the test of time.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 text-center text-gray-500 border-t border-gray-800 mt-20">
        <p>&copy; 2026 Anish.Design. All rights reserved.</p>
        <div class="flex justify-center gap-6 mt-6">
            <a href="#" class="hover:text-white"><i class="fa-brands fa-twitter text-xl"></i></a>
            <a href="#" class="hover:text-white"><i class="fa-brands fa-linkedin text-xl"></i></a>
            <a href="#" class="hover:text-white"><i class="fa-brands fa-github text-xl"></i></a>
        </div>
    </footer>

</body>
</html>`
};
