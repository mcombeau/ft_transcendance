import {useContext, useEffect, useState} from 'react';
import {WebSocketContext, WebSocketProvider, socket} from '../../contexts/WebsocketContext';

type Message = {
	datestamp: Date;
	msg: string;
	sender : string;
	channel: string;
};

export const Chat = () => {

		const socket = useContext(WebSocketContext);
		const [value, setValue] = useState('');
		const [messages, setMessage] = useState<Message[]>([]); // TODO: init with database

		useEffect(() => {
			socket.on('chat message', function(msg) {
				console.log("message: " + msg);
				// var item = document.createElement('li');
				// var messages = document.getElementById('messages');
				// item.textContent = msg;
				// messages.appendChild(item);
				window.scrollTo(0, document.body.scrollHeight);
			})

			socket.on('connect', function() {
				console.log('I connected !');
				// var item = document.createElement('li');
				// var messages = document.getElementById('messages');
				// item.textContent = "A user just connected";
				// item.id = "event";
				// messages.appendChild(item);
				window.scrollTo(0, document.body.scrollHeight);
			});

			socket.on('connection event', function() {
				console.log('connection');
				// var item = document.createElement('li');
				// var messages = document.getElementById('messages');
				// item.textContent = "A user just connected";
				// item.id = "event";
				// messages.appendChild(item);
				window.scrollTo(0, document.body.scrollHeight);
			});
			
			socket.on('disconnection event', function() {
				console.log('disconnection');
				// var item = document.createElement('li');
				// var messages = document.getElementById('messages');
				// item.textContent = "A user just disconnected";
				// item.id = "event";
				// messages.appendChild(item);
				window.scrollTo(0, document.body.scrollHeight);
			});
			return () => {
				console.log("unregistering events");
				socket.off('chat message');
				socket.off('connection event');
				socket.off('disconnection event');
				socket.off('connect');
			};
		}, []);

		const handleSendMessage = (e) => {
				var input = document.getElementById('input');
				var messages = document.getElementById('messages');
				e.preventDefault();
				// if (input.value) {

				// 	var item = document.createElement('li');
				// 	item.textContent = input.value;
				// 	item.id = "mine";
				// 	messages.appendChild(item);

				// 	socket.emit('chat message', input.value);

				// 	input.value = '';
				// 	window.scrollTo(0, document.body.scrollHeight);
				// }
			};

    return (
	  <WebSocketProvider value={socket}>
	<body>
		<ul id="messages"></ul>
		<form id="form" onSubmit={handleSendMessage}> 
			<input id="input" /><button>Send</button>
		</form>
	</body>
	  </WebSocketProvider>
    );
};

export default Chat;
