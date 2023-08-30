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
import {
  Status,
  Message,
  User,
  ChatRoom,
  Invite,
  ReceivedInfo,
  typeInvite,
  PublicChatRoom,
} from "./types";

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
  var participant_list = await fetchChatParticipants(chatRoomID, request);
  var message_list = await fetchChatMessages(chatRoomID, request);
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

export const Chat = () => {
  const socket = useContext(WebSocketContext);
  const [myChats, setMyChats] = useState<ChatRoom[]>([]);
  const [publicChats, setPublicChats] = useState<PublicChatRoom[]>([]);
  const [newchannel, setNewchannel] = useState("");
  const [currentChatRoomID, setCurrentChatRoomID] = useState(null); // TODO: have screen if no channels
  const [settings, setSettings] = useState(false);
  const [cookies] = useCookies(["cookie-name"]);
  const [contextMenu, setContextMenu] = useState(false);
  const [invitesPannel, setInvitesPannel] = useState(false);
  const [publicChatsPannel, setPublicChatsPannel] = useState(false);
  const [invites, setInvites] = useState([]);
  let navigate = useNavigate();

  function getChannel(chatRoomID: number): ChatRoom {
    return channels.find((e) => e.chatRoomID === chatRoomID);
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
    setMessages((prev) => [...prev, message]);
  }

  useEffect(() => {
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
        senderUsername: info.username,
      };
      setMessages((prev) => [...prev, message]);
    });

    socket.on("delete chat", (info: ReceivedInfo) => {
      setChannels((prev) =>
        prev.filter((e: ChatRoom) => e.chatRoomID !== info.chatRoomID)
      );
      setPublicChats((prev) =>
        prev.filter((e: ChatRoom) => e.chatRoomID !== info.chatRoomID)
      );
      setMessages((prev) =>
        prev.filter((e: Message) => e.chatRoomID !== info.chatRoomID)
      );
      setSettings(false);
      setContextMenu(false);
      setCurrentChatRoomID("");
    });

    socket.on("toggle private", async (info: ReceivedInfo) => {
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
        };

        setPublicChats((prev) => [...prev, newPublicChat]);
      }
    });

    socket.on("add chat", (info: ReceivedInfo) => {
      console.log("Added new chat");
      console.log(info);

      var publicChatRoom: PublicChatRoom = {
        chatRoomID: info.chatRoomID,
        name: info.chatInfo.name,
      };

      setPublicChats((prev) => [...prev, publicChatRoom]);

      // TODO : check if I have more info #socket refacto
      if (info.userID === getUserID(cookies)) {
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
          isPrivate: info.chatInfo.isPrivate,
          ownerID: info.userID,
          isDM: false,
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

      if (info.userID === getUserID(cookies)) {
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

      if (info.userID === getUserID(cookies)) {
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
        `${info.username} has been muted until ${
          new Date(info.participantInfo.mutedUntil).toString().split("GMT")[0]
        }.`,
        info.chatRoomID
      );
    });

    socket.on("ban", (info: ReceivedInfo) => {
      // If somebody is being banned
      if (info.participantInfo.isBanned) {
        if (info.userID === getUserID(cookies)) {
          // If i'm the one being banned remove chat from mychats
          setMyChats((prev) => {
            const tmp = [...prev];
            return tmp.filter(
              (chat: ChatRoom) => chat.chatRoomID !== info.chatRoomID
            );
          });
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
        targetUsername: info.username,
        senderID: info.userID,
        senderUsername: info.username2,
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
      // For everybody in the chat, update participants
      setMyChats((prev) => {
        const temp = [...prev];
        return temp.map((chat: ChatRoom) => {
          if (chat.chatRoomID === info.chatRoomID) {
            chat.participants = chat.participants.filter(
              (participant: User) => participant.userID !== info.userID
            );
            serviceAnnouncement(
              `${info.username} has been kicked from the channel`,
              chat.chatRoomID
            );
          }
          return chat;
        });
      });

      if (info.userID === getUserID(cookies)) {
        // If i'm the one being kicked remove chat from mychats
        setMyChats((prev) => {
          const tmp = [...prev];
          return tmp.filter(
            (chat: ChatRoom) => chat.chatRoomID !== info.chatRoomID
          );
        });
      }
    });

    socket.on("operator", (info: ReceivedInfo) => {
      setChannels((prev) => {
        const temp = [...prev];
        return temp.map((chan: ChatRoom) => {
          if (chan.chatRoomID === info.chatRoomID) {
            chan.participants.map((p: User) => {
              if (p.userID === info.targetID) {
                p.isOperator = info.participantInfo.isOperator;
                console.log("isoperator", p.isOperator);
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
        isPrivate: true,
        ownerID: null,
        isDM: true,
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
      // Fetching Chats
      fetch(
        `http://localhost:3001/users/${getUserID(cookies)}/chats`,
        request
      ).then(async (response) => {
        const chat_data = await response.json();
        if (!response.ok) {
          console.log("error response load channels");
          return;
        }
        console.log("RECEIVED private CHAT DATA", chat_data);
        chat_data.map(async (chatRoom: any) => {
          var chan = await fetchChatParticipants(chatRoom, request);
          setChannels((prev) => [...prev, chan]);
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
            var chan = await fetchChatParticipants(chatRoom, request);
            setPublicChats((prev) => [...prev, chan]);
            return chatRoom;
          });
        }
      );
    }

    if (invites.length === 0) {
      fetch(
        `http://localhost:3001/invites/received/${getUserID(cookies)}`
      ).then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.log("error response load invites");
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
            targetID: e.invitedID,
            targetUsername: e.invitedUsername,
            senderUsername: e.senderUsername,
            senderID: e.senderID,
            type: type,
            chatRoomID: e.chatRoomID, // TODO: change with gameroomid
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
            console.log("MESSAGE");
            console.log(e);
            var msg: Message = {
              datestamp: e.sentAt,
              msg: e.message,
              senderID: e.sender.id,
              chatRoomID: e.chatRoom.id,
              read: true,
              system: false,
              senderUsername: e.sender.username,
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
    console.log("My chats: ", channels);
  }, [channels]);

  useEffect(() => {
    console.log("Public chats", publicChats);
  }, [publicChats]);

  // TODO: test
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
          messages,
          setMessages,
          settings,
          setSettings,
          setContextMenu,
          channels,
          invitesPannel,
          setInvitesPannel,
          publicChatsPannel,
          setPublicChatsPannel,
          cookies
        )}
        <div className="chat">
          {SettingsMenu(
            settings,
            setSettings,
            getChannel(currentChatRoomID),
            setCurrentChatRoomID,
            socket,
            navigate,
            cookies
          )}
          {Messages(
            messages,
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
            channels
          )}
          {SendForm(getChannel(currentChatRoomID), cookies, socket)}
        </div>
      </div>
    </WebSocketProvider>
  );
};

export default Chat;
