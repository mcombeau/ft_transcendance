import { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { useCookies } from "react-cookie";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import defaultProfilePicture from "./profilePicture.jpg";
import FriendsList from "./friendsList";
import GameHistory from "./history";
import ProfileSettings from "./profileSettings";
import { AuthenticationContext } from "../authenticationState";

export type User = {
  id: number;
  username: string;
  email: string;
  login42: string;
  isTwoFaEnabled: boolean;
};

function titleProfile(isMyPage: boolean, user: User) {
  if (user === undefined) return <h2>User not found</h2>;
  if (isMyPage) return <h2>My user page ({user.username})</h2>;

  return <h2>User page for {user.username}</h2>;
}

function userDetails(user: User) {
  if (user === undefined) return <div />;
  return (
    <p>
      {user.login42 ? " aka " + user.login42 : ""}
      <br /> Email is : {user.email}
    </p>
  );
}

async function befriend(
  userID: number,
  authenticatedUserID: number,
  cookies: any
) {
  // TODO: rather create friendship invite
  var request = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cookies["token"]}`,
    },
    body: JSON.stringify({
      userID1: authenticatedUserID,
      userID2: userID,
    }),
  };
  return fetch(`http://localhost:3001/friends`, request).then(
    async (response) => {
      if (!response.ok) {
        console.log("Error adding friend");
        return false;
      }
      return true;
    }
  );
}

export async function unfriend(
  userID: number,
  authenticatedUserID: number,
  cookies: any
) {
  var request = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cookies["token"]}`,
    },
    body: JSON.stringify({
      userID1: authenticatedUserID,
      userID2: userID,
    }),
  };
  return fetch(`http://localhost:3001/friends`, request).then(
    async (response) => {
      console.log("response");
      console.log(response);
      if (!response.ok) {
        console.log("Error adding friend");
        return false;
      }
      return true;
    }
  );
}

async function checkIfIsMyFriend(
  user: User,
  authenticatedUserID: number,
  cookies: any,
  setIsMyFriend: any
) {
  if (user === undefined) return;
  var request = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cookies["token"]}`,
    },
    body: JSON.stringify({
      userID1: authenticatedUserID,
      userID2: user.id,
    }),
  };
  await fetch(`http://localhost:3001/friends/friend`, request).then(
    async (response) => {
      if (!response.ok) {
        setIsMyFriend(false);
      } else {
        setIsMyFriend(true);
      }
    }
  );
}

async function checkIfIsBlocked(
  user: User,
  authenticatedUserID: number,
  cookies: any,
  setIsBlocked: any
) {
  if (user === undefined) return;
  var request = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cookies["token"]}`,
    },
    body: JSON.stringify({
      blockingUserID: authenticatedUserID,
      blockedUserID: user.id,
    }),
  };
  await fetch(
    `http://localhost:3001/blocked-users/isUserBlocked`,
    request
  ).then(async (response) => {
    console.log("is blocked response");
    console.log(response);
    if (!response.ok) {
      setIsBlocked(false);
    } else {
      setIsBlocked(true);
    }
  });
}

export async function blockUser(
  userID: number,
  authenticatedUserID: number,
  cookies: any
) {
  console.log("blocking user");
  var request = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cookies["token"]}`,
    },
    body: JSON.stringify({
      blockingUserID: authenticatedUserID,
      blockedUserID: userID,
    }),
  };
  return fetch(`http://localhost:3001/blocked-users`, request).then(
    async (response) => {
      if (!response.ok) {
        console.log("Error blocking user");
        return false;
      }
      return true;
    }
  );
}

async function unblockUser(
  userID: number,
  authenticatedUserID: number,
  cookies: any
) {
  console.log("Unblocking user");
  var request = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cookies["token"]}`,
    },
    body: JSON.stringify({
      blockingUserID: authenticatedUserID,
      blockedUserID: userID,
    }),
  };
  return fetch(`http://localhost:3001/blocked-users`, request).then(
    async (response) => {
      console.log("response");
      console.log(response);
      if (!response.ok) {
        console.log("Error unblocking user");
        return false;
      }
      return true;
    }
  );
}

function friendButton(
  user: User,
  authenticatedUserID: number,
  cookies: any,
  isMyFriend: boolean,
  setIsMyFriend: any
) {
  // TODO: check if need be async
  if (isMyFriend) {
    return (
      <button
        onClick={() => {
          if (unfriend(user.id, authenticatedUserID, cookies)) {
            setIsMyFriend(false);
          }
        }}
      >
        Unfriend
      </button>
    );
  }
  return (
    <button
      onClick={() => {
        if (befriend(user.id, authenticatedUserID, cookies)) {
          setIsMyFriend(true);
        }
      }}
    >
      Add friend
    </button>
  );
}

function blockButton(
  user: User,
  authenticatedUserID: number,
  cookies: any,
  isBlocked: boolean,
  setIsBlocked: any
) {
  if (isBlocked) {
    return (
      <button
        onClick={() => {
          if (unblockUser(user.id, authenticatedUserID, cookies))
            setIsBlocked(false);
        }}
      >
        Unblock
      </button>
    );
  }
  return (
    <button
      onClick={() => {
        if (blockUser(user.id, authenticatedUserID, cookies))
          setIsBlocked(true);
      }}
    >
      Block
    </button>
  );
}

function challengeButton(user: User, authenticatedUserID: number) {
  console.log("User " + authenticatedUserID + " challenges user " + user.id);
  // TODO: redirect challenging user to play page with a specific status (maybe unique id room ?)
  // - accept challenge business for later, challenged user has a new button
  // - if they click it redirect them to the new room
  // - probably using sockets
  return <button>Challenge</button>;
}

function interactWithUser(
  isMyPage: boolean,
  isMyFriend: boolean,
  setIsMyFriend: any,
  isBlocked: boolean,
  setIsBlocked: any,
  user: User,
  authenticatedUserID: number,
  cookies: any
) {
  if (user === undefined) return <div />;
  if (isMyPage) return <p></p>;
  return (
    <p>
      {friendButton(
        user,
        authenticatedUserID,
        cookies,
        isMyFriend,
        setIsMyFriend
      )}
      {blockButton(user, authenticatedUserID, cookies, isBlocked, setIsBlocked)}
      {challengeButton(user, authenticatedUserID)}
      <button>Send DM</button>
    </p>
  );
}

function editProfile(
  isMyPage: boolean,
  user: User,
  isEditingProfile: any,
  setIsEditingProfile: any
) {
  if (user === undefined) return <div />;
  if (!isMyPage) return <div></div>;
  if (isEditingProfile) return <div></div>;
  return (
    <button
      onClick={() => {
        setIsEditingProfile(true);
      }}
    >
      Edit profile
    </button>
  );
}

function Profile() {
  const [userExists, setUserExists] = useState(false);
  var profileUserID: number = Number(useParams().id);
  const [user, setUser] = useState<User>();
  const [isMyPage, setIsMyPage] = useState(false);
  const [cookies] = useCookies(["token"]);
  const socket = useContext(WebSocketContext);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isMyFriend, setIsMyFriend] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const { authenticatedUserID } = useContext(AuthenticationContext);

  async function fetchUser() {
    var request = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies["token"]}`,
      },
    };

    fetch(`http://localhost:3001/users/${profileUserID}`, request).then(
      async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.log("error response load channels");
          return <h1>No such user</h1>;
        }
        setUserExists(true);
        setUser({
          id: data.id,
          username: data.username,
          email: data.email,
          login42: data.login42 ? data.login42 : "",
          isTwoFaEnabled: data.isTwoFactorAuthenticationEnabled,
        });
      }
    );
  }

  useEffect(() => {
    if (authenticatedUserID === profileUserID) {
      socket.emit("login", cookies["token"]);
      setIsMyPage(true);
    }

    fetchUser();
  }, [cookies, socket, profileUserID]);

  useEffect(() => {
    checkIfIsMyFriend(user, authenticatedUserID, cookies, setIsMyFriend);
    checkIfIsBlocked(user, authenticatedUserID, cookies, setIsBlocked);
  }, [user]);

  // TODO: add friendship invite section
  return (
    <div>
      <img src={defaultProfilePicture} width="100" height="100"></img>
      {!userExists ? "User is not logged in" : ""}
      {titleProfile(isMyPage, user)}
      {userDetails(user)}
      {interactWithUser(
        isMyPage,
        isMyFriend,
        setIsMyFriend,
        isBlocked,
        setIsBlocked,
        user,
        authenticatedUserID,
        cookies
      )}
      {editProfile(isMyPage, user, isEditingProfile, setIsEditingProfile)}
      {ProfileSettings(
        user,
        cookies,
        isEditingProfile,
        setIsEditingProfile,
        authenticatedUserID
      )}
      {FriendsList(isMyPage, user, cookies)}
      {GameHistory(user, cookies)}
    </div>
  );
}

export default Profile;
