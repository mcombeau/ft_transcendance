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
import { getUsername } from "../../cookies";
import {
  Status,
  Message,
  User,
  ChatRoom,
  Invite,
  ReceivedInfo,
  PublicChatRoom,
} from "./types";
import { AuthenticationContext } from "../authenticationState";

export function isInChannel(
  userID: number,
  chatRoomID: number,
  chatRooms: ChatRoom[]
): boolean {
  return chatRooms
    .find((chatRoom) => chatRoom.chatRoomID === chatRoomID)
    .participants.some((user) => user.userID === userID);
}

export function checkStatus(channel: ChatRoom, userID: number): Status {
  if (!channel) return Status.Normal;
  var user = channel.participants.find((p) => p.userID === userID); //TODO: maybe add some error management
  if (!user) return Status.Normal;
  if (user.isOwner) return Status.Owner;
  if (user.isOperator) return Status.Operator;
  return Status.Normal;
}

export function isUserMuted(user: User): boolean {
  if (user.mutedUntil < new Date().getTime()) return false;
  return true;
}

export function isMuted(channel: ChatRoom, userID: number): boolean {
  var user = channel.participants.find((p) => p.userID === userID); // TODO: understand how this can be undefined
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
  console.log("Change status invite info", info);
  socket.emit(userStatus, info);
}

export function getChatRoomNameFromID(
  chatRoomID: number,
  channels: ChatRoom[]
) {
  return channels.find((chatRoom: ChatRoom) => {
    return chatRoomID === chatRoom.chatRoomID;
  }).name;
}
export function getChatRoomIDFromName(
  chatRoomName: string,
  channels: ChatRoom[]
) {
  return channels.find((chatRoom: ChatRoom) => {
    return chatRoom.name === chatRoomName;
  }).chatRoomID;
}

export async function fetchChatData(
  chatRoomID: number,
  chatRoomName: string,
  isPrivate: boolean,
  isDirectMessage: boolean,
  request: any
): Promise<ChatRoom> {
  const participant_list = await fetchChatParticipants(chatRoomID, request);
  const message_list = await fetchChatMessages(chatRoomID, request);
  const hasPassword = await fetchHasPassword(chatRoomID, request);
  var chan: ChatRoom = {
    chatRoomID: chatRoomID,
    name: chatRoomName,
    isPrivate: isPrivate,
    ownerID: isDirectMessage
      ? null
      : participant_list.find((u: User) => u.isOwner).userID,
    participants: participant_list.filter(
      (user: User) => !user.isBanned && user.invitedUntil === null
    ),
    banned: participant_list.filter((user: User) => user.isBanned),
    invited: participant_list.filter(
      (user: User) => user.invitedUntil !== null
    ),
    isDM: isDirectMessage,
    messages: message_list,
    hasPassword: hasPassword,
  };
  return chan;
}
export async function fetchChatParticipants(
  chatRoomID: number,
  request: any
): Promise<User[]> {
  var participant_list = await fetch(
    `http://localhost:3001/chats/${chatRoomID}/participants`,
    request
  ).then(async (response) => {
    const participant_data = await response.json();
    if (!response.ok) {
      console.log("error response load participants");
      return null;
    }
    var participants = participant_data.map((user: any) => {
      var newUser: User = {
        userID: user.userID,
        username: user.username,
        isOwner: user.isOwner,
        isOperator: user.isOperator,
        isBanned: user.isBanned,
        mutedUntil: user.mutedUntil,
        invitedUntil: null,
      };
      return newUser;
    });
    return participants;
  });
  return participant_list;
}

export async function fetchChatMessages(
  chatRoomID: number,
  request: any
): Promise<Message[]> {
  var message_list = await fetch(
    `http://localhost:3001/chats/${chatRoomID}/messages`,
    request
  ).then(async (response) => {
    const message_data = await response.json();
    if (!response.ok) {
      console.log("error response load messages");
      return null;
    }
    var messages = message_data.map((message: any) => {
      var newMessage: Message = {
        datestamp: message.sentAt,
        msg: message.message,
        senderID: message.senderID,
        senderUsername: message.senderUsername,
        chatRoomID: message.chatRoomID,
        read: true,
        system: false,
      };
      return newMessage;
    });
    return messages;
  });
  return message_list;
}

export async function fetchHasPassword(
  chatRoomID: number,
  request: any
): Promise<boolean> {
  return await fetch(
    `http://localhost:3001/chats/${chatRoomID}/has_password`,
    request
  ).then(async (response) => {
    const hasPassword = await response.json();
    if (!response.ok) {
      console.log("error response load has password");
      return null;
    }
    return hasPassword;
  });
}

export const Chat = () => {
  const socket = useContext(WebSocketContext);
  const [myChats, setMyChats] = useState<ChatRoom[]>([]);
  const [publicChats, setPublicChats] = useState<PublicChatRoom[]>([]);
  const [newchannel, setNewchannel] = useState("");
  const [currentChatRoomID, setCurrentChatRoomID] = useState(null); // TODO: have screen if no channels
  const [settings, setSettings] = useState(false);
  const [cookies] = useCookies(["token"]);
  const [contextMenu, setContextMenu] = useState(false);
  const [invitesPannel, setInvitesPannel] = useState(false);
  const [publicChatsPannel, setPublicChatsPannel] = useState(false);
  const [invites, setInvites] = useState([]);
  const { authenticatedUserID } = useContext(AuthenticationContext);
  let navigate = useNavigate();

  function getChannel(chatRoomID: number): ChatRoom {
    return myChats.find((e) => e.chatRoomID === chatRoomID);
  }

  function serviceAnnouncement(content: string, chatRoomID: number) {
    var message: Message = {
      msg: content,
      datestamp: new Date(),
      senderID: null,
      chatRoomID: chatRoomID,
      read: true,
      system: true,
      senderUsername: null,
    };
    addMessageToChatRoom(message, chatRoomID);
  }

  function addMessageToChatRoom(message: Message, chatRoomID: number) {
    setMyChats((prev) => {
      const temp = [...prev];
      return temp.map((chat: ChatRoom) => {
        if (chat.chatRoomID === chatRoomID) {
          chat.messages = [...chat.messages, message];
        }
        return chat;
      });
    });
  }

  useEffect(() => {
    socket.on("error", (error_msg: string) => {
      alert(error_msg);
    });

    socket.on("chat message", (info: ReceivedInfo) => {
      console.log("RECEIVED", "chat message", info);
      var message: Message = {
        datestamp: info.messageInfo.sentAt,
        msg: info.messageInfo.message,
        senderID: info.userID,
        chatRoomID: info.chatRoomID,
        read: false,
        system: false,
        senderUsername: info.username,
      };
      addMessageToChatRoom(message, info.chatRoomID);
    });

    socket.on("delete chat", (info: ReceivedInfo) => {
      console.log("RECEIVED", "delete chat", info);
      setMyChats((prev) =>
        prev.filter((e: ChatRoom) => e.chatRoomID !== info.chatRoomID)
      );
      setPublicChats((prev) =>
        prev.filter((e: ChatRoom) => e.chatRoomID !== info.chatRoomID)
      );
      setSettings(false);
      setContextMenu(false);
      setCurrentChatRoomID("");
    });

    socket.on("toggle private", async (info: ReceivedInfo) => {
      console.log("RECEIVED", "toggle private", info);
      if (info.chatInfo.isPrivate) {
        // the chat is becoming private
        setPublicChats((prev) =>
          prev.filter((e: ChatRoom) => e.chatRoomID !== info.chatRoomID)
        );
      } else {
        // the chat is going public
        const newPublicChat: PublicChatRoom = {
          chatRoomID: info.chatRoomID,
          name: info.chatInfo.name,
          hasPassword: info.chatInfo.hasPassword,
        };

        setPublicChats((prev) => [...prev, newPublicChat]);
      }

      setMyChats((prev) => {
        const temp = [...prev];
        return temp.map((chat: ChatRoom) => {
          if (chat.chatRoomID === info.chatRoomID) {
            if (info.chatInfo.isPrivate) {
              chat.isPrivate = true;
              serviceAnnouncement(
                "This chatroom is now private",
                chat.chatRoomID
              );
            } else {
              chat.isPrivate = false;
              serviceAnnouncement(
                "This chatroom is now public",
                chat.chatRoomID
              );
            }
          }
          return chat;
        });
      });
    });

    socket.on("add chat", (info: ReceivedInfo) => {
      console.log("RECEIVED", "add chat", info);
      console.log("Added new chat");
      console.log(info);

      var publicChatRoom: PublicChatRoom = {
        chatRoomID: info.chatRoomID,
        name: info.chatInfo.name,
        hasPassword: info.chatInfo.hasPassword,
      };

      setPublicChats((prev) => [...prev, publicChatRoom]);

      // TODO : check if I have more info #socket refacto
      if (info.userID === authenticatedUserID) {
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
          messages: [],
          isPrivate: info.chatInfo.isPrivate,
          ownerID: info.userID,
          isDM: false,
          hasPassword: info.chatInfo.hasPassword,
        };
        setMyChats((prev) => [...prev, chatRoom]);
      }
    });

    socket.on("join chat", async (info: ReceivedInfo) => {
      var user: User = {
        userID: info.userID,
        username: info.username,
        isOwner: false,
        isOperator: false,
        isBanned: false,
        mutedUntil: new Date().getTime(),
        invitedUntil: 0,
      };

      // For everybody in the chat, update participants
      setMyChats((prev) => {
        const temp = [...prev];
        return temp.map((chat: ChatRoom) => {
          if (chat.chatRoomID === info.chatRoomID) {
            chat.participants = [...chat.participants, user];
            serviceAnnouncement(
              `${info.username} has joined the channel`,
              chat.chatRoomID
            );
          }
          return chat;
        });
      });

      if (info.userID === authenticatedUserID) {
        // If i'm the one joining create new mychat and fetch info
        const newChat = await fetchChatData(
          info.chatRoomID,
          info.chatInfo.name,
          info.chatInfo.isPrivate,
          false,
          request
        );
        setMyChats((prev) => [...prev, newChat]);
      }
    });

    socket.on("leave chat", (info: ReceivedInfo) => {
      console.log("RECEIVED", "leave chat", info);
      // For everybody in the chat, update participants
      setMyChats((prev) => {
        const temp = [...prev];
        return temp.map((chat: ChatRoom) => {
          if (chat.chatRoomID === info.chatRoomID) {
            chat.participants = chat.participants.filter(
              (participant: User) => participant.userID !== info.userID
            );
            serviceAnnouncement(
              `${info.username} has left the channel`,
              chat.chatRoomID
            );
          }
          return chat;
        });
      });

      if (info.userID === authenticatedUserID) {
        // If i'm the one leaving remove chat from mychats
        setMyChats((prev) => {
          const tmp = [...prev];
          return tmp.filter(
            (chat: ChatRoom) => chat.chatRoomID !== info.chatRoomID
          );
        });
      }
    });

    socket.on("mute", (info: ReceivedInfo) => {
      console.log("RECEIVED", "mute", info);
      setMyChats((prev) => {
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
      if (new Date(info.participantInfo.mutedUntil) > new Date()) {
        serviceAnnouncement(
          `${info.username} has been muted until ${
            new Date(info.participantInfo.mutedUntil).toString().split("GMT")[0]
          }.`,
          info.chatRoomID
        );
      } else {
        serviceAnnouncement(
          `${info.username} has been unmuted.`,
          info.chatRoomID
        );
      }
    });

    socket.on("ban", (info: ReceivedInfo) => {
      console.log("RECEIVED", "ban", info);
      // If somebody is being banned
      if (info.participantInfo.isBanned) {
        if (info.targetID === authenticatedUserID) {
          // If i'm the one being banned remove chat from mychats
          setMyChats((prev) => {
            const tmp = [...prev];
            return tmp.filter(
              (chat: ChatRoom) => chat.chatRoomID !== info.chatRoomID
            );
          });
          info.token = cookies["token"];
          socket.emit("leave socket room", info);
        }
        // For other people, move participant to banned list
        setMyChats((prev) => {
          const temp = [...prev];
          return temp.map((chat: ChatRoom) => {
            if (chat.chatRoomID === info.chatRoomID) {
              var banned_user = chat.participants.find(
                (p) => p.userID === info.targetID
              );
              banned_user.isBanned = true;
              chat.participants = chat.participants.filter(
                (p) => p.userID !== info.targetID
              );
              chat.banned = [...chat.banned, banned_user];
              serviceAnnouncement(
                `${info.username} has been banned from this channel.`,
                info.chatRoomID
              );
            }
            return chat;
          });
        });
      } else {
        // Somebody is being unbanned
        setMyChats((prev) => {
          const temp = [...prev];
          return temp.map((chat: ChatRoom) => {
            if (chat.chatRoomID === info.chatRoomID) {
              chat.banned = chat.banned.filter(
                (p) => p.userID !== info.targetID
              );

              serviceAnnouncement(
                `${info.username} has been unbanned from this channel.`,
                info.chatRoomID
              );
            }
            return chat;
          });
        });
      }
    });

    socket.on("invite", (info: ReceivedInfo) => {
      // Receive invitation from someone else
      var invite: Invite = info.inviteInfo;
      if (invite.invitedID === authenticatedUserID) {
        setInvites((prev: Invite[]) =>
          prev.filter((i: Invite) => i.id !== invite.id)
        );
        setInvites((prev: Invite[]) => [...prev, invite]);
      }
    });

    socket.on("accept invite", async (info: ReceivedInfo) => {
      setInvites((prev) =>
        prev.filter((invite: Invite) => invite.id !== info.inviteInfo.id)
      );
      console.log("RECEIVED", "accept invite", info);
      var user: User = {
        userID: info.userID,
        username: info.username,
        isOwner: false,
        isOperator: false,
        isBanned: false,
        mutedUntil: new Date().getTime(),
        invitedUntil: 0,
      };

      // For everybody in the chat, update participants
      setMyChats((prev) => {
        const temp = [...prev];
        return temp.map((chat: ChatRoom) => {
          if (chat.chatRoomID === info.chatRoomID) {
            chat.participants = [...chat.participants, user];
            serviceAnnouncement(
              `${info.username} has joined the channel`,
              chat.chatRoomID
            );
          }
          return chat;
        });
      });

      if (info.userID === authenticatedUserID) {
        // If i'm the one joining create new mychat and fetch info
        const newChat = await fetchChatData(
          info.chatRoomID,
          info.chatInfo.name,
          info.chatInfo.isPrivate,
          false,
          request
        );
        setMyChats((prev) => [...prev, newChat]);
      }
    });

    socket.on("refuse invite", (info: ReceivedInfo) => {
      setInvites((prev) =>
        prev.filter((invite: Invite) => invite.id !== info.inviteInfo.id)
      );
    });

    socket.on("set password", (info: ReceivedInfo) => {
      console.log("RECEIVED", "set password", info);

      setPublicChats((prev: PublicChatRoom[]) => {
        const temp = [...prev];
        return temp.map((chat: PublicChatRoom) => {
          if (chat.chatRoomID === info.chatRoomID) {
            chat.hasPassword = info.chatInfo.hasPassword;
          }
          return chat;
        });
      });

      setInvites((prev: Invite[]) => {
        const temp = [...prev];
        return temp.map((invite: Invite) => {
          if (invite.chatRoomID === info.chatRoomID) {
            invite.chatHasPassword = info.chatInfo.hasPassword;
          }
          return invite;
        });
      });

      setMyChats((prev) => {
        const temp = [...prev];
        return temp.map((chat: ChatRoom) => {
          if (chat.chatRoomID === info.chatRoomID) {
            if (info.chatInfo.hasPassword) {
              chat.hasPassword = true;
              serviceAnnouncement(
                "This chatroom now has a password",
                chat.chatRoomID
              );
            } else {
              chat.hasPassword = false;
              serviceAnnouncement(
                "This chatroom doesn't have a password anymore",
                chat.chatRoomID
              );
            }
          }
          return chat;
        });
      });
    });

    socket.on("kick", (info: ReceivedInfo) => {
      console.log("RECEIVED", "kick", info);
      // For everybody in the chat, update participants
      setMyChats((prev) => {
        const temp = [...prev];
        return temp.map((chat: ChatRoom) => {
          if (chat.chatRoomID === info.chatRoomID) {
            chat.participants = chat.participants.filter(
              (participant: User) => participant.userID !== info.targetID
            );
            serviceAnnouncement(
              `${info.username} has been kicked from the channel`,
              chat.chatRoomID
            );
          }
          return chat;
        });
      });

      if (info.targetID === authenticatedUserID) {
        // If i'm the one being kicked remove chat from mychats
        setMyChats((prev) => {
          const tmp = [...prev];
          return tmp.filter(
            (chat: ChatRoom) => chat.chatRoomID !== info.chatRoomID
          );
        });
        info.token = cookies["token"];
        socket.emit("leave socket room", info);
      }
    });

    socket.on("operator", (info: ReceivedInfo) => {
      console.log("RECEIVED", "operator", info);
      setMyChats((prev) => {
        const temp = [...prev];
        return temp.map((chan: ChatRoom) => {
          if (chan.chatRoomID === info.chatRoomID) {
            chan.participants.map((p: User) => {
              if (p.userID === info.targetID) {
                p.isOperator = info.participantInfo.isOperator;
                if (p.isOperator) {
                  serviceAnnouncement(
                    `${info.username} is now a channel admin.`,
                    info.chatRoomID
                  );
                } else {
                  serviceAnnouncement(
                    `${info.username} is not a channel admin anymore.`,
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
      console.log("RECEIVED", "dm", info);
      console.log(info);
      var user1: User = {
        userID: info.userID,
        username: info.username,
        isOwner: false,
        isOperator: false,
        isBanned: false,
        mutedUntil: new Date().getTime(),
        invitedUntil: null,
      };
      var user2: User = {
        userID: info.targetID,
        username: info.username2,
        isOwner: false,
        isOperator: false,
        isBanned: false,
        mutedUntil: new Date().getTime(),
        invitedUntil: null,
      };
      var channel: ChatRoom = {
        chatRoomID: info.chatRoomID,
        name: `DM: ${user1.username}/${user2.username}`,
        participants: [user1, user2],
        banned: [],
        invited: [],
        messages: [],
        isPrivate: true,
        ownerID: null,
        isDM: true,
        hasPassword: false,
      };
      info.token = cookies["token"];
      socket.emit("join socket room", info);
      setMyChats((prev) => [...prev, channel]);
    });

    var request = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies["token"]}`,
      },
    };
    if (myChats.length === 0) {
      // Fetching Chats
      fetch(
        `http://localhost:3001/users/${authenticatedUserID}/chats`,
        request
      ).then(async (response) => {
        const chat_data = await response.json();
        if (!response.ok) {
          console.log("error response load channels");
          return;
        }
        console.log("RECEIVED private CHAT DATA", chat_data);
        chat_data.map(async (chatRoom: any) => {
          var chan = await fetchChatData(
            chatRoom.id,
            chatRoom.name,
            chatRoom.isPrivate,
            chatRoom.isDirectMessage,
            request
          );
          setMyChats((prev) => [...prev, chan]);
          return chatRoom;
        });
      });
    }

    if (publicChats.length === 0) {
      fetch(`http://localhost:3001/chats/public`, request).then(
        async (response) => {
          const chat_data = await response.json();
          if (!response.ok) {
            console.log("error response load channels");
            return;
          }
          console.log("RECEIVED public CHAT DATA", chat_data);
          chat_data.map(async (chatRoom: any) => {
            const newPublicChat: PublicChatRoom = {
              chatRoomID: chatRoom.id,
              name: chatRoom.name,
              hasPassword: await fetchHasPassword(chatRoom.id, request),
            };
            setPublicChats((prev) => [...prev, newPublicChat]);
            return chatRoom;
          });
        }
      );
    }

    if (invites.length === 0) {
      fetch(
        `http://localhost:3001/invites/received/${authenticatedUserID}`,
        request
      ).then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.log("error response load invites");
          return;
        }
        data.map((invite: Invite) => {
          console.log("fetching invites", invite);
          setInvites((prev) => [...prev, invite]);
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
      socket.off("refuse invite");
      socket.off("set password");
    };
  }, []);

  useEffect(() => {
    var message_els = document.getElementById("messages");
    if (!message_els) return;

    message_els.scrollTop = message_els.scrollHeight;
  }, [myChats]);

  useEffect(() => {
    console.log("My chats: ", myChats);
  }, [myChats]);

  useEffect(() => {
    console.log("Public chats", publicChats);
  }, [publicChats]);

  useEffect(() => {
    if (getUsername(cookies) === undefined) {
      alert("You have no username"); // TODO : remove = for debug purposes
    }
  }, [cookies]);

  return (
    <WebSocketProvider value={socket}>
      <div className="chat-container">
        {SidePannel(
          newchannel,
          setNewchannel,
          currentChatRoomID,
          setCurrentChatRoomID,
          socket,
          settings,
          setSettings,
          setContextMenu,
          myChats,
          invitesPannel,
          setInvitesPannel,
          publicChatsPannel,
          setPublicChatsPannel,
          cookies,
          authenticatedUserID
        )}
        <div className="chat">
          {SettingsMenu(
            settings,
            setSettings,
            getChannel(currentChatRoomID),
            setCurrentChatRoomID,
            socket,
            navigate,
            cookies,
            authenticatedUserID
          )}
          {Messages(
            getChannel(currentChatRoomID),
            navigate,
            settings,
            contextMenu,
            setContextMenu,
            socket,
            invitesPannel,
            invites,
            publicChats,
            publicChatsPannel,
            cookies,
            myChats,
            authenticatedUserID
          )}
          {SendForm(
            getChannel(currentChatRoomID),
            cookies,
            socket,
            authenticatedUserID
          )}
        </div>
      </div>
    </WebSocketProvider>
  );
};

export default Chat;
