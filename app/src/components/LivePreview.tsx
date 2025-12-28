
import { useState } from 'react';
import { RefreshCcw } from 'lucide-react';

interface LivePreviewProps {
    url: string;
}

export default function LivePreview({ url }: LivePreviewProps) {
    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = () => setRefreshKey(prev => prev + 1);

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: 'white' }}>
            <div style={{ padding: '8px 10px', background: '#f0f0f0', borderBottom: '1px solid #ccc', display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={refresh} title="Refresh Preview" style={{ background: 'transparent', border: 'none', padding: 4, cursor: 'pointer', display: 'flex' }}>
                    <RefreshCcw size={16} />
                </button>
                <input
                    value={url}
                    readOnly
                    style={{ flex: 1, padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', background: '#fff', color: '#555', fontSize: 12 }}
                />
            </div>
            <iframe
                key={refreshKey}
                src={url}
                style={{ flex: 1, width: '100%', border: 'none' }}
                title="Live Preview"
            />
        </div>
    );
}
