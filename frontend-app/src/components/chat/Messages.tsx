import { Dispatch, SetStateAction, useState } from "react";
import { NavigateFunction } from "react-router-dom";
import { Socket } from "socket.io-client";
import { getUserID } from "../../cookies";
import { Message, ChatRoom, Invite, typeInvite, User } from "./types";
import { ContextMenuEl } from "./ContextMenu";

export const Messages = (
  messages: Message[],
  currentChatRoom: ChatRoom,
  navigate: NavigateFunction,
  settings: boolean,
  contextMenu: boolean,
  setContextMenu: Dispatch<SetStateAction<boolean>>,
  socket: Socket,
  invitesPannel: boolean,
  invites: Invite[],
  publicChats: ChatRoom[],
  publicChatsPannel: boolean,
  cookies: any,
  channels: ChatRoom[]
) => {
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [contextMenuTarget, setContextMenuTarget] = useState({
    id: null,
    username: null,
  });

  const messageStatus = (msg: Message) => {
    if (
      !currentChatRoom ||
      !currentChatRoom.participants.find(
        (p: User) => p.userID === getUserID(cookies)
      )
    ) {
      return;
    }
    if (msg.chatRoomID !== currentChatRoom.chatRoomID) return;
    if (msg.system) {
      return (
        <div id="announcement">
          <li>{msg.msg}</li>
        </div>
      );
    }
    if (msg.senderID === getUserID(cookies)) {
      return (
        <div id="rightmessage">
          <span
            id="sender"
            onClick={() => {
              navigate("/user/" + msg.senderUsername); // TODO: create front profile page and go there
            }}
          >
            {msg.senderUsername}
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
            navigate("/user/" + msg.senderUsername);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (currentChatRoom.name !== "" && settings === false) {
              setContextMenu(true);
              setContextMenuPos({ x: e.pageX, y: e.pageY });
              setContextMenuTarget({
                id: msg.senderID,
                username: msg.senderUsername,
              });
            }
          }}
        >
          {msg.senderUsername}
        </span>
        <span id="date">{msg.datestamp.toString().split("G")[0]}</span>
        <li id="othermsg">{msg.msg}</li>
      </div>
    );
  };

  // TODO: invites pannel

  // const inviteStatus = (invite: Invite) => {
  //   if (invite.type === typeInvite.Chat) {
  //     var text = `${invite.sender} invites you to join the chat ${invite.target}`;
  //   }
  //   return (
  //     // TODO: make actual type
  //     <div id="messages invite">
  //       <p>{text}</p>
  //       <button id="accept">Accept</button>
  //       <button id="refuse">Refuse</button>
  //     </div>
  //   );
  // };
  // if (invitesPannel) {
  //   return (
  //     <div id="messages">
  //       {invites.map((invite: Invite) => inviteStatus(invite))}
  //       {ContextMenuEl(
  //         contextMenu,
  //         contextMenuSender,
  //         setContextMenu,
  //         contextMenuPos,
  //         socket,
  //         currentChatRoom,
  //         username,
  //         cookies
  //       )}
  //     </div>
  //   );
  // }

  function displayPublicChat(chat: ChatRoom) {
    return <div id="public chat">{chat.name}</div>;
  }

  function displayPublicChats() {
    if (!publicChatsPannel) {
      return <div></div>;
    }
    return <div>{publicChats.map(displayPublicChat)}</div>;
  }

  return (
    <div id="messages">
      {messages.map((msg: Message) => messageStatus(msg))}
      {displayPublicChats()}
      {ContextMenuEl(
        contextMenu,
        contextMenuTarget,
        setContextMenu,
        contextMenuPos,
        socket,
        currentChatRoom,
        cookies,
        channels
      )}
    </div>
  );
};

export default Messages;
