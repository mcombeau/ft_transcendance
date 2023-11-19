import { User } from "./profile";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

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
	isEditingProfile: boolean,
	setIsEditingProfile: Dispatch<SetStateAction<boolean>>,
	authenticatedUserID: number
) {
	const [newUsername, setNewUsername] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [is2faEnabled, setIs2faEnabled] = useState(false);
	const [qrcode, setQrcode] = useState();
	const [twoFaValidationCode, setTwoFaValidationCode] = useState("");
	const [newAvatar, setNewAvatar] = useState(null);

	useEffect(() => {
		if (user !== undefined) {
			setNewUsername(user.username);
			setNewEmail(user.email);
			setIs2faEnabled(user.isTwoFaEnabled);
		}
	}, [user]);

	// useEffect(() => {
	// 	console.log("Changing 2fa status");
	// 	setIs2faEnabled(getIs2faEnabled(cookies));
	// }, [cookies]);

	async function enable2Fa() {
		var request: any = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${cookies["token"]}`,
			},
		};
		return await fetch("/backend/auth/2fa/generate", request).then(
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

		fetch(`/backend/auth/2fa/turn-on`, request).then(async (response) => {
			const data = await response.json();
			if (!response.ok) {
				alert("Error with enabling 2fa: " + data.error + ": " + data.message);
				return;
			}
		});

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
		// TODO: dont send username if username has not changed
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
		fetch(`/backend/users/${authenticatedUserID}`, request).then(
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
		fetch(`/backend/users/${authenticatedUserID}`, request).then(
			async (response) => {
				if (!response.ok) {
					const error = await response.json();
					alert("Error: " + error.error + ": " + error.message);
				}
			}
		);
	}

	async function submitNewAvatar(e: any) {
		e.preventDefault();
		const formData = new FormData(e.target.closest("form"));
		console.log("Form data");
		console.log(formData);

		var request = {
			method: "POST",
			headers: {
				Authorization: `Bearer ${cookies["token"]}`,
			},
			body: formData,
		};
		await fetch(`/backend/users/${authenticatedUserID}/avatar`, request).then(
			async (response) => {
				if (!response.ok) {
					console.log("There was an issue with changing your avatar");
				} else {
					// TODO: change current image
				}
			}
		);
	}

	async function removeAvatar(e: any) {
		e.preventDefault();
		var request = {
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${cookies["token"]}`,
			},
		};
		await fetch(`/backend/users/${authenticatedUserID}/avatar`, request).then(
			async (response) => {
				if (!response.ok) {
					console.log("There was an issue with removing your avatar");
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
			{newAvatar && (
				<img
					alt="not found"
					width={"250px"}
					src={URL.createObjectURL(newAvatar)}
				/>
			)}
			<form id="avatar-form">
				<input
					type="file"
					name="file"
					onChange={(event) => {
						console.log(event.target.files[0]);
						setNewAvatar(event.target.files[0]);
					}}
				/>
				<button onClick={submitNewAvatar}>Save new avatar</button>
			</form>
			<button onClick={removeAvatar}>Remove avatar</button>
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
