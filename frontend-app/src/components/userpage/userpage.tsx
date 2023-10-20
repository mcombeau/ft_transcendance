import { useContext, useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useCookies } from "react-cookie";
import { getIs2faEnabled, getUserID } from "../../cookies";
import { WebSocketContext } from "../../contexts/WebsocketContext";

type User = {
  username: string;
  email: string;
};

function UserPage() {
  const [userExists, setUserExists] = useState(false);
  var userID = useParams().name;
  const [user, setUser] = useState<User>();
  const [isMyPage, setIsMyPage] = useState(false);
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [cookies] = useCookies(["cookie-name"]);
  const socket = useContext(WebSocketContext);

  async function enable2Fa() {
    var request = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies["token"]}`,
      },
    };
    await fetch("http://localhost:3001/auth/2fa/generate", request).then(
      async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.log("error QR code generation");
          return;
        }
		// TODO display QR code somehow
		console.log(response);
      }
    );
    // TODO: post request to generate
    // TODO: display QR code + field for code with submit
    // TODO: post it to turn on and if it works close everything
  }

  function disable2Fa() {
    // TODO: post request to turn off
    // TODO: if it works flip the switch
    // TODO: check if cookie is up to date
  }

  useEffect(() => {
    var request = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies["token"]}`,
      },
    };

    if (getUserID(cookies).toString() === userID) {
      socket.emit("login", cookies["token"]);
      setIsMyPage(true);
      if (getIs2faEnabled(cookies)) {
        setIs2faEnabled(true);
      }
    }

    fetch(`http://localhost:3001/users/${userID}`, request).then(
      async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.log("error response load channels");
          return <h1>No such user</h1>;
        }
        setUserExists(true);
        setUser({ username: data.username, email: data.email });
        console.log(data);
      }
    );
  }, [cookies, socket, userID]);
  if (!userExists) {
    return <h1>No such user</h1>;
  }
  if (isMyPage) {
    return (
      <div>
        <h1>My user page ({user.username})</h1>
        <p> My email is : {user.email}</p>
        <input type="checkbox" checked={is2faEnabled} onChange={() => {}} />
      </div>
    );
  }
  return (
    <div>
      <h1>User page for {user.username}</h1>
      <p> My email is : {user.email}</p>
    </div>
  );
}

export default UserPage;
