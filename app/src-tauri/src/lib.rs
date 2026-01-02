use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use sysinfo::{Pid, System};
use walkdir::WalkDir;

mod ast_bridge;

#[tauri::command]
fn kill_process(pid: u32) -> Result<(), String> {
    let mut system = System::new_all();
    system.refresh_all();

    let root_pid = Pid::from_u32(pid);

    // Collect all PIDs to kill (root + descendants)
    let mut to_kill = Vec::new();
    to_kill.push(root_pid);

    // Simple iterative search for children (sysinfo doesn't have a direct tree iterator easily accessible without building it)
    // For a deeper tree, we might need recursion.
    // Let's do a robust recursive search.

    fn collect_children(sys: &System, parent: Pid, list: &mut Vec<Pid>) {
        for (pid, process) in sys.processes() {
            if let Some(ppid) = process.parent() {
                if ppid == parent {
                    list.push(*pid);
                    collect_children(sys, *pid, list);
                }
            }
        }
    }

    collect_children(&system, root_pid, &mut to_kill);

    for pid in to_kill {
        if let Some(process) = system.process(pid) {
            process.kill();
        }
    }

    Ok(())
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Position {
    x: f64,
    y: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct NodeData {
    label: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Node {
    id: String,
    position: Position,
    data: NodeData,
    #[serde(rename = "type")]
    node_type: String, // "default" usually
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct Edge {
    id: String,
    source: String,
    target: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct ProjectGraph {
    nodes: Vec<Node>,
    edges: Vec<Edge>,
}

#[derive(Serialize, Deserialize, Debug)]
struct SavedGraphState {
    nodes: Vec<SavedNodeState>,
}

#[derive(Serialize, Deserialize, Debug)]
struct SavedNodeState {
    id: String,
    position: Position,
}

#[tauri::command]
fn scan_project(path: String) -> Result<ProjectGraph, String> {
    let project_path = Path::new(&path);
    if !project_path.exists() {
        return Err("Project path does not exist".to_string());
    }

    let mut nodes = Vec::new();
    let mut edges = Vec::new();

    // 1. Read project.json for positions
    let mut saved_positions: std::collections::HashMap<String, Position> =
        std::collections::HashMap::new();
    let project_json_path = project_path.join("project.json");
    if project_json_path.exists() {
        if let Ok(content) = fs::read_to_string(&project_json_path) {
            if let Ok(state) = serde_json::from_str::<SavedGraphState>(&content) {
                for node in state.nodes {
                    saved_positions.insert(node.id, node.position);
                }
            }
        }
    }

    // 2. Walk directory
    let walker = WalkDir::new(project_path).into_iter();

    // Compile regex for imports
    let import_regex =
        regex::Regex::new(r#"(?:import|from|require)\s*\(?['"]([^'"]+)['"]"#).unwrap();

    for entry in walker.filter_entry(|e| {
        let name = e.file_name().to_str().unwrap_or("");
        // Ignore hidden files and common build/dependency folders
        !name.starts_with('.')
            && name != "node_modules"
            && name != "dist"
            && name != "build"
            && name != "target"
    }) {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.file_type().is_file() {
            if let Some(extension) = entry.path().extension() {
                let ext_str = extension.to_string_lossy().to_string();
                if ["html", "vue", "jsx", "tsx", "js", "ts"].contains(&ext_str.as_str()) {
                    let path_buf = entry.path();
                    let relative_path = path_buf
                        .strip_prefix(project_path)
                        .map(|p| p.to_string_lossy().replace("\\", "/"))
                        .unwrap_or_else(|_| entry.file_name().to_string_lossy().to_string());

                    let file_name = entry.file_name().to_string_lossy().to_string();
                    let mut title = file_name.clone();
                    let mut parsed_edges = Vec::new();

                    // OPTIMIZATION: Check file size before reading to protect RAM
                    let metadata = fs::metadata(entry.path()).map_err(|e| e.to_string())?;
                    // Limit to 100KB (source files rarely exceed this; prevents reading massive bundles)
                    if metadata.len() < 100 * 1024 {
                        if let Ok(content) = fs::read_to_string(entry.path()) {
                            // 1. HTML Title Parsing (for html/vue)
                            if ext_str == "html" || ext_str == "vue" {
                                let document = Html::parse_document(&content);
                                let title_selector = Selector::parse("title").unwrap();
                                if let Some(t) = document.select(&title_selector).next() {
                                    title = t.text().collect::<String>();
                                }
                            }

                            // 2. Link Parsing (HTML tags)
                            if ext_str == "html" || ext_str == "vue" {
                                let document = Html::parse_document(&content);
                                let a_selector = Selector::parse("a").unwrap();
                                for element in document.select(&a_selector) {
                                    if let Some(href) = element.value().attr("href") {
                                        if !href.starts_with("http") && !href.starts_with("#") {
                                            parsed_edges.push(href.to_string());
                                        }
                                    }
                                }
                            }

                            // 3. Import Parsing (JS/TS/Vue)
                            if ["vue", "jsx", "tsx", "js", "ts"].contains(&ext_str.as_str()) {
                                for cap in import_regex.captures_iter(&content) {
                                    if let Some(match_str) = cap.get(1) {
                                        let import_path = match_str.as_str();
                                        // Filter out external libraries (start with alphanumeric usually)
                                        // Keep relative paths (./, ../, /) or defined aliases if possible
                                        // For now, simple heuristic: starts with . or /
                                        if import_path.starts_with('.')
                                            || import_path.starts_with('/')
                                        {
                                            parsed_edges.push(import_path.to_string());
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Normalize Edges
                    // This is naive. Ideally we resolve "./Component" to "src/components/Component.tsx"
                    // For now, we just strip "./" and hope for a partial string match in the frontend or simple ID match

                    // Node
                    let position = saved_positions
                        .get(&relative_path)
                        .cloned()
                        .unwrap_or(Position { x: 0.0, y: 0.0 });

                    nodes.push(Node {
                        id: relative_path.clone(),
                        position,
                        data: NodeData { label: title },
                        node_type: "default".to_string(),
                    });

                    // Add Edges
                    for target in parsed_edges {
                        let edge_target_id;

                        // Check if it's a relative import like "./components/Navbar"
                        if target.starts_with("./") || target.starts_with("../") {
                            let current_dir = Path::new(&relative_path).parent();
                            if let Some(dir) = current_dir {
                                let resolved = dir.join(&target);
                                // CRITICAL: Normalize to forward slashes for ID matching
                                let resolved_str = resolved.to_string_lossy().replace("\\", "/");

                                // Clean up ./ and ../ from the string if possible, but standard replace isn't path canonicalization
                                // The simplest connection strategy: Use the resolved path as the target ID
                                // (assuming scan found the file at that exact relative path)
                                // We strip implicit extensions if needed later, but for now:
                                edge_target_id = Some(resolved_str);
                            } else {
                                edge_target_id = Some(target.clone());
                            }
                        } else {
                            // Absolute-ish path (packages or aliases)
                            edge_target_id = Some(target.clone());
                        }

                        if let Some(term) = edge_target_id {
                            let _extensions = [".jsx", ".tsx", ".vue", ".js", ".ts", ".html"];

                            // Clean up the term to ensure it matches Node IDs (which have no ./ usually)
                            let final_target = term.replace("./", "");

                            let edge_id = format!("{}-{}", relative_path, final_target);
                            edges.push(Edge {
                                id: edge_id,
                                source: relative_path.clone(),
                                target: final_target,
                            });
                        }
                    }
                }
            }
        }
    }

    Ok(ProjectGraph { nodes, edges })
}

#[tauri::command]
fn save_graph_state(path: String, nodes: Vec<Node>) -> Result<(), String> {
    let project_path = Path::new(&path);
    let project_json_path = project_path.join("project.json");

    let saved_nodes: Vec<SavedNodeState> = nodes
        .into_iter()
        .map(|n| SavedNodeState {
            id: n.id,
            position: n.position,
        })
        .collect();

    let state = SavedGraphState { nodes: saved_nodes };
    let content = serde_json::to_string_pretty(&state).map_err(|e| e.to_string())?;

    fs::write(project_json_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn create_page(path: String, filename: String, content: Option<String>) -> Result<(), String> {
    let project_path = Path::new(&path);
    let file_path = project_path.join(&filename);

    if file_path.exists() {
        return Err("File already exists".to_string());
    }

    let final_content = if let Some(c) = content {
        c
    } else {
        format!(
            "<!DOCTYPE html>\n<html>\n<head>\n<title>{}</title>\n</head>\n<body>\n<h1>{}</h1>\n</body>\n</html>",
            filename, filename
        )
    };

    fs::write(file_path, final_content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn connect_pages(path: String, source: String, target: String) -> Result<(), String> {
    let project_path = Path::new(&path);
    let source_path = project_path.join(&source);

    if !source_path.exists() {
        return Err("Source file does not exist".to_string());
    }

    let content = fs::read_to_string(&source_path).map_err(|e| e.to_string())?;
    // Simple append for now. In reality, should parse and insert in nav.
    // If <nav> exists, append there. Else append to body.

    // We will just append before </body>
    let new_link = format!(r#"<a href="{}" style="color: blue">{}</a>"#, target, target);
    let new_content = if content.contains("</body>") {
        content.replace("</body>", &format!("{}\n</body>", new_link))
    } else {
        format!("{}\n{}", content, new_link)
    };

    fs::write(source_path, new_content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn read_page_content(path: String, filename: String) -> Result<String, String> {
    let project_path = Path::new(&path);
    let file_path = project_path.join(&filename);

    if !file_path.exists() {
        return Err("File does not exist".to_string());
    }

    fs::read_to_string(file_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_page_content(path: String, filename: String, content: String) -> Result<(), String> {
    let project_path = Path::new(&path);
    let file_path = project_path.join(&filename);

    fs::write(file_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn create_project_folder(path: String) -> Result<String, String> {
    let project_path = Path::new(&path);
    if project_path.exists() {
        return Err("Directory already exists".to_string());
    }
    fs::create_dir_all(project_path).map_err(|e| e.to_string())?;

    // Create an initial empty project.json or index.html to make it a valid project?
    // User didn't ask, but it's good practice. Let's just make the folder for now as requested.

    Ok(path)
}

// --- AST COMMANDS ---

#[tauri::command]
fn get_component_tree(
    path: String,
    filename: String,
) -> Result<Vec<ast_bridge::ComponentNode>, String> {
    let project_path = Path::new(&path);
    let file_path = project_path.join(&filename);

    if !file_path.exists() {
        return Err("File does not exist".to_string());
    }

    let content = fs::read_to_string(file_path).map_err(|e| e.to_string())?;
    ast_bridge::parse_jsx(&content)
}

#[tauri::command]
fn update_component_props(
    path: String,
    filename: String,
    node_id: String,
    props: String,
) -> Result<(), String> {
    let project_path = Path::new(&path);
    let file_path = project_path.join(&filename);

    if !file_path.exists() {
        return Err("File does not exist".to_string());
    }

    let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;

    let new_props: serde_json::Map<String, serde_json::Value> =
        serde_json::from_str(&props).map_err(|e| e.to_string())?;

    let update = ast_bridge::UpdateRequest {
        node_id,
        new_props: Some(new_props),
    };

    let new_code = ast_bridge::update_jsx_node(&content, vec![update])?;

    fs::write(file_path, new_code).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn ensure_example_project() -> Result<String, String> {
    let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
    let exe_dir = exe_path.parent().unwrap_or(Path::new("."));
    let project_path = exe_dir.join("localweaver-example");
    let project_path_str = project_path.to_string_lossy().to_string();

    if !project_path.exists() {
        fs::create_dir_all(&project_path).map_err(|e| e.to_string())?;
    }

    let index_path = project_path.join("index.html");
    if !index_path.exists() {
        // Use create_dir_all relative to cargo manifest dir if needed, but include_str embeds at compile time
        // so we just write the string content.
        let content = include_str!("../assets/example_index.html");
        fs::write(index_path, content).map_err(|e| e.to_string())?;
    }

    let about_path = project_path.join("about.html");
    if !about_path.exists() {
        let content = include_str!("../assets/example_about.html");
        fs::write(about_path, content).map_err(|e| e.to_string())?;
    }

    Ok(project_path_str)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            scan_project,
            save_graph_state,
            create_page,
            connect_pages,
            read_page_content,
            save_page_content,
            kill_process,
            create_project_folder,
            get_component_tree,
            update_component_props,
            ensure_example_project
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
