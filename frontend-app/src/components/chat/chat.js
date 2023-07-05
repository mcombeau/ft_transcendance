import { socket } from '../../socket';

function Chat() {
		// var input = document.getElementById('input');

		const handleSendMessage = (e) => {
				var input = document.getElementById('input');
				var messages = document.getElementById('messages');
				e.preventDefault();
				if (input.value) {

					var item = document.createElement('li');
					item.textContent = input.value;
					item.id = "mine";
					messages.appendChild(item);

					socket.emit('chat message', input.value);

					input.value = '';
					window.scrollTo(0, document.body.scrollHeight);
				}
			}

			socket.on('chat message', function(msg) {
				var item = document.createElement('li');
				var messages = document.getElementById('messages');
				item.textContent = msg;
				messages.appendChild(item);
				window.scrollTo(0, document.body.scrollHeight);
			})

			socket.on('connection event', function() {
				var item = document.createElement('li');
				var messages = document.getElementById('messages');
				item.textContent = "A user just connected";
				item.id = "event";
				messages.appendChild(item);
				window.scrollTo(0, document.body.scrollHeight);
			});
			
			socket.on('disconnection event', function() {
				var item = document.createElement('li');
				var messages = document.getElementById('messages');
				item.textContent = "A user just disconnected";
				item.id = "event";
				messages.appendChild(item);
				window.scrollTo(0, document.body.scrollHeight);
			});
    return (
	<body>
		<ul id="messages"></ul>
		<form id="form" onSubmit={handleSendMessage}>
			<input id="input" autocomplete="off" /><button>Send</button>
		</form>
	</body>
    )
}

export default Chat;
