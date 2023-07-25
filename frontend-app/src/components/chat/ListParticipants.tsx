import { NavigateFunction } from "react-router-dom";
import { Socket } from "socket.io-client";
import { ChangeStatus, Channel, Status, User } from "./Chat";
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
    if (participant.muted) {
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
                <button
                  onClick={() => {
                    console.log("Muted");
                    ChangeStatus(
                      "mute",
                      socket,
                      channel.name,
                      current_user,
                      participant.username
                    );
                  }}
                >
                  {participant.muted ? "Unmute" : "Mute"}
                </button>
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
            {checkStatus(channel, current_user) == Status.Owner &&
            checkStatus(channel, participant.username) != Status.Owner &&
            current_user != participant.username ? ( // TODO: check if admin
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
    </ul>
  );
};
