import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { RoomsList } from './RoomsList';
import { Toast } from 'primereact/toast';

// Importamos los tipos desde el archivo principal de tipos
import { type HostInfo, type AvailableRoom } from '../types';

interface LobbyProps {
  nickname: string;
  hostInfo: HostInfo;
  availableRooms: AvailableRoom[];
  onCreateRoom: () => void;
  onJoinRoom: () => void;
  onSelectRoom: (pin: string) => void;
  toast: React.RefObject<Toast | null>;
}

export const Lobby: React.FC<LobbyProps> = ({ 
  nickname, 
  hostInfo, 
  availableRooms,
  onCreateRoom,
  onJoinRoom, 
  onSelectRoom,
  toast 
}) => {
  return (
    <div className="app">
      <Card title="Salas de Chat" className="rooms-card">
        <div className="room-options">
          <Button 
            label="Crear una sala" 
            icon="pi pi-plus-circle"
            className="p-button-success p-mr-2" 
            onClick={onCreateRoom} 
          />
          <Button 
            label="Unirse a una sala" 
            icon="pi pi-sign-in"
            className="p-button-info" 
            onClick={onJoinRoom} 
          />
        </div>
        
        {/* Lista de salas disponibles */}
        <RoomsList 
          availableRooms={availableRooms}
          onSelectRoom={onSelectRoom}
          toast={toast}
        />
        
        {/* Información de host */}
        <div className="host-info">
          Conectado como: <strong>{nickname}</strong> desde <strong>{hostInfo.host}</strong> ({hostInfo.ip})
        </div>
      </Card>
    </div>
  );
};
