import { useContext, useEffect, useState } from "react";
import {
  WebSocketContext,
  WebSocketProvider,
} from "../../contexts/WebsocketContext";

type Message = {
  datestamp: Date;
  msg: string;
  sender: number;
  channel: number;
};

type Channel = {
  name: string;
};

export const Chat = () => {
  const socket = useContext(WebSocketContext);
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]); // TODO: init with database
  const [channels, setChannels] = useState<Channel[]>([]); // TODO: init with database

  useEffect(() => {
    var chan: Channel = {
      name: "First Channel",
    };
    var chan2: Channel = {
      name: "Second Channel",
    };
    var chan3: Channel = {
      name: "Other Channel",
    };
    setChannels((prev) => [...prev, chan]);
    setChannels((prev) => [...prev, chan2]);
    setChannels((prev) => [...prev, chan3]);
  }, []);

  useEffect(() => {
    socket.on("chat message", (msg: Message) => {
      console.log(msg);
      setMessages((prev) => [...prev, msg]);
      window.scrollTo(0, document.body.scrollHeight);
    });

    // socket.on("connect", function () {
    //   console.log("I connected !");
    //   window.scrollTo(0, document.body.scrollHeight);
    // });

    // socket.on("connection event", function () {
    //   console.log("connection");
    //   window.scrollTo(0, document.body.scrollHeight);
    // });

    // socket.on("disconnection event", function () {
    //   console.log("disconnection");
    //   window.scrollTo(0, document.body.scrollHeight);
    // });
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
      msg: "yolo",
      datestamp: new Date(),
      sender: 1,
      channel: 1,
    };
    console.log("Msg :");
    console.log(msg);
    socket.emit("chat message", msg);
    // msg.sender = 0;
    setMessages((prev) => [...prev, msg]);
    setValue("");
  };

  const messageStatus = (msg: Message) => {
    if (msg.sender == 0) {
      return (
        <div id="rightmessage">
          <span id="sender">{msg.sender}</span>
          <span id="date">{msg.datestamp.toString().split("G")[0]}</span>
          <li id="mine">{msg.msg}</li>
        </div>
      );
    }
    return (
      <div id="leftmessage">
        <span id="sender">{msg.sender}</span>
        <span id="date">{msg.datestamp.toString().split("G")[0]}</span>
        <li id="othermsg">{msg.msg}</li>
      </div>
    );
  };

  const channelInfo = (channel: Channel) => {
    return (
      <div id="channel-info">
        <li>{channel.name}</li>
      </div>
    );
  };

  return (
    <WebSocketProvider value={socket}>
      <body>
        <div className="chat-container">
          <div className="sidebar">
            <div id="channels">
              {channels.map((channel: Channel) => channelInfo(channel))}
            </div>
          </div>
          <div className="chat">
            <div id="messages">
              {messages.map((msg: Message) => messageStatus(msg))}
            </div>
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
          </div>
        </div>
      </body>
    </WebSocketProvider>
  );
};

export default Chat;
