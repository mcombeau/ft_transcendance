import { ChatRoom, ReceivedInfo, Status, User } from "./types";
import { NavigateFunction } from "react-router-dom";
import { Socket } from "socket.io-client";
import { ChangeStatus, isUserMuted } from "./Chat";
import { checkStatus } from "./Chat";

export const ListParticipants = (
  channel: ChatRoom,
  navigate: NavigateFunction,
  socket: Socket,
  cookies: any,
  authenticatedUserID: number
) => {
  function displayUser(participant: User) {
    var name = participant.username;
    var style = {};
    if (participant.isOwner) {
      style = { textDecoration: "underline" };
    } else if (participant.isOperator) {
      name += " ★";
    }
    if (isUserMuted(participant)) {
      name += " 🔇";
      style = { fontStyle: "italic" };
    }
    return (
      <li
        onClick={() => {
          navigate("/user/" + participant.userID);
        }}
        style={style}
      >
        {name}
      </li>
    );
  }
  return (
    <ul className="participant_list">
      {channel.participants.map((participant: User) => {
        return (
          <div>
            {displayUser(participant)}
            {checkStatus(channel, authenticatedUserID) !== Status.Normal &&
            checkStatus(channel, participant.userID) !== Status.Owner &&
            authenticatedUserID !== participant.userID ? (
              <div>
                {isUserMuted(participant) ? (
                  <button
                    onClick={() => {
                      console.log("Muted");
                      var info: ReceivedInfo = {
                        token: cookies["token"],
                        chatRoomID: channel.chatRoomID,
                        targetID: participant.userID,
                        participantInfo: {
                          mutedUntil: 0,
                        },
                      };
                      ChangeStatus(info, "mute", socket);
                    }}
                  >
                    Unmute
                  </button>
                ) : (
                  <div>
                    <select id={"mute " + participant.username}>
                      <option value="1">1 minute</option>
                      <option value="5">5 minutes</option>
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
                        var info: ReceivedInfo = {
                          token: cookies["token"],
                          chatRoomID: channel.chatRoomID,
                          targetID: participant.userID,
                          participantInfo: {
                            mutedUntil: muteTime,
                          },
                        };
                        ChangeStatus(info, "mute", socket);
                      }}
                    >
                      Mute
                    </button>
                  </div>
                )}
                <button
                  onClick={() => {
                    console.log("Kicked");
                    var info: ReceivedInfo = {
                      token: cookies["token"],
                      chatRoomID: channel.chatRoomID,
                      targetID: participant.userID,
                    };
                    ChangeStatus(info, "kick", socket);
                  }}
                >
                  Kick
                </button>
                <button
                  onClick={() => {
                    console.log("Banned " + participant);
                    var info: ReceivedInfo = {
                      token: cookies["token"],
                      chatRoomID: channel.chatRoomID,
                      targetID: participant.userID,
                    };
                    ChangeStatus(info, "ban", socket);
                  }}
                >
                  Ban
                </button>
              </div>
            ) : (
              <div></div>
            )}
            {checkStatus(channel, authenticatedUserID) === Status.Owner &&
            checkStatus(channel, participant.userID) !== Status.Owner &&
            authenticatedUserID !== participant.userID ? (
              <div>
                <button
                  onClick={() => {
                    console.log("Made operator " + participant);
                    var info: ReceivedInfo = {
                      token: cookies["token"],
                      chatRoomID: channel.chatRoomID,
                      targetID: participant.userID,
                    };
                    ChangeStatus(info, "operator", socket);
                  }}
                >
                  {checkStatus(channel, participant.userID) == Status.Operator
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
            {checkStatus(channel, authenticatedUserID) !== Status.Normal ? (
              <button
                onClick={() => {
                  console.log("unban " + participant.username);
                  var info: ReceivedInfo = {
                    token: cookies["token"],
                    chatRoomID: channel.chatRoomID,
                    targetID: participant.userID,
                  };
                  ChangeStatus(info, "ban", socket);
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
      <h2>Invited</h2>
      {channel.invited.map((participant) => {
        return (
          <div>
            <li>{participant.username}</li>
          </div>
        );
      })}
    </ul>
  );
};
