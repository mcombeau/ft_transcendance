import { User } from "./profile";
import { useEffect, useState } from "react";
import { getIs2faEnabled } from "../../cookies";

async function readStream(response: any) {
  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      // Do something with last chunk of data then exit reader
      return value;
    }
    // Otherwise do something here to process current chunk
  }
}

function ProfileSettings(
  user: User,
  cookies: any,
  isEditingProfile,
  setIsEditingProfile,
  authenticatedUserID: number
) {
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [is2faEnabled, setIs2faEnabled] = useState(false);
  const [qrcode, setQrcode] = useState();
  const [twoFaValidationCode, setTwoFaValidationCode] = useState("");

  useEffect(() => {
    if (user !== undefined) {
      setNewUsername(user.username);
      setNewEmail(user.email);
      setIs2faEnabled(user.isTwoFaEnabled);
    }
  }, [user]);

  useEffect(() => {
    console.log("Changing 2fa status");
    setIs2faEnabled(getIs2faEnabled(cookies));
  }, [cookies]);

  async function enable2Fa() {
    var result: Uint8Array;
    var request = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies["token"]}`,
      },
    };
    return await fetch("http://localhost:3001/auth/2fa/generate", request).then(
      async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.log("error QR code generation");
          return;
        }
        setQrcode(data);
      }
    );
    // TODO: post it to turn on and if it works close everything
  }

  function submitTwoFaValidationCode(e: any) {
    e.preventDefault();
    var request = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies["token"]}`,
      },
      body: JSON.stringify({
        twoFactorAuthenticationCode: twoFaValidationCode.toString(),
      }),
    };

    fetch(`http://localhost:3001/auth/2fa/turn-on`, request).then(
      async (response) => {
        const data = await response.json();
        if (!response.ok) {
          alert("Error with enabling 2fa: " + data.error + ": " + data.message);
          return;
        }
      }
    );

    setTwoFaValidationCode("");
    setQrcode(null);
    setIs2faEnabled(true);
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
    fetch(`http://localhost:3001/users/${authenticatedUserID}`, request).then(
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
    fetch(`http://localhost:3001/users/${authenticatedUserID}`, request).then(
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
      <div>
        <input
          type="checkbox"
          checked={is2faEnabled}
          onChange={() => {
            enable2Fa();
          }}
        />
        <label> Enable two-factor authentication</label>
      </div>
      {qrcode && (
        <div>
          <img src={qrcode}></img>

          <form onSubmit={submitTwoFaValidationCode}>
            <input
              placeholder="2fa validation code"
              value={twoFaValidationCode}
              onChange={(e) => {
                setTwoFaValidationCode(e.target.value);
              }}
            />
            <button>Submit</button>
          </form>
        </div>
      )}
      <canvas id="canvas"></canvas>
    </div>
  );
}

export default ProfileSettings;
