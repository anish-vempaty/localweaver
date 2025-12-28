# How LocalWeaver Works

This document outlines the technical architecture of LocalWeaver. The application is built on the concept of **"Visual State to File System Synchronization."**

## 1. The Core Loop

The app does not use a database. The "Truth" is the file system itself.

1. **Read:** On startup, the app scans the project folder. It parses HTML files to reconstruct the Visual Graph.
2. **Edit:** The user modifies the graph or the page content in the UI.
3. **Write:** The app transpiles the visual state back into clean HTML/CSS files immediately.

## 2. The Graph Engine (Sitemap)

We use **React Flow** to manage the site structure.

* **Nodes:** Each "Node" on the canvas represents a unique HTML file (e.g., `index.html`, `contact.html`).
* **Edges (Lines):** A line connecting Node A to Node B represents a hyperlinked relationship.
  * *Logic:* If the user connects "Home" to "Contact," the system parses `index.html`, looks for the navigation menu, and injects `<a href="contact.html">Contact</a>`.

## 3. The Page Editor (UI/UX)

We use a wrapper around **GrapesJS** combined with an **AI Agent**.

* **The Canvas:** An iframe where the user sees the rendered HTML.
* **The Agent:** When a user types a prompt ("Add a testimonial section here"):
  1. The request is sent to the Local LLM (Ollama).
  2. The LLM generates the specific HTML block (e.g., `<div class="testimonial">...</div>`).
  3. The Editor injects this block into the DOM at the selected cursor position.

## 4. Local File Management

Since this is a desktop app, we use the Node.js `fs` module (or Rust file system bindings in Tauri) to handle I/O.

* **Project Structure:**
  ```text
  /MyWebsite
  ├── assets/       (Images, CSS, JS)
  ├── index.html    (Home Node)
  ├── about.html    (About Node)
  └── project.json  (Stores metadata about graph positions/colors)
  ```

## 5. Deployment Logic

Because the output is static HTML, "Deployment" is simple:

* **Self-Host:** The user can basically drag the project folder into an FTP client or S3 bucket.
* **Git Integration:** (Future Feature) Initialize a git repo in the folder and push to GitHub Pages automatically.
