import { Status } from "./Chat";
import { useRef } from "react";
import { Socket } from "socket.io-client";

export const ContextMenuEl = (
  contextMenu: boolean,
  contextMenuSender: string,
  status: Status,
  setContextMenu: any,
  contextMenuPos: any,
  socket: Socket,
  channel_name: string,
  current_user: string
) => {
  const menuRef = useRef<HTMLDivElement>(null);
  var options = (
    <ul>
      <li
        onClick={() => {
          console.log("Blocked " + contextMenuSender);
        }}
      >
        Block
      </li>
      {status != Status.Normal ? (
        <div>
          <li
            onClick={() => {
              socket.emit("mute", {
                channel_name: channel_name,
                current_user: current_user,
                target_user: contextMenuSender,
              });
            }}
          >
            Mute
          </li>
          <li
            onClick={() => {
              console.log("Kicked " + contextMenuSender);
              socket.emit("kick", {
                channel_name: channel_name,
                current_user: current_user,
                target_user: contextMenuSender,
              });
            }}
          >
            Kick
          </li>
          <li
            onClick={() => {
              console.log("Banned " + contextMenuSender);
              socket.emit("ban", {
                channel_name: channel_name,
                current_user: current_user,
                target_user: contextMenuSender,
              });
            }}
          >
            Ban
          </li>
        </div>
      ) : (
        <div></div>
      )}
      {status == Status.Owner ? ( // TODO: check if admin and switch button
        <div>
          <li
            onClick={() => {
              console.log("Made operator " + contextMenuSender);
              socket.emit("operator", {
                channel_name: channel_name,
                current_user: current_user,
                target_user: contextMenuSender,
              });
            }}
          >
            Make admin
          </li>
          <li
            onClick={() => {
              console.log("Removed admin " + contextMenuSender);
            }}
          >
            Remove admin
          </li>
        </div>
      ) : (
        <div></div>
      )}
    </ul>
  );
  if (!contextMenu) {
    return <div></div>;
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
      <p>{contextMenuSender}</p>
      {options}
      <button onClick={() => setContextMenu(false)}>✕</button>
    </div>
  );
};

export default ContextMenuEl;
