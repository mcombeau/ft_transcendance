import { Status, Channel, checkStatus } from "./Chat";
import { Socket } from "socket.io-client";
import { ChangeEvent, Dispatch, SetStateAction, useState } from "react";
import { ListParticipants } from "./ListParticipants";
import { NavigateFunction } from "react-router-dom";

export const SettingsMenu = (
  settings: boolean,
  setSettings: Dispatch<SetStateAction<boolean>>,
  current_channel: Channel,
  setCurrentChannel: Dispatch<SetStateAction<string>>,
  socket: Socket,
  navigate: NavigateFunction,
  current_user: string,
  cookies: any
) => {
  const [newParticipant, setNewParticipant] = useState("");

  const addNewParticipant = (e: any) => {
    e.preventDefault();
    console.log(newParticipant);
    setNewParticipant("");
  };
  if (
    !settings ||
    !current_channel ||
    !current_channel.participants.find((p) => p.username === current_user)
  ) {
    return;
  }

  if (settings && current_channel) {
    var leave_button = (
      <button
        onClick={() => {
          console.log("Leaving " + current_channel.name);
          socket.emit("leave chat", {
            channel_name: current_channel.name,
            username: current_user,
            token: cookies["token"],
          });
          setSettings(false);
          setCurrentChannel("");
        }}
      >
        Leave channel
      </button>
    );
    if (checkStatus(current_channel, current_user) == Status.Owner) {
      leave_button = (
        <button
          onClick={() => {
            socket.emit("delete chat", {
              channel_name: current_channel.name,
              token: cookies["token"],
            });
            console.log("Deleting " + current_channel.name);
          }}
        >
          Delete channel
        </button>
      );
      var private_public = (
        <div>
          <label className="switch">
            <input
              type="checkbox"
              checked={current_channel.private}
              onChange={() => {
                socket.emit("toggle private", {
                  channel_name: current_channel.name,
                  sender: current_user,
                  token: cookies["token"],
                });
              }}
            />
            <span className="slider round"></span>
          </label>
          <p className="private switch">Set channel as private</p>
        </div>
      );
    }
    return (
      <div className="settings">
        <h3>
          Settings for {current_channel.name} (
          {current_channel.private ? "private" : "public"})
        </h3>
        {leave_button} <br></br>
        {private_public}
        <h3>Channel members</h3>
        {ListParticipants(
          current_channel,
          navigate,
          current_user,
          socket,
          cookies
        )}
        <button
          className="closesettings"
          onClick={() => {
            setSettings(false);
          }}
        >
          ✕
        </button>
      </div>
    );
  }
};

export default SettingsMenu;
