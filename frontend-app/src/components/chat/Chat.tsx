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
  system: boolean;
  invite: boolean;
};

export type User = {
  username: string;
  owner: boolean;
  operator: boolean;
  banned: boolean;
  mutedUntil: number;
  invitedUntil: number;
};

export type Channel = {
  name: string;
  owner: string;
  participants: User[];
  invited: User[];
  banned: User[];
  private: boolean;
  dm: boolean;
};

export enum typeInvite {
  Chat,
  Game,
  Friend,
}

export type Invite = {
  id: number;
  target_user: string;
  sender: string;
  type: typeInvite;
  target: string;
  expirationDate: number;
};

export enum Status {
  Normal,
  Operator,
  Owner,
}

export function checkStatus(channel: Channel, username: string): Status {
  if (!channel) return Status.Normal;
  var user = channel.participants.find((p) => p.username === username); //TODO: maybe add some error management
  if (!user) return Status.Normal;
  if (user.owner) return Status.Owner;
  if (user.operator) return Status.Operator;
  return Status.Normal;
}

export function isUserMuted(user: User): boolean {
  if (user.mutedUntil < new Date().getTime()) return false;
  return true;
}

export function isMuted(channel: Channel, username: string): boolean {
  var user = channel.participants.find((p) => p.username === username); // TODO: understand how this can be undefined
  if (!user) return false;
  if (user.mutedUntil < new Date().getTime()) {
    return false;
  }
  return true;
}

export function ChangeStatus(
  status: string,
  socket: Socket,
  channel_name: string,
  operator_name: string,
  target_name: string,
  lenght_in_minutes: number = 0
) {
  const status_values = ["mute", "kick", "ban", "operator", "invite", "dm"];
  if (!status_values.includes(status)) return;
  if (status === "mute") {
    socket.emit(status, {
      channel_name: channel_name,
      current_user: operator_name,
      target_user: target_name,
      lenght_in_minutes: lenght_in_minutes,
    });
    return;
  }
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
  const [cookies] = useCookies(["cookie-name"]);
  const [contextMenu, setContextMenu] = useState(false);
  const [invitesPannel, setInvitesPannel] = useState(false);
  const [invites, setInvites] = useState([]);
  let navigate = useNavigate();

  function getChannel(channel_name: string): Channel {
    return channels.find((e) => e.name === channel_name);
  }

  function handleJoinChat(info: any) {
    var user: User = {
      username: info.username,
      owner: false,
      operator: false,
      banned: false,
      mutedUntil: new Date().getTime(),
      invitedUntil: 0,
    };

    setChannels((prev) => {
      const temp = [...prev];
      return temp.map((chan) => {
        if (chan.name === info.channel_name) {
          if (
            !chan.participants.some((p: User) => p.username === info.username)
          ) {
            chan.participants = [...chan.participants, user];

            serviceAnnouncement(
              `${info.username} joined the channel.`,
              info.channel_name
            );
          }
        }
        return chan;
      });
    });
  }

  function serviceAnnouncement(content: string, channel_name: string) {
    var message: Message = {
      msg: content,
      datestamp: new Date(),
      sender: "",
      channel: channel_name,
      read: true,
      system: true,
      invite: false,
    };
    setMessages((prev) => [...prev, message]);
  }

  useEffect(() => {
    setUsername(cookies["Username"]);
    console.log(username);

    socket.on("error", (error_msg: string) => {
      alert(error_msg);
    });
    socket.on("chat message", (msg: Message) => {
      msg.read = false;
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("delete chat", (channelname: string) => {
      setChannels((prev) => prev.filter((e) => e.name !== channelname));
      setMessages((prev) => prev.filter((e) => e.channel !== channelname));
      setSettings(false);
      setContextMenu(false);
      setCurrentChannel("");
    });

    socket.on("toggle private", (info: any) => {
      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan) => {
          if (chan.name === info.channel_name) {
            chan.private = !chan.private;
          }
          return chan;
        });
      });
    });

    socket.on("add chat", (info: any) => {
      console.log("Added new chat");
      console.log(info);
      var user: User = {
        username: info.owner,
        owner: true,
        operator: true,
        banned: false,
        mutedUntil: new Date().getTime(),
        invitedUntil: 0,
      };
      var channel: Channel = {
        name: info.name,
        participants: [user],
        banned: [],
        invited: [],
        private: info.private,
        owner: info.owner,
        dm: false,
      };
      setChannels((prev) => [...prev, channel]);
      if (info.owner === username) setCurrentChannel(info.name);
      setNewchannel("");
      serviceAnnouncement(`${info.owner} created channel.`, info.name);
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
              serviceAnnouncement(
                `${info.username} has left the channel`,
                info.channel_name
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
          if (chan.name === info.channel_name) {
            chan.participants.map((p) => {
              if (p.username === info.target_user) {
                p.mutedUntil = info.mute_date;
              }
              return p;
            });
          }
          return chan;
        });
      });
      serviceAnnouncement(
        `${info.target_user} has been muted until ${
          new Date(info.mute_date).toString().split("GMT")[0]
        }.`,
        info.channel_name
      );
    });

    socket.on("ban", (info: any) => {
      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan) => {
          if (chan.name === info.channel_name) {
            if (chan.banned.find((p) => p.username === info.target_user)) {
              chan.banned = chan.banned.filter(
                (p) => p.username !== info.target_user
              );
            } else if (
              chan.participants.find((p) => p.username === info.target_user)
            ) {
              var banned_user = chan.participants.find(
                (p) => p.username === info.target_user
              );
              banned_user.banned = true;
              chan.participants = chan.participants.filter(
                (p) => p.username !== info.target_user
              );
              chan.banned = [...chan.banned, banned_user];
            }
          }
          return chan;
        });
      });
      serviceAnnouncement(
        `${info.target_user} has been banned from this channel.`,
        info.channel_name
      );
    });

    socket.on("invite", (info: any) => {
      console.log("Received invite info");
      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan) => {
          if (chan.name === info.channel_name) {
            var invited_user: User = {
              username: info.target_user,
              owner: false,
              operator: false,
              banned: false,
              mutedUntil: new Date().getTime(),
              invitedUntil: info.invite_date,
            };
            chan.participants = chan.participants.filter(
              (p) => p.username !== info.target_user
            );
            chan.invited = [...chan.invited, invited_user];
          }
          return chan;
        });
      });
      serviceAnnouncement(
        `${info.target_user} has been invited to this channel.`,
        info.channel_name
      );
      var invite: Invite = {
        id: 0,
        target_user: info.target_user,
        sender: info.sender,
        type: typeInvite.Chat,
        target: info.channel_name,
        expirationDate: info.invite_date,
      };
      setInvites((prev) => [...prev, invite]);
    });

    socket.on("accept invite", (info: any) => {
      var user: User = {
        username: info.target_user,
        owner: false,
        operator: false,
        banned: false,
        mutedUntil: new Date().getTime(),
        invitedUntil: 0,
      };

      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan) => {
          if (chan.name === info.channel_name) {
            if (
              !chan.participants.some(
                (p: User) => p.username === info.target_user
              )
            ) {
              chan.participants = [...chan.participants, user];

              serviceAnnouncement(
                `${info.username} joined the channel.`,
                info.channel_name
              );
              chan.invited = chan.invited.filter(
                (e) => e.username !== info.target_user
              );
            }
          }
          return chan;
        });
      });
    });

    socket.on("kick", (info: any) => {
      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan) => {
          if (chan.name === info.channel_name) {
            chan.participants = chan.participants.filter(
              (p) => p.username !== info.target_user
            );
          }
          return chan;
        });
      });
      serviceAnnouncement(
        `${info.target_user} has been kicked from this channel.`,
        info.channel_name
      );
    });

    socket.on("operator", (info: any) => {
      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan) => {
          if (chan.name === info.channel_name) {
            chan.participants.map((p) => {
              if (p.username === info.target_user) {
                p.operator = !p.operator;
                if (p.operator) {
                  serviceAnnouncement(
                    `${info.target_user} is now a channel admin.`,
                    info.channel_name
                  );
                } else {
                  serviceAnnouncement(
                    `${info.target_user} is not a channel admin anymore.`,
                    info.channel_name
                  );
                }
              }
              return p;
            });
          }
          return chan;
        });
      });
    });

    socket.on("dm", (info: any) => {
      console.log(info);
      var user1: User = {
        username: info.user1,
        owner: false,
        operator: false,
        banned: false,
        mutedUntil: new Date().getTime(),
        invitedUntil: 0,
      };
      var user2: User = {
        username: info.user2,
        owner: false,
        operator: false,
        banned: false,
        mutedUntil: new Date().getTime(),
        invitedUntil: 0,
      };
      var channel: Channel = {
        name: info.name,
        participants: [user1, user2],
        banned: [],
        invited: [],
        private: true,
        owner: "",
        dm: true,
      };
      setChannels((prev) => [...prev, channel]);
    });

    if (channels.length === 0) {
      fetch("http://localhost:3001/chats").then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.log("error response load channels");
          return;
        }
        data.map((e: any) => {
          var participant_list = e.participants.map((user: any) => {
            var newUser: User = {
              username: user.participant.username,
              owner: user.owner,
              operator: user.operator,
              banned: user.banned,
              mutedUntil: user.mutedUntil,
              invitedUntil: user.invitedUntil,
            };
            return newUser;
          });
          var chan: Channel = {
            name: e.name,
            private: e.private,
            owner: e.directMessage
              ? ""
              : participant_list.find((u: any) => u.owner).username,
            participants: participant_list.filter(
              (user: any) => !user.banned && user.invitedUntil == 0
            ),
            banned: participant_list.filter((user: any) => user.banned),
            invited: participant_list.filter(
              (user: any) => user.invitedUntil != 0
            ),
            dm: e.directMessage,
          };
          setChannels((prev) => [...prev, chan]);
          return e;
        });
      });
    }

    if (invites.length === 0) {
      fetch(`http://localhost:3001/invites/received/${username}`).then(
        async (response) => {
          const data = await response.json();
          if (!response.ok) {
            console.log("error response load channels");
            return;
          }
          data.map((e: any) => {
            var type: typeInvite = typeInvite.Chat;
            if (e.type === "game") {
              type = typeInvite.Game;
            } else if (e.type === "friend") {
              type = typeInvite.Friend;
            }
            var invite: Invite = {
              id: e.id,
              target_user: e.invitedUser,
              sender: e.inviteSender,
              type: type,
              target: e.chatRoom.name,
              expirationDate: e.expiresAt,
            };

            setInvites((prev) => [...prev, invite]);
          });
        }
      );
    }

    if (messages.length === 0) {
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
            system: false,
            invite: false,
          };
          setMessages((prev) => [...prev, msg]);
          return e;
        });
      });
    }

    return () => {
      console.log("unregistering events");
      socket.off("chat message");
      socket.off("error");
      socket.off("delete chat");
      socket.off("add chat");
      socket.off("join chat");
      socket.off("leave chat");
      socket.off("mute");
      socket.off("kick");
      socket.off("ban");
      socket.off("operator");
      socket.off("toggle private");
      socket.off("invite");
      socket.off("accept invite");
      socket.off("dm");
    };
  }, []);

  useEffect(() => {
    var message_els = document.getElementById("messages");
    if (!message_els) return;

    message_els.scrollTop = message_els.scrollHeight;
  }, [messages]);

  useEffect(() => {
    console.log(channels);
  }, [channels]);

  useEffect(() => {
    if (username === undefined) {
      alert("You have no username"); // TODO : remove = for debug purposes
    }
  }, [username]);

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
          username,
          invitesPannel,
          setInvitesPannel
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
            socket,
            invitesPannel,
            invites
          )}
          {SendForm(
            getChannel(current_channel),
            cookies,
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
