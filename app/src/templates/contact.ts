import { Template } from './index';

export const contactTemplate: Template = {
    id: 'contact',
    name: 'Contact Page',
    description: 'Clean contact form with map and info.',
    category: 'General',
    thumbnail: { type: 'icon', value: 'fa-envelope-open-text', bg: 'linear-gradient(135deg, #a8ff78 0%, #78ffd6 100%)' },
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contact Us</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
         @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap');
        body { font-family: 'Poppins', sans-serif; }
    </style>
</head>
<body class="bg-gray-50 text-gray-800 min-h-screen flex flex-col">

    <!-- Navbar -->
    <nav class="bg-white shadow-sm p-4">
        <div class="max-w-6xl mx-auto font-bold text-xl">BrandName</div>
    </nav>

    <!-- Main Content -->
    <main class="flex-grow flex items-center justify-center p-6">
        <div class="bg-white rounded-3xl shadow-xl overflow-hidden max-w-5xl w-full flex flex-col md:flex-row">
            
            <!-- Contact Info -->
            <div class="bg-blue-600 text-white p-12 md:w-2/5 flex flex-col justify-between relative overflow-hidden">
                <div class="relative z-10">
                    <h2 class="text-3xl font-bold mb-6">Contact Information</h2>
                    <p class="text-blue-100 mb-10">Fill up the form and our team will get back to you within 24 hours.</p>
                    
                    <div class="space-y-6">
                        <div class="flex items-center gap-4">
                            <i class="fa-solid fa-phone"></i>
                            <span>+1 (555) 123-4567</span>
                        </div>
                        <div class="flex items-center gap-4">
                            <i class="fa-solid fa-envelope"></i>
                            <span>hello@example.com</span>
                        </div>
                        <div class="flex items-center gap-4">
                            <i class="fa-solid fa-location-dot"></i>
                            <span>123 Innovation Dr, Tech City</span>
                        </div>
                    </div>
                </div>

                <div class="relative z-10 mt-12 flex gap-4">
                    <a href="#" class="w-10 h-10 rounded-full border border-blue-400 flex items-center justify-center hover:bg-white hover:text-blue-600 transition"><i class="fa-brands fa-twitter"></i></a>
                    <a href="#" class="w-10 h-10 rounded-full border border-blue-400 flex items-center justify-center hover:bg-white hover:text-blue-600 transition"><i class="fa-brands fa-linkedin-in"></i></a>
                    <a href="#" class="w-10 h-10 rounded-full border border-blue-400 flex items-center justify-center hover:bg-white hover:text-blue-600 transition"><i class="fa-brands fa-instagram"></i></a>
                </div>

                <!-- Decor -->
                <div class="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-500 rounded-full opacity-50"></div>
                <div class="absolute -top-10 -right-10 w-32 h-32 bg-blue-400 rounded-full opacity-50"></div>
            </div>

            <!-- Form -->
            <div class="p-12 md:w-3/5">
                <form class="space-y-6">
                    <div class="grid grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-600 mb-2">First Name</label>
                            <input type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition" placeholder="John">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600 mb-2">Last Name</label>
                            <input type="text" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition" placeholder="Doe">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-600 mb-2">Email Address</label>
                        <input type="email" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition" placeholder="john@example.com">
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-600 mb-2">Phone Number</label>
                            <input type="tel" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition" placeholder="+1 012 3456 789">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600 mb-2">Subject</label>
                            <select class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition">
                                <option>General Inquiry</option>
                                <option>Support</option>
                                <option>Sales</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-600 mb-2">Message</label>
                        <textarea rows="4" class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition" placeholder="Write your message..."></textarea>
                    </div>

                    <button type="submit" class="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">
                        Send Message
                    </button>
                </form>
            </div>
        </div>
    </main>
</body>
</html>`
};
