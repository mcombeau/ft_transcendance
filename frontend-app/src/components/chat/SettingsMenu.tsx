import { Message, Status, Channel } from "./Chat";
import { Socket } from "socket.io-client";
import { ChangeEvent, Dispatch, SetStateAction, useState } from "react";
import { ListParticipants } from "./ListParticipants";
import { NavigateFunction } from "react-router-dom";

// TODO: refacto
export const SettingsMenu = (
  settings: boolean,
  setSettings: Dispatch<SetStateAction<boolean>>,
  status: Status,
  current_channel: Channel,
  setCurrentChannel: Dispatch<SetStateAction<string>>,
  socket: Socket,
  navigate: NavigateFunction
) => {
  const [newParticipant, setNewParticipant] = useState("");

  const addNewParticipant = (e) => {
    e.preventDefault();
    console.log(newParticipant);
    setNewParticipant("");
  };

  if (settings) {
    var leave_button = (
      <button
        onClick={() => {
          // TODO: change
          console.log("Leaving " + current_channel.name);
          setSettings(false);
          setCurrentChannel("");
        }}
      >
        Leave channel
      </button>
    );
    if (status != Status.Normal) {
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
      var add_participant = (
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
        <h3>Settings for {current_channel.name}</h3>
        {leave_button}
        <h3>Channel members</h3>
        {ListParticipants(current_channel, navigate, status)}
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
