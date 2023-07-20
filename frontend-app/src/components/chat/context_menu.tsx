import { Status } from "./chat";
import { useRef } from "react";

export const ContextMenuEl = (
  contextMenuSender: string,
  status: Status,
  setContextMenu: any,
  contextMenuPos: any
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
              console.log("Muted " + contextMenuSender);
            }}
          >
            Mute
          </li>
          <li
            onClick={() => {
              console.log("Kicked " + contextMenuSender);
            }}
          >
            Kick
          </li>
          <li
            onClick={() => {
              console.log("Banned " + contextMenuSender);
            }}
          >
            Ban
          </li>
        </div>
      ) : (
        <div></div>
      )}
      {status == Status.Owner ? (
        <div>
          <li
            onClick={() => {
              console.log("Banned " + contextMenuSender);
            }}
          >
            Make admin
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
