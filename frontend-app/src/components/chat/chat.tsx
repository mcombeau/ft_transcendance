import { useContext, useEffect, useState } from "react";
import {
  WebSocketContext,
  WebSocketProvider,
} from "../../contexts/WebsocketContext";

type Message = {
  datestamp: Date;
  msg: string;
  sender: string;
  channel: string;
};

type Channel = {
  name: string;
  id: number;
};

export const Chat = () => {
  const socket = useContext(WebSocketContext);
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]); // TODO: init with database
  const [channels, setChannels] = useState<Channel[]>([]);
  const [newchannel, setNewchannel] = useState("");
  const [current_channel, setCurrentChannel] = useState(""); // TODO: have screen if no channels
  const [username, setUsername] = useState("");

  useEffect(() => {
    socket.on("chat message", (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      var chat = document.getElementById("messages");
      chat.scrollTop = chat.scrollHeight * 2;
    });

    fetch("http://localhost:3001/chats").then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        console.log("error response create channel");
        return;
      }
      data.map((e) => {
        var chan: Channel = {
          name: e.name,
          id: e.id,
        };
        setChannels((prev) => [...prev, chan]);
      });
    });

    fetch("http://localhost:3001/chat-messages").then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        console.log("error response create channel");
        return;
      }
      console.log(data);
      data.map((e) => {
        var msg: Message = {
          datestamp: e.datestamp,
          msg: e.msg,
          sender: e.sender,
          channel: e.channel,
        };
        setMessages((prev) => [...prev, msg]);
      });
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
    if (value == "" || current_channel == "") {
      console.log("Message is empty or channel is not defined");
      return;
    }
    var msg: Message = {
      msg: value,
      datestamp: new Date(),
      sender: username,
      channel: current_channel,
    };
    console.log("Msg :");
    console.log(msg);
    socket.emit("chat message", msg);
    msg.sender = "me";
    setMessages((prev) => [...prev, msg]);
    setValue("");
  };

  const messageStatus = (msg: Message) => {
    var chat = document.getElementById("messages");
    if (msg.channel != current_channel) return;
    if (msg.sender == "me") {
      chat.scrollTop = chat.scrollHeight * 2;
      return (
        <div id="rightmessage">
          <span id="sender">{msg.sender}</span>
          <span id="date">{msg.datestamp.toString().split("G")[0]}</span>
          <li id="mine">{msg.msg}</li>
        </div>
      );
    }
    chat.scrollTop = chat.scrollHeight * 2;
    return (
      <div id="leftmessage">
        <span id="sender">{msg.sender}</span>
        <span id="date">{msg.datestamp.toString().split("G")[0]}</span>
        <li id="othermsg">{msg.msg}</li>
      </div>
    );
  };

  const createChannel = () => {
    // Create new channel
    if (newchannel == "") return;
    const requestchan = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newchannel,
        password: "pass",
      }),
    };
    console.log(requestchan);
    fetch("http://localhost:3001/chats", requestchan).then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        console.log("Error response create channel");
        return;
      }
      var channel = {
        name: newchannel,
        id: data.id,
      };
      setChannels((prev) => [...prev, channel]);
      setNewchannel("");
    });
  };

  const channelInfo = (channel: Channel) => {
    var isCurrent = channel.name == current_channel;
    return (
      <div id="channel-info">
        <li
          value={channel.name}
          onClick={(e) => {
            setCurrentChannel(
              (e.target as HTMLInputElement).getAttribute("value")
            );
          }}
          className={isCurrent ? "chanCurrent" : "channotCurrent"}
        >
          {channel.name}
        </li>
      </div>
    );
  };

  return (
    <WebSocketProvider value={socket}>
      <body>
        <div className="chat-container">
          <div className="sidebar">
            <form className="newchan" onSubmit={createChannel}>
              <input
                type="text"
                value={newchannel}
                onChange={(e) => {
                  setNewchannel(e.target.value);
                }}
              />
              <button>+</button>
            </form>
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
