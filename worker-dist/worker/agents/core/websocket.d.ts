import { Connection } from 'agents';
import { SimpleCodeGeneratorAgent } from './simpleGeneratorAgent';
import { WebSocketMessageData, WebSocketMessageType } from '../../api/websocketTypes';
export declare function handleWebSocketMessage(agent: SimpleCodeGeneratorAgent, connection: Connection, message: string): void;
export declare function handleWebSocketClose(connection: Connection): void;
export declare function broadcastToConnections<T extends WebSocketMessageType>(agent: {
    getWebSockets(): WebSocket[];
}, type: T, data: WebSocketMessageData<T>): void;
export declare function sendToConnection<T extends WebSocketMessageType>(connection: WebSocket, type: T, data: WebSocketMessageData<T>): void;
export declare function sendError(connection: WebSocket, errorMessage: string): void;
