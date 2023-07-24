import { Dispatch, SetStateAction, useState } from "react";
import { Socket } from "socket.io-client";
import { Message, Status, Channel } from "./Chat";

export const SendForm = (
  current_channel: Channel,
  setStatus: Dispatch<SetStateAction<Status>>,
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
      <select
        multiple
        onChange={(choice) => {
          if (choice.target.value == "normal") setStatus(Status.Normal);
          if (choice.target.value == "operator") setStatus(Status.Operator);
          if (choice.target.value == "owner") setStatus(Status.Owner);
        }}
      >
        <option value="normal">Normal</option>
        <option value="operator">Operator</option>
        <option value="owner">Owner</option>
      </select>
    </form>
  );
};

export default SendForm;
