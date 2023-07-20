import { useContext, useEffect, useState, useRef } from "react";
import {
  WebSocketContext,
  WebSocketProvider,
} from "../../contexts/WebsocketContext";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import "./chat.css";
import Messages from "./messages";

export type Message = {
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

export enum Status {
  Normal,
  Operator,
  Owner,
}

export const Chat = () => {
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
  const [status, setStatus] = useState<Status>(Status.Normal);
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
      setContextMenu(false);
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
              setContextMenu(false);
            }}
          >
            ⚙
          </button>
        </li>
      </div>
    );
  };

  const listParticipants = (channel_name: string) => {
    var participants = messages
      .filter((message: Message) => {
        return message.channel == channel_name;
      })
      .map((message: Message) => {
        return message.sender;
      })
      .filter((value, index, self) => self.indexOf(value) === index); // TODO: change
    console.log(participants);
    return (
      <ul className="participant_list">
        {participants.map((participant) => {
          return (
            <div>
              <li
                onClick={() => {
                  navigate("/user/" + participant);
                }}
              >
                {participant}
              </li>
              {status != Status.Normal ? (
                <div>
                  <button
                    onClick={() => {
                      console.log("Muted " + participant);
                    }}
                  >
                    Mute
                  </button>
                  <button
                    onClick={() => {
                      console.log("Kicked " + participant);
                    }}
                  >
                    Kick
                  </button>
                  <button
                    onClick={() => {
                      console.log("Banned " + participant);
                    }}
                  >
                    Ban
                  </button>
                </div>
              ) : (
                <div></div>
              )}
            </div>
          );
        })}
      </ul>
    );
  };

  const settingMenu = () => {
    if (settings) {
      if (status != Status.Normal) {
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
            <h3>Channel members</h3>
            {listParticipants(current_channel)}
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
          <h3>Channel members</h3>
          {listParticipants(current_channel)}
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
        <select
          multiple
          onChange={(choice) => {
            if (choice.target.value == "normal") setStatus(Status.Normal);
            if (choice.target.value == "operator") setStatus(Status.Operator);
            if (choice.target.value == "owner") setStatus(Status.Owner);
          }}
        >
          <option value="normal">Normal</option>
          <option value="operator">Operator</option>
          <option value="owner">Owner</option>
        </select>
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
          {Messages(
            messages,
            current_channel,
            username,
            navigate,
            settings,
            contextMenu,
            setContextMenu,
            status
          )}
          {sendForm()}
        </div>
      </div>
    </WebSocketProvider>
  );
};

export default Chat;
