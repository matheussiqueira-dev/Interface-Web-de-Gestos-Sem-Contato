import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const NOTE_WIDTH = 240;
const NOTE_HEIGHT = 180;

const initialNotes: Note[] = [
    { id: "1", x: 120, y: 150, text: '👋 Olá! Use "Pinça" para arrastar esta nota', color: "#fef3c7" },
    { id: "2", x: 450, y: 250, text: "🎨 Desenhe no quadro fazendo o gesto de pinça no vazio", color: "#dcfce7" },
    { id: "3", x: 250, y: 450, text: "✊ Feche o punho para pausar o rastreamento", color: "#e0f2fe" },
];

export function NotesBoard({ cursorX, cursorY, isPinching, width, height, resetSignal }: Props) {
    const [notes, setNotes] = useState<Note[]>(() => initialNotes);
    const notesRef = useRef(notes);

    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const bounds = useMemo(() => ({
        maxX: Math.max(32, width - NOTE_WIDTH - 32),
        maxY: Math.max(32, height - NOTE_HEIGHT - 32),
    }), [width, height]);

    useEffect(() => {
        notesRef.current = notes;
    }, [notes]);

    useEffect(() => {
        if (!isPinching) {
            setDraggingId(null);
            return;
        }

        if (draggingId) {
            setNotes(prev => {
                let changed = false;
                const next = prev.map(n => {
                    if (n.id !== draggingId) return n;
                    const nextX = clamp(cursorX - offset.x, 32, bounds.maxX);
                    const nextY = clamp(cursorY - offset.y, 32, bounds.maxY);
                    if (Math.abs(nextX - n.x) < 0.5 && Math.abs(nextY - n.y) < 0.5) return n;
                    changed = true;
                    return { ...n, x: nextX, y: nextY };
                });
                return changed ? next : prev;
            });
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
    }, [cursorX, cursorY, isPinching, draggingId, offset.x, offset.y, bounds.maxX, bounds.maxY]);

    useEffect(() => {
        setNotes(initialNotes);
        setDraggingId(null);
    }, [resetSignal]);

    return (
        <div className="notes-board">
            <AnimatePresence>
                {notes.map(note => (
                    <motion.div
                        key={note.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                            opacity: 1,
                            scale: draggingId === note.id ? 1.05 : 1,
                            x: note.x,
                            y: note.y,
                            boxShadow: draggingId === note.id
                                ? "0 30px 60px -12px rgba(0,0,0,0.3)"
                                : "0 10px 20px -10px rgba(0,0,0,0.1)"
                        }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                            x: { duration: 0.05 },
                            y: { duration: 0.05 }
                        }}
                        className="note-card glass"
                        style={{
                            backgroundColor: note.color,
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            pointerEvents: 'auto'
                        }}
                    >
                        <div style={{ color: '#0f172a', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            {note.text}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
