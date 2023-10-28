import { QRCodeRaw } from "@cheprasov/qrcode";
import { User } from "./profile";
import { useEffect, useState } from "react";
import { getIs2faEnabled, getUserID } from "../../cookies";

function ProfileSettings(
  user: User,
  cookies: any,
  isEditingProfile,
  setIsEditingProfile
) {
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [is2faEnabled, setIs2faEnabled] = useState(false);

  useEffect(() => {
    if (user !== undefined) setNewUsername(user.username);
    if (user !== undefined) setNewEmail(user.email);
    if (getIs2faEnabled(cookies)) {
      setIs2faEnabled(true);
    }
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
    fetch(`http://localhost:3001/users/${getUserID(cookies)}`, request).then(
      async (response) => {
        if (!response.ok) {
          const error = await response.json();
          alert("Error: " + error.error + ": " + error.message);
        }
      }
    );
  }

  function submitNewPassword(e: any) {
    var request = {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies["token"]}`,
      },
      body: JSON.stringify({
        currentPassword: currentPassword,
        newPassword: newPassword,
      }),
    };
    e.preventDefault();
    fetch(`http://localhost:3001/users/${getUserID(cookies)}`, request).then(
      async (response) => {
        if (!response.ok) {
          const error = await response.json();
          alert("Error: " + error.error + ": " + error.message);
        }
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
      {user.login42 === "" ? (
        <form className="edit_field" onSubmit={submitNewPassword}>
          <input
            placeholder="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
            }}
          />
          <input
            placeholder="New password"
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
            }}
          />
          <button>Change password</button>
        </form>
      ) : (
        <div />
      )}
      <input
        type="checkbox"
        checked={is2faEnabled}
        onChange={() => {
          enable2Fa();
        }}
      />
    </div>
  );
}

export default ProfileSettings;
