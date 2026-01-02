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
    initialGraphData: { nodes: any[], edges: any[] };
    onRefresh: () => void;
}

export default function GraphEditor({ projectPath, onNodeSelect, initialGraphData, onRefresh }: GraphEditorProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Sync flow nodes when initialGraphData changes
    useEffect(() => {
        if (!initialGraphData) return;

        const graph = initialGraphData;
        console.log("SYNCING GRAPH DATA:", graph); // DEBUG

        // Map Backend Nodes to ReactFlow Nodes
        const flowNodes: Node[] = graph.nodes.map((n: any) => ({
            id: n.id,
            type: 'default',
            data: { label: n.data.label },
            position: n.position,
            style: {
                background: n.id.endsWith('.html') ? '#fff' : '#f0f4ff',
                border: '1px solid #777',
                padding: 10,
                borderRadius: 5,
                width: 180,
                fontSize: 12
            },
        }));

        setNodes(flowNodes);

        // Fuzzy Match Edges
        const flowEdges: Edge[] = [];
        graph.edges.forEach((e: any) => {
            let targetId = e.target;
            const simpleTarget = targetId.split('/').pop()?.split('.')[0];

            let found = flowNodes.find(n => n.id === targetId);

            if (!found && simpleTarget) {
                found = flowNodes.find(n => {
                    const nodeName = n.id.split('/').pop()?.split('.')[0];
                    return nodeName === simpleTarget && n.id !== e.source;
                });
            }

            if (found) {
                flowEdges.push({
                    id: e.id,
                    source: e.source,
                    target: found.id,
                    animated: true,
                    style: { stroke: '#555' }
                });
            }
        });

        setEdges(flowEdges);

    }, [initialGraphData, setNodes, setEdges]);

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
            onRefresh();
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
                    <button onClick={onRefresh}>Refresh</button>
                </Panel>
            </ReactFlow>
        </div>
    );
}
