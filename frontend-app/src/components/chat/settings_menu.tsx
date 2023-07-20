import { Message, Status } from "./chat";
import { Socket } from "socket.io-client";
import { Dispatch, SetStateAction } from "react";
import { ListParticipants } from "./ListParticipants";
import { NavigateFunction } from "react-router-dom";

export const SettingsMenu = (
  settings: boolean,
  setSettings: Dispatch<SetStateAction<boolean>>,
  status: Status,
  current_channel: string,
  setCurrentChannel: Dispatch<SetStateAction<string>>,
  socket: Socket,
  messages: Message[],
  navigate: NavigateFunction
) => {
  if (settings) {
    if (status != Status.Normal) {
      // TODO: change that
      return (
        <div className="settings">
          <h3>Admin panel for {current_channel}</h3>
          <button
            onClick={() => {
              socket.emit("delete chat", current_channel);
              console.log("Deleting " + current_channel);
            }}
          >
            Delete channel
          </button>
          <h3>Channel members</h3>
          {ListParticipants(current_channel, messages, navigate, status)}
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
    return (
      <div className="settings">
        <h3>Settings for {current_channel}</h3>
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
        {ListParticipants(current_channel, messages, navigate, status)}
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
