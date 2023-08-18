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
import { getUserID, getUsername } from "../../cookies";
import { ReceivedInfo } from "./types";

export type Message = {
  datestamp: Date;
  msg: string;
  senderID: number;
  chatRoomID: number;
  read: boolean;
  system: boolean;
};

export type User = {
  userID: number;
  username: string;
  isOwner: boolean;
  isOperator: boolean;
  isBanned: boolean;
  mutedUntil: number;
  invitedUntil: number;
};

export type ChatRoom = {
  chatRoomID: number;
  name: string;
  ownerID: number;
  participants: User[];
  invited: User[];
  banned: User[];
  isPrivate: boolean;
  isDM: boolean;
};

export enum typeInvite {
  Chat,
  Game,
  Friend,
}

export type Invite = {
  targetID: number;
  senderID: number;
  type: typeInvite;
  chatRoomID: number;
  expirationDate: number;
};

export enum Status {
  Normal,
  Operator,
  Owner,
}

export function checkStatus(channel: ChatRoom, username: string): Status {
  if (!channel) return Status.Normal;
  var user = channel.participants.find((p) => p.username === username); //TODO: maybe add some error management
  if (!user) return Status.Normal;
  if (user.isOwner) return Status.Owner;
  if (user.isOperator) return Status.Operator;
  return Status.Normal;
}

export function isUserMuted(user: User): boolean {
  if (user.mutedUntil < new Date().getTime()) return false;
  return true;
}

export function isMuted(channel: ChatRoom, username: string): boolean {
  var user = channel.participants.find((p) => p.username === username); // TODO: understand how this can be undefined
  if (!user) return false;
  if (user.mutedUntil < new Date().getTime()) {
    return false;
  }
  return true;
}

export function ChangeStatus(
  info: ReceivedInfo,
  userStatus: string,
  socket: Socket
) {
  const status_values = ["mute", "kick", "ban", "operator", "invite", "dm"];
  if (!status_values.includes(userStatus)) return;
  socket.emit(userStatus, info);
}

export function getChatRoomNameFromID(
  chatRoomID: number,
  channels: ChatRoom[]
) {
  return channels.find((chatRoom: ChatRoom) => {
    chatRoomID === chatRoom.chatRoomID;
  }).name;
}

export function getUserNameFromID(userID: number, channels: ChatRoom[]) {
  return channels
    .find((chatRoom: ChatRoom) => {
      chatRoom.participants.some((p: User) => p.userID === userID);
    })
    .participants.find((p: User) => p.userID === userID).username;
}

export const Chat = () => {
  const socket = useContext(WebSocketContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [channels, setChannels] = useState<ChatRoom[]>([]);
  const [newchannel, setNewchannel] = useState("");
  const [current_channel, setCurrentChannel] = useState(""); // TODO: have screen if no channels
  const [username, setUsername] = useState(""); // TODO: maybe change to id ?
  const [settings, setSettings] = useState(false);
  const [cookies] = useCookies(["cookie-name"]);
  const [contextMenu, setContextMenu] = useState(false);
  const [invitesPannel, setInvitesPannel] = useState(false);
  const [invites, setInvites] = useState([]);
  let navigate = useNavigate();

  function getChannel(channel_name: string): ChatRoom {
    return channels.find((e) => e.name === channel_name);
  }

  function serviceAnnouncement(content: string, chatRoomID: number) {
    var message: Message = {
      msg: content,
      datestamp: new Date(),
      senderID: null,
      chatRoomID: chatRoomID,
      read: true,
      system: true,
    };
    setMessages((prev) => [...prev, message]);
  }

  useEffect(() => {
    setUsername(getUsername(cookies));

    socket.on("error", (error_msg: string) => {
      alert(error_msg);
    });

    socket.on("chat message", (info: ReceivedInfo) => {
      var message: Message = {
        datestamp: info.messageInfo.sentAt,
        msg: info.messageInfo.message,
        senderID: info.userID,
        chatRoomID: info.chatRoomID,
        read: false,
        system: false,
      };
      setMessages((prev) => [...prev, message]);
    });

    socket.on("delete chat", (info: ReceivedInfo) => {
      setChannels((prev) =>
        prev.filter((e: ChatRoom) => e.chatRoomID !== info.chatRoomID)
      );
      setMessages((prev) =>
        prev.filter((e: Message) => e.chatRoomID !== info.chatRoomID)
      );
      setSettings(false);
      setContextMenu(false);
      setCurrentChannel("");
    });

    socket.on("toggle private", (info: ReceivedInfo) => {
      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan: ChatRoom) => {
          if (chan.chatRoomID === info.chatRoomID) {
            chan.isPrivate = info.chatInfo.private;
          }
          return chan;
        });
      });
    });

    socket.on("add chat", (info: ReceivedInfo) => {
      console.log("Added new chat");
      console.log(info);
      var user: User = {
        userID: info.userID,
        username: info.username,
        isOwner: true,
        isOperator: true,
        isBanned: false,
        mutedUntil: new Date().getTime(),
        invitedUntil: 0,
      };
      var chatRoom: ChatRoom = {
        chatRoomID: info.chatRoomID,
        name: info.chatInfo.name,
        participants: [user],
        banned: [],
        invited: [],
        isPrivate: info.chatInfo.private,
        ownerID: info.userID,
        isDM: false,
      };
      setChannels((prev) => [...prev, chatRoom]);
      if (info.userID === getUserID(cookies)) {
        setCurrentChannel(info.chatInfo.name);
      }
      setNewchannel("");
      serviceAnnouncement(
        `${user.username} created channel.`,
        chatRoom.chatRoomID
      );
    });

    socket.on("join chat", (info: ReceivedInfo) => {
      var user: User = {
        userID: info.userID,
        username: info.username,
        isOwner: false,
        isOperator: false,
        isBanned: false,
        mutedUntil: new Date().getTime(),
        invitedUntil: 0,
      };

      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan: ChatRoom) => {
          if (chan.chatRoomID === info.chatRoomID) {
            if (
              !chan.participants.some((p: User) => p.userID === info.userID)
            ) {
              chan.participants = [...chan.participants, user];

              serviceAnnouncement(
                `${info.username} joined the channel.`,
                info.chatRoomID
              );
            }
          }
          return chan;
        });
      });
    });

    socket.on("leave chat", (info: ReceivedInfo) => {
      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan: ChatRoom) => {
          if (chan.chatRoomID === info.chatRoomID) {
            if (chan.participants.some((p: User) => p.userID === info.userID)) {
              chan.participants = chan.participants.filter(
                (p) => p.userID !== info.userID
              );
              serviceAnnouncement(
                `${info.username} has left the channel`,
                chan.chatRoomID
              );
            }
          }
          return chan;
        });
      });
    });

    socket.on("mute", (info: ReceivedInfo) => {
      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan: ChatRoom) => {
          if (chan.chatRoomID === info.chatRoomID) {
            chan.participants.map((p) => {
              if (p.userID === info.targetID) {
                p.mutedUntil = info.participantInfo.mutedUntil;
              }
              return p;
            });
          }
          return chan;
        });
      });
      serviceAnnouncement(
        `${getUserNameFromID(info.targetID, channels)} has been muted until ${
          new Date(info.participantInfo.mutedUntil).toString().split("GMT")[0]
        }.`,
        info.chatRoomID
      );
    });

    socket.on("ban", (info: ReceivedInfo) => {
      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan: ChatRoom) => {
          if (chan.chatRoomID === info.chatRoomID) {
            if (chan.banned.find((p) => p.userID === info.targetID)) {
              chan.banned = chan.banned.filter(
                (p) => p.userID !== info.targetID
              );
            } else if (
              chan.participants.find((p) => p.userID === info.targetID)
            ) {
              var banned_user = chan.participants.find(
                (p) => p.userID === info.targetID
              );
              banned_user.isBanned = true;
              chan.participants = chan.participants.filter(
                (p) => p.userID !== info.targetID
              );
              chan.banned = [...chan.banned, banned_user];
            }
          }
          return chan;
        });
      });
      serviceAnnouncement(
        `${getUserNameFromID(
          info.targetID,
          channels
        )} has been banned from this channel.`,
        info.chatRoomID
      );
    });

    socket.on("invite", (info: ReceivedInfo) => {
      // TODO: check if we are sure we don't need that

      // console.log("Received invite info");
      // setChannels((prev) => {
      //   const temp = [...prev];
      //   return temp.map((chan: ChatRoom) => {
      //     if (chan.chatRoomID === info.chatRoomID) {
      //       var invited_user: User = {
      //         userID: info.targetID,
      //         username: info.username,
      //         isOwner: false,
      //         isOperator: false,
      //         isBanned: false,
      //         mutedUntil: new Date().getTime(),
      //         invitedUntil: info.inviteDate,
      //       };
      //       chan.participants = chan.participants.filter(
      //         (p: User) => p.userID !== info.targetID
      //       );
      //       chan.invited = [...chan.invited, invited_user];
      //     }
      //     return chan;
      //   });
      // });
      serviceAnnouncement(
        `${info.username} has been invited to this channel.`,
        info.chatRoomID
      );
      var invite: Invite = {
        targetID: info.targetID,
        senderID: info.userID,
        type: typeInvite.Chat,
        chatRoomID: info.chatRoomID,
        expirationDate: info.inviteDate,
      };
      setInvites((prev) => [...prev, invite]);
    });

    socket.on("accept invite", (info: ReceivedInfo) => {
      var user: User = {
        userID: info.targetID,
        username: info.username,
        isOwner: false,
        isOperator: false,
        isBanned: false,
        mutedUntil: new Date().getTime(),
        invitedUntil: 0,
      };

      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan: ChatRoom) => {
          if (chan.chatRoomID === info.chatRoomID) {
            if (
              !chan.participants.some((p: User) => p.userID === info.targetID)
            ) {
              chan.participants = [...chan.participants, user];

              serviceAnnouncement(
                `${info.username} joined the channel.`,
                info.chatRoomID
              );
            }
          }
          return chan;
        });
      });
    });

    socket.on("kick", (info: ReceivedInfo) => {
      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan: ChatRoom) => {
          if (chan.chatRoomID === info.chatRoomID) {
            chan.participants = chan.participants.filter(
              (p: User) => p.userID !== info.targetID
            );
          }
          return chan;
        });
      });
      serviceAnnouncement(
        `${getUserNameFromID(
          info.targetID,
          channels
        )} has been kicked from this channel.`,
        info.chatRoomID
      );
    });

    socket.on("operator", (info: ReceivedInfo) => {
      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan: ChatRoom) => {
          if (chan.chatRoomID === info.chatRoomID) {
            chan.participants.map((p: User) => {
              if (p.userID === info.targetID) {
                p.isOperator = info.participantInfo.operator;
                if (p.isOperator) {
                  serviceAnnouncement(
                    `${getUserNameFromID(
                      info.targetID,
                      channels
                    )} is now a channel admin.`,
                    info.chatRoomID
                  );
                } else {
                  serviceAnnouncement(
                    `${getUserNameFromID(
                      info.targetID,
                      channels
                    )} is not a channel admin anymore.`,
                    info.chatRoomID
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

    socket.on("dm", (info: ReceivedInfo) => {
      console.log(info);
      var user1: User = {
        username: info.user1,
        isOwner: false,
        isOperator: false,
        isBanned: false,
        mutedUntil: new Date().getTime(),
        invitedUntil: 0,
      };
      var user2: User = {
        username: info.user2,
        isOwner: false,
        isOperator: false,
        isBanned: false,
        mutedUntil: new Date().getTime(),
        invitedUntil: 0,
      };
      var channel: ChatRoom = {
        name: info.name,
        participants: [user1, user2],
        isBanned: [],
        invited: [],
        private: true,
        owner: "",
        dm: true,
      };
      setChannels((prev) => [...prev, channel]);
    });

    var request = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies["token"]}`,
      },
    };
    if (channels.length === 0) {
      fetch(
        `http://localhost:3001/users/${getUserID(cookies)}/chats`,
        request
      ).then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.log("error response load channels");
          return;
        }
        data.map((e: any) => {
          var participant_list = e.participants.map((user: User) => {
            var newUser: User = {
              userID: user.user.id,
              username: user.user.username,
              isOwner: user.owner,
              isOperator: user.isOperator,
              isBanned: user.isBanned,
              mutedUntil: user.mutedUntil,
              invitedUntil: user.invitedUntil,
            };
            return newUser;
          });
          var chan: ChatRoom = {
            chatRoomID: e.id,
            name: e.name,
            isPrivate: e.private,
            ownerID: e.directMessage
              ? null
              : participant_list.find((u: User) => u.isOwner).userID,
            participants: participant_list.filter(
              (user: User) => !user.isBanned && user.invitedUntil == 0
            ),
            banned: participant_list.filter((user: User) => user.isBanned),
            invited: participant_list.filter(
              (user: User) => user.invitedUntil != 0
            ),
            isDM: e.directMessage,
          };
          setChannels((prev) => [...prev, chan]);
          return e;
        });
      });
    }

    if (invites.length === 0) {
      fetch(
        `http://localhost:3001/invites/received/${getUserID(cookies)}`
      ).then(async (response) => {
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
            targetID: e.invitedUser,
            senderID: e.inviteSender,
            type: type,
            chatRoomID: e.chatRoom.id,
            expirationDate: e.expiresAt,
          };

          setInvites((prev) => [...prev, invite]);
        });
      });
    }

    if (messages.length === 0) {
      fetch("http://localhost:3001/chat-messages", request).then(
        async (response) => {
          const data = await response.json();
          if (!response.ok) {
            console.log("error response load messages");
            return;
          }
          data.map((e: any) => {
            var msg: Message = {
              datestamp: e.sentAt,
              msg: e.message,
              senderID: e.sender.id,
              chatRoomID: e.chatRoom.id,
              read: true,
              system: false,
            };
            setMessages((prev) => [...prev, msg]);
            return e;
          });
        }
      );
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
          setInvitesPannel,
          cookies
        )}
        <div className="chat">
          {SettingsMenu(
            settings,
            setSettings,
            getChannel(current_channel),
            setCurrentChannel,
            socket,
            navigate,
            username,
            cookies
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
            invites,
            cookies
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
