import React from 'react';
import { Toast } from 'primereact/toast';

// Importamos los tipos desde el archivo principal de tipos
import { type AvailableRoom, STORAGE_KEYS } from '../types';

interface RoomsListProps {
  availableRooms: AvailableRoom[];
  onSelectRoom: (pin: string) => void;
  toast: React.RefObject<Toast | null>;
}

export const RoomsList: React.FC<RoomsListProps> = ({ availableRooms, onSelectRoom, toast }) => {  // Verificar si el usuario ya está en una sala
  const handleRoomSelect = (pin: string) => {
    const savedInRoom = localStorage.getItem(STORAGE_KEYS.IN_ROOM);
    if (savedInRoom === 'true') {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Ya estás en una sala. Debes salir primero para unirte a otra.'
      });
      return;
    }
    onSelectRoom(pin);
  };

  if (availableRooms.length === 0) {
    return null;
  }

  return (
    <div className="available-rooms">
      <h3>Salas disponibles</h3>
      <div className="rooms-list">
        {availableRooms.map(room => (
          <div 
            key={room.pin} 
            className="room-item" 
            onClick={() => handleRoomSelect(room.pin)}
          >
            <div className="room-pin">
              Sala #{room.roomNumber || 'Sin número'}
            </div>
            <div className="room-users">
              <i className="pi pi-users"></i> 
              {room.currentParticipants}/{room.maxParticipants}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
