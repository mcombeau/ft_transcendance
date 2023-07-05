import {  OnModuleInit } from "@nestjs/common";
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket as ioSocket } from 'socket.io'

@WebSocketGateway()
export class ChatGateway implements OnModuleInit {

    @WebSocketServer()
    server: Server;

    onModuleInit() {
        this.server.on('connection', (socket) => {
            console.log(socket.id);
            console.log('A user connected');
            socket.broadcast.emit("connection event");
            socket.on('disconnect', () => {
                console.log('a user disconnected');
                socket.broadcast.emit('disconnection event');
            });
        });
    }

    @SubscribeMessage('chat message')
    onChatMessage(
        @MessageBody() msg: any,
        @ConnectedSocket() socket: ioSocket) {
        console.log('message: ' + msg);
        socket.broadcast.emit('chat message', msg);
    }
}