import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import "./App.css";
import ProjectRunner from "./components/ProjectRunner";
import LivePreview from "./components/LivePreview";
import ProjectSelector from "./components/ProjectSelector";

// Lazy Load Heavy Components
const GraphEditor = lazy(() => import("./components/GraphEditor"));
const PageEditor = lazy(() => import("./components/PageEditor"));
const VisualBuilder = lazy(() => import("./components/VisualBuilder"));

interface BackendGraph {
  nodes: any[];
  edges: any[];
}

function App() {
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'graph' | 'editor' | 'preview' | 'visual_builder'>('graph');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);

  // Graph Data Hoisted
  const [graphData, setGraphData] = useState<BackendGraph>({ nodes: [], edges: [] });

  const loadGraph = useCallback(async () => {
    if (!projectPath) return;
    try {
      const graph = await invoke<BackendGraph>('scan_project', { path: projectPath });
      setGraphData(graph);
    } catch (err) {
      console.error("Failed to fetch graph:", err);
    }
  }, [projectPath]);

  // Initial load
  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  const handleNodeSelect = (nodeId: string) => {
    setSelectedFile(nodeId);
    setActiveTab('editor');
  };

  const handleBrowse = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: projectPath || undefined,
      });
      if (selected && typeof selected === 'string') {
        setProjectPath(selected);
      }
    } catch (err) {
      console.error("Failed to open dialog:", err);
    }
  };

  const isFrameworkFile = selectedFile && (selectedFile.endsWith('.jsx') || selectedFile.endsWith('.tsx') || selectedFile.endsWith('.vue'));

  // Calculate neighbors for the selected file
  const neighbors = selectedFile ? graphData.edges
    .filter(e => e.source === selectedFile)
    .map(e => {
      // Resolve target ID to label or basename
      const targetNode = graphData.nodes.find(n => n.id === e.target);
      return {
        id: e.target,
        label: targetNode?.data?.label || e.target.split('/').pop() || e.target
      };
    })
    : [];

  if (!projectPath) {
    return <ProjectSelector onSelect={setProjectPath} />;
  }

  return (
    <div className="container">
      <div className="toolbar" style={{ padding: 10, background: '#333', display: 'flex', gap: 10, alignItems: 'center', color: 'white' }}>
        <span>Project:</span>
        <input
          value={projectPath}
          onChange={(e) => setProjectPath(e.target.value)}
          style={{ width: 300, padding: 5 }}
        />
        <button onClick={handleBrowse} style={{ marginLeft: 5 }}>Browse</button>
        <div style={{ flex: 1 }} />
        <span>{selectedFile ? `Editing: ${selectedFile}` : "No file selected"}</span>
        <button onClick={() => setActiveTab('graph')} disabled={activeTab === 'graph'}>Graph View</button>
        <button
          onClick={() => setActiveTab('editor')}
          disabled={activeTab === 'editor' || !selectedFile}
        >
          Page Editor
        </button>
        <button onClick={() => setActiveTab('visual_builder')} disabled={activeTab === 'visual_builder'}>
          Visual Builder
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          disabled={activeTab === 'preview' || !liveUrl}
          title={!liveUrl ? "Start server first" : "View Fullscreen Preview"}
        >
          Live Preview
        </button>
      </div>

      <div className="content" style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: '100%', height: '100%', display: activeTab === 'graph' ? 'block' : 'none' }}>
          <Suspense fallback={<div className="loading-overlay">Loading Graph...</div>}>
            <GraphEditor
              projectPath={projectPath}
              onNodeSelect={handleNodeSelect}
              initialGraphData={graphData}
              onRefresh={loadGraph}
            />
          </Suspense>
        </div>

        <div style={{ width: '100%', height: '100%', display: activeTab === 'visual_builder' ? 'block' : 'none' }}>
          <Suspense fallback={<div className="loading-overlay">Loading Visual Builder...</div>}>
            <VisualBuilder projectPath={projectPath} />
          </Suspense>
        </div>

        {/* Editor Tab: Split View if Framework, Single View if HTML */}
        <div style={{ width: '100%', height: '100%', display: activeTab === 'editor' && selectedFile ? 'flex' : 'none' }}>
          {selectedFile && (
            <Suspense fallback={<div className="loading-overlay">Loading Editor...</div>}>
              <>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <PageEditor
                    projectPath={projectPath}
                    filename={selectedFile}
                    neighbors={neighbors}
                    onNavigate={handleNodeSelect}
                  />
                </div>
                {/* Sidebar for Runner/Mini-Preview */}
                {isFrameworkFile && (
                  <div style={{ width: 400, borderLeft: '1px solid #444', display: 'flex', flexDirection: 'column' }}>
                    {/* Placeholder to keep layout consistent */}
                  </div>
                )}
              </>
            </Suspense>
          )}
        </div>

        {/* WE MUST RENDER PROJECT RUNNER ALWAYS TO KEEP PROCESS ALIVE */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 400,
          height: '100%',
          borderLeft: '1px solid #444',
          background: '#1e1e1e',
          zIndex: 10,
          display: (activeTab === 'editor' && isFrameworkFile) ? 'flex' : 'none',
          flexDirection: 'column'
        }}>
          <div style={{ height: '50%', borderBottom: '1px solid #444' }}>
            <ProjectRunner projectPath={projectPath} onUrlReady={setLiveUrl} />
          </div>
          <div style={{ height: '50%' }}>
            {liveUrl ? <LivePreview url={liveUrl} /> : <div style={{ padding: 20, color: '#888' }}>Waiting...</div>}
          </div>
        </div>

        {/* Fullscreen Preview Tab */}
        <div style={{ width: '100%', height: '100%', display: activeTab === 'preview' ? 'block' : 'none', background: 'white' }}>
          {liveUrl ? (
            <iframe src={liveUrl} style={{ width: '100%', height: '100%', border: 'none' }} title="Fullscreen Preview" />
          ) : (
            <div style={{ padding: 20, color: '#333' }}>Server not running. Go to Editor and start it.</div>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;

