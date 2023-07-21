import { Dispatch, SetStateAction } from "react";
import { Socket } from "socket.io-client";
import { Channel, Message } from "./Chat";

export const SidePannel = (
  newchannel: string,
  setNewchannel: Dispatch<SetStateAction<string>>,
  current_channel: string,
  setCurrentChannel: Dispatch<SetStateAction<string>>,
  socket: Socket,
  messages: Message[],
  setMessages: Dispatch<SetStateAction<Message[]>>,
  settings: boolean,
  setSettings: Dispatch<SetStateAction<boolean>>,
  setContextMenu: Dispatch<SetStateAction<boolean>>,
  channels: Channel[]
) => {
  const createChannel = (e: any) => {
    e.preventDefault();
    // Create new channel
    if (newchannel == "") return;
    socket.emit("add chat", { name: newchannel, password: "pass" });
  };

  const channelInfo = (channel: Channel) => {
    var isCurrent = channel.name == current_channel;
    var unreadMessages: number = messages
      .filter((msg) => {
        return msg.channel == channel.name;
      })
      .filter((msg) => {
        return msg.read == false;
      }).length;
    return (
      <div id="channel-info">
        <li
          value={channel.name}
          onClick={(e) => {
            console.log("here");
            var target = (e.target as HTMLInputElement).getAttribute("value");
            setCurrentChannel(target);
            setMessages(
              messages.map((msg) => {
                if (msg.channel == target) {
                  return { ...msg, read: true };
                } else {
                  return { ...msg };
                }
              })
            );
          }}
          className={isCurrent ? "chanCurrent" : "channotCurrent"}
        >
          {unreadMessages > 0 && <p>{unreadMessages}</p>}
          {channel.name}
          <button
            value={channel.name}
            onClick={(e) => {
              setCurrentChannel(
                (e.target as HTMLInputElement).getAttribute("value")
              );
              setSettings(!settings);
              setContextMenu(false);
            }}
          >
            ⚙
          </button>
        </li>
      </div>
    );
  };
  return (
    <div className="sidebar">
      <form className="newchan" onSubmit={createChannel}>
        <input
          type="text"
          value={newchannel}
          onChange={(e) => {
            setNewchannel(e.target.value);
          }}
        />
        <button>+</button>
      </form>
      <div id="channels">
        {channels.map((channel: Channel) => channelInfo(channel))}
      </div>
    </div>
  );
};

export default SidePannel;
