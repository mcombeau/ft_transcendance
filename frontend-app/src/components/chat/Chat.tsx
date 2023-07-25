import { useContext, useEffect, useState } from "react";
import {
  WebSocketContext,
  WebSocketProvider,
} from "../../contexts/WebsocketContext";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import "./Chat.css";
import Messages from "./Messages";
import SettingsMenu from "./SettingsMenu";
import SidePannel from "./SidePannel";
import SendForm from "./SendForm";
import { Socket } from "socket.io-client";

export type Message = {
  datestamp: Date;
  msg: string;
  sender: string;
  channel: string;
  read: boolean;
};

export type User = {
  username: string;
  owner: boolean;
  operator: boolean;
  banned: boolean;
  muted: boolean;
};

export type Channel = {
  name: string;
  owner: string;
  participants: User[];
  private: boolean;
};

export enum Status {
  Normal,
  Operator,
  Owner,
}

export function checkStatus(channel: Channel, username: string): Status {
  if (!channel) return Status.Normal;
  var user = channel.participants.find((p) => p.username == username); //TODO: maybe add some error management
  if (!user) return Status.Normal;
  if (user.owner) return Status.Owner;
  if (user.operator) return Status.Operator;
  return Status.Normal;
}

export function ChangeStatus(
  status: string,
  socket: Socket,
  channel_name: string,
  operator_name: string,
  target_name: string
) {
  const status_values = ["mute", "kick", "ban", "operator"];
  if (!status_values.includes(status)) return;
  console.log("emitted");
  console.log({
    channel_name: channel_name,
    current_user: operator_name,
    target_user: target_name,
  });
  socket.emit(status, {
    channel_name: channel_name,
    current_user: operator_name,
    target_user: target_name,
  });
}

export const Chat = () => {
  const socket = useContext(WebSocketContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [newchannel, setNewchannel] = useState("");
  const [current_channel, setCurrentChannel] = useState(""); // TODO: have screen if no channels
  const [username, setUsername] = useState("");
  const [settings, setSettings] = useState(false);
  const [cookies, setCookie, removeCookie] = useCookies(["cookie-name"]);
  const [contextMenu, setContextMenu] = useState(false);
  let navigate = useNavigate();

  function getChannel(channel_name: string): Channel {
    return channels.find((e) => e.name == channel_name);
  }

  function handleJoinChat(info: any) {
    var user: User = {
      username: info.username,
      owner: false,
      operator: false,
      banned: false,
      muted: false,
    };

    setChannels((prev) => {
      const temp = [...prev];
      return temp.map((chan) => {
        if (chan.name == info.channel_name) {
          if (
            !chan.participants.some((p: User) => p.username == info.username)
          ) {
            chan.participants = [...chan.participants, user];
          }
        }
        return chan;
      });
    });
  }

  useEffect(() => {
    setUsername(cookies["Username"]);
    console.log(username);

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
        participants: [],
        private: info.private,
        owner: info.username,
      };
      setChannels((prev) => [...prev, channel]);
      setNewchannel("");
    });

    socket.on("join chat", (info: any) => {
      handleJoinChat(info);
    });

    socket.on("leave chat", (info: any) => {
      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan) => {
          if (chan.name === info.channel_name) {
            if (
              chan.participants.some((p: User) => p.username === info.username)
            ) {
              chan.participants = chan.participants.filter(
                (p) => p.username !== info.username
              );
            }
          }
          return chan;
        });
      });
    });

    socket.on("mute", (info: any) => {
      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan) => {
          if (chan.name == info.channel_name) {
            chan.participants.map((p) => {
              if (p.username == info.target_user) {
                p.muted = !p.muted; // TODO: change later
              }
              return p;
            });
          }
          return chan;
        });
      });
    });

    socket.on("ban", (info: any) => {
      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan) => {
          if (chan.name == info.channel_name) {
            chan.participants.map((p) => {
              if (p.username == info.target_user) {
                p.banned = true;
              }
              return p;
            });
          }
          return chan;
        });
      });
    });

    socket.on("kick", (info: any) => {
      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan) => {
          if (chan.name == info.channel_name) {
            chan.participants = chan.participants.filter(
              (p) => p.username !== info.target_user
            );
          }
          return chan;
        });
      });
    });

    socket.on("operator", (info: any) => {
      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan) => {
          if (chan.name == info.channel_name) {
            chan.participants.map((p) => {
              if (p.username == info.target_user) {
                p.operator = !p.operator;
              }
              return p;
            });
          }
          return chan;
        });
      });
    });

    if (channels.length == 0) {
      fetch("http://localhost:3001/chats").then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.log("error response load channels");
          return;
        }
        data.map((e: any) => {
          var chan: Channel = {
            name: e.name,
            private: e.private,
            owner: e.username,
            participants: e.participants.map((user: any) => {
              var newUser: User = {
                username: user.participant.username,
                owner: user.owner,
                operator: user.operator,
                banned: user.banned,
                muted: user.muted,
              };
              return newUser;
            }),
          };
          setChannels((prev) => [...prev, chan]);
          console.log(channels);
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
        data.map((e: any) => {
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

  useEffect(() => {
    var message_els = document.getElementById("messages");

    message_els.scrollTop = message_els.scrollHeight;
  }, [messages]);

  useEffect(() => {
    console.log(channels);
  }, [channels]);

  return (
    <WebSocketProvider value={socket}>
      <div className="chat-container">
        {SidePannel(
          newchannel,
          setNewchannel,
          current_channel,
          setCurrentChannel,
          socket,
          messages,
          setMessages,
          settings,
          setSettings,
          setContextMenu,
          channels,
          username
        )}
        <div className="chat">
          {SettingsMenu(
            settings,
            setSettings,
            getChannel(current_channel),
            setCurrentChannel,
            socket,
            navigate,
            username
          )}
          {Messages(
            messages,
            getChannel(current_channel),
            username,
            navigate,
            settings,
            contextMenu,
            setContextMenu,
            socket
          )}
          {SendForm(
            getChannel(current_channel),
            cookies,
            setMessages,
            setUsername,
            socket,
            username
          )}
        </div>
      </div>
    </WebSocketProvider>
  );
};

export default Chat;
