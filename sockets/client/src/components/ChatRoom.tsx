import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';

import { MessagesList } from './MessagesList';
import { ParticipantsList } from './ParticipantsList';

// Importamos las interfaces desde el archivo de tipos
import { 
  type Message, 
  type RoomInfo 
} from '../types';

interface ChatRoomProps {
  nickname: string;
  roomInfo: RoomInfo | null;
  messages: Message[];
  participants: string[];
  onSendMessage: (message: string) => void;
  onLeaveRoom: () => void;
  onGetParticipants: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ 
  nickname, 
  roomInfo, 
  messages, 
  participants, 
  onSendMessage, 
  onLeaveRoom,
  onGetParticipants
}) => {
  const [message, setMessage] = useState<string>('');
  const [showParticipants, setShowParticipants] = useState<boolean>(false);
    // Referencia al contenedor de mensajes para auto-scroll
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Efecto para auto-scroll cuando cambian los mensajes
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    // No enviamos si no hay texto
    if (!message.trim()) return;
    
    onSendMessage(message);
    setMessage('');
  };

  const toggleParticipantsList = () => {
    if (!showParticipants) {
      onGetParticipants();
    }
    setShowParticipants(!showParticipants);
  };

  return (
    <div className="app chat-app-static-header">
      <Card title={`Chat — ${nickname}`} className="chat-container">
        {/* Información de la sala */}
        <div className="room-info static-header">
          <div className="room-details">          <div className="room-pin-display">
              <i className="pi pi-lock"></i> PIN: <strong>{roomInfo?.pin || 'Error: PIN no disponible'}</strong>
            </div>
            <div 
              className="room-users-display"
              onClick={toggleParticipantsList}
              style={{ cursor: 'pointer' }}
            >
              <i className="pi pi-users"></i> Usuarios: <strong>{roomInfo?.currentParticipants}</strong>/{roomInfo?.maxParticipants}
            </div>
          </div>
          <Button 
            label="Salir" 
            icon="pi pi-sign-out" 
            className="p-button-danger p-button-sm" 
            onClick={onLeaveRoom}
          />
        </div>
        
        {/* Lista de participantes */}
        <ParticipantsList
          participants={participants}
          currentUser={nickname}
          visible={showParticipants}
          onClose={() => setShowParticipants(false)}
        />
        
        {/* Lista de mensajes */}
        <div className="messages-scrollable">
          <MessagesList
            messages={messages}
            currentUser={nickname}
            messagesEndRef={messagesEndRef}
          />
        </div>

        {/* Área de entrada y botón */}
        <div className="input-area">
          <InputTextarea
            rows={2}
            cols={30}
            value={message}
            onChange={e => setMessage(e.target.value)}         // Actualiza el mensaje
            placeholder="Escribe un mensaje"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            label="Enviar"
            icon="pi pi-send"
            onClick={handleSendMessage}  // Al hacer clic enviamos el mensaje
          />
        </div>
      </Card>
    </div>
  );
};
