import { Dispatch, SetStateAction, useState } from "react";
import { Socket } from "socket.io-client";
import { Message, Channel } from "./Chat";

export const SendForm = (
  current_channel: Channel,
  cookies: any,
  setMessages: Dispatch<SetStateAction<Message[]>>,
  setUsername: Dispatch<SetStateAction<string>>,
  socket: Socket
) => {
  const [value, setValue] = useState("");

  const handleSendMessage = (e: any) => {
    e.preventDefault();
    if (value == "" || current_channel.name == "" || !cookies["Username"]) {
      console.log(
        "Message is empty or channel is not defined or not logged in"
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
    setMessages((prev) => [...prev, msg]);
    setValue("");
  };

  if (!current_channel) {
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
