import React, { useState, useEffect, useRef } from 'react';
import { Note } from './Note';
import type { Note as NoteType, GestureState, CursorPosition } from '../types';

interface NotesBoardProps {
  gestureState: GestureState;
  cursorPosition: CursorPosition;
}

const NOTE_COLORS = [
  '#fef3c7', '#fecaca', '#ddd6fe', '#bfdbfe', '#bbf7d0'
];

export const NotesBoard: React.FC<NotesBoardProps> = ({ gestureState, cursorPosition }) => {
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [draggedNote, setDraggedNote] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const previousGestureRef = useRef<string>('none');
  const pinchStartTimeRef = useRef<number>(0);
  const lastPinchPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Create new note on quick pinch
  useEffect(() => {
    const screenX = cursorPosition.smoothX * window.innerWidth;
    const screenY = cursorPosition.smoothY * window.innerHeight;

    // Detect pinch start
    if (gestureState.type === 'pinch' && 
        gestureState.isStable && 
        previousGestureRef.current !== 'pinch') {
      pinchStartTimeRef.current = Date.now();
      lastPinchPositionRef.current = { x: screenX, y: screenY };
    }

    // Detect pinch release (quick pinch = create note)
    if (previousGestureRef.current === 'pinch' && 
        gestureState.type !== 'pinch' && 
        !draggedNote) {
      const pinchDuration = Date.now() - pinchStartTimeRef.current;
      
      // Quick pinch (less than 500ms) creates a note
      if (pinchDuration < 500) {
        createNote(lastPinchPositionRef.current.x, lastPinchPositionRef.current.y);
      }
    }

    previousGestureRef.current = gestureState.type;
  }, [gestureState, cursorPosition, draggedNote]);

  // Handle note dragging with fist gesture
  useEffect(() => {
    if (gestureState.type === 'fist' && gestureState.isStable && !draggedNote) {
      // Check if cursor is over any note
      const screenX = cursorPosition.smoothX * window.innerWidth;
      const screenY = cursorPosition.smoothY * window.innerHeight;
      
      const noteUnderCursor = findNoteAtPosition(screenX, screenY);
      if (noteUnderCursor) {
        setDraggedNote(noteUnderCursor.id);
        setDragOffset({
          x: screenX - noteUnderCursor.position.x,
          y: screenY - noteUnderCursor.position.y
        });
      }
    } else if (gestureState.type !== 'fist' && draggedNote) {
      // Release dragged note
      setDraggedNote(null);
    }
  }, [gestureState, cursorPosition, draggedNote, notes]);

  // Update dragged note position
  useEffect(() => {
    if (draggedNote) {
      const screenX = cursorPosition.smoothX * window.innerWidth;
      const screenY = cursorPosition.smoothY * window.innerHeight;
      
      setNotes(prevNotes => 
        prevNotes.map(note => 
          note.id === draggedNote
            ? {
                ...note,
                position: {
                  x: Math.max(0, Math.min(window.innerWidth - 200, screenX - dragOffset.x)),
                  y: Math.max(0, Math.min(window.innerHeight - 150, screenY - dragOffset.y))
                }
              }
            : note
        )
      );
    }
  }, [draggedNote, cursorPosition, dragOffset]);

  const createNote = (x: number, y: number) => {
    const newNote: NoteType = {
      id: Date.now().toString(),
      content: 'Double click to edit',
      position: { 
        x: Math.max(0, Math.min(window.innerWidth - 200, x - 100)),
        y: Math.max(0, Math.min(window.innerHeight - 150, y - 75))
      },
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]
    };
    setNotes(prev => [...prev, newNote]);
  };

  const findNoteAtPosition = (x: number, y: number): NoteType | null => {
    // Check notes in reverse order (top to bottom)
    for (let i = notes.length - 1; i >= 0; i--) {
      const note = notes[i];
      if (x >= note.position.x && x <= note.position.x + 200 &&
          y >= note.position.y && y <= note.position.y + 150) {
        return note;
      }
    }
    return null;
  };

  const updateNoteContent = (id: string, content: string) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === id ? { ...note, content } : note
      )
    );
  };

  const deleteNote = (id: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      {notes.map(note => (
        <Note
          key={note.id}
          note={note}
          onUpdate={updateNoteContent}
          onDelete={deleteNote}
          isBeingDragged={draggedNote === note.id}
        />
      ))}
      
      {notes.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '18px'
        }}>
          <p>Quick pinch to create a note</p>
          <p style={{ fontSize: '14px', marginTop: '10px' }}>Make a fist to drag notes</p>
        </div>
      )}
    </div>
  );
};
