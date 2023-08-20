import { useState } from "react";
import { Socket } from "socket.io-client";
import { getUserID, getUsername } from "../../cookies";
import { isMuted } from "./Chat";
import { ReceivedInfo } from "./types";
import { ChatRoom, User } from "./types";

export const SendForm = (
  currentChatRoom: ChatRoom,
  cookies: any,
  socket: Socket
) => {
  const [value, setValue] = useState("");

  const handleSendMessage = (e: any) => {
    e.preventDefault();
    if (
      !currentChatRoom ||
      value === "" ||
      currentChatRoom.name === "" ||
      !getUsername(cookies) ||
      !currentChatRoom.participants.some(
        (p: User) => p.userID === getUserID(cookies)
      ) ||
      isMuted(currentChatRoom, getUserID(cookies))
    ) {
      console.log(
        "Message is empty or channel is not defined or not logged in. Or not in the channel"
      );
      return;
    }
    var info: ReceivedInfo = {
      token: cookies["token"],
      messageInfo: {
        message: value,
        sentAt: new Date(),
      },
      chatRoomID: currentChatRoom.chatRoomID,
    };
    socket.emit("chat message", info);
    setValue("");
  };

  if (
    !currentChatRoom ||
    !currentChatRoom.participants.find(
      (p: User) => p.userID === getUserID(cookies)
    )
  ) {
    return;
  }
  return (
    <form id="form" onSubmit={handleSendMessage}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
      />
      <button>Send</button>
    </form>
  );
};

export default SendForm;
