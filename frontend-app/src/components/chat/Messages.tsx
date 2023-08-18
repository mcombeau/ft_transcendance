import { Dispatch, SetStateAction, useState } from "react";
import { NavigateFunction } from "react-router-dom";
import { Socket } from "socket.io-client";
import { getUserID } from "../../cookies";
import { Message, ChatRoom, Invite, typeInvite, User } from "./Chat";
import { ContextMenuEl } from "./ContextMenu";

export const Messages = (
  messages: Message[],
  current_channel: ChatRoom,
  navigate: NavigateFunction,
  settings: boolean,
  contextMenu: boolean,
  setContextMenu: Dispatch<SetStateAction<boolean>>,
  socket: Socket,
  invitesPannel: boolean,
  invites: Invite[],
  cookies: any
) => {
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [contextMenuSender, setContextMenuSender] = useState("");

  const messageStatus = (msg: Message) => {
    if (
      !current_channel ||
      !current_channel.participants.find(
        (p: User) => p.userID === getUserID(cookies)
      )
    ) {
      return;
    }
    if (msg.chatRoomID !== current_channel.name) return;
    if (msg.system) {
      return (
        <div id="announcement">
          <li>{msg.msg}</li>
        </div>
      );
    }
    if (msg.sender === username) {
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
            if (current_channel.name !== "" && settings === false) {
              setContextMenu(true);
              setContextMenuPos({ x: e.pageX, y: e.pageY });
              setContextMenuSender(msg.sender);
            }
          }}
        >
          {msg.sender}
        </span>
        <span id="date">{msg.datestamp.toString().split("G")[0]}</span>
        <li id="othermsg">{msg.msg}</li>
      </div>
    );
  };

  const inviteStatus = (invite: Invite) => {
    if (invite.type === typeInvite.Chat) {
      var text = `${invite.sender} invites you to join the chat ${invite.target}`;
    }
    return (
      // TODO: make actual type
      <div id="messages invite">
        <p>{text}</p>
        <button id="accept">Accept</button>
        <button id="refuse">Refuse</button>
      </div>
    );
  };
  if (invitesPannel) {
    return (
      <div id="messages">
        {invites.map((invite: Invite) => inviteStatus(invite))}
        {ContextMenuEl(
          contextMenu,
          contextMenuSender,
          setContextMenu,
          contextMenuPos,
          socket,
          current_channel,
          username,
          cookies
        )}
      </div>
    );
  }

  return (
    <div id="messages">
      {messages.map((msg: Message) => messageStatus(msg))}
      {ContextMenuEl(
        contextMenu,
        contextMenuSender,
        setContextMenu,
        contextMenuPos,
        socket,
        current_channel,
        username,
        cookies
      )}
    </div>
  );
};

export default Messages;
