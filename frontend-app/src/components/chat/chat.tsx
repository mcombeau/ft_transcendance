import { useContext, useEffect, useState } from "react";
import {
  WebSocketContext,
  WebSocketProvider,
} from "../../contexts/WebsocketContext";

type Message = {
  datestamp: string;
  msg: string;
  sender: string;
  channel: string;
};

export const Chat = () => {
  const socket = useContext(WebSocketContext);
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]); // TODO: init with database

  useEffect(() => {
    socket.on("chat message", (msg: Message) => {
      console.log(msg);
      // var item = document.createElement('li');
      // var messages = document.getElementById('messages');
      // item.textContent = msg;
      // messages.appendChild(item);
      setMessages((prev) => [...prev, msg]);
      window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on("connect", function () {
      console.log("I connected !");
      // var item = document.createElement('li');
      // var messages = document.getElementById('messages');
      // item.textContent = "A user just connected";
      // item.id = "event";
      // messages.appendChild(item);
      window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on("connection event", function () {
      console.log("connection");
      // var item = document.createElement('li');
      // var messages = document.getElementById('messages');
      // item.textContent = "A user just connected";
      // item.id = "event";
      // messages.appendChild(item);
      window.scrollTo(0, document.body.scrollHeight);
    });

    socket.on("disconnection event", function () {
      console.log("disconnection");
      // var item = document.createElement('li');
      // var messages = document.getElementById('messages');
      // item.textContent = "A user just disconnected";
      // item.id = "event";
      // messages.appendChild(item);
      window.scrollTo(0, document.body.scrollHeight);
    });
    return () => {
      console.log("unregistering events");
      socket.off("chat message");
      socket.off("connection event");
      socket.off("disconnection event");
      socket.off("connect");
    };
  }, []);

  const handleSendMessage = () => {
    if (value == "") {
      return;
    }
    var msg: Message = {
      msg: value,
      datestamp: Date(),
      sender: "someone",
      channel: "chan",
    };
    socket.emit("chat message", msg);
    msg.sender = "me";
    setMessages((prev) => [...prev, msg]);
    setValue("");
  };

  const messageStatus = (msg: Message) => {
    if (msg.sender == "me") {
      return false;
    }
    return true;
  };

  return (
    <WebSocketProvider value={socket}>
      <body>
        <ul id="messages">
          {messages.map((msg: Message) => (
            <li>{msg.msg}</li>
          ))}
        </ul>
        <form id="form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
          />
          <button>Send</button>
        </form>
      </body>
    </WebSocketProvider>
  );
};

export default Chat;
