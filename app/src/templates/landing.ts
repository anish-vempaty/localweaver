import { Template } from './index';

export const landingTemplate: Template = {
    id: 'landing',
    name: 'SaaS Landing Page',
    description: 'High-conversion landing page for software products.',
    category: 'Marketing',
    thumbnail: { type: 'icon', value: 'fa-rocket', bg: 'linear-gradient(135deg, #FF6B6B 0%, #556270 100%)' },
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Landing</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-white text-gray-900">

    <!-- Header -->
    <header class="border-b border-gray-100">
        <div class="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div class="flex items-center gap-2 text-indigo-600 font-bold text-2xl">
                <i class="fa-brands fa-hive"></i> OmniStack
            </div>
            <nav class="hidden md:flex gap-8 text-sm font-medium text-gray-600">
                <a href="#features" class="hover:text-indigo-600">Features</a>
                <a href="#pricing" class="hover:text-indigo-600">Pricing</a>
                <a href="#testimonials" class="hover:text-indigo-600">Testimonials</a>
            </nav>
            <div class="flex gap-4">
                <a href="#" class="text-gray-600 font-medium hover:text-indigo-600 self-center">Login</a>
                <a href="#" class="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition">Get Started</a>
            </div>
        </div>
    </header>

    <!-- Hero -->
    <section class="pt-24 pb-32 overflow-hidden">
        <div class="max-w-7xl mx-auto px-6 text-center">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-8">
                <span class="bg-indigo-600 text-white px-2 py-0.5 rounded text-xs">New</span>
                <span>v2.0 is now available!</span>
            </div>
            <h1 class="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-8 max-w-4xl mx-auto">
                Manage your team <br>
                <span class="text-indigo-600">without the chaos.</span>
            </h1>
            <p class="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
                All-in-one platform to streamline your workflow, boost productivity, and keep your team aligned. No credit card required.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <button class="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-xl shadow-indigo-600/20">
                    Start Free Trial
                </button>
                <button class="bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition flex items-center gap-3">
                    <i class="fa-regular fa-circle-play"></i> Watch Demo
                </button>
            </div>
            
            <!-- Dashboard Preview -->
            <div class="relative max-w-5xl mx-auto">
                <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-30"></div>
                <div class="relative bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-800">
                    <img src="https://assets.codepen.io/16606/dashboard-preview.jpg" alt="App Dashboard" class="w-full h-auto opacity-75">
                    <div class="absolute inset-0 flex items-center justify-center">
                         <span class="text-white/50 text-xl font-mono">[ Image Placeholder: Dashboard ]</span>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features -->
    <section id="features" class="py-24 bg-gray-50">
        <div class="max-w-7xl mx-auto px-6">
            <div class="text-center mb-20">
                <h2 class="text-3xl font-bold mb-4">Everything you need to scale</h2>
                <p class="text-gray-500 max-w-2xl mx-auto">We've baked in all the features you need to take your business to the next level, without the bloat.</p>
            </div>
            <div class="grid md:grid-cols-3 gap-12">
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xl mb-6">
                        <i class="fa-solid fa-chart-line"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Real-time Analytics</h3>
                    <p class="text-gray-500">Track your growth with up-to-the-minute data visualization and custom reports.</p>
                </div>
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div class="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-xl mb-6">
                        <i class="fa-solid fa-users"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Team Collaboration</h3>
                    <p class="text-gray-500">Built-in chat, tasks, and file sharing to keep everyone on the same page.</p>
                </div>
                <div class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-xl mb-6">
                        <i class="fa-solid fa-lock"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3">Enterprise Security</h3>
                    <p class="text-gray-500">Bank-grade encryption and SSO support to keep your data safe and compliant.</p>
                </div>
            </div>
        </div>
    </section>

</body>
</html>`
};
