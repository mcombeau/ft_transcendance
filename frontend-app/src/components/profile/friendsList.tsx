import { useContext, useEffect, useState } from "react";
import { AuthenticationContext } from "../authenticationState";
import { blockUser, unfriend, User } from "./profile";

export type Friend = {
  id: number;
  username: string;
};

function removeFriendFromList(userID: number, setFriends: any) {
  setFriends((friends: Friend[]) =>
    friends.filter((friend) => friend.id !== userID)
  );
}

function blockButton(
  myID: number,
  targetID: number,
  cookies: any,
  setFriends: any
) {
  return (
    <button
      onClick={() => {
        if (blockUser(targetID, myID, cookies)) {
          removeFriendFromList(targetID, setFriends);
        }
      }}
    >
      Block
    </button>
  );
}

function unfriendButton(
  myID: number,
  targetID: number,
  cookies: any,
  setFriends: any
) {
  return (
    <button
      onClick={() => {
        if (unfriend(targetID, myID, cookies)) {
          removeFriendFromList(targetID, setFriends);
        }
      }}
    >
      Unfriend
    </button>
  );
}

function displayFriend(
  friend: Friend,
  isMyPage: boolean,
  myID: number,
  cookies: any,
  setFriends: any
) {
  if (isMyPage) {
    return (
      <li>
        <a href={"/user/" + friend.id}>{friend.username}</a>
        {blockButton(myID, friend.id, cookies, setFriends)}
        {unfriendButton(myID, friend.id, cookies, setFriends)}
      </li>
    );
  }
  return (
    <li>
      <a href={"/user/" + friend.id}>{friend.username}</a>
    </li>
  );
}

function displayFriends(
  friends: Friend[],
  isMyPage: boolean,
  myID: number,
  cookies: any,
  setFriends: any
) {
  if (friends === undefined) return <ul>No friends</ul>;
  return (
    <ul>
      {friends.map((friend: Friend) =>
        displayFriend(friend, isMyPage, myID, cookies, setFriends)
      )}
    </ul>
  );
}

function FriendsList(isMyPage: boolean, user: User, cookies: any) {
  const [friends, setFriends] = useState<Friend[]>();
  const { authenticatedUserID } = useContext(AuthenticationContext);

  async function fetchFriends(userID: number, cookies: any) {
    var request = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies["token"]}`,
      },
    };
    fetch(`http://localhost:3001/users/${userID}/friends`, request).then(
      async (response) => {
        const friendsData = await response.json();
        if (!response.ok) {
          console.log("error response loading friends list");
          return <h1>No Friends loaded</h1>;
        }
        var fetchedFriends = friendsData.map((fetchedFriend: any) => {
          const amIUser1 = fetchedFriend.userID1 === user.id;
          if (!amIUser1) {
            var newFriend: Friend = {
              id: fetchedFriend.userID1,
              username: fetchedFriend.username1,
            };
          } else {
            var newFriend: Friend = {
              id: fetchedFriend.userID2,
              username: fetchedFriend.username2,
            };
          }
          return newFriend;
        });
        setFriends([...fetchedFriends]);
      }
    );
  }

  useEffect(() => {
    if (user !== undefined) {
      fetchFriends(user.id, cookies);
    }
  }, [user]);

  if (user === undefined) {
    return <div></div>;
  }

  return (
    <div>
      <h3>Friends list:</h3>
      {displayFriends(
        friends,
        isMyPage,
        authenticatedUserID,
        cookies,
        setFriends
      )}
    </div>
  );
}

export default FriendsList;
