# LocalWeaver

LocalWeaver is a desktop application that bridges the gap between visual website building and local file system management. It synchronizes a visual node-based graph representation directly with your local HTML files.

## Features

- **Visual Sitemap**: View and manage your website structure as a graph of nodes.
- **File System Sync**: Creating a page in the graph creates a real HTML file on your disk. Connecting nodes automatically injects HTML links between pages.
- **Page Editor**: Integrated visual HTML editor (GrapesJS) to edit page content without writing code.
- **Local AI Integration**: Built-in support for local LLMs (via llama.cpp) to generate HTML content and styling directly within the editor.
- **Context-Aware**: The AI understands the current context of your page for more accurate generation.

## Prerequisites

1. **Rust**: Required for the Tauri backend.
2. **Node.js**: Required for the React frontend.
3. **llama.cpp**: Required for AI features. You need the `llama-server` binary.

## Installation

1. Clone functionality is not yet packaged, so you run from source.
2. Install dependencies:
   ```bash
   cd app
   npm install
   ```

## Usage

1. **Start the AI Server**:
   Download a GGUF model (e.g., Qwen2.5-Coder) and run the server on port 8081:
   ```bash
   ./llama-server -m your-model.gguf --port 8081 -c 2048
   ```

2. **Run the Application**:
   In a separate terminal:
   ```bash
   cd app
   npm run tauri dev
   ```

3. **Open a Project**:
   - Click "Browse" to select a folder containing HTML files (or an empty folder to start fresh).
   - Use "+ Add Page" to create new HTML files.
   - Drag connections between nodes to link pages.
   - Click a node to open the Page Editor.
