import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useState } from "react";

type User = {
  username: string;
  email: string;
};

function UserPage() {
  const [userExists, setUserExists] = useState(false);
  var username = useParams().name;
  const [user, setUser] = useState<User>();

  useEffect(() => {
    fetch(`http://localhost:3001/users/username/${username}`).then(
      async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.log("error response load channels");
          console.log("fucking here");
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
      <h1>User page for {user.username}</h1>
      <p> My email is : {user.email}</p>
    </div>
  );
}

export default UserPage;
