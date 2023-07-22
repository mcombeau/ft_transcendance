import { NavigateFunction } from "react-router-dom";
import { Channel, Status, User } from "./Chat";

export const ListParticipants = (
  channel: Channel,
  navigate: NavigateFunction,
  status: Status
) => {
  function displayUser(participant: User) {
    var name = participant.username;
    var style = {};
    if (participant.owner) {
      name += " ⍟";
      style = { textDecoration: "underline" };
    } else if (participant.operator) {
      name += " ★";
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
            {status != Status.Normal ? (
              <div>
                <button
                  onClick={() => {
                    console.log("Muted " + participant);
                  }}
                >
                  Mute
                </button>
                <button
                  onClick={() => {
                    console.log("Kicked " + participant);
                  }}
                >
                  Kick
                </button>
                <button
                  onClick={() => {
                    console.log("Banned " + participant);
                  }}
                >
                  Ban
                </button>
              </div>
            ) : (
              <div></div>
            )}
            {status == Status.Owner ? ( // TODO: check if admin
              <div>
                <button
                  onClick={() => {
                    console.log("Made admin " + participant);
                  }}
                >
                  Make admin
                </button>
                <button
                  onClick={() => {
                    console.log("Removed from admins " + participant);
                  }}
                >
                  Remove admin
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
