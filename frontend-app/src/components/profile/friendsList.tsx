import { useContext, useEffect, useState } from "react";
import { AuthenticationContext } from "../authenticationState";
import { blockUser, unblockUser, unfriend, User } from "./profile";

export type Friend = {
  id: number;
  username: string;
};

type BlockedUser = Friend;

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

function unblockButton(
  myID: number,
  targetID: number,
  cookies: any,
  setFriends: any
) {
  return (
    <button
      onClick={() => {
        if (unblockUser(targetID, myID, cookies)) {
          removeFriendFromList(targetID, setFriends);
        }
      }}
    >
      Unblock
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
  setFriends: any,
  blocked: boolean = false
) {
  if (blocked) {
    return (
      <li>
        <a href={"/user/" + friend.id}>{friend.username}</a>
        {unblockButton(myID, friend.id, cookies, setFriends)}
      </li>
    );
  }
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
  setFriends: any,
  blocked: boolean = false
) {
  if (friends === undefined)
    return <ul>{blocked ? "Nobody blocked" : "No friends"}</ul>;
  return (
    <ul>
      {friends.map((friend: Friend) =>
        displayFriend(friend, isMyPage, myID, cookies, setFriends, blocked)
      )}
    </ul>
  );
}

function FriendsList(isMyPage: boolean, user: User, cookies: any) {
  const [friends, setFriends] = useState<Friend[]>();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>();
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
    fetch(`http://localhost:3001/users/${userID}/blockedUsers`, request).then(
      async (response) => {
        const blockedData = await response.json();
        if (!response.ok) {
          console.log("error response loading blocked users list");
          return <h1>No Blocked Users loaded</h1>;
        }
        var fetchedBlockedUsers = blockedData.map((fetchedBlockedUser: any) => {
          const amIUser1 = fetchedBlockedUser.userID1 === user.id;
          if (!amIUser1) {
            var newBlockedUser: BlockedUser = {
              id: fetchedBlockedUser.blockedUserID,
              username: fetchedBlockedUser.blockedUsername,
            };
          } else {
            var newBlockedUser: BlockedUser = {
              id: fetchedBlockedUser.blockedUserID,
              username: fetchedBlockedUser.blockedUsername,
            };
          }
          return newBlockedUser;
        });
        setBlockedUsers([...fetchedBlockedUsers]);
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
      {isMyPage ? (
        <div>
          <h3>Blocked Users</h3>
          {displayFriends(
            blockedUsers,
            isMyPage,
            authenticatedUserID,
            cookies,
            setBlockedUsers,
            true
          )}
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
}

export default FriendsList;
