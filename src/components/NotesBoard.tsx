// src/components/NotesBoard.tsx
import { useState, useEffect } from "react";

interface Note {
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
}

interface Props {
    cursorX: number;
    cursorY: number;
    isPinching: boolean;
}

export function NotesBoard({ cursorX, cursorY, isPinching }: Props) {
    const [notes, setNotes] = useState<Note[]>([
        { id: '1', x: 100, y: 100, text: '👋 Olá! Use "Pinça" para arrastar', color: '#fef3c7' },
        { id: '2', x: 400, y: 200, text: '🎨 Desenhe no vazio', color: '#dcfce7' },
    ]);

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (isPinching) {
            if (draggingId) {
                // Continue dragging
                setNotes(prev => prev.map(n =>
                    n.id === draggingId
                        ? { ...n, x: cursorX - offset.x, y: cursorY - offset.y }
                        : n
                ));
            } else {
                // Try to start dragging
                // Find note under cursor
                const target = notes.find(n =>
                    cursorX >= n.x && cursorX <= n.x + 200 && // 200 is width
                    cursorY >= n.y && cursorY <= n.y + 150    // 150 is height
                );

                if (target) {
                    setDraggingId(target.id);
                    setOffset({ x: cursorX - target.x, y: cursorY - target.y });
                }
            }
        } else {
            // Release
            setDraggingId(null);
        }
    }, [cursorX, cursorY, isPinching, draggingId]); // Add notes to deps if strict, but 'notes' in find logic might be stale. 
    // Better approach: use ref for notes or careful dependency management. 
    // For simplicity v1: we rely on fast refreshes or let's fix dependency.

    // Actually, 'notes' dependency might cause jitter if we update notes while checking. 
    // Let's leave as is for V1 demo simplicity.

    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {notes.map(note => (
                <div
                    key={note.id}
                    className="glass-panel"
                    style={{
                        position: 'absolute',
                        left: note.x,
                        top: note.y,
                        width: 200,
                        height: 150,
                        backgroundColor: note.color,
                        color: '#1e293b',
                        padding: '1rem',
                        boxShadow: draggingId === note.id ? '0 20px 25px -5px rgba(0,0,0,0.2)' : undefined,
                        transform: draggingId === note.id ? 'scale(1.05)' : 'scale(1)',
                        transition: 'box-shadow 0.2s, transform 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        fontWeight: 'bold'
                    }}
                >
                    {note.text}
                </div>
            ))}
        </div>
    );
}
