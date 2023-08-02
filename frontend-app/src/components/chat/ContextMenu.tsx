import { ChangeStatus, isMuted, Status } from "./Chat";
import { useRef } from "react";
import { Socket } from "socket.io-client";
import { Channel } from "./Chat";
import { checkStatus } from "./Chat";

export const ContextMenuEl = (
  contextMenu: boolean,
  target_user: string,
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
  // TODO: refact li
  var options = (
    <ul>
      <li
        onClick={() => {
          console.log("Blocked " + target_user);
          setContextMenu(false);
        }}
      >
        Block
      </li>
      <li
        onClick={() => {
          console.log("DM " + target_user);
          ChangeStatus("dm", socket, "", current_user, target_user);
          setContextMenu(false);
        }}
      >
        DM
      </li>
      {checkStatus(channel, current_user) !== Status.Operator && // TODO: double check logic
      checkStatus(channel, target_user) !== Status.Owner ? (
        <div>
          <li
            onClick={() => {
              ChangeStatus(
                "mute",
                socket,
                channel.name,
                current_user,
                target_user,
                1
              );
              setContextMenu(false);
            }}
          >
            {isMuted(channel, target_user) ? "Unmute" : "Mute (1 min)"}
          </li>
          <li
            onClick={() => {
              console.log("Kicked " + target_user);
              ChangeStatus(
                "kick",
                socket,
                channel.name,
                current_user,
                target_user
              );
              setContextMenu(false);
            }}
          >
            Kick
          </li>
          <li
            onClick={() => {
              console.log("Banned " + target_user);
              ChangeStatus(
                "ban",
                socket,
                channel.name,
                current_user,
                target_user
              );
              setContextMenu(false);
            }}
          >
            Ban
          </li>
          <li
            onClick={() => {
              console.log("Invited " + target_user);
              var channel_name = prompt(
                "Which channel do you want to send an invitation for ?"
              );
              ChangeStatus(
                "invite",
                socket,
                channel_name,
                current_user,
                target_user
              );
              setContextMenu(false);
            }}
          >
            Invite
          </li>
        </div>
      ) : (
        <div></div>
      )}
      {checkStatus(channel, current_user) === Status.Owner ? ( // TODO: check if admin and switch button
        <div>
          <li
            onClick={() => {
              console.log("Made operator " + target_user);
              ChangeStatus(
                "operator",
                socket,
                channel.name,
                current_user,
                target_user
              );
              setContextMenu(false);
            }}
          >
            {checkStatus(channel, target_user) === Status.Operator
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
      <p>{target_user}</p>
      {options}
      <button onClick={() => setContextMenu(false)}>✕</button>
    </div>
  );
};

export default ContextMenuEl;
