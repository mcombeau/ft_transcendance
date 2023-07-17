import { useParams } from "react-router-dom";

function UserPage() {
  var username = useParams().name;
  return <h1>User page for {username}</h1>;
}

export default UserPage;
