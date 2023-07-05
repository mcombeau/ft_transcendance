const { io } = require("socket.io-client");
var socket = io();

			var messages = document.getElementById('messages');
			var form = document.getElementById('form');
			var input = document.getElementById('input');

			form.addEventListener('submit', function(e) {
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
			});

			input.addEventListener('input', function () {
				socket.broadcast.emit('writing');
			})

			socket.on('chat message', function(msg) {
				var item = document.createElement('li');
				item.textContent = msg;
				messages.appendChild(item);
				window.scrollTo(0, document.body.scrollHeight);
			});

			socket.on('connection event', function() {
				var item = document.createElement('li');
				item.textContent = "A user just connected";
				item.id = "event";
				messages.appendChild(item);
				window.scrollTo(0, document.body.scrollHeight);
			});
			
			socket.on('disconnection event', function() {
				var item = document.createElement('li');
				item.textContent = "A user just disconnected";
				item.id = "event";
				messages.appendChild(item);
				window.scrollTo(0, document.body.scrollHeight);
			});

function Chat() {
    return (
	<body>
		<ul id="messages"></ul>
		<form id="form" action="">
			<input id="input" autocomplete="off" /><button>Send</button>
		</form>
	</body>
    )
}

export default Chat;
