import React from 'react';
import { Button } from 'primereact/button';

interface ParticipantsListProps {
  participants: string[];
  currentUser: string;
  visible: boolean;
  onClose: () => void;
}

export const ParticipantsList: React.FC<ParticipantsListProps> = ({ 
  participants, 
  currentUser, 
  visible, 
  onClose 
}) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="participants-list">
      <div className="participants-header">
        <h3>Participantes</h3>
        <Button 
          icon="pi pi-times" 
          className="p-button-rounded p-button-text" 
          onClick={onClose}
        />
      </div>
      <div className="participants-body">
        {participants.map((name, index) => (
          <div key={index} className="participant-item">
            <i className="pi pi-user"></i> {name}
            {name === currentUser && " (tú)"}
          </div>
        ))}
      </div>
    </div>
  );
};
