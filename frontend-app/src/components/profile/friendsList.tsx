import { useEffect, useState } from "react";
import { User } from "./profile";

export type Friend = {
  id: number;
  username: string;
};

function displayFriend(friend: Friend) {
  return <a href={"/users/" + friend.id}>{friend.username}</a>;
}

function displayFriends(friends: Friend[]) {
  if (friends === undefined) return <p>No friends</p>;
  return friends.map(displayFriend);
}

function FriendsList(isMyPage: boolean, user: User, cookies: any) {
  const [friends, setFriends] = useState<Friend[]>();

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
      {displayFriends(friends)}
    </div>
  );
}

export default FriendsList;
