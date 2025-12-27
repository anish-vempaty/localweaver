import { useState } from "react";
import { open } from '@tauri-apps/plugin-dialog';
import "./App.css";
import GraphEditor from "./components/GraphEditor";
import PageEditor from "./components/PageEditor";

function App() {
  const [projectPath, setProjectPath] = useState("c:\\PROJECTS\\localweaver\\test-site");
  const [activeTab, setActiveTab] = useState<'graph' | 'editor'>('graph');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleNodeSelect = (nodeId: string) => {
    setSelectedFile(nodeId);
    setActiveTab('editor');
  };

  const handleBrowse = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: projectPath,
      });
      if (selected && typeof selected === 'string') {
        setProjectPath(selected);
      }
    } catch (err) {
      console.error("Failed to open dialog:", err);
    }
  };

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
      </div>

      <div className="content" style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '100%', display: activeTab === 'graph' ? 'block' : 'none' }}>
          <GraphEditor
            projectPath={projectPath}
            onNodeSelect={handleNodeSelect}
          />
        </div>
        {activeTab === 'editor' && selectedFile && (
          <PageEditor
            projectPath={projectPath}
            filename={selectedFile}
          />
        )}
      </div>
    </div>
  );
}

export default App;
