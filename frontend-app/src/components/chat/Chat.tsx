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
  creator: string;
  participants: User[];
};

export enum Status {
  Normal,
  Operator,
  Owner,
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
        participants: [],
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
        data.map((e: any) => {
          var chan: Channel = {
            name: e.name,
            creator: "",
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
          console.log(chan);
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
            status,
            getChannel(current_channel),
            setCurrentChannel,
            socket,
            navigate
          )}
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
          {SendForm(
            current_channel,
            setStatus,
            cookies,
            setMessages,
            setUsername,
            socket
          )}
        </div>
      </div>
    </WebSocketProvider>
  );
};

export default Chat;
