import React from 'react';
import type { Message as MessageType } from '../types';

interface MessagesListProps {
  messages: MessageType[];
  currentUser: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const MessagesList: React.FC<MessagesListProps> = ({ 
  messages, 
  currentUser,
  messagesEndRef
}) => {
  return (
    <div className="messages-container">
      {messages.map((m, i) => (
        <div
          key={m.id || i}
          className={`message ${m.author === currentUser ? 'me' : m.author === 'Sistema' ? 'system' : 'other'}`}
        >
          <strong>{m.author}</strong> {m.content}
        </div>
      ))}
      {/* Elemento de referencia para el auto-scroll */}
      <div ref={messagesEndRef} />
    </div>
  );
};
