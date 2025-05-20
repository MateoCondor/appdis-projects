import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

interface WelcomeFormProps {
  onSetNickname: (nickname: string) => void;
}

export const WelcomeForm: React.FC<WelcomeFormProps> = ({ onSetNickname }) => {
  // Estado temporal para el nickname mientras el usuario lo escribe
  const [tempNick, setTempNick] = useState<string>('');

  // Función que fija el nickname definitivo al pulsar el botón o Enter
  const handleSetNick = () => {
    const nick = tempNick.trim();
    if (!nick) return; // No aceptamos nickname vacío
    onSetNickname(nick); // Llamamos a la función del componente padre
  };

  return (
    <div className="app">
      <Card title="Bienvenido al Chat" className="welcome-card">
        <div className="p-fluid">
          <div className="p-field p-mb-3">
            <label htmlFor="nick">Elige un nickname:</label>
            <InputText
              id="nick"
              value={tempNick}
              onChange={(e) => setTempNick(e.target.value)} // Actualiza tempNick
              onKeyDown={(e) => e.key === 'Enter' && handleSetNick()} // También al pulsar Enter
              placeholder="Tu nickname"
              className="p-mt-2"
            />
          </div>
          <Button
            label="Entrar al chat"
            icon="pi pi-sign-in"
            onClick={handleSetNick} // Al hacer clic fijamos el nickname
            className="p-mt-3"
          />
        </div>
      </Card>
    </div>
  );
};
