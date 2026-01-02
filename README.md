# LocalWeaver

LocalWeaver is a powerful desktop environment for web development that combines a visual node-based sitemap, a drag-and-drop HTML builder, and a robust code editor for React/Vue projects. It runs entirely locally, bridging the gap between visual design and your file system.

## Features

- **Visual Sitemap**: View your project structure as a graph. For HTML projects, it visualizes links. For React/Vue projects, it visualizes component dependencies.
- **Visual Builder (HTML)**: GrapesJS-powered editor with Drag-and-Drop, Tailwind CSS integration, and AI generation.
- **Rich Component Library**: Includes ready-to-use blocks for Cards, Hover Effects, Scrolling Text (Marquee), Forms (Input, Button, Dropdown), and semantic Layout (Header, Footer, Aside, Section).
- **Icon Manager**: Integrated **Font Awesome 7** support with a dedicated searchable Icon Manager. Browse and insert thousands of icons offline.
- **Offline First**: All assets (including Tailwind and Font Awesome) are bundled locally. Work without an internet connection.
- **Code Editor (React/Vue)**: Full-featured Monaco editor with syntax highlighting for generic web development.
- **Local AI**: Built-in integration with `llama.cpp` for generating code and content offline.
- **File System Sync**: Changes in the editor are saved directly to your local files.

## Prerequisites

1. **Rust**: Required for the Tauri backend.
2. **Node.js**: Required for the frontend.
3. **llama-server(llama.cpp)**: Required for AI features.

## Installation & Setup

1. **Install Dependencies**:

   ```bash
   cd app
   npm install
   ```
2. **Start the AI Server** (Optional, for AI features):
   Download a GGUF model (e.g., Qwen2.5-Coder) and run:

   ```bash
   # In the project root or where you keep the server
   ./llama-server -m your-model.gguf --port 8081 -c 2048
   ```
3. **Run the App**:

   ```bash
   cd app
   npm run tauri dev
   ```

## Usage Guide

### 1. HTML Projects (Visual Builder)

When you open an `index.html` or any HTML file, LocalWeaver launches the **Visual Page Editor**.

* **Drag & Drop**: Drag blocks from the sidebar onto the canvas.
  * **Basis Blocks**: Section, Div, Container, Text, Image.
  * **Advanced UI**: Cards, Tilt Cards, Scrolling Marquees.
  * **Forms**: Input fields, Buttons (Link/Action), Dropdowns.
  * **Double Click**: Instantly append any block to the bottom of the page by double-clicking it.
* **Icon Manager**:
  * Click the **Star Icon** in the top toolbar to open the Icon Manager.
  * Search and select from the full **Font Awesome 7 Free** library.
  * Icons work completely offline.
* **Interactions Manager**:
  * Click the **Thunder Icon** in the top toolbar to open the Interaction Manager.
  * **Triggers**: Attach events like `Click`, `MouseEnter` (Hover), or `MouseLeave`.
  * **Actions**:
    * **Animations**: Presets like Bounce, Shake, Pulse, Levitations.
    * **Utilities**: Scroll to Top, Toggle Visibility, Alerts.
    * **Custom Code**: Write your own JavaScript action for infinite flexibility.
* **Tailwind CSS**:
  * **Toggle**: Use the `TW: ON` button in the toolbar to enable/disable Tailwind CSS support.
* **Visual Palette**: Click the Paint Brush icon to open the Tailwind Palette. Visually apply colors, gradients, typography, animation, and spacing without writing code.
* **AI Generation**: Click the Magic Wand icon.
  * Select an element to modify it, or select nothing to append to the body.
  * *Tip*: To **replace** an element entirely, use keywords like "replace", "change", or "update" in your prompt.

### 2. React / Vue Projects (Code Editor)

When you open a `.jsx`, `.tsx`, or `.vue` file, LocalWeaver switches to **Code Mode**.

* **Graph View**: Visualizes your component import tree. You can see how `App.jsx` imports `Navbar.jsx`, etc.
* **Code Editor**: Edit your code with syntax highlighting using the integrated Monaco editor.
* **Important**: The **Visual Builder components are for HTML projects only**. React/Vue files require manual coding or AI assistance.
* **AI Assistance**: You can still use the AI to generate code snippets, which you can paste into the editor.

### 3. Previewing Your App

* **Start Dev Server**: Click this button (visible in React/Vue mode) to run your project's local dev server (e.g., `npm run dev`).
  * A terminal panel will appear showing the build output.
  * A small live view will render the running app.
* **Live Preview**: Click the "Live Preview" button in the top bar to open your running application in a separate method (e.g., full browser) for full-fidelity testing.

## Gallery

|                Visual Builder                |             Code Editor              |
| :------------------------------------------: | :----------------------------------: |
| ![Visual Builder](assets/visual-builder.png) | ![Code Editor](assets/code-view.png) |

|              Graph View              |               React Editor               |
| :----------------------------------: | :--------------------------------------: |
| ![Graph View](assets/graph-view.png) | ![React Editor](assets/react-editor.png) |

|            Tailwind Palette             |
| :-------------------------------------: |
| ![Palette](assets/tailwind-palette.png) |
