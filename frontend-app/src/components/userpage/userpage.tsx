import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { useCookies } from "react-cookie";
import { getUserID } from "../../cookies";

type User = {
  username: string;
  email: string;
};

function UserPage() {
  const [userExists, setUserExists] = useState(false);
  var userID = useParams().name;
  const [user, setUser] = useState<User>();
  const [isMyPage, setIsMyPage] = useState(false);
  const [cookies] = useCookies(["cookie-name"]);

  useEffect(() => {
    var request = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies["token"]}`,
      },
    };

    if (getUserID(cookies).toString() === userID) {
      setIsMyPage(true);
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
  }, []);
  if (!userExists) {
    return <h1>No such user</h1>;
  }
  return (
    <div>
      <h1>User page for {isMyPage ? "me" : user.username}</h1>
      <p> My email is : {user.email}</p>
    </div>
  );
}

export default UserPage;
