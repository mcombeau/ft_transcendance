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
  current_user: string
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
          // TODO: change
          console.log("Leaving " + current_channel.name);
          socket.emit("leave chat", {
            channel_name: current_channel.name,
            username: current_user,
          });
          setSettings(false);
          setCurrentChannel("");
        }}
      >
        Leave channel
      </button>
    );
    if (checkStatus(current_channel, current_user) == Status.Owner) {
      // TODO: change that
      leave_button = (
        <button
          onClick={() => {
            socket.emit("delete chat", current_channel.name);
            console.log("Deleting " + current_channel.name);
          }}
        >
          Delete channel
        </button>
      );
      var add_participant = // TODO : integrate later ? or scrap ?
        (
          <form id="add_participant" onSubmit={addNewParticipant}>
            <input
              type="text"
              value={newParticipant}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                e.preventDefault();
                setNewParticipant(e.target.value);
              }}
            ></input>
            <button>Add</button>
          </form>
        );
    }
    return (
      <div className="settings">
        <h3>
          Settings for {current_channel.name} (
          {current_channel.private ? "private" : "public"})
        </h3>
        {leave_button}
        <h3>Channel members</h3>
        {ListParticipants(current_channel, navigate, current_user, socket)}
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
