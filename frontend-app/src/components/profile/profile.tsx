import { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { useCookies } from "react-cookie";
import { getIs2faEnabled, getUserID } from "../../cookies";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import defaultProfilePicture from "./profilePicture.jpg";
import FriendsList from "./friendsList";
import Stats from "./stats";
import History from "./history";

export type User = {
  username: string;
  email: string;
  login42: string;
};

function titleProfile(isMyPage: boolean, user: User) {
  if (isMyPage) return <h2>My user page ({user.username})</h2>;

  return <h2>User page for {user.username}</h2>;
}

function userDetails(isMyPage: boolean, user: User) {
  return (
    <p>
      {user.login42 ? " aka " + user.login42 : ""}
      <br /> Email is : {user.email}
    </p>
  );
}

function editProfile(isMyPage: boolean, user: User) {
  if (!isMyPage) return <div></div>;
  return <button>Edit profile</button>;
}

function interactWithUser(isMyPage: boolean, user: User) {
  if (isMyPage) return <p></p>;
  // TODO: add unfriend logic
  return (
    <p>
      <button>Add friend</button>
      <button>Block user</button>
      <button>Send DM</button>
    </p>
  );
}

function Profile() {
  const [userExists, setUserExists] = useState(false);
  var userID = useParams().id;
  const [user, setUser] = useState<User>();
  const [isMyPage, setIsMyPage] = useState(false);
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [cookies] = useCookies(["cookie-name"]);
  const socket = useContext(WebSocketContext);

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
        setUser({
          username: data.username,
          email: data.email,
          login42: data.login42 ? data.login42 : "",
        });
        console.log(data);
      }
    );
  }, [cookies, socket, userID]);
  if (!userExists) {
    return <h1>No such user</h1>;
  }

  return (
    <div>
      <img src={defaultProfilePicture} width="100" height="100"></img>
      {titleProfile(isMyPage, user)}
      {userDetails(isMyPage, user)}
      {interactWithUser(isMyPage, user)}
      {editProfile(isMyPage, user)}
      {FriendsList(isMyPage, user)}
      {Stats(isMyPage, user)}
      {History(isMyPage, user)}
    </div>
  );
}

export default Profile;
