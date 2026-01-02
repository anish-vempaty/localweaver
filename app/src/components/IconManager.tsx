import { useState, useEffect } from 'react';
import { Editor } from 'grapesjs';
import { Search } from 'lucide-react';
import DraggableWindow from './DraggableWindow';

interface IconManagerProps {
    editor: Editor;
    onClose: () => void;
}

const FONT_AWESOME_URL = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.0/css/all.min.css';

type IconStyle = 'solid' | 'regular' | 'brands';

export default function IconManager({ editor, onClose }: IconManagerProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [allIcons, setAllIcons] = useState<string[]>([]);
    const [filteredIcons, setFilteredIcons] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [iconStyle, setIconStyle] = useState<IconStyle>('solid');

    useEffect(() => {
        // Dynamic fetch of icons from the CSS
        const fetchIcons = async () => {
            try {
                setLoading(true);
                const response = await fetch(FONT_AWESOME_URL);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const cssText = await response.text();

                // Parse CSS for icons.
                // FA6 uses .fa-icon:before { content: ... }
                // FA7 uses .fa-icon { --fa: ... }
                // We match both patterns.
                const iconRegex = /\.fa-([a-z0-9-]+)(?::+before|\s*\{\s*--fa)/g;
                const icons = new Set<string>();
                let match;

                while ((match = iconRegex.exec(cssText)) !== null) {
                    if (match[1]) {
                        icons.add('fa-' + match[1]);
                    }
                }

                const iconList = Array.from(icons).sort();
                if (iconList.length === 0) throw new Error("No icons parsed from CSS");

                setAllIcons(iconList);
                setFilteredIcons(iconList);
            } catch (error) {
                console.error("Failed to load icons:", error);

                // Fallback to commonly used icons
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
                    'fa-share-alt', 'fa-retweet', 'fa-reply', 'fa-reply-all', 'fa-history',
                    'fa-rocket', 'fa-code', 'fa-magic', 'fa-layer-group', 'fa-table-columns',
                    'fa-heading', 'fa-compass', 'fa-window-maximize', 'fa-copyright', 'fa-note-sticky',
                    'fa-pencil', 'fa-square-check', 'fa-caret-down', 'fa-right-left', 'fa-id-card', 'fa-paper-plane'
                ];

                setAllIcons(commonIcons);
                setFilteredIcons(commonIcons);
            } finally {
                setLoading(false);
            }
        };

        fetchIcons();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredIcons(allIcons);
        } else {
            setFilteredIcons(allIcons.filter(i => i.includes(searchTerm.toLowerCase())));
        }
    }, [searchTerm, allIcons]);

    const applyIcon = (iconClass: string) => {
        const selected = editor.getSelected();
        const styleClass = `fa-${iconStyle}`;
        const iconHtml = `<i class="${styleClass} ${iconClass} text-xl m-1"></i>`;

        if (selected) {
            const tagName = selected.get('tagName');
            if (tagName === 'i') {
                // Formatting/Replacing existing icon
                const currentClasses = selected.getClasses();
                currentClasses.forEach((c: string) => {
                    if (c.startsWith('fa-')) selected.removeClass(c);
                });
                selected.addClass(styleClass);
                selected.addClass(iconClass);
            } else {
                // Append to container
                selected.append(iconHtml);
            }
        } else {
            // Add to end of body
            editor.addComponents(iconHtml);
        }
        editor.trigger('component:toggled');
        // We don't close, allowing multiple additions? User asked to place it. closing seems appropriate or maybe keep open.
        // Let's close for now to be safe, or keep open for speed?
        // User didn't specify. I'll close it to mimic previous behavior.
        onClose();
    };

    return (
        <DraggableWindow title="Select Icon" onClose={onClose} initialWidth={600} initialHeight={500}>
            {/* Search and Filter */}
            <div style={{ padding: 15, borderBottom: '1px solid #333', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                {/* Style Toggles */}
                <div style={{ display: 'flex', gap: 5 }}>
                    {(['solid', 'regular', 'brands'] as IconStyle[]).map(style => (
                        <button
                            key={style}
                            onClick={() => setIconStyle(style)}
                            style={{
                                flex: 1,
                                padding: '6px',
                                background: iconStyle === style ? '#3b82f6' : '#2a2a2a',
                                color: iconStyle === style ? 'white' : '#888',
                                border: '1px solid #333',
                                borderRadius: 4,
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                                fontSize: 12
                            }}
                        >
                            {style}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div style={{ flex: 1, padding: 15, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: 10 }}>
                {loading ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#888', padding: 20 }}>
                        Loading icons...
                    </div>

                ) : filteredIcons.map(icon => (
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
                        <i className={`fa-${iconStyle} ${icon}`} style={{ fontSize: 20 }}></i>
                        <span style={{ fontSize: 9, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', opacity: 0.7 }}>
                            {icon.replace('fa-', '')}
                        </span>
                    </button>
                ))}
                {!loading && filteredIcons.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666', padding: 20 }}>
                        No icons found.
                    </div>
                )}
            </div>
        </DraggableWindow>
    );
}
