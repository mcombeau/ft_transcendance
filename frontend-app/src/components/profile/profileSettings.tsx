import { User } from "./profile";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { ButtonIconType, getButtonIcon } from "../styles/icons";
import { BannerType, createBanner } from "../banner/Banner";
import { useLocation, useNavigate } from "react-router-dom";

function ProfileSettings(
	user: User,
	cookies: any,
	isEditingProfile: boolean,
	setIsEditingProfile: Dispatch<SetStateAction<boolean>>,
	authenticatedUserID: number,
	setBanners: any,
	setChangeProfile: Dispatch<SetStateAction<boolean>>
) {
	const [newUsername, setNewUsername] = useState("");
	const [newEmail, setNewEmail] = useState("");
	const [is2faEnabled, setIs2faEnabled] = useState(false);
	const [qrcode, setQrcode] = useState();
	const [twoFaValidationCode, setTwoFaValidationCode] = useState("");
	const [newAvatar, setNewAvatar] = useState(null);
	let location = useLocation();
	const navigate = useNavigate();

	useEffect(() => {
		if (user !== undefined) {
			setNewUsername(user.username);
			setNewEmail(user.email);
			setIs2faEnabled(user.isTwoFaEnabled);
		}
	}, [user]);

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
					console.warn("error QR code generation: ", data.message);
					createBanner(
						"Error generating QR code: " + data.message,
						setBanners,
						BannerType.Alert
					);
					return;
				}
				setQrcode(data);
			}
		);
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
			if (!response.ok) {
				console.warn("Error enabling 2fa");
				createBanner("Error enabling 2fa ", setBanners, BannerType.Alert);
				setTwoFaValidationCode("");
				setQrcode(null);
				setIs2faEnabled(false);
				return;
			}
			setTwoFaValidationCode("");
			setQrcode(null);
			setIs2faEnabled(true);
			createBanner("2FA successfully enabled!", setBanners, BannerType.Notif);
		});
	}

	function disable2Fa() {
		var request: any = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${cookies["token"]}`,
			},
		};
		fetch(`/backend/auth/2fa/turn-off`, request).then(async (response) => {
			if (!response.ok) {
				console.warn("Error disabling 2fa");
				createBanner("Error disabling 2fa", setBanners, BannerType.Alert);
				return;
			}
			createBanner("2FA successfully disabled.", setBanners, BannerType.Notif);
		});

		setTwoFaValidationCode("");
		setQrcode(null);
		setIs2faEnabled(false);
	}

	function submitUserInfo(e: any) {
		e.preventDefault();
		var body: { username?: string; email?: string } = {};
		if (newUsername !== user.username) {
			body.username = newUsername;
		}
		if (newEmail !== user.email) {
			body.email = newEmail;
		}
		if (!body.username && !body.email) {
			return;
		}
		var request = {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${cookies["token"]}`,
			},
			body: JSON.stringify(body),
		};
		fetch(`/backend/users/${authenticatedUserID}`, request).then(
			async (response) => {
				if (!response.ok) {
					const error = await response.json();
					createBanner(
						"Error: " + error.error + ": " + error.message,
						setBanners,
						BannerType.Alert
					);
				} else {
					setChangeProfile((prev) => !prev);
					createBanner(
						"User information successfully updated.",
						setBanners,
						BannerType.Notif
					);
				}
			}
		);
	}

	async function submitNewAvatar(e: any) {
		e.preventDefault();
		const formData = new FormData(e.target.closest("form"));

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
					console.warn("There was an issue with changing your avatar");
					createBanner(
						"Error: Invalid file type or size (max. 5 MB)",
						setBanners,
						BannerType.Alert
					);
				} else {
					setChangeProfile((prev) => !prev);
					createBanner(
						"Avatar successfully updated!",
						setBanners,
						BannerType.Notif
					);
				}
				setNewAvatar(null);
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
					console.warn("There was an issue with removing your avatar");
					const error = await response.json();
					createBanner(
						"Error: " + error.error + ": " + error.message,
						setBanners,
						BannerType.Alert
					);
				} else {
					setChangeProfile((prev) => !prev);
					createBanner(
						"Avatar successfully removed.",
						setBanners,
						BannerType.Notif
					);
				}
			}
		);
	}

	if (!isEditingProfile) return <div></div>;

	function validateUploadedAvatarSize(fileSize: number): boolean {
		if (fileSize > 1_000_000) {
			createBanner(
				"Error: File too large (max. 1 MB)",
				setBanners,
				BannerType.Alert
			);
			return false;
		} else if (fileSize < 10) {
			createBanner(
				"Error: File too small (min: 10 B)",
				setBanners,
				BannerType.Alert
			);
			return false;
		}
		return true;
	}

	function avatarSetting() {
		return (
			<div className="bg-lightblue dark:bg-darklightblue rounded-md m-2 p-2">
				<h3 className="font-bold">Avatar</h3>
				{newAvatar && (
					<img
						alt="not found"
						width={"250px"}
						src={URL.createObjectURL(newAvatar)}
						className="w-15 h-15 rounded-full sm:w-30 sm:h-30 m-2"
					/>
				)}
				<form id="avatar-form" className="m-2">
					<input
						className="file:text-sage file:dark:text-darkdarkblue file:bg-darkblue file:dark:bg-darkteal hover:file:dark:bg-darklightblue hover:file:bg-teal file:border-none file:rounded-md file:p-1 file:text-sm bg-sage dark:bg-darksage rounded-md p-1"
						type="file"
						accept=".png,.jpg,.jpeg"
						name="file"
						onChange={(event) => {
							if (!validateUploadedAvatarSize(event.target.files[0].size)) {
								event.target.value = null;
								setNewAvatar(null);
							} else {
								setNewAvatar(event.target.files[0]);
							}
						}}
					/>
					<button
						className="rounded-md bg-darkblue dark:bg-darkteal text-sage dark:text-darkdarkblue hover:bg-teal hover:dark:bg-darkdarkblue hover:text-sage hover:dark:text-darksage text-sm p-2 py-2 m-2"
						onClick={submitNewAvatar}
					>
						Save new avatar
					</button>
					<button
						className="rounded-md bg-darkblue dark:bg-darkteal text-sage dark:text-darkdarkblue hover:bg-teal hover:dark:bg-darkdarkblue hover:text-sage hover:dark:text-darksage text-sm p-2 py-2 m-2"
						onClick={removeAvatar}
					>
						Remove avatar
					</button>
				</form>
			</div>
		);
	}

	function personalInfoSetting() {
		return (
			<div className="bg-lightblue dark:bg-darklightblue rounded-md m-2 p-2">
				<h3 className="font-bold">Personal Information</h3>
				<form className="edit_field" onSubmit={submitUserInfo}>
					<input
						className="bg-sage dark:bg-darksage rounded-md p-2 m-2 focus:outline-none"
						value={newUsername}
						onChange={(e) => {
							setNewUsername(e.target.value);
						}}
					/>
					<input
						className="bg-sage dark:bg-darksage rounded-md p-2 m-2 focus:outline-none"
						value={newEmail}
						onChange={(e) => {
							setNewEmail(e.target.value);
						}}
					/>
					<button className="rounded-md bg-darkblue dark:bg-darkteal text-sage dark:text-darkdarkblue hover:bg-teal hover:dark:bg-darkdarkblue hover:text-sage hover:dark:text-darksage text-sm p-2 py-2 m-2">
						Save changes
					</button>
				</form>
			</div>
		);
	}

	function twoFactorSetting() {
		return (
			<div className="bg-lightblue dark:bg-darklightblue rounded-md m-2 mb-6 p-2">
				<h3 className="font-bold">Security</h3>
				<input
					className="m-2 py-2"
					type="checkbox"
					checked={is2faEnabled}
					onChange={() => {
						if (!is2faEnabled) {
							enable2Fa();
						} else {
							disable2Fa();
						}
					}}
				/>
				<label> Enable two-factor authentication</label>
				{qrcode && (
					<div>
						<div className="flex w-full m-2">
							<img
								className="bg-sage dark:bg-darkdarkblue relative rounded-md overflow-hidden mx-auto my-2"
								alt="QR code"
								src={qrcode}
							></img>
							<div className="relative mx-auto justify-center">
								<form onSubmit={submitTwoFaValidationCode}>
									<input
										className="bg-sage dark:bg-darksage rounded-md p-2 m-2 focus:outline-none"
										placeholder="2fa validation code"
										value={twoFaValidationCode}
										onChange={(e) => {
											setTwoFaValidationCode(e.target.value);
										}}
									/>
									<button className="rounded-md bg-darkblue dark:bg-darkteal text-sage dark:text-darkdarkblue hover:bg-teal hover:dark:bg-darkdarkblue hover:text-sage hover:dark:text-darksage text-sm p-2 py-2 m-2">
										Submit
									</button>
								</form>
							</div>
						</div>
					</div>
				)}
				<canvas id="canvas" className="hidden"></canvas>
			</div>
		);
	}

	return (
		<>
			<div
				className={`fixed left-0 top-0  h-full w-full overflow-y-auto overflow-x-hidden outline-none ${
					isEditingProfile ? "" : "hidden"
				}`}
			>
				<div className="pointer-events-none relative h-[calc(80%-1rem)] w-auto translate-y-[20%] min-[576px]:mx-auto min-[576px]:mt-7 min-[576px]:h-[calc(85%-3.5rem)] min-[576px]:max-w-[500px]">
					<div className="pointer-events-auto relative flex max-h-[90%] w-full flex-col overflow-hidden bg-clip-padding shadow-lg bg-teal dark:bg-darkteal border-2 border-teal dark:border-darkteal border-b-8 rounded-md text-darkblue dark:text-darkdarkblue">
						<div className="flex flex-shrink-0 items-center justify-between rounded-t-md p-4">
							<h2 className="font-bold text-sage dark:text-darkdarkblue text-lg">
								Settings
							</h2>
							<button
								onClick={() => {
									setIsEditingProfile(false);
									setNewAvatar(null);
									if (location.hash === "#settings") {
										navigate("/user/" + authenticatedUserID);
									}
								}}
							>
								{getButtonIcon(
									ButtonIconType.closeSettings,
									"w-6 h-6 text-sage dark:text-darkdarlblue"
								)}
							</button>
						</div>

						<div className="relative overflow-y-auto scrollbar-hide">
							{avatarSetting()}
							{personalInfoSetting()}
							{twoFactorSetting()}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

export default ProfileSettings;
