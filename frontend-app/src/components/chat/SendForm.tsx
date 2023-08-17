import { Dispatch, SetStateAction, useState } from "react";
import { Socket } from "socket.io-client";
import { getUsername } from "../../cookies";
import { Message, Channel, isMuted } from "./Chat";

export const SendForm = (
  current_channel: Channel,
  cookies: any,
  setUsername: Dispatch<SetStateAction<string>>,
  socket: Socket,
  current_user: string
) => {
  const [value, setValue] = useState("");

  const handleSendMessage = (e: any) => {
    e.preventDefault();
    if (
      !current_channel ||
      value === "" ||
      current_channel.name === "" ||
      !getUsername(cookies) ||
      !current_channel.participants.some((p) => p.username === current_user) ||
      isMuted(current_channel, current_user)
    ) {
      console.log(
        "Message is empty or channel is not defined or not logged in. Or not in the channel"
      );
      return;
    }
    setUsername(getUsername(cookies));
    var msg: Message = {
      msg: value,
      datestamp: new Date(),
      sender: getUsername(cookies),
      channel: current_channel.name,
      read: true,
      system: false,
      invite: false,
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
