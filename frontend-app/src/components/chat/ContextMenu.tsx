import { ChangeStatus, isMuted, Status } from "./Chat";
import { useRef } from "react";
import { Socket } from "socket.io-client";
import { Channel } from "./Chat";
import { checkStatus } from "./Chat";

export const ContextMenuEl = (
  contextMenu: boolean,
  contextMenuSender: string,
  setContextMenu: any,
  contextMenuPos: any,
  socket: Socket,
  channel: Channel,
  current_user: string
) => {
  const menuRef = useRef<HTMLDivElement>(null);
  if (!contextMenu) {
    return <div></div>;
  }
  var options = (
    <ul>
      <li
        onClick={() => {
          console.log("Blocked " + contextMenuSender);
          setContextMenu(false);
        }}
      >
        Block
      </li>
      {checkStatus(channel, current_user) !== Status.Operator &&
      checkStatus(channel, contextMenuSender) !== Status.Owner ? (
        <div>
          <li
            onClick={() => {
              ChangeStatus(
                "mute",
                socket,
                channel.name,
                current_user,
                contextMenuSender,
                1
              );
              setContextMenu(false);
            }}
          >
            {isMuted(channel, contextMenuSender) ? "Unmute" : "Mute (1 min)"}
          </li>
          <li
            onClick={() => {
              console.log("Kicked " + contextMenuSender);
              ChangeStatus(
                "kick",
                socket,
                channel.name,
                current_user,
                contextMenuSender
              );
              setContextMenu(false);
            }}
          >
            Kick
          </li>
          <li
            onClick={() => {
              console.log("Banned " + contextMenuSender);
              ChangeStatus(
                "ban",
                socket,
                channel.name,
                current_user,
                contextMenuSender
              );
              setContextMenu(false);
            }}
          >
            Ban
          </li>
        </div>
      ) : (
        <div></div>
      )}
      {checkStatus(channel, current_user) === Status.Owner ? ( // TODO: check if admin and switch button
        <div>
          <li
            onClick={() => {
              console.log("Made operator " + contextMenuSender);
              ChangeStatus(
                "operator",
                socket,
                channel.name,
                current_user,
                contextMenuSender
              );
              setContextMenu(false);
            }}
          >
            {checkStatus(channel, contextMenuSender) === Status.Operator
              ? "Remove from admins"
              : "Make admin"}
          </li>
        </div>
      ) : (
        <div></div>
      )}
    </ul>
  );

  return (
    <div
      ref={menuRef}
      className="contextMenu"
      style={{
        top: contextMenuPos.y - 10,
        left: contextMenuPos.x + 15,
      }}
    >
      <p>{contextMenuSender}</p>
      {options}
      <button onClick={() => setContextMenu(false)}>✕</button>
    </div>
  );
};

export default ContextMenuEl;
