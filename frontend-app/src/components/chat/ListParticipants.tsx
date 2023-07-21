import { NavigateFunction } from "react-router-dom";
import { Channel, Status } from "./Chat";

export const ListParticipants = (
  channel: Channel,
  navigate: NavigateFunction,
  status: Status
) => {
  return (
    <ul className="participant_list">
      {channel.participants.map((participant) => {
        return (
          <div>
            <li
              onClick={() => {
                navigate("/user/" + participant);
              }}
            >
              {participant.username}
            </li>
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
