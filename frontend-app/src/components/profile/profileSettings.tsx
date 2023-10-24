import { QRCodeRaw } from "@cheprasov/qrcode";

function ProfileSettings(cookies: any) {
  // TODO: put 2fa checkbox in edit profile menu
  // <input
  //   type="checkbox"
  //   checked={is2faEnabled}
  //   onChange={() => {
  //     enable2Fa();
  //   }} />
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
  return;
}

export default ProfileSettings;
