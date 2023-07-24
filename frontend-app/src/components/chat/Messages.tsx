import { Dispatch, SetStateAction, useState } from "react";
import { NavigateFunction } from "react-router-dom";
import { Socket } from "socket.io-client";
import { Message, Status, Channel } from "./Chat";
import { ContextMenuEl } from "./ContextMenu";

export const Messages = (
  messages: Message[],
  current_channel: Channel,
  username: string,
  navigate: NavigateFunction,
  settings: boolean,
  contextMenu: boolean,
  setContextMenu: Dispatch<SetStateAction<boolean>>,
  status: Status,
  socket: Socket
) => {
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [contextMenuSender, setContextMenuSender] = useState("");

  const messageStatus = (msg: Message) => {
    if (!current_channel) {
      return;
    }
    if (msg.channel != current_channel.name) return;
    if (msg.sender == username) {
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

  return (
    <div id="messages">
      {messages.map((msg: Message) => messageStatus(msg))}
      {ContextMenuEl(
        contextMenu,
        contextMenuSender,
        status,
        setContextMenu,
        contextMenuPos,
        socket,
        current_channel,
        username
      )}
    </div>
  );
};

export default Messages;
