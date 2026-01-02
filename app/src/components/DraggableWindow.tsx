import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DraggableWindowProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    initialWidth?: number;
    initialHeight?: number;
    minWidth?: number;
    minHeight?: number;
}

export default function DraggableWindow({
    title,
    onClose,
    children,
    initialWidth = 400,
    initialHeight = 500,
    minWidth = 300,
    minHeight = 200
}: DraggableWindowProps) {
    const [position, setPosition] = useState({ x: window.innerWidth / 2 - initialWidth / 2, y: window.innerHeight / 2 - initialHeight / 2 });
    const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const windowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const dx = e.clientX - dragStartRef.current.x;
                const dy = e.clientY - dragStartRef.current.y;
                setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
                dragStartRef.current = { x: e.clientX, y: e.clientY };
            }
            if (isResizing) {
                const dx = e.clientX - dragStartRef.current.x;
                const dy = e.clientY - dragStartRef.current.y;
                setSize(prev => ({
                    width: Math.max(minWidth, prev.width + dx),
                    height: Math.max(minHeight, prev.height + dy)
                }));
                dragStartRef.current = { x: e.clientX, y: e.clientY };
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, minWidth, minHeight]);

    const startDrag = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    const startResize = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
        dragStartRef.current = { x: e.clientX, y: e.clientY };
    };

    return (
        <div
            ref={windowRef}
            style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                width: size.width,
                height: size.height,
                background: '#1e1e1e',
                color: 'white',
                borderRadius: 8,
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                zIndex: 9999, // High z-index but below prompts if any
                border: '1px solid #333',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            {/* Header / Drag Handle */}
            <div
                onMouseDown={startDrag}
                style={{
                    padding: '10px 15px',
                    borderBottom: '1px solid #333',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'grab',
                    background: '#252525',
                    userSelect: 'none'
                }}
            >
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{title}</h3>
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', display: 'flex' }}
                >
                    <X size={16} />
                </button>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {children}
            </div>

            {/* Resize Handle */}
            <div
                onMouseDown={startResize}
                style={{
                    position: 'absolute',
                    right: 0,
                    bottom: 0,
                    width: 15,
                    height: 15,
                    cursor: 'nwse-resize',
                    zIndex: 10
                }}
            >
                {/* Visual indicator corner */}
                <div style={{
                    position: 'absolute',
                    right: 4,
                    bottom: 4,
                    width: 6,
                    height: 6,
                    borderRight: '2px solid #555',
                    borderBottom: '2px solid #555'
                }} />
            </div>
        </div>
    );
}
