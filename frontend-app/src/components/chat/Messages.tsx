import { Dispatch, SetStateAction, useState } from "react";
import { NavigateFunction } from "react-router-dom";
import { Socket } from "socket.io-client";
import { getUserID } from "../../cookies";
import { Message, ChatRoom, Invite, PublicChatRoom } from "./types";
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

  const inviteStatus = (invite: Invite) => {
    // MAKE SURE THIS WORKS BECAUSE ITS FUCKING WEIIIIIIRD
    var date = new Date(parseInt(invite.expiresAt.toString()));
    return (
      // TODO: make actual type
      <div id="messages_invite">
        <p>
          <b>{invite.senderUsername}</b> invites you to join the {invite.type}{" "}
          <i>{invite.chatRoomName}</i> until {date.toString().split("GMT")[0]}
        </p>
        <button
          id="accept"
          onClick={(e) => {
            const info = {
              token: cookies["token"],
              inviteInfo: invite,
            };
            socket.emit("accept invite", info);
          }}
        >
          Accept
        </button>

        <button
          id="refuse"
          onClick={(e) => {
            const info = {
              token: cookies["token"],
              inviteInfo: invite,
            };
            socket.emit("refuse invite", info);
          }}
        >
          Refuse
        </button>
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

  function displayPublicChat(chat: PublicChatRoom) {
    var joinButton = (
      <button
        className="joinchan"
        value={chat.chatRoomID}
        onClick={(e) => {
          if (chat.hasPassword) {
            var getPassword = prompt(
              `${chat.name} is password protected. Please enter password:`
            );
          } else {
            var getPassword = "";
          }
          var info: ReceivedInfo = {
            chatRoomID: parseInt(
              (e.target as HTMLInputElement).getAttribute("value")
            ),
            token: cookies["token"],
            chatInfo: {
              password: getPassword,
            },
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
