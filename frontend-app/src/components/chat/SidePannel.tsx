import { Dispatch, SetStateAction } from "react";
import { Socket } from "socket.io-client";
import { getUserID } from "../../cookies";
import { ReceivedInfo, Message, ChatRoom } from "./types";

export const SidePannel = (
  newchannel: string,
  setNewchannel: Dispatch<SetStateAction<string>>,
  currentChatRoomID: number,
  setCurrentChatRoomID: Dispatch<SetStateAction<number>>,
  socket: Socket,
  messages: Message[],
  setMessages: Dispatch<SetStateAction<Message[]>>,
  settings: boolean,
  setSettings: Dispatch<SetStateAction<boolean>>,
  setContextMenu: Dispatch<SetStateAction<boolean>>,
  channels: ChatRoom[],
  invitesPannel: boolean,
  setInvitesPannel: Dispatch<SetStateAction<boolean>>,
  cookies: any
) => {
  const createChannel = (e: any) => {
    console.log(e); // TODO: maybe change any
    e.preventDefault();
    if (newchannel == "") return;
    console.log("Emit new chan");
    var info: ReceivedInfo = {
      chatInfo: {
        name: newchannel,
        password: "",
        isPrivate: false,
      },
      token: cookies["token"],
    };
    socket.emit("add chat", info);
  };

  function getDMChannelAlias(channel: ChatRoom) {
    return channel.participants.find((p) => p.userID != getUserID(cookies))
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
          onClick={() => {
            setCurrentChatRoomID(null);
            setInvitesPannel(true);
          }}
          className={classname}
        >
          INVITES
        </li>
      </div>
    );
  };

  const channelInfo = (channel: ChatRoom) => {
    var isCurrent = channel.chatRoomID == currentChatRoomID;
    var unreadMessages: number = messages
      .filter((msg: Message) => {
        return msg.chatRoomID == channel.chatRoomID;
      })
      .filter((msg: Message) => {
        return msg.read == false;
      }).length;
    var channel_alias = channel.isDM // TODO: change with actual name (get from back)
      ? `💬 ${getDMChannelAlias(channel)}`
      : channel.name;
    var classname = "channotCurrent";
    if (isCurrent) {
      classname = "chanCurrent";
    }
    if (channel.isDM) {
      console.log(channel.name, " is a dm");
      classname += " dm";
    }
    return (
      <div id="channel-info">
        <li
          value={channel.chatRoomID}
          onClick={(e) => {
            var targetChannel = parseInt(
              (e.target as HTMLInputElement).getAttribute("value")
            );
            setCurrentChatRoomID(targetChannel);
            setInvitesPannel(false);
            setMessages(
              messages.map((msg: Message) => {
                if (msg.chatRoomID === targetChannel) {
                  return { ...msg, read: true };
                } else {
                  return { ...msg };
                }
              })
            );
          }}
          className={classname}
        >
          {/*unreadMessages > 0 && <p>{unreadMessages}</p>*/}
          {channel_alias}
          <button
            value={channel.chatRoomID}
            onClick={(e) => {
              setSettings(!settings);
              setCurrentChatRoomID(
                parseInt((e.target as HTMLInputElement).getAttribute("value"))
              );
              setInvitesPannel(false);
              setContextMenu(false);
            }}
          >
            ⚙
          </button>
          <button
            className="joinchan"
            value={channel.chatRoomID}
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
        {channels.map((channel: ChatRoom) => channelInfo(channel))}
      </div>
    </div>
  );
};

export default SidePannel;
