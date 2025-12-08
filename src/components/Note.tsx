import React, { useState } from 'react';
import type { Note as NoteType } from '../types';

interface NoteProps {
  note: NoteType;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  isBeingDragged: boolean;
}

export const Note: React.FC<NoteProps> = ({ note, onUpdate, onDelete, isBeingDragged }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    if (editContent.trim()) {
      onUpdate(note.id, editContent);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditContent(note.content);
      setIsEditing(false);
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${note.position.x}px`,
        top: `${note.position.y}px`,
        width: '200px',
        minHeight: '150px',
        backgroundColor: note.color,
        padding: '15px',
        borderRadius: '8px',
        boxShadow: isBeingDragged 
          ? '0 20px 40px rgba(0,0,0,0.3)' 
          : '0 4px 8px rgba(0,0,0,0.2)',
        cursor: 'move',
        transition: isBeingDragged ? 'none' : 'all 0.2s ease',
        transform: isBeingDragged ? 'scale(1.05)' : 'scale(1)',
        zIndex: isBeingDragged ? 1000 : 1,
        userSelect: 'none'
      }}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            width: '100%',
            minHeight: '120px',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'none'
          }}
        />
      ) : (
        <div style={{ 
          whiteSpace: 'pre-wrap', 
          wordBreak: 'break-word',
          fontSize: '14px',
          lineHeight: '1.5'
        }}>
          {note.content}
        </div>
      )}
      
      <button
        onClick={() => onDelete(note.id)}
        style={{
          position: 'absolute',
          top: '5px',
          right: '5px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: 'none',
          backgroundColor: 'rgba(0,0,0,0.2)',
          color: 'white',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>
    </div>
  );
};
