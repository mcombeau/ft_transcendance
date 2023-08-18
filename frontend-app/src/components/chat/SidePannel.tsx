import { Dispatch, SetStateAction } from "react";
import { Socket } from "socket.io-client";
import { Channel, Invite, Message } from "./Chat";

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
  channels: Channel[],
  username: string,
  invitesPannel: boolean,
  setInvitesPannel: Dispatch<SetStateAction<boolean>>,
  cookies: any
) => {
  const createChannel = (e: any) => {
    e.preventDefault();
    // Create new channel
    if (newchannel == "") return;
    console.log("Emit new chan");
    socket.emit("add chat", {
      // TODO : investigate duplicate chats
      name: newchannel,
      password: "pass",
      private: false,
      owner: username,
      token: cookies["token"],
    });
  };

  function getDMChannelAlias(channel: Channel, current_user: string) {
    return channel.participants.find((p) => p.username != current_user)
      .username;
  }

  const invitePannel = () => {
    var classname = "channotCurrent";
    if (invitesPannel) {
      classname = "chanCurrent";
    }
    return (
      <div id="channel-info">
        <li
          value={"INVITES"}
          onClick={(e) => {
            setCurrentChannel("");
            setInvitesPannel(true);
          }}
          className={classname}
        >
          INVITES
        </li>
      </div>
    );
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
    var channel_alias = channel.dm
      ? `💬 ${getDMChannelAlias(channel, username)}`
      : channel.name;
    var classname = "channotCurrent";
    if (isCurrent) {
      classname = "chanCurrent";
    }
    if (channel.dm) {
      console.log(channel.name, " is a dm");
      classname += " dm";
    }
    return (
      <div id="channel-info">
        <li
          value={channel.name}
          onClick={(e) => {
            var target = (e.target as HTMLInputElement).getAttribute("value");
            setCurrentChannel(target);
            setInvitesPannel(false);
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
          className={classname}
        >
          {unreadMessages > 0 && <p>{unreadMessages}</p>}
          {channel_alias}
          <button
            value={channel.name}
            onClick={(e) => {
              setCurrentChannel(
                (e.target as HTMLInputElement).getAttribute("value")
              );
              setInvitesPannel(false);
              setSettings(!settings);
              setContextMenu(false);
            }}
          >
            ⚙
          </button>
          <button
            className="joinchan"
            value={channel.name}
            onClick={(e) => {
              socket.emit("join chat", {
                username: username,
                channel_name: (e.target as HTMLInputElement).getAttribute(
                  "value"
                ),
                token: cookies["token"],
              });
            }}
          >
            Join
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
        {invitePannel()}
        {channels.map((channel: Channel) => channelInfo(channel))}
      </div>
    </div>
  );
};

export default SidePannel;
