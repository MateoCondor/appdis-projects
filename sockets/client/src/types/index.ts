// Definición de interfaces comunes utilizadas en toda la aplicación

// Interfaz para los mensajes de chat
export interface Message {
  id?: string;    // Identificador único del mensaje
  author: string;
  content: string;
}

// Interfaz para la información de host/IP enviada por el servidor
export interface HostInfo {
  host: string;
  ip: string;
}

// Interfaz para información de sala
export interface RoomInfo {
  pin: string;
  roomNumber?: string;
  currentParticipants: number;
  maxParticipants: number;
}

// Interfaz para la lista de salas disponibles
export interface AvailableRoom {
  pin: string;
  roomNumber?: string;
  currentParticipants: number;
  maxParticipants: number;
}

// Claves para almacenamiento local
export const STORAGE_KEYS = {
  ROOM_INFO: 'chat_room_info',
  IN_ROOM: 'chat_in_room'
};
