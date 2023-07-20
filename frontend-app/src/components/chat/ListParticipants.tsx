import { NavigateFunction } from "react-router-dom";
import { Message, Status } from "./Chat";

export const ListParticipants = (
  channel_name: string,
  messages: Message[],
  navigate: NavigateFunction,
  status: Status
) => {
  var participants = messages
    .filter((message: Message) => {
      return message.channel == channel_name;
    })
    .map((message: Message) => {
      return message.sender;
    })
    .filter((value, index, self) => self.indexOf(value) === index); // TODO: change
  console.log(participants);
  return (
    <ul className="participant_list">
      {participants.map((participant) => {
        return (
          <div>
            <li
              onClick={() => {
                navigate("/user/" + participant);
              }}
            >
              {participant}
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
          </div>
        );
      })}
    </ul>
  );
};
