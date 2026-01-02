import { useState, useEffect } from 'react';
import { Editor } from 'grapesjs';
import { Search } from 'lucide-react';
import DraggableWindow from './DraggableWindow';

interface IconManagerProps {
    editor: Editor;
    onClose: () => void;
}

const commonIcons = [
    'fa-user', 'fa-home', 'fa-search', 'fa-cog', 'fa-envelope', 'fa-phone',
    'fa-bars', 'fa-trash', 'fa-edit', 'fa-plus', 'fa-minus', 'fa-check',
    'fa-times', 'fa-arrow-right', 'fa-arrow-left', 'fa-arrow-up', 'fa-arrow-down',
    'fa-chevron-right', 'fa-chevron-left', 'fa-chevron-up', 'fa-chevron-down',
    'fa-calendar', 'fa-clock', 'fa-map-marker-alt', 'fa-star', 'fa-heart',
    'fa-camera', 'fa-image', 'fa-music', 'fa-video', 'fa-file', 'fa-folder',
    'fa-download', 'fa-upload', 'fa-cloud', 'fa-comments', 'fa-comment',
    'fa-bell', 'fa-shopping-cart', 'fa-credit-card', 'fa-money-bill',
    'fa-user-circle', 'fa-users', 'fa-laptop', 'fa-desktop', 'fa-mobile-alt',
    'fa-tablet-alt', 'fa-list', 'fa-th', 'fa-th-list', 'fa-info-circle',
    'fa-question-circle', 'fa-exclamation-circle', 'fa-exclamation-triangle',
    'fa-lock', 'fa-unlock', 'fa-key', 'fa-sign-in-alt', 'fa-sign-out-alt',
    'fa-share-alt', 'fa-retweet', 'fa-reply', 'fa-reply-all', 'fa-history'
];

export default function IconManager({ editor, onClose }: IconManagerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredIcons, setFilteredIcons] = useState(commonIcons);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredIcons(commonIcons);
        } else {
            setFilteredIcons(commonIcons.filter(i => i.includes(searchTerm.toLowerCase())));
        }
    }, [searchTerm]);

    const applyIcon = (iconClass: string) => {
        const selected = editor.getSelected();
        if (selected) {
            const currentClasses = selected.getClasses();
            currentClasses.forEach((c: string) => {
                if (c.startsWith('fa-')) selected.removeClass(c);
            });
            selected.addClass('fa-solid');
            selected.addClass(iconClass);
            editor.trigger('component:toggled');
            onClose();
        }
    };

    return (
        <DraggableWindow title="Select Icon" onClose={onClose} initialWidth={600} initialHeight={500}>
            {/* Search */}
            <div style={{ padding: 15, borderBottom: '1px solid #333' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: 10, top: 10, color: '#888' }} />
                    <input
                        type="text"
                        placeholder="Search icons... (e.g. user, arrow)"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '8px 10px 8px 35px',
                            background: '#252525', border: '1px solid #444',
                            color: 'white', borderRadius: 4, outline: 'none'
                        }}
                        autoFocus
                    />
                </div>
            </div>

            {/* Grid */}
            <div style={{ flex: 1, padding: 15, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: 10 }}>
                {filteredIcons.map(icon => (
                    <button
                        key={icon}
                        onClick={() => applyIcon(icon)}
                        style={{
                            background: '#2a2a2a', border: '1px solid #333',
                            borderRadius: 4, aspectRatio: '1',
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#ccc', gap: 5
                        }}
                        title={icon}
                    >
                        <i className={`fa-solid ${icon}`} style={{ fontSize: 20 }}></i>
                        <span style={{ fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', opacity: 0.7 }}>
                            {icon.replace('fa-', '')}
                        </span>
                    </button>
                ))}
                {filteredIcons.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666', padding: 20 }}>
                        No icons found.
                    </div>
                )}
            </div>
        </DraggableWindow>
    );
}
