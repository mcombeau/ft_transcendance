import { QRCodeRaw } from "@cheprasov/qrcode";
import { User } from "./profile";
import { useEffect, useState } from "react";
import { getUserID } from "../../cookies";

function ProfileSettings(
  user: User,
  cookies: any,
  isEditingProfile,
  setIsEditingProfile
) {
  // TODO: put 2fa checkbox in edit profile menu
  // <input
  //   type="checkbox"
  //   checked={is2faEnabled}
  //   onChange={() => {
  //     enable2Fa();
  //   }} />
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    if (user !== undefined) setNewUsername(user.username);
    if (user !== undefined) setNewEmail(user.email);
  }, [user]);

  async function enable2Fa() {
    var result: Uint8Array;
    var request = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies["token"]}`,
      },
    };
    await fetch("http://localhost:3001/auth/2fa/generate", request).then(
      async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.log("error QR code generation");
          return;
        }
        // TODO display QR code somehow
        console.log("GENERATE");
        const code = new QRCodeRaw(response["body"]);
        console.log(code);
      }
    );
    // TODO: post request to generate
    // TODO: display QR code + field for code with submit
    // TODO: post it to turn on and if it works close everything
  }

  function disable2Fa() {
    // TODO: post request to turn off
    // TODO: if it works flip the switch
    // TODO: check if cookie is up to date
  }

  function submitUserInfo(e: any) {
    var request = {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies["token"]}`,
      },
      body: JSON.stringify({
        username: newUsername,
        email: newEmail,
      }),
    };
    e.preventDefault();
    console.log("Submitting username " + newUsername);
    console.log("Submitting email " + newEmail);
    console.log("request", request);
    fetch(`http://localhost:3001/users/${getUserID(cookies)}`, request).then(
      async (response) => {
        if (!response.ok) alert("There was a problem with updating settings");
      }
    );
  }

  if (!isEditingProfile) return <div></div>;

  return (
    <div>
      <button
        onClick={() => {
          setIsEditingProfile(false);
        }}
      >
        Close settings
      </button>
      <form className="edit_field" onSubmit={submitUserInfo}>
        <input
          value={newUsername}
          onChange={(e) => {
            setNewUsername(e.target.value);
          }}
        />
        <input
          value={newEmail}
          onChange={(e) => {
            setNewEmail(e.target.value);
          }}
        />
        <button>Save changes</button>
      </form>
    </div>
  );
}

export default ProfileSettings;
