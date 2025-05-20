// src/components/Chat.tsx

import React, { useState, useEffect, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputNumber } from 'primereact/inputnumber';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import io from 'socket.io-client';
import './Chat.css';

// URL de conexión al servidor Socket.IO, definida en .env
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_SERVER_URL || 'http://localhost:3001';

// Claves para almacenamiento local
const STORAGE_KEYS = {
    ROOM_INFO: 'chat_room_info',
    IN_ROOM: 'chat_in_room'
};

// Interfaz para los mensajes de chat
interface Message {
    id?: string;    // Identificador único del mensaje
    author: string;
    content: string;
}

// Interfaz para la información de host/IP enviada por el servidor
interface HostInfo {
    host: string;
    ip: string;
}

// Interfaz para información de sala
interface RoomInfo {
    pin: string;
    roomNumber?: string;
    currentParticipants: number;
    maxParticipants: number;
}

// Interfaz para la lista de salas disponibles
interface AvailableRoom {
    pin: string;
    roomNumber?: string;
    currentParticipants: number;
    maxParticipants: number;
}

export const Chat: React.FC = () => {
    // Referencia para mostrar mensajes toast
    const toast = useRef<Toast>(null);

    // Estado temporal para el nickname mientras el usuario lo escribe
    const [tempNick, setTempNick] = useState<string>('');

    // Estado que almacena el nickname definitivo del usuario
    const [nickname, setNickname] = useState<string>('');

    // Indica si el socket ya se conectó y llegó la info de host
    const [connected, setConnected] = useState<boolean>(false);

    // Estado para guardar la información de host/IP recibida
    const [hostInfo, setHostInfo] = useState<HostInfo>({ host: '', ip: '' });

    // Estado del mensaje que el usuario va a enviar
    const [message, setMessage] = useState<string>('');    
    
    // Historial de mensajes intercambiados
    const [messages, setMessages] = useState<Message[]>([]);

    // Referencia al socket, para poder usarlo en distintos callbacks
    const socketRef = useRef<any>(null);

    // Referencia al contenedor de mensajes para auto-scroll
    const messagesEndRef = useRef<HTMLDivElement>(null);    
    
    // Estados para gestión de salas
    const [inRoom, setInRoom] = useState<boolean>(false);
    const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
    const [joinPin, setJoinPin] = useState<string>('');
    const [roomNumber, setRoomNumber] = useState<string>('');
    const [maxParticipants, setMaxParticipants] = useState<number>(5);
    const [availableRooms, setAvailableRooms] = useState<AvailableRoom[]>([]);
    const [participants, setParticipants] = useState<string[]>([]);
    const [showParticipants, setShowParticipants] = useState<boolean>(false);
    
    // Estados para los diálogos
    const [showCreateRoomDialog, setShowCreateRoomDialog] = useState<boolean>(false);
    const [showJoinRoomDialog, setShowJoinRoomDialog] = useState<boolean>(false);

    // Cargar el estado inicial desde localStorage
    useEffect(() => {
        try {
            const savedInRoom = localStorage.getItem(STORAGE_KEYS.IN_ROOM);
            const savedRoomInfo = localStorage.getItem(STORAGE_KEYS.ROOM_INFO);
            
            if (savedInRoom === 'true' && savedRoomInfo) {
                setInRoom(true);
                setRoomInfo(JSON.parse(savedRoomInfo));
            }
        } catch (error) {
            console.error('Error al cargar estado desde localStorage:', error);
        }
    }, []);

    // Guardar el estado actual en localStorage cuando cambie
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.IN_ROOM, String(inRoom));
            
            if (inRoom && roomInfo) {
                localStorage.setItem(STORAGE_KEYS.ROOM_INFO, JSON.stringify(roomInfo));
            } else {
                localStorage.removeItem(STORAGE_KEYS.ROOM_INFO);
            }
        } catch (error) {
            console.error('Error al guardar estado en localStorage:', error);
        }
    }, [inRoom, roomInfo]);

    // Función para auto-scroll al último mensaje
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Efecto para auto-scroll cuando cambian los mensajes
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Efecto que inicializa la conexión al servidor
    useEffect(() => {
        // Si no hay nickname, no conectamos el socket
        if (!nickname) return;

        console.log('Intentando conectar a:', SOCKET_SERVER_URL);
        
        // Crear la conexión Socket.IO
        socketRef.current = io(SOCKET_SERVER_URL);

        // Debuggear conexión
        socketRef.current.on('connect', () => {
            console.log('Conectado al servidor como:', socketRef.current.id);
            
            // Comprobar si estábamos en una sala y reconectar
            const savedInRoom = localStorage.getItem(STORAGE_KEYS.IN_ROOM);
            const savedRoomInfo = localStorage.getItem(STORAGE_KEYS.ROOM_INFO);
            
            if (savedInRoom === 'true' && savedRoomInfo) {
                try {
                    const roomData = JSON.parse(savedRoomInfo);
                    // Reconectar a la sala automáticamente
                    socketRef.current.emit('join_room', { 
                        pin: roomData.pin, 
                        nickname 
                    });
                    setInRoom(true);
                    setRoomInfo(roomData);
                } catch (error) {
                    console.error('Error al reconectar a la sala:', error);
                    // Limpiar localStorage si hay error
                    localStorage.removeItem(STORAGE_KEYS.IN_ROOM);
                    localStorage.removeItem(STORAGE_KEYS.ROOM_INFO);
                }
            }
        });

        // Escuchar el evento 'host_info' enviado por el servidor al conectar
        socketRef.current.on('host_info', (info: HostInfo) => {
            console.log('Recibida info del host:', info);
            setHostInfo(info);      // Guardar host/IP en estado
            setConnected(true);     // Marcar como conectado
        });
        
        // Manejar evento de sala creada
        socketRef.current.on('room_created', (info: RoomInfo) => {
            console.log('Sala creada:', info);
            setRoomInfo(info);
            setInRoom(true);
            localStorage.setItem(STORAGE_KEYS.ROOM_INFO, JSON.stringify(info));
            localStorage.setItem(STORAGE_KEYS.IN_ROOM, 'true');
            toast.current?.show({ 
                severity: 'success', 
                summary: 'Sala creada', 
                detail: `Se ha creado la sala con PIN: ${info.pin}` 
            });
        });
        
        // Manejar errores al unirse a una sala
        socketRef.current.on('join_error', ({ message }: { message: string }) => {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: message 
            });
            setShowJoinRoomDialog(false);
            
            // Si el error es porque el usuario ya está en una sala, actualizar el estado local
            if (message.includes('ya estás en una sala') || message.includes('already in a room')) {
                // Intenta obtener información de la sala actual desde localStorage
                const savedRoomInfo = localStorage.getItem(STORAGE_KEYS.ROOM_INFO);
                if (savedRoomInfo) {
                    try {
                        setInRoom(true);
                        setRoomInfo(JSON.parse(savedRoomInfo));
                    } catch (error) {
                        console.error('Error al parsear información de sala:', error);
                    }
                }
            }
        });
        
        // Manejar evento de unión exitosa a una sala
        socketRef.current.on('user_joined', (info: RoomInfo & { nickname: string }) => {
            const updatedRoomInfo = {
                pin: roomInfo?.pin || '',
                currentParticipants: info.currentParticipants,
                maxParticipants: info.maxParticipants
            };
            setRoomInfo(updatedRoomInfo);
            localStorage.setItem(STORAGE_KEYS.ROOM_INFO, JSON.stringify(updatedRoomInfo));
            
            // Añadir mensaje de sistema
            if (info.nickname !== nickname) {
                setMessages(prev => [
                    ...prev,
                    {
                        author: 'Sistema',
                        content: `${info.nickname} se ha unido a la sala`
                    }
                ]);
            }
        });
        
        // Manejar cuando un usuario abandona la sala
        socketRef.current.on('user_left', (info: RoomInfo & { nickname: string }) => {
            const updatedRoomInfo = {
                pin: roomInfo?.pin || '',
                currentParticipants: info.currentParticipants,
                maxParticipants: info.maxParticipants
            };
            setRoomInfo(updatedRoomInfo);
            localStorage.setItem(STORAGE_KEYS.ROOM_INFO, JSON.stringify(updatedRoomInfo));
            
            // Añadir mensaje de sistema
            setMessages(prev => [
                ...prev,
                {
                    author: 'Sistema',
                    content: `${info.nickname} ha abandonado la sala`
                }
            ]);
        });
        
        // Obtener historial de mensajes al unirse a una sala
        socketRef.current.on('room_history', (history: Message[]) => {
            setMessages(history);
        });

        // Recibir actualizaciones sobre salas disponibles
        socketRef.current.on('available_rooms', (rooms: AvailableRoom[]) => {
            setAvailableRooms(rooms);
        });

        // Recibir la lista de participantes
        socketRef.current.on('room_participants', (participantsList: string[]) => {
            setParticipants(participantsList);
        });

        // Escuchar nuevos mensajes emitidos por el servidor
        socketRef.current.on('receive_message', (msg: Message) => {
            console.log('Mensaje recibido:', msg);
            
            // Verificar si el mensaje ya existe en nuestro array (para evitar duplicados)
            if (msg.id) {
                setMessages(prev => {
                    // Si el mensaje ya existe (por ID), no lo añadimos otra vez
                    if (prev.some(m => m.id === msg.id)) {
                        return prev;
                    }
                    // Si no existe, lo añadimos
                    return [...prev, msg];
                });
            } else {
                // Para compatibilidad con versiones anteriores (mensajes sin ID)
                setMessages(prev => [...prev, msg]);
            }
        });

        // Limpieza al desmontar el componente o cambiar de nickname
        return () => {
            socketRef.current.disconnect();
        };
    }, [nickname]);

    // Efecto para solicitar salas disponibles cuando estamos conectados
    useEffect(() => {
        if (connected && !inRoom && socketRef.current) {
            // Solicitar la lista de salas disponibles
            socketRef.current.emit('get_available_rooms');
            
            // Configurar un intervalo para actualizar la lista cada 10 segundos
            const intervalId = setInterval(() => {
                socketRef.current.emit('get_available_rooms');
            }, 10000);
            
            // Limpiar el intervalo al desmontar o entrar a una sala
            return () => clearInterval(intervalId);
        }
    }, [connected, inRoom]);

    // Función que fija el nickname definitivo al pulsar el botón o Enter
    const handleSetNick = () => {
        const nick = tempNick.trim();
        if (!nick) return;       // No aceptamos nickname vacío
        setNickname(nick);        // Guardamos el nickname en estado
    };

    // Función para crear una nueva sala
    const createRoom = () => {
        // Verificar si el usuario ya está en una sala
        const savedInRoom = localStorage.getItem(STORAGE_KEYS.IN_ROOM);
        if (savedInRoom === 'true') {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'Ya estás en una sala. Debes salir primero para crear una nueva.' 
            });
            setShowCreateRoomDialog(false);
            return;
        }

        if (socketRef.current && connected) {
            socketRef.current.emit('create_room', { 
                maxParticipants,
                roomNumber,
                nickname
            });
            setShowCreateRoomDialog(false);
        }
    };
    
    // Función para unirse a una sala existente
    const joinRoom = () => {
        // Verificar si el usuario ya está en una sala
        const savedInRoom = localStorage.getItem(STORAGE_KEYS.IN_ROOM);
        if (savedInRoom === 'true') {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'Ya estás en una sala. Debes salir primero para unirte a otra.' 
            });
            setShowJoinRoomDialog(false);
            return;
        }

        if (socketRef.current && connected && joinPin.length === 6) {
            socketRef.current.emit('join_room', { pin: joinPin, nickname });
            setInRoom(true);
            setShowJoinRoomDialog(false);
        } else {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'El PIN debe tener 6 dígitos' 
            });
        }
    };
    
    // Función para abandonar la sala actual
    const leaveRoom = () => {
        if (socketRef.current && inRoom) {
            socketRef.current.emit('leave_room');
            setInRoom(false);
            setRoomInfo(null);
            setMessages([]);
            
            // Limpiar localStorage cuando el usuario abandona la sala
            localStorage.removeItem(STORAGE_KEYS.IN_ROOM);
            localStorage.removeItem(STORAGE_KEYS.ROOM_INFO);
        }
    };

    // Función para enviar un mensaje al servidor
    const sendMessage = () => {
        // No enviamos si no hay texto o no estamos conectados o no estamos en una sala
        if (!message.trim() || !connected || !inRoom) return;

        // Creamos el objeto mensaje con el autor = nickname y un ID único
        const msgId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const msg = { 
            id: msgId,
            author: nickname, 
            content: message 
        };

        // Emitimos al servidor
        socketRef.current.emit('send_message', msg);
        
        // Limpiamos el input de texto
        setMessage('');
    };

    // Si aún no se ha fijado nickname, mostramos el formulario de bienvenida
    if (!nickname) {
        return (
            <div className="app">
                <Card title="Bienvenido al Chat" className="welcome-card" >
                    <div className="p-fluid">
                        <div className="p-field p-mb-3">
                            <label htmlFor="nick">Elige un nickname:</label>
                            <InputText
                                id="nick"
                                value={tempNick}
                                onChange={e => setTempNick(e.target.value)}        // Actualiza tempNick
                                onKeyDown={e => e.key === 'Enter' && handleSetNick()} // También al pulsar Enter
                                placeholder="Tu nickname"
                                className="p-mt-2"
                            />
                        </div>
                        <Button
                            label="Entrar al chat"
                            icon="pi pi-sign-in"
                            onClick={handleSetNick}  // Al hacer clic fijamos el nickname
                            className="p-mt-3"
                        />
                    </div>
                </Card>
            </div>
        );
    }    
      // Una vez tenemos nickname, pero no estamos en ninguna sala
    if (!inRoom) {
        return (
            <div className="app">
                <Toast ref={toast} />
                
                <Card title="Salas de Chat" className="rooms-card">
                    <div className="room-options">
                        <Button 
                            label="Crear una sala" 
                            icon="pi pi-plus-circle"
                            className="p-button-success p-mr-2" 
                            onClick={() => setShowCreateRoomDialog(true)} 
                        />
                        <Button 
                            label="Unirse a una sala" 
                            icon="pi pi-sign-in"
                            className="p-button-info" 
                            onClick={() => setShowJoinRoomDialog(true)} 
                        />
                    </div>
                    
                    {/* Lista de salas disponibles */}
                    {availableRooms.length > 0 && (
                        <div className="available-rooms">
                            <h3>Salas disponibles</h3>
                            <div className="rooms-list">                                {availableRooms.map(room => (
                                    <div key={room.pin} className="room-item" 
                                         onClick={() => {
                                             // Verificar si el usuario ya está en una sala
                                             const savedInRoom = localStorage.getItem(STORAGE_KEYS.IN_ROOM);
                                             if (savedInRoom === 'true') {
                                                 toast.current?.show({ 
                                                     severity: 'error', 
                                                     summary: 'Error', 
                                                     detail: 'Ya estás en una sala. Debes salir primero para unirte a otra.' 
                                                 });
                                                 return;
                                             }
                                             
                                             setJoinPin(room.pin);
                                             setShowJoinRoomDialog(true);
                                         }}>
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
                    )}
                    
                    {/* Información de host */}
                    <div className="host-info">
                        Conectado como: <strong>{nickname}</strong> desde <strong>{hostInfo.host}</strong> ({hostInfo.ip})
                    </div>
                </Card>
                
                {/* Diálogo para crear sala */}                <Dialog
                    header="Crear nueva sala"
                    visible={showCreateRoomDialog}
                    onHide={() => setShowCreateRoomDialog(false)}
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
                            onClick={createRoom} 
                            className="p-mt-3"
                        />
                    </div>
                </Dialog>
                
                {/* Diálogo para unirse a sala */}
                <Dialog
                    header="Unirse a una sala"
                    visible={showJoinRoomDialog}
                    onHide={() => setShowJoinRoomDialog(false)}
                    style={{ width: '50vw' }}
                >
                    <div className="p-fluid">
                        <div className="p-field">
                            <label htmlFor="roomPin">PIN de la sala (6 dígitos):</label>
                            <InputText
                                id="roomPin"
                                value={joinPin}
                                onChange={(e) => setJoinPin(e.target.value)}
                                keyfilter="int"
                                maxLength={6}
                            />
                        </div>
                        <Button 
                            label="Unirse" 
                            icon="pi pi-sign-in" 
                            onClick={joinRoom} 
                            className="p-mt-3"
                            disabled={joinPin.length !== 6}
                        />
                    </div>
                </Dialog>
            </div>
        );
    }
    
    // Vista de la sala de chat cuando estamos en una
    return (
        <div className="app">
            <Toast ref={toast} />
              <Card title={`Chat — ${nickname}`} className="chat-container">                {/* Información de la sala */}
                <div className="room-info">
                    <div className="room-details">
                        <div className="room-pin-display">
                            <i className="pi pi-lock"></i> PIN: <strong>{roomInfo?.pin}</strong>
                        </div>
                        <div 
                            className="room-users-display"
                            onClick={() => {
                                setShowParticipants(!showParticipants);
                                socketRef.current.emit('get_room_participants');
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <i className="pi pi-users"></i> Usuarios: <strong>{roomInfo?.currentParticipants}</strong>/{roomInfo?.maxParticipants}
                        </div>
                    </div>
                    <Button 
                        label="Salir" 
                        icon="pi pi-sign-out" 
                        className="p-button-danger p-button-sm" 
                        onClick={leaveRoom}
                    />
                </div>
                
                {/* Lista de participantes */}
                {showParticipants && (
                    <div className="participants-list">
                        <div className="participants-header">
                            <h3>Participantes</h3>
                            <Button 
                                icon="pi pi-times" 
                                className="p-button-rounded p-button-text" 
                                onClick={() => setShowParticipants(false)}
                            />
                        </div>
                        <div className="participants-body">
                            {participants.map((name, index) => (
                                <div key={index} className="participant-item">
                                    <i className="pi pi-user"></i> {name}
                                    {name === nickname && " (tú)"}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Contenedor de mensajes */}
                <div className="messages-container">                    {messages.map((m, i) => (
                        <div
                            key={m.id || i}
                            className={`message ${m.author === nickname ? 'me' : m.author === 'Sistema' ? 'system' : 'other'}`}
                        >
                            <strong>{m.author}</strong> {m.content}
                        </div>
                    ))}
                    {/* Elemento de referencia para el auto-scroll */}
                    <div ref={messagesEndRef} />
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
                                sendMessage();
                            }
                        }}
                    />
                    <Button
                        label="Enviar"
                        icon="pi pi-send"
                        onClick={sendMessage}  // Al hacer clic enviamos el mensaje
                        disabled={!inRoom}
                    />
                </div>
            </Card>
        </div>
    );
};