import { Status, ChatRoom, ReceivedInfo } from "./types";
import { checkStatus } from "./Chat";
import { Socket } from "socket.io-client";
import { Dispatch, SetStateAction, useState } from "react";
import { ListParticipants } from "./ListParticipants";
import { NavigateFunction } from "react-router-dom";
import { getUserID } from "../../cookies";

export const SettingsMenu = (
  settings: boolean,
  setSettings: Dispatch<SetStateAction<boolean>>,
  currentChatRoom: ChatRoom,
  setCurrentChatRoomID: Dispatch<SetStateAction<number>>,
  socket: Socket,
  navigate: NavigateFunction,
  cookies: any
) => {
  const [newPassword, setNewPassword] = useState("");

  function removePassword() {
    console.log("Removing password");
    var info: ReceivedInfo = {
      token: cookies["token"],
      chatRoomID: currentChatRoom.chatRoomID,
      chatInfo: {
        password: "",
      },
    };
    socket.emit("set password", info);
  }

  function submitNewPassword(e: any) {
    console.log("Setting new password");
    e.preventDefault();
    var info: ReceivedInfo = {
      token: cookies["token"],
      chatRoomID: currentChatRoom.chatRoomID,
      chatInfo: {
        password: newPassword,
      },
    };
    socket.emit("set password", info);
    setNewPassword("");
  }

  if (settings && currentChatRoom) {
    var leave_button = (
      <button
        onClick={() => {
          console.log("Leaving " + currentChatRoom.name);
          var info: ReceivedInfo = {
            token: cookies["token"],
            chatRoomID: currentChatRoom.chatRoomID,
          };
          socket.emit("leave chat", info);
          setSettings(false);
          setCurrentChatRoomID(null);
        }}
      >
        Leave channel
      </button>
    );
    var password_form = <div></div>;
    if (currentChatRoom.isDM) {
      var leave_button = <br></br>;
    }
    // if (settings && currentChatRoom && currentChatRoom.isDM)
    //   var leave_button = <br></br>;
    if (checkStatus(currentChatRoom, getUserID(cookies)) == Status.Owner) {
      leave_button = (
        <button
          onClick={() => {
            var info: ReceivedInfo = {
              chatRoomID: currentChatRoom.chatRoomID,
              token: cookies["token"],
            };
            socket.emit("delete chat", info);
            console.log("Deleting " + currentChatRoom.name);
          }}
        >
          Delete channel
        </button>
      );
      password_form = (
        <div>
          <form className="set_password" onSubmit={submitNewPassword}>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
              }}
            />
            <button>{currentChatRoom.hasPassword ? "Update" : "Set"}</button>
          </form>
          {currentChatRoom.hasPassword ? (
            <button onClick={removePassword}>Remove password</button>
          ) : (
            <div></div>
          )}
        </div>
      );
      // TODO: fix this button
      var private_public = (
        <div>
          <label className="switch">
            <input
              type="checkbox"
              checked={currentChatRoom.isPrivate}
              onChange={() => {
                var info: ReceivedInfo = {
                  chatRoomID: currentChatRoom.chatRoomID,
                  token: cookies["token"],
                };
                socket.emit("toggle private", info);
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
          Settings for {currentChatRoom.name} (
          {currentChatRoom.isPrivate ? "private" : "public"})
        </h3>
        {leave_button} <br></br>
        {private_public}
        <h3>Password settings</h3>
        {currentChatRoom.hasPassword
          ? "Password protected"
          : "Not password protected"}
        {password_form}
        <h3>Channel members</h3>
        {ListParticipants(currentChatRoom, navigate, socket, cookies)}
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
