import { useContext, useEffect, useState, useRef } from "react";
import {
  WebSocketContext,
  WebSocketProvider,
} from "../../contexts/WebsocketContext";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import "./chat.css";

type Message = {
  datestamp: Date;
  msg: string;
  sender: string;
  channel: string;
  read: boolean;
};

type Channel = {
  name: string;
  creator: string;
};

export const Chat = ({ children, exceptionRef, onClick, className }) => {
  const socket = useContext(WebSocketContext);
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [newchannel, setNewchannel] = useState("");
  const [current_channel, setCurrentChannel] = useState(""); // TODO: have screen if no channels
  const [username, setUsername] = useState("");
  const [settings, setSettings] = useState(false);
  const [cookies, setCookie, removeCookie] = useCookies(["cookie-name"]);
  const [contextMenu, setContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [contextMenuSender, setContextMenuSender] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  let navigate = useNavigate();

  function getChannel(channel_name: string): Channel {
    return channels.find((e) => e.name == channel_name);
  }

  useEffect(() => {
    socket.on("chat message", (msg: Message) => {
      msg.read = false;
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("delete chat", (channelname: string) => {
      setChannels((prev) => prev.filter((e) => e.name != channelname));
      setMessages((prev) => prev.filter((e) => e.channel != channelname));
      setSettings(false);
      setCurrentChannel("");
    });

    socket.on("add chat", (info: any) => {
      console.log("Added new chat");
      console.log(info);
      var channel = {
        name: info.name,
        creator: "creator",
      };
      setChannels((prev) => [...prev, channel]);
      setNewchannel("");
    });

    if (channels.length == 0) {
      fetch("http://localhost:3001/chats").then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.log("error response load channels");
          return;
        }
        data.map((e) => {
          var chan: Channel = {
            name: e.name,
            creator: "",
          };
          setChannels((prev) => [...prev, chan]);
        });
      });
    }

    if (messages.length == 0) {
      fetch("http://localhost:3001/chat-messages").then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.log("error response load messages");
          return;
        }
        data.map((e) => {
          var msg: Message = {
            datestamp: e.sentAt,
            msg: e.message,
            sender: e.sender.username,
            channel: e.chatRoom.name,
            read: true,
          };
          setMessages((prev) => [...prev, msg]);
        });
      });
    }

    return () => {
      console.log("unregistering events");
      socket.off("chat message");
      socket.off("connection event");
      socket.off("disconnection event");
      socket.off("connect");
    };
  }, []);

  const handleSendMessage = (e: any) => {
    e.preventDefault();
    if (value == "" || current_channel == "" || !cookies["Username"]) {
      console.log(
        "Message is empty or channel is not defined or not logged in"
      );
      return;
    }
    setUsername(cookies["Username"]);
    var msg: Message = {
      msg: value,
      datestamp: new Date(),
      sender: cookies["Username"],
      channel: current_channel,
      read: true,
    };
    socket.emit("chat message", msg);
    setMessages((prev) => [...prev, msg]);
    setValue("");
  };

  const contextMenuEl = () => {
    return (
      <div
        ref={menuRef}
        className="contextMenu"
        style={{
          top: contextMenuPos.y - 10,
          left: contextMenuPos.x + 15,
        }}
      >
        <p>{contextMenuSender}</p>
        <ul
          onClick={() => {
            console.log("Muted " + contextMenuSender);
          }}
        >
          Mute
        </ul>
        <ul
          onClick={() => {
            console.log("Kicked " + contextMenuSender);
          }}
        >
          Kick
        </ul>
        <ul
          onClick={() => {
            console.log("Banned " + contextMenuSender);
          }}
        >
          Ban
        </ul>
        <ul
          onClick={() => {
            console.log("Blocked " + contextMenuSender);
          }}
        >
          Block
        </ul>
        <button onClick={() => setContextMenu(false)}>✕</button>
      </div>
    );
  };

  const messageStatus = (msg: Message) => {
    if (msg.channel != current_channel) return;
    if (msg.sender == username) {
      return (
        <div id="rightmessage">
          <span
            id="sender"
            onClick={() => {
              navigate("/user/" + msg.sender);
            }}
          >
            {msg.sender}
          </span>
          <span id="date">{msg.datestamp.toString().split("G")[0]}</span>
          <li id="mine">{msg.msg}</li>
        </div>
      );
    }
    return (
      <div id="leftmessage">
        <span
          id="sender"
          onClick={() => {
            navigate("/user/" + msg.sender);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu(true);
            setContextMenuPos({ x: e.pageX, y: e.pageY });
            setContextMenuSender(msg.sender);
          }}
        >
          {msg.sender}
        </span>
        <span id="date">{msg.datestamp.toString().split("G")[0]}</span>
        <li id="othermsg">{msg.msg}</li>
      </div>
    );
  };

  useEffect(() => {
    var message_els = document.getElementById("messages");

    message_els.scrollTop = message_els.scrollHeight;
  }, [messages]);

  const createChannel = (e: any) => {
    e.preventDefault();
    // Create new channel
    if (newchannel == "") return;
    socket.emit("add chat", { name: newchannel, password: "pass" });
  };

  const channelInfo = (channel: Channel) => {
    var isCurrent = channel.name == current_channel;
    var unreadMessages: number = messages
      .filter((msg) => {
        return msg.channel == channel.name;
      })
      .filter((msg) => {
        return msg.read == false;
      }).length;
    return (
      <div id="channel-info">
        <li
          value={channel.name}
          onClick={(e) => {
            var target = (e.target as HTMLInputElement).getAttribute("value");
            setCurrentChannel(target);
            setMessages(
              messages.map((msg) => {
                if (msg.channel == target) {
                  return { ...msg, read: true };
                } else {
                  return { ...msg };
                }
              })
            );
          }}
          className={isCurrent ? "chanCurrent" : "channotCurrent"}
        >
          {unreadMessages > 0 && <p>{unreadMessages}</p>}
          {channel.name}
          <button
            value={channel.name}
            onClick={(e) => {
              setCurrentChannel(
                (e.target as HTMLInputElement).getAttribute("value")
              );
              setSettings(!settings);
            }}
          >
            ⚙
          </button>
        </li>
      </div>
    );
  };

  const settingMenu = () => {
    if (settings) {
      if (username == "admin") {
        // TODO: change that
        return (
          <div className="settings">
            <h3>Admin panel for {current_channel}</h3>
            <button
              onClick={() => {
                socket.emit("delete chat", current_channel);
                console.log("Deleting " + current_channel);
              }}
            >
              Delete channel
            </button>
            <button
              className="closesettings"
              onClick={() => {
                setSettings(false);
              }}
            >
              ✕
            </button>
          </div>
        );
      }
      return (
        <div className="settings">
          <h3>Settings for {current_channel}</h3>
          <button
            onClick={() => {
              // TODO: change
              console.log("Leaving " + current_channel);
              setSettings(false);
              setCurrentChannel("");
            }}
          >
            Leave channel
          </button>
          <button
            className="closesettings"
            onClick={() => {
              setSettings(false);
            }}
          >
            ✕
          </button>
        </div>
      );
    }
  };

  const sendForm = () => {
    if (current_channel == "") return;
    return (
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
    );
  };

  return (
    <WebSocketProvider value={socket}>
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
          {settingMenu()}
          <div id="messages">
            {messages.map((msg: Message) => messageStatus(msg))}
			{contextMenu && contextMenuEl()}
          </div>
          {sendForm()}
        </div>
      </div>
    </WebSocketProvider>
  );
};

export default Chat;
