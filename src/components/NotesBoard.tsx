// src/components/NotesBoard.tsx
import { useEffect, useRef, useState } from "react";
import { clamp } from "../utils/geometry";

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
    width: number;
    height: number;
    resetSignal: number;
}

const NOTE_WIDTH = 220;
const NOTE_HEIGHT = 160;

const initialNotes: Note[] = [
    { id: "1", x: 120, y: 120, text: '👋 Olá! Use "Pinça" para arrastar', color: "#fef3c7" },
    { id: "2", x: 420, y: 220, text: "🎨 Desenhe no vazio", color: "#dcfce7" },
    { id: "3", x: 220, y: 420, text: "✊ Feche o punho para pausar o traço", color: "#e0f2fe" },
];

export function NotesBoard({ cursorX, cursorY, isPinching, width, height, resetSignal }: Props) {
    const [notes, setNotes] = useState<Note[]>(() => initialNotes);
    const notesRef = useRef(notes);

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        notesRef.current = notes;
    }, [notes]);

    useEffect(() => {
        if (!isPinching) {
            setDraggingId(null);
            return;
        }

        if (draggingId) {
            setNotes(prev =>
                prev.map(n => {
                    if (n.id !== draggingId) return n;
                    const nextX = clamp(cursorX - offset.x, 16, Math.max(16, width - NOTE_WIDTH - 16));
                    const nextY = clamp(cursorY - offset.y, 16, Math.max(16, height - NOTE_HEIGHT - 16));
                    return { ...n, x: nextX, y: nextY };
                })
            );
            return;
        }

        const target = notesRef.current.find(n =>
            cursorX >= n.x &&
            cursorX <= n.x + NOTE_WIDTH &&
            cursorY >= n.y &&
            cursorY <= n.y + NOTE_HEIGHT
        );

        if (target) {
            setDraggingId(target.id);
            setOffset({ x: cursorX - target.x, y: cursorY - target.y });
        }
    }, [cursorX, cursorY, isPinching, draggingId, offset.x, offset.y, width, height]);

    useEffect(() => {
        setNotes(initialNotes);
        setDraggingId(null);
        setOffset({ x: 0, y: 0 });
    }, [resetSignal]);

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
                        width: NOTE_WIDTH,
                        height: NOTE_HEIGHT,
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
