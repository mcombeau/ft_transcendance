import { useContext, useEffect, useState } from "react";
import { AuthenticationContext } from "../authenticationState";
import { blockUser, User } from "./profile";

export type Friend = {
  id: number;
  username: string;
};

function blockButton(myID: number, targetID: number, cookies: any) {
  return (
    <button
      onClick={() => {
        blockUser(targetID, myID, cookies);
      }}
    >
      Block
    </button>
  );
}

function displayFriend(
  friend: Friend,
  isMyPage: boolean,
  myID: number,
  cookies: any
) {
  if (isMyPage) {
    return (
      <li>
        <a href={"/user/" + friend.id}>{friend.username}</a>
        {blockButton(myID, friend.id, cookies)}
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
  cookies: any
) {
  if (friends === undefined) return <ul>No friends</ul>;
  return (
    <ul>
      {friends.map((friend: Friend) =>
        displayFriend(friend, isMyPage, myID, cookies)
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
      {displayFriends(friends, isMyPage, authenticatedUserID, cookies)}
    </div>
  );
}

export default FriendsList;
