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
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (user !== undefined) setUsername(user.username);
  }, []);

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

  function submitUsername(e: any) {
    var request = {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies["token"]}`,
      },
    };
    e.preventDefault();
    console.log("Submitting username " + username);
    fetch(`http://localhost:3001/users/${getUserID(cookies)}`, request).then(
      async (response) => {
        if (!response.ok) alert("There was a problem with updating settings");
      }
    );
  }

  // if (user !== undefined) setUsername(user.username);
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
      <form className="edit_field" onSubmit={submitUsername}>
        <input
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
          }}
        />
        <button>Save changes</button>
      </form>
    </div>
  );
}

export default ProfileSettings;
