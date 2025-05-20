import React, { useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';

interface CreateRoomDialogProps {
  visible: boolean;
  onHide: () => void;
  onCreateRoom: (roomNumber: string, maxParticipants: number) => void;
}

export const CreateRoomDialog: React.FC<CreateRoomDialogProps> = ({ 
  visible, 
  onHide, 
  onCreateRoom 
}) => {
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [maxParticipants, setMaxParticipants] = useState<number>(5);
  const [error, setError] = useState<string>('');

  const handleCreateRoom = () => {
    if (!roomNumber.trim()) {
      setError('Debes ingresar un número de sala.');
      return;
    }
    setError('');
    onCreateRoom(roomNumber, maxParticipants);
  };

  return (
    <Dialog
      header="Crear nueva sala"
      visible={visible}
      onHide={onHide}
      style={{ width: '50vw' }}
    >
      <div className="p-fluid">
        <div className="p-field p-mb-3">
          <label htmlFor="roomNumber">Número de sala:</label>
          <InputText
            id="roomNumber"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            placeholder="Ej: 42"
            className="p-mt-2"
          />
          {error && <small style={{ color: 'red' }}>{error}</small>}
          <small className="p-d-block p-pt-1">
            Elige un número para identificar tu sala. Un PIN aleatorio de 6 dígitos será generado automáticamente.
          </small>
        </div>
        <div className="p-field p-mt-3">
          <label htmlFor="maxParticipants">Límite de participantes:</label>
          <InputNumber
            id="maxParticipants"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(e.value as number)}
            min={2}
            max={10}
          />
        </div>
        <Button 
          label="Crear sala" 
          icon="pi pi-check" 
          onClick={handleCreateRoom} 
          className="p-mt-3"
        />
      </div>
    </Dialog>
  );
};
