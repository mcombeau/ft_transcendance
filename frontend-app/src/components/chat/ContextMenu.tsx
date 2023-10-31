import { Status, ChatRoom } from "./types";
import { ChangeStatus } from "./Chat";
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { checkStatus } from "./Chat";
import { ReceivedInfo } from "./types";

export const ContextMenuEl = (
  contextMenu: boolean,
  target: { id: number; username: string },
  setContextMenu: Dispatch<SetStateAction<boolean>>,
  contextMenuPos: { x: number; y: number },
  socket: Socket,
  channel: ChatRoom,
  cookies: any,
  myChats: ChatRoom[],
  authenticatedUserID: number
) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [invitesMenu, setInvitesMenu] = useState(false);

  function inviteToChat(e: any) {
    var targetChatID = parseInt(
      (e.target as HTMLInputElement).getAttribute("value")
    );
    var info: ReceivedInfo = {
      token: cookies["token"],
      chatRoomID: targetChatID,
      targetID: target.id,
    };
    ChangeStatus(info, "invite", socket);
    setContextMenu(false);
    setInvitesMenu(false);
  }

  function displayChatInviteButton(chat: ChatRoom) {
    return (
      <li value={chat.chatRoomID} onClick={(e) => inviteToChat(e)}>
        {chat.name}
      </li>
    );
  }

  if (!contextMenu) {
    return <div></div>;
  }
  // TODO: refact li

  if (!invitesMenu) {
    var options = (
      <ul>
        <li
          onClick={() => {
            console.log("Blocked " + target.username);
            setContextMenu(false);
          }}
        >
          Block
        </li>
        <li
          onClick={() => {
            console.log("Invited " + target.username);
            setInvitesMenu(true);
          }}
        >
          Invite
        </li>
        <li
          onClick={() => {
            console.log("DM " + target.username);
            var info: ReceivedInfo = {
              token: cookies["token"],
              chatRoomID: channel.chatRoomID,
              targetID: target.id,
            };
            ChangeStatus(info, "dm", socket);
            setContextMenu(false);
          }}
        >
          DM
        </li>
        {checkStatus(channel, authenticatedUserID) !== Status.Operator && // TODO: double check logic
        checkStatus(channel, target.id) !== Status.Owner ? (
          <div>
            <li
              onClick={() => {
                var info: ReceivedInfo = {
                  token: cookies["token"],
                  chatRoomID: channel.chatRoomID,
                  targetID: target.id,
                  participantInfo: {
                    mutedUntil: 1,
                  },
                };
                ChangeStatus(info, "mute", socket);
                setContextMenu(false);
              }}
            >
              {"Mute (1 min)"}
            </li>
            <li
              onClick={() => {
                console.log("Kicked " + target.username);
                var info: ReceivedInfo = {
                  token: cookies["token"],
                  chatRoomID: channel.chatRoomID,
                  targetID: target.id,
                };
                ChangeStatus(info, "kick", socket);
                setContextMenu(false);
              }}
            >
              Kick
            </li>
            <li
              onClick={() => {
                console.log("Banned " + target.username);
                var info: ReceivedInfo = {
                  token: cookies["token"],
                  chatRoomID: channel.chatRoomID,
                  targetID: target.id,
                };
                ChangeStatus(info, "ban", socket);
                setContextMenu(false);
              }}
            >
              Ban
            </li>
          </div>
        ) : (
          <div></div>
        )}
        {checkStatus(channel, authenticatedUserID) === Status.Owner ? ( // TODO: check if admin and switch button
          <div>
            <li
              onClick={() => {
                console.log("Made operator " + target.username);
                var info: ReceivedInfo = {
                  token: cookies["token"],
                  chatRoomID: channel.chatRoomID,
                  targetID: target.id,
                };
                ChangeStatus(info, "operator", socket);
                setContextMenu(false);
              }}
            >
              {checkStatus(channel, target.id) === Status.Operator
                ? "Remove from admins"
                : "Make admin"}
            </li>
          </div>
        ) : (
          <div></div>
        )}
      </ul>
    );
  } else {
    // List chat you can join
    var options = (
      <ul>
        {myChats.filter((chat) => !chat.isDM).map(displayChatInviteButton)}
      </ul>
    );
  }

  return (
    <div
      ref={menuRef}
      className="contextMenu"
      style={{
        top: contextMenuPos.y - 10,
        left: contextMenuPos.x + 15,
      }}
    >
      <p>{target.username}</p>
      {options}
      <button onClick={() => setContextMenu(false)}>✕</button>
    </div>
  );
};

export default ContextMenuEl;
