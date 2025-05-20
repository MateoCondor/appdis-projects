const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
app.use(cors());

// Ruta básica para la página principal
app.get('/', (req, res) => {
  res.send('Servidor Socket.IO funcionando correctamente');
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Estructura para almacenar las salas
const rooms = new Map();

// Set global para nicknames activos (en cualquier sala)
const activeNicknames = new Set();

// Función para obtener lista de salas disponibles (no llenas)
function getAvailableRooms() {
  const availableRooms = [];
  rooms.forEach((room, pin) => {
    if (room.participants.size < room.maxParticipants) {
      availableRooms.push({
        pin,
        roomNumber: room.number,
        currentParticipants: room.participants.size,
        maxParticipants: room.maxParticipants
      });
    }
  });
  return availableRooms;
}

// Función para generar un PIN único de 6 dígitos
function generateUniquePin() {
  let pin;
  do {
    pin = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.has(pin));
  return pin;
}

io.on('connection', (socket) => {
  console.log(`Usuario conectado: ${socket.id}`);
  
  // Enviar información del host al cliente cuando se conecta
  const hostInfo = {
    host: require('os').hostname(),
    ip: require('os').networkInterfaces().Ethernet?.[0]?.address || '127.0.0.1'
  };
  socket.emit('host_info', hostInfo);
  
  // Evento para solicitar salas disponibles
  socket.on('get_available_rooms', () => {
    socket.emit('available_rooms', getAvailableRooms());
  });
  
  // Evento para solicitar lista de participantes de una sala
  socket.on('get_room_participants', () => {
    const pin = socket.currentRoom;
    if (pin && rooms.has(pin)) {
      const room = rooms.get(pin);
      const participants = room.participants instanceof Map ? 
        Array.from(room.participants.values()) : [];
      socket.emit('room_participants', participants);
    }
  });
  
  // Nueva funcionalidad para crear una sala
  socket.on('create_room', ({ maxParticipants, roomNumber, nickname }) => {
    // Verificar si el nickname ya está en uso globalmente
    if (activeNicknames.has(nickname)) {
      socket.emit('join_error', { message: 'Este usuario ya está en una sala o en uso en otro dispositivo/navegador.' });
      return;
    }
    
    // Registrar nickname como activo
    activeNicknames.add(nickname);
    
    const pin = generateUniquePin();
    
    rooms.set(pin, {
      number: roomNumber || 'Sin número',  // Número de sala personalizado
      participants: new Map(), // Cambio a Map para almacenar id => nickname
      maxParticipants: maxParticipants || 5, // Valor por defecto: 5
      messages: []
    });
    
    // Guardar el nickname en el socket
    socket.nickname = nickname;
    
    // Unimos al creador a la sala
    socket.join(pin);
    rooms.get(pin).participants.set(socket.id, nickname);
    
    // Guardar la referencia a la sala en el objeto socket
    socket.currentRoom = pin;
    
    // Enviamos confirmación con el PIN generado
    socket.emit('room_created', { 
      pin, 
      roomNumber: roomNumber,
      currentParticipants: rooms.get(pin).participants.size,
      maxParticipants: rooms.get(pin).maxParticipants
    });
    
    // Notificar a todos sobre la actualización de salas disponibles
    io.emit('available_rooms', getAvailableRooms());
    
    console.log(`Sala #${roomNumber} creada con PIN: ${pin}, límite: ${maxParticipants} usuarios`);
  });
  
  // Unirse a una sala existente
  socket.on('join_room', ({ pin, nickname }) => {
    // Verificar si el nickname ya está en uso globalmente
    if (activeNicknames.has(nickname)) {
      socket.emit('join_error', { message: 'Este usuario ya está en una sala o en uso en otro dispositivo/navegador.' });
      return;
    }
    
    // Verificar si la sala existe
    if (!rooms.has(pin)) {
      socket.emit('join_error', { message: 'La sala no existe. Verifica el PIN e intenta nuevamente.' });
      return;
    }
    
    const room = rooms.get(pin);
    
    // Verificar si la sala está llena
    if (room.participants.size >= room.maxParticipants) {
      socket.emit('join_error', { message: 'La sala está llena. Intenta más tarde o crea una nueva sala.' });
      return;
    }
    
    // Registrar nickname como activo
    activeNicknames.add(nickname);
    
    // Guardar el nickname en el socket
    socket.nickname = nickname;
    
    // Unir al usuario a la sala
    socket.join(pin);
    
    // Si estamos usando Map para participantes
    if (room.participants instanceof Map) {
      room.participants.set(socket.id, nickname);
    } else {
      // Compatibilidad con la implementación anterior
      room.participants.add(socket.id);
    }
    
    // Guardar la referencia a la sala en el objeto socket
    socket.currentRoom = pin;
    
    // Obtener la lista de participantes
    const participantsList = room.participants instanceof Map ? 
      Array.from(room.participants.values()) : [];
    
    // Enviar historial de mensajes al usuario
    socket.emit('room_history', room.messages);
    
    // Enviar lista de participantes
    io.to(pin).emit('room_participants', participantsList);
      // Notificar a todos en la sala sobre el nuevo usuario
    io.to(pin).emit('user_joined', { 
      nickname, 
      pin, // Añadimos explícitamente el pin para que nunca falte
      roomNumber: room.number || 'Sin número',
      currentParticipants: room.participants.size,
      maxParticipants: room.maxParticipants
    });
    
    // Notificar a todos sobre la actualización de salas disponibles
    io.emit('available_rooms', getAvailableRooms());
    
    console.log(`Usuario ${nickname} (${socket.id}) se unió a la sala ${pin}`);
  });
  
  // Enviar mensaje en una sala específica
  socket.on('send_message', (msg) => {
    const pin = socket.currentRoom;
    
    if (pin && rooms.has(pin)) {
      // Guardar el mensaje en el historial de la sala
      rooms.get(pin).messages.push(msg);
      
      // Emitir mensaje solo a los usuarios en esa sala
      io.to(pin).emit('receive_message', msg);
    }
  });
  
  // Salir de una sala
  socket.on('leave_room', () => {
    leaveCurrentRoom(socket);
    
    // Liberar nickname globalmente
    if (socket.nickname) {
      activeNicknames.delete(socket.nickname);
    }
  });

  // Función para manejar la salida de una sala
  function leaveCurrentRoom(socket) {
    const pin = socket.currentRoom;
    if (pin && rooms.has(pin)) {
      const room = rooms.get(pin);
      
      // Eliminar al usuario de la lista de participantes
      if (room.participants instanceof Map) {
        room.participants.delete(socket.id);
      } else {
        room.participants.delete(socket.id);
      }
      
      // Obtener la lista actualizada de participantes
      const participantsList = room.participants instanceof Map ? 
        Array.from(room.participants.values()) : [];
        // Notificar a todos los usuarios restantes
      io.to(pin).emit('user_left', { 
        nickname: socket.nickname,
        pin, // Añadimos explícitamente el pin para que nunca falte
        roomNumber: room.number || 'Sin número',
        currentParticipants: room.participants.size,
        maxParticipants: room.maxParticipants
      });
      
      // Enviar la lista actualizada de participantes
      io.to(pin).emit('room_participants', participantsList);
        
      // Si la sala quedó vacía, eliminarla inmediatamente
      if (room.participants.size === 0) {
        rooms.delete(pin);
        console.log(`Sala ${pin} eliminada inmediatamente por quedar vacía`);
        
        // Notificar a todos sobre la actualización de salas disponibles
        io.emit('available_rooms', getAvailableRooms());
      } else {
        // Notificar a todos sobre la actualización de salas disponibles
        io.emit('available_rooms', getAvailableRooms());
      }
      
      // Hacer que el socket abandone la sala
      socket.leave(pin);
      socket.currentRoom = null;
      
      // Liberar nickname globalmente
      if (socket.nickname) {
        activeNicknames.delete(socket.nickname);
      }
      
      console.log(`Usuario ${socket.nickname} (${socket.id}) abandonó la sala ${pin}`);
    }
  }

  socket.on('disconnect', () => {
    console.log(`Usuario desconectado: ${socket.id}`);
    leaveCurrentRoom(socket);
    
    // Liberar nickname globalmente
    if (socket.nickname) {
      activeNicknames.delete(socket.nickname);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});