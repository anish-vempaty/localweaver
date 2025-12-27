import { useCallback, useEffect } from 'react';
import ReactFlow, {
    Node,
    Edge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    Connection,
    addEdge,
    Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { invoke } from '@tauri-apps/api/core';

interface GraphEditorProps {
    projectPath: string;
    onNodeSelect: (nodeId: string) => void;
}

interface BackendGraph {
    nodes: Node[];
    edges: Edge[];
}

export default function GraphEditor({ projectPath, onNodeSelect }: GraphEditorProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const loadGraph = useCallback(async () => {
        try {
            const graph = await invoke<BackendGraph>('scan_project', { path: projectPath });
            console.log("Loaded graph:", graph);
            setNodes(graph.nodes);
            setEdges(graph.edges);
        } catch (error) {
            console.error("Failed to scan project:", error);
        }
    }, [projectPath, setNodes, setEdges]);

    useEffect(() => {
        if (projectPath) {
            loadGraph();
        }
    }, [projectPath, loadGraph]);

    const onConnect = useCallback(
        async (params: Connection) => {
            setEdges((eds) => addEdge(params, eds));
            if (params.source && params.target) {
                try {
                    await invoke('connect_pages', {
                        path: projectPath,
                        source: params.source,
                        target: params.target
                    });
                } catch (err) {
                    console.error("Failed to connect pages:", err);
                }
            }
        },
        [setEdges, projectPath],
    );

    const saveLayout = async () => {
        try {
            await invoke('save_graph_state', {
                path: projectPath,
                nodes: nodes.map(n => ({ id: n.id, position: n.position, data: n.data, type: n.type }))
            });
            // alert("Graph layout saved!"); // Optional: suppress alert for internal calls
        } catch (err) {
            console.error("Error saving layout: " + err);
        }
    };

    const createPage = async () => {
        const name = prompt("Enter page name (e.g. about.html):");
        if (!name) return;
        try {
            await saveLayout(); // Save positions first
            // Small delay to ensure FS write completes/propagates?
            await new Promise(r => setTimeout(r, 100));
            await invoke('create_page', { path: projectPath, filename: name });
            loadGraph();
        } catch (err) {
            alert("Error creating page: " + err);
        }
    };

    return (
        <div style={{ width: '100%', height: '100%', background: '#1a1a1a' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={(_, node) => onNodeSelect(node.id)}
                fitView
            >
                <Background />
                <Controls />
                <MiniMap />
                <Panel position="top-right">
                    <button onClick={createPage} style={{ marginRight: 10 }}>+ Add Page</button>
                    <button onClick={saveLayout} style={{ marginRight: 10 }}>Save Layout</button>
                    <button onClick={loadGraph}>Refresh</button>
                </Panel>
            </ReactFlow>
        </div>
    );
}
