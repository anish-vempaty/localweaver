use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

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

    // 2. Walk directory for HTML files
    let walker = WalkDir::new(project_path).into_iter();
    for entry in walker.filter_entry(|e| {
        !e.file_name()
            .to_str()
            .map(|s| s.starts_with('.'))
            .unwrap_or(false)
    }) {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.file_type().is_file() {
            if let Some(extension) = entry.path().extension() {
                if extension == "html" {
                    let file_name = entry.file_name().to_string_lossy().to_string();
                    let relative_path = file_name.clone(); // For simplicity, using filename as ID. ideally relative path.

                    // Parse HTML for title and links
                    let content = fs::read_to_string(entry.path()).map_err(|e| e.to_string())?;
                    let document = Html::parse_document(&content);

                    // Title
                    let title_selector = Selector::parse("title").unwrap();
                    let title = document
                        .select(&title_selector)
                        .next()
                        .map(|el| el.text().collect::<String>())
                        .unwrap_or(file_name.clone());

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

                    // Edges (Links)
                    let a_selector = Selector::parse("a").unwrap();
                    for element in document.select(&a_selector) {
                        if let Some(href) = element.value().attr("href") {
                            if href.ends_with(".html") {
                                // Simple link check
                                let target = href.to_string();
                                // Avoid self-loops or duplicates here if needed, but for now allow
                                let edge_id = format!("{}-{}", relative_path, target);
                                edges.push(Edge {
                                    id: edge_id,
                                    source: relative_path.clone(),
                                    target,
                                });
                            }
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
fn create_page(path: String, filename: String) -> Result<(), String> {
    let project_path = Path::new(&path);
    let file_path = project_path.join(&filename);

    if file_path.exists() {
        return Err("File already exists".to_string());
    }

    let default_content = format!(
        "<!DOCTYPE html>\n<html>\n<head>\n<title>{}</title>\n</head>\n<body>\n<h1>{}</h1>\n</body>\n</html>",
        filename, filename
    );

    fs::write(file_path, default_content).map_err(|e| e.to_string())?;
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            scan_project,
            save_graph_state,
            create_page,
            connect_pages,
            read_page_content,
            save_page_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
