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

function befriend(
  user: User,
  authenticatedUserID: number,
  cookies: any,
  setIsMyFriend: any
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
      userID2: user.id,
    }),
  };
  fetch(`http://localhost:3001/friends`, request).then(async (response) => {
    if (!response.ok) {
      console.log("Error adding friend");
    } else {
      setIsMyFriend(true);
    }
  });
}

function unfriend(
  user: User,
  authenticatedUserID: number,
  cookies: any,
  setIsMyFriend: any
) {
  var request = {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cookies["token"]}`,
    },
    body: JSON.stringify({
      userID1: authenticatedUserID,
      userID2: user.id,
    }),
  };
  fetch(`http://localhost:3001/friends`, request).then(async (response) => {
    console.log("response");
    console.log(response);
    if (!response.ok) {
      console.log("Error adding friend");
    } else {
      setIsMyFriend(false);
    }
  });
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

function blockUser(
  user: User,
  authenticatedUserID: number,
  cookies: any,
  setIsBlocked: any
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
      blockedUserID: user.id,
    }),
  };
  fetch(`http://localhost:3001/blocked-users`, request).then(
    async (response) => {
      if (!response.ok) {
        console.log("Error blocking user");
      } else {
        setIsBlocked(true);
      }
    }
  );
}

function unblockUser(
  user: User,
  authenticatedUserID: number,
  cookies: any,
  setIsBlocked: any
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
      blockedUserID: user.id,
    }),
  };
  fetch(`http://localhost:3001/blocked-users`, request).then(
    async (response) => {
      console.log("response");
      console.log(response);
      if (!response.ok) {
        console.log("Error unblocking user");
      } else {
        setIsBlocked(false);
      }
    }
  );
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
  var friendshipButton: any;
  if (isMyFriend) {
    friendshipButton = (
      <button
        onClick={() =>
          unfriend(user, authenticatedUserID, cookies, setIsMyFriend)
        }
      >
        Unfriend
      </button>
    );
  } else {
    friendshipButton = (
      <button
        onClick={() =>
          befriend(user, authenticatedUserID, cookies, setIsMyFriend)
        }
      >
        Add friend
      </button>
    );
  }
  var blockButton: any;
  if (isBlocked) {
    blockButton = (
      <button
        onClick={() =>
          unblockUser(user, authenticatedUserID, cookies, setIsBlocked)
        }
      >
        Unblock
      </button>
    );
  } else {
    blockButton = (
      <button
        onClick={() =>
          blockUser(user, authenticatedUserID, cookies, setIsBlocked)
        }
      >
        Block
      </button>
    );
  }
  return (
    <p>
      {friendshipButton}
      {blockButton}
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
