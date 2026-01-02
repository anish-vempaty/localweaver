import { Template } from './index';

export const appTemplate: Template = {
    id: 'app',
    name: 'Dashboard App',
    description: 'Admin dashboard layout with sidebar.',
    category: 'App',
    thumbnail: { type: 'icon', value: 'fa-chart-pie', bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');
        body { font-family: 'Roboto', sans-serif; }
    </style>
</head>
<body class="bg-gray-100 flex h-screen overflow-hidden">

    <!-- Sidebar -->
    <aside class="w-64 bg-gray-900 text-gray-300 flex flex-col transition-all duration-300" id="sidebar">
        <div class="h-16 flex items-center px-6 border-b border-gray-800 font-bold text-white tracking-wider">
            AVANT<span class="text-blue-500">DASH</span>
        </div>
        
        <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Main</div>
            <a href="#" class="flex items-center gap-3 px-3 py-2 bg-blue-600 text-white rounded-lg transition">
                <i class="fa-solid fa-house w-5 text-center"></i> Dashboard
            </a>
            <a href="#" class="flex items-center gap-3 px-3 py-2 hover:bg-gray-800 hover:text-white rounded-lg transition">
                <i class="fa-solid fa-chart-simple w-5 text-center"></i> Analytics
            </a>
            <a href="#" class="flex items-center gap-3 px-3 py-2 hover:bg-gray-800 hover:text-white rounded-lg transition">
                <i class="fa-solid fa-users w-5 text-center"></i> Customers
            </a>
            
            <div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2 px-2">Settings</div>
            <a href="#" class="flex items-center gap-3 px-3 py-2 hover:bg-gray-800 hover:text-white rounded-lg transition">
                <i class="fa-solid fa-user-gear w-5 text-center"></i> Profile
            </a>
            <a href="#" class="flex items-center gap-3 px-3 py-2 hover:bg-gray-800 hover:text-white rounded-lg transition">
                <i class="fa-solid fa-file-invoice-dollar w-5 text-center"></i> Billing
            </a>
        </nav>

        <div class="p-4 border-t border-gray-800">
            <a href="#" class="flex items-center gap-3 px-3 py-2 text-red-400 hover:bg-gray-800 rounded-lg transition">
                <i class="fa-solid fa-arrow-right-from-bracket w-5 text-center"></i> Logout
            </a>
        </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0">
        <!-- Top Bar -->
        <header class="h-16 bg-white shadow-sm flex items-center justify-between px-6 z-10">
            <button class="text-gray-500 hover:text-gray-900">
                <i class="fa-solid fa-bars text-xl"></i>
            </button>
            <div class="flex items-center gap-4">
                <button class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition relative">
                    <i class="fa-regular fa-bell text-gray-600"></i>
                    <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <div class="flex items-center gap-3">
                    <img src="https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff" class="w-10 h-10 rounded-full">
                    <div class="hidden md:block text-sm">
                        <div class="font-bold text-gray-900">John Doe</div>
                        <div class="text-gray-500">Admin</div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Scrollable Content -->
        <main class="flex-1 overflow-y-auto p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <!-- Stat Card 1 -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div class="flex items-center justify-between mb-4">
                        <div class="text-gray-500">Total Revenue</div>
                        <div class="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><i class="fa-solid fa-dollar-sign"></i></div>
                    </div>
                    <div class="text-3xl font-bold text-gray-900">$45,231</div>
                    <div class="text-sm text-green-500 mt-1 flex items-center gap-1"><i class="fa-solid fa-arrow-trend-up"></i> +12% from last month</div>
                </div>
                 <!-- Stat Card 2 -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div class="flex items-center justify-between mb-4">
                        <div class="text-gray-500">Active Users</div>
                        <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><i class="fa-solid fa-users"></i></div>
                    </div>
                    <div class="text-3xl font-bold text-gray-900">2,345</div>
                    <div class="text-sm text-blue-500 mt-1 flex items-center gap-1"><i class="fa-solid fa-arrow-trend-up"></i> +5% new users</div>
                </div>
                 <!-- Stat Card 3 -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div class="flex items-center justify-between mb-4">
                        <div class="text-gray-500">Bounce Rate</div>
                        <div class="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center"><i class="fa-solid fa-percent"></i></div>
                    </div>
                    <div class="text-3xl font-bold text-gray-900">42.5%</div>
                    <div class="text-sm text-red-500 mt-1 flex items-center gap-1"><i class="fa-solid fa-arrow-trend-down"></i> +2% increase</div>
                </div>
                 <!-- Stat Card 4 -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div class="flex items-center justify-between mb-4">
                        <div class="text-gray-500">Tasks Done</div>
                        <div class="w-10 h-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center"><i class="fa-solid fa-check"></i></div>
                    </div>
                    <div class="text-3xl font-bold text-gray-900">89%</div>
                    <div class="text-sm text-purple-500 mt-1 flex items-center gap-1">32 tasks pending</div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Chart Area -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                    <h3 class="font-bold text-lg mb-4">Revenue Overview</h3>
                    <div class="h-64 bg-gray-50 rounded flex items-center justify-center border border-dashed border-gray-300">
                        <span class="text-gray-400">Chart Placeholder</span>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 class="font-bold text-lg mb-4">Recent Activity</h3>
                    <div class="space-y-4">
                        <div class="flex items-start gap-4">
                            <img src="https://ui-avatars.com/api/?name=Alice+Smith&background=random" class="w-8 h-8 rounded-full">
                            <div>
                                <div class="text-sm font-semibold">Alice posted a new comment</div>
                                <div class="text-xs text-gray-500">2 mins ago</div>
                            </div>
                        </div>
                        <div class="flex items-start gap-4">
                            <div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center"><i class="fa-solid fa-upload text-xs"></i></div>
                            <div>
                                <div class="text-sm font-semibold">New file uploaded</div>
                                <div class="text-xs text-gray-500">15 mins ago</div>
                            </div>
                        </div>
                         <div class="flex items-start gap-4">
                            <img src="https://ui-avatars.com/api/?name=Bob+Jones&background=random" class="w-8 h-8 rounded-full">
                            <div>
                                <div class="text-sm font-semibold">Bob completed task "Update API"</div>
                                <div class="text-xs text-gray-500">1 hour ago</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </main>
    </div>

</body>
</html>`
};
