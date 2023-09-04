import { Dispatch, SetStateAction, useState } from "react";
import { NavigateFunction } from "react-router-dom";
import { Socket } from "socket.io-client";
import { getUserID } from "../../cookies";
import {
  Message,
  ChatRoom,
  Invite,
  User,
  PublicChatRoom,
  typeInvite,
} from "./types";
import { ContextMenuEl } from "./ContextMenu";
import { ReceivedInfo } from "./types";

export const Messages = (
  currentChatRoom: ChatRoom,
  navigate: NavigateFunction,
  settings: boolean,
  contextMenu: boolean,
  setContextMenu: Dispatch<SetStateAction<boolean>>,
  socket: Socket,
  invitesPannel: boolean,
  invites: Invite[],
  publicChats: PublicChatRoom[],
  publicChatsPannel: boolean,
  cookies: any,
  myChats: ChatRoom[]
) => {
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [contextMenuTarget, setContextMenuTarget] = useState({
    id: null,
    username: null,
  });

  const messageStatus = (msg: Message) => {
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
              navigate("/user/" + msg.senderID); // TODO: create front profile page and go there
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
            navigate("/user/" + msg.senderID); // TODO: create front profile page and go there
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

  // TODO: maybe get chat name for display
  const inviteStatus = (invite: Invite) => {
	// MAKE SURE THIS WORKS BECAUSE ITS FUCKING WEIIIIIIRD
    var date = new Date(parseInt(invite.expiresAt.toString()));
    var text = `${invite.senderUsername} invites you to join the ${
      invite.type
    } ${invite.chatRoomID} until ${date.toString()}`;
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
          contextMenuTarget,
          setContextMenu,
          contextMenuPos,
          socket,
          currentChatRoom,
          cookies,
          myChats
        )}
      </div>
    );
  }
  function displayInvite(invite: Invite) {
    return (
      <br>{`You have been invited to ${invite.chatRoomID} by ${invite.senderID}`}</br>
    );
  }

  function displayInvites() {
    if (!invitesPannel) {
      return <div></div>;
    }
    return <div>{invites.map(displayInvite)}</div>;
  }

  function displayPublicChat(chat: PublicChatRoom) {
    // TODO: check if the public chat is also in mychats
    var joinButton = (
      <button
        className="joinchan"
        value={chat.chatRoomID}
        onClick={(e) => {
          var info: ReceivedInfo = {
            chatRoomID: parseInt(
              (e.target as HTMLInputElement).getAttribute("value")
            ),
            token: cookies["token"],
          };
          socket.emit("join chat", info);
        }}
      >
        Join
      </button>
    );
    return (
      <div id="publicchat">
        {chat.name}
        {joinButton}
      </div>
    );
  }

  function displayPublicChats() {
    if (!publicChatsPannel) {
      return <div></div>;
    }
    return (
      <div>
        {publicChats
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((chat: PublicChatRoom) => displayPublicChat(chat))}
      </div>
    );
  }

  function displayMessages(currentChatRoom: ChatRoom) {
    if (currentChatRoom === undefined) return <div></div>;
    return currentChatRoom.messages.map(messageStatus);
  }

  return (
    <div id="messages">
      {displayMessages(currentChatRoom)}
      {displayPublicChats()}
      {displayInvites()}
      {ContextMenuEl(
        contextMenu,
        contextMenuTarget,
        setContextMenu,
        contextMenuPos,
        socket,
        currentChatRoom,
        cookies,
        myChats
      )}
    </div>
  );
};

export default Messages;
