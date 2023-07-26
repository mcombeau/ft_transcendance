import { Dispatch, SetStateAction, useState } from "react";
import { Socket } from "socket.io-client";
import { Message, Channel, isUserMuted, isMuted } from "./Chat";

export const SendForm = (
  current_channel: Channel,
  cookies: any,
  setMessages: Dispatch<SetStateAction<Message[]>>,
  setUsername: Dispatch<SetStateAction<string>>,
  socket: Socket,
  current_user: string
) => {
  const [value, setValue] = useState("");

  const handleSendMessage = (e: any) => {
    e.preventDefault();
    if (
      !current_channel ||
      value == "" ||
      current_channel.name == "" ||
      !cookies["Username"] ||
      !current_channel.participants.some((p) => p.username === current_user) ||
      isMuted(current_channel, current_user)
    ) {
      console.log(
        "Message is empty or channel is not defined or not logged in. Or not in the channel"
      );
      return;
    }
    setUsername(cookies["Username"]);
    var msg: Message = {
      msg: value,
      datestamp: new Date(),
      sender: cookies["Username"],
      channel: current_channel.name,
      read: true,
    };
    socket.emit("chat message", msg);
    // setMessages((prev) => [...prev, msg]);
    setValue("");
  };

  if (
    !current_channel ||
    !current_channel.participants.find((p) => p.username === current_user)
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
