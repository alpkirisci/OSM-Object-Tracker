from fastapi import WebSocket
from typing import Dict
import logging

logger = logging.getLogger(__name__)

class WebSocketManager:
    """
    WebSocket connection manager to handle multiple client connections
    """
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        """
        Connect a client to the WebSocket
        """
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected. Total active connections: {len(self.active_connections)}")

    def disconnect(self, client_id: str):
        """
        Disconnect a client from the WebSocket
        """
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"Client {client_id} disconnected. Total active connections: {len(self.active_connections)}")

    async def send_personal_message(self, message, client_id: str):
        """
        Send a message to a specific client
        """
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)
            logger.debug(f"Message sent to client {client_id}")
        else:
            logger.warning(f"Attempted to send message to disconnected client {client_id}")

    async def broadcast(self, message):
        """
        Broadcast a message to all connected clients
        """
        disconnected_clients = []
        for client_id, connection in self.active_connections.items():
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to client {client_id}: {str(e)}")
                disconnected_clients.append(client_id)
        
        # Clean up any disconnected clients
        for client_id in disconnected_clients:
            self.disconnect(client_id)

    async def broadcast_object_update(self, object_id: str, data: dict):
        """
        Broadcast an object update to all connected clients
        """
        message = {
            "type": "object_update",
            "object_id": object_id,
            "data": data
        }
        await self.broadcast(message)

# Create a singleton instance
websocket_manager = WebSocketManager() 