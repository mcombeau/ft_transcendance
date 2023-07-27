import { Dispatch, SetStateAction, useState } from "react";
import { NavigateFunction } from "react-router-dom";
import { Socket } from "socket.io-client";
import { ChangeStatus, Channel, isUserMuted, Status, User } from "./Chat";
import { checkStatus } from "./Chat";

export const ListParticipants = (
  channel: Channel,
  navigate: NavigateFunction,
  current_user: string,
  socket: Socket
) => {
  function displayUser(participant: User) {
    var name = participant.username;
    var style = {};
    if (participant.owner) {
      style = { textDecoration: "underline" };
    } else if (participant.operator) {
      name += " ★";
    }
    if (isUserMuted(participant)) {
      name += " 🔇";
      style = { fontStyle: "italic" };
    }
    return (
      <li
        onClick={() => {
          navigate("/user/" + participant);
        }}
        style={style}
      >
        {name}
        <div>{participant.muted}</div>
      </li>
    );
  }
  return (
    <ul className="participant_list">
      {channel.participants.map((participant) => {
        return (
          <div>
            {displayUser(participant)}
            {checkStatus(channel, current_user) != Status.Normal &&
            checkStatus(channel, participant.username) != Status.Owner &&
            current_user != participant.username ? (
              <div>
                {isUserMuted(participant) ? (
                  <button
                    onClick={() => {
                      console.log("Muted");
                      ChangeStatus(
                        "mute",
                        socket,
                        channel.name,
                        current_user,
                        participant.username,
                        0
                      );
                    }}
                  >
                    Unmute
                  </button>
                ) : (
                  <div>
                    <select id={"mute " + participant.username}>
                      <option value="1">1 minute</option>
                      <option value="5">5 minute</option>
                      <option value="60">1 hour</option>
                      <option value="1440">1 day</option>
                    </select>
                    <button
                      onClick={() => {
                        var muteTime = document.getElementById(
                          "mute " + participant.username
                        )["value"];
                        muteTime = parseInt(muteTime);
                        console.log("Muted for ", muteTime);
                        ChangeStatus(
                          "mute",
                          socket,
                          channel.name,
                          current_user,
                          participant.username,
                          muteTime
                        );
                      }}
                    >
                      Mute
                    </button>
                  </div>
                )}
                <button
                  onClick={() => {
                    console.log("Kicked");
                    ChangeStatus(
                      "kick",
                      socket,
                      channel.name,
                      current_user,
                      participant.username
                    );
                  }}
                >
                  Kick
                </button>
                <button
                  onClick={() => {
                    console.log("Banned " + participant);
                    ChangeStatus(
                      "ban",
                      socket,
                      channel.name,
                      current_user,
                      participant.username
                    );
                  }}
                >
                  Ban
                </button>
              </div>
            ) : (
              <div></div>
            )}
            {checkStatus(channel, current_user) === Status.Owner &&
            checkStatus(channel, participant.username) !== Status.Owner &&
            current_user !== participant.username ? (
              <div>
                <button
                  onClick={() => {
                    console.log("Made admin " + participant);
                    ChangeStatus(
                      "operator",
                      socket,
                      channel.name,
                      current_user,
                      participant.username
                    );
                  }}
                >
                  {checkStatus(channel, participant.username) == Status.Operator
                    ? "Remove from admins"
                    : "Make admin"}
                </button>
              </div>
            ) : (
              <div></div>
            )}
          </div>
        );
      })}
      <h2>Banned</h2>
      {channel.banned.map((participant) => {
        return (
          <div>
            <li>{participant.username}</li>
            {checkStatus(channel, current_user) !== Status.Normal ? (
              <button
                onClick={() => {
                  console.log("unban " + participant.username);
                  ChangeStatus(
                    "ban",
                    socket,
                    channel.name,
                    current_user,
                    participant.username
                  );
                }}
              >
                Unban
              </button>
            ) : (
              ""
            )}
          </div>
        );
      })}
    </ul>
  );
};
