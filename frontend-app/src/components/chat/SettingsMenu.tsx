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
    if (status != Status.Normal) {
      // TODO: change that
      return (
        <div className="settings">
          <h3>Admin panel for {current_channel.name}</h3>
          <button
            onClick={() => {
              socket.emit("delete chat", current_channel);
              console.log("Deleting " + current_channel);
            }}
          >
            Delete channel
          </button>
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
        </div>
      );
    }
    return (
      <div className="settings">
        <h3>Settings for {current_channel.name}</h3>
        <button
          onClick={() => {
            // TODO: change
            console.log("Leaving " + current_channel);
            setSettings(false);
            setCurrentChannel("");
          }}
        >
          Leave channel
        </button>
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
