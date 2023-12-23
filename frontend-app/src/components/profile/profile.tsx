import { ReceivedInfo } from "../chat/types";
import { useCallback, useContext, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useCookies } from "react-cookie";
import FriendsList from "./friendsList";
import GameHistory from "./history";
import ProfileSettings from "./profileSettings";
import { AuthenticationContext } from "../authenticationState";
import { typeInvite } from "../chat/types";
import { Socket } from "socket.io-client";
import { ButtonIconType, getButtonIcon } from "../styles/icons";
import { BannerType, createBanner } from "../banner/Banner";
import { useWebSocket } from "../../contexts/WebsocketContext";

export enum UserStatus {
	Offline = "offline",
	Online = "online",
	InGame = "in game",
}

export type User = {
	id: number;
	username: string;
	email: string;
	login42: string;
	isTwoFaEnabled: boolean;
	status: UserStatus;
};

export type Friend = {
	id: number;
	username: string;
	status: UserStatus;
	avatar?: string;
};

function titleProfile(isMyPage: boolean, user: User) {
	if (user === undefined) return <h2>User not found</h2>;
	let statusColor: string = getUserStatusColor(user.status);
	return (
		<div className="flex items-center mb-3">
			<h2 className="w-full font-bold text-3xl ">{user.username}</h2>
			<div className="flex items-center bg-sage dark:bg-darksage rounded-lg p-1.5">
				<span className={`rounded-full w-1 h-1 p-1.5 m-2 ${statusColor}`} />
				<p className="px-2 block"> {user.status}</p>
			</div>
		</div>
	);
}

export function getUserStatusColor(status: UserStatus) {
	switch (status) {
		case UserStatus.Online:
			return "bg-online";

		case UserStatus.Offline:
			return "bg-offline";

		default:
			return "bg-ingame";
	}
}

function userDetails(user: User) {
	if (user === undefined) return <div />;
	return (
		<div>
			<p>
				{user.login42 ? (
					<>
						aka <i>{user.login42}</i>
					</>
				) : (
					<></>
				)}
			</p>
			<p>{user.email}</p>
		</div>
	);
}

async function befriend(
	userID: number,
	authenticatedUserID: number,
	cookies: any
) {
	var request = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${cookies["token"]}`,
		},
		body: JSON.stringify({
			type: typeInvite.Friend,
			senderID: authenticatedUserID,
			invitedUserID: userID,
		}),
	};
	return fetch(`/backend/invites`, request).then(async (response) => {
		if (!response.ok) {
			console.warn("Error inviting friend");
			return false;
		}
		return true;
	});
}

export async function unfriend(
	userID: number,
	authenticatedUserID: number,
	cookies: any
) {
	var request = {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${cookies["token"]}`,
		},
		body: JSON.stringify({
			userID1: authenticatedUserID,
			userID2: userID,
		}),
	};
	return fetch(`/backend/friends`, request).then(async (response) => {
		if (!response.ok) {
			console.warn("Error removing friend");
			return false;
		}
		return true;
	});
}

async function checkIfIsMyFriend(
	user: User,
	authenticatedUserID: number,
	cookies: any,
	setIsMyFriend: any
) {
	if (user === undefined) return;
	var request = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${cookies["token"]}`,
		},
		body: JSON.stringify({
			userID1: authenticatedUserID,
			userID2: user.id,
		}),
	};
	await fetch(`/backend/friends/isMyFriend`, request).then(async (response) => {
		const data = await response.json();
		if (!response.ok) {
			console.warn("Fetch friends bad request");
			return;
		}
		setIsMyFriend(data.areFriends);
	});
}

async function checkIfIsBlocked(
	user: User,
	authenticatedUserID: number,
	cookies: any,
	setIsBlocked: any
) {
	if (user === undefined) return;
	var request = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${cookies["token"]}`,
		},
		body: JSON.stringify({
			blockingUserID: authenticatedUserID,
			blockedUserID: user.id,
		}),
	};
	await fetch(`/backend/blocked-users/isUserBlocked`, request).then(
		async (response) => {
			const data = await response.json();
			if (!response.ok) {
				console.warn("Fetch is user blocked bad request");
				return;
			}
			setIsBlocked(data.isBlocked);
		}
	);
}

export async function blockUser(
	userID: number,
	authenticatedUserID: number,
	cookies: any
) {
	var request = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${cookies["token"]}`,
		},
		body: JSON.stringify({
			blockingUserID: authenticatedUserID,
			blockedUserID: userID,
		}),
	};
	return fetch(`/backend/blocked-users`, request).then(async (response) => {
		if (!response.ok) {
			console.warn("Error blocking user");
			return false;
		}
		return true;
	});
}

export async function unblockUser(
	userID: number,
	authenticatedUserID: number,
	cookies: any
) {
	var request = {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${cookies["token"]}`,
		},
		body: JSON.stringify({
			blockingUserID: authenticatedUserID,
			blockedUserID: userID,
		}),
	};
	return fetch(`/backend/blocked-users`, request).then(async (response) => {
		if (!response.ok) {
			console.warn("Error unblocking user");
			return false;
		}
		return true;
	});
}

function friendButton(
	user: User,
	authenticatedUserID: number,
	cookies: any,
	isMyFriend: boolean,
	setIsMyFriend: any,
	isBlocked: boolean
) {
	if (isBlocked) return <div></div>;
	if (isMyFriend) {
		return (
			<button
				className="button"
				onClick={() => {
					if (unfriend(user.id, authenticatedUserID, cookies)) {
						setIsMyFriend(false);
					}
				}}
			>
				{getButtonIcon(ButtonIconType.unfriend)}
			</button>
		);
	}
	return (
		<button
			className="button"
			onClick={() => {
				if (befriend(user.id, authenticatedUserID, cookies)) {
					setIsMyFriend(true);
				}
			}}
		>
			{getButtonIcon(ButtonIconType.friend)}
		</button>
	);
}

function blockButton(
	user: User,
	authenticatedUserID: number,
	cookies: any,
	isBlocked: boolean,
	setIsBlocked: any
) {
	if (isBlocked) {
		return (
			<button
				className="button"
				onClick={() => {
					if (unblockUser(user.id, authenticatedUserID, cookies))
						setIsBlocked(false);
				}}
			>
				{getButtonIcon(ButtonIconType.unblock)}
			</button>
		);
	}
	return (
		<button
			className="button"
			onClick={() => {
				if (blockUser(user.id, authenticatedUserID, cookies))
					setIsBlocked(true);
			}}
		>
			{getButtonIcon(ButtonIconType.block)}
		</button>
	);
}

export async function challenge(
	userID: number,
	authenticatedUserID: number,
	cookies: any,
	navigate: any
) {
	var request = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${cookies["token"]}`,
		},
		body: JSON.stringify({
			type: typeInvite.Game,
			senderID: authenticatedUserID,
			invitedUserID: userID,
		}),
	};
	const inviteID = await fetch("/backend/invites", request).then(
		async (response) => {
			const data = await response.json();
			if (!response.ok) {
				console.warn("Error inviting friend to play", data.message);
				// TODO: Add banner here with data.message as content
				return null;
			}
			return data.id;
		}
	);
	if (inviteID) {
		navigate("/play/" + inviteID);
	}
}

function challengeButton(
	user: User,
	authenticatedUserID: number,
	cookies: any,
	navigate: any
) {
	return (
		<button
			className="button"
			onClick={() => challenge(user.id, authenticatedUserID, cookies, navigate)}
		>
			{getButtonIcon(ButtonIconType.challenge)}
		</button>
	);
}

function DM(user: User, cookies: any, navigate: any, socket: Socket) {
	var info: ReceivedInfo = {
		token: cookies["token"],
		chatRoomID: null,
		targetID: user.id,
	};
	socket.emit("dm", info);
	navigate("/chat/" + user.id);
}

function DMButton(user: User, cookies: any, navigate: any, socket: Socket) {
	return (
		<button
			className="button"
			onClick={() => DM(user, cookies, navigate, socket)}
		>
			{getButtonIcon(ButtonIconType.dm)}
		</button>
	);
}

function interactWithUser(
	isMyPage: boolean,
	isMyFriend: boolean,
	setIsMyFriend: any,
	isBlocked: boolean,
	setIsBlocked: any,
	user: User,
	authenticatedUserID: number,
	cookies: any,
	navigate: any,
	socket: Socket,
	iCanChallenge: boolean
) {
	if (user === undefined) return <div />;
	if (isMyPage) return <></>;
	return (
		<div className="absolute bottom-0 right-0">
			{friendButton(
				user,
				authenticatedUserID,
				cookies,
				isMyFriend,
				setIsMyFriend,
				isBlocked
			)}
			{blockButton(user, authenticatedUserID, cookies, isBlocked, setIsBlocked)}
			{iCanChallenge && !isBlocked ? (
				challengeButton(user, authenticatedUserID, cookies, navigate)
			) : (
				<></>
			)}
			{isBlocked ? <></> : DMButton(user, cookies, navigate, socket)}
		</div>
	);
}

function editProfileButton(
	isMyPage: boolean,
	user: User,
	isEditingProfile: any,
	setIsEditingProfile: any
) {
	if (user === undefined) return <div />;
	if (!isMyPage) return <div></div>;
	if (isEditingProfile) return <div></div>;
	return (
		<button
			className="button absolute bottom-0 right-0"
			onClick={() => {
				setIsEditingProfile(true);
			}}
		>
			{getButtonIcon(ButtonIconType.settings)}
		</button>
	);
}

function Profile({ setBanners }) {
	var profileUserID: number = Number(useParams().id);
	let location = useLocation();
	const [user, setUser] = useState<User>();
	const [isMyPage, setIsMyPage] = useState(false);
	const [cookies] = useCookies(["token"]);
	const socket = useWebSocket();
	const [isEditingProfile, setIsEditingProfile] = useState(false);
	const [changeProfile, setChangeProfile] = useState(false);
	const [isMyFriend, setIsMyFriend] = useState(false);
	const [isBlocked, setIsBlocked] = useState(false);
	const { authenticatedUserID } = useContext(AuthenticationContext);
	const [profilePicture, setProfilePicture] = useState(null);
	const [friends, setFriends] = useState<Friend[]>();
	const [iCanChallenge, setICanChallenge] = useState<boolean>(false);
	const navigate = useNavigate();

	const fetchUser = useCallback(() => {
		var request = {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${cookies["token"]}`,
			},
		};

		fetch(`/backend/users/${profileUserID}`, request).then(async (response) => {
			const data = await response.json();
			if (!response.ok) {
				console.warn("error response fetching user");
				navigate("/not-found");
				return;
			}

			setUser({
				id: data.id,
				username: data.username,
				email: data.email,
				login42: data.login42 ? data.login42 : "",
				isTwoFaEnabled: data.isTwoFactorAuthenticationEnabled,
				status: data.status,
			});
		});

		fetch(`/backend/users/${profileUserID}/avatar`, request).then(
			async (response) => {
				const data = await response.blob();
				if (!response.ok) {
					console.warn("error fetching avatar");
					createBanner(
						"Error while fetching avatar",
						setBanners,
						BannerType.Alert
					);
					return <h1>No such user</h1>;
				}
				const src = URL.createObjectURL(data);
				setProfilePicture(src);
			}
		);
	}, [cookies, navigate, profileUserID, setBanners]);

	// Fetch user and check if is authenticated
	useEffect(() => {
		fetchUser();
		if (authenticatedUserID === profileUserID) {
			setIsMyPage(true);
		}
	}, [
		cookies,
		socket,
		profileUserID,
		changeProfile,
		authenticatedUserID,
		fetchUser,
	]);

	// Checks for page user relationship to authenticated user
	useEffect(() => {
		checkIfIsMyFriend(user, authenticatedUserID, cookies, setIsMyFriend);
		checkIfIsBlocked(user, authenticatedUserID, cookies, setIsBlocked);
	}, [user, authenticatedUserID, cookies]);

	// Socket receivers for status
	useEffect(() => {
		if (socket) {
			socket.on(
				"status change",
				(body: { userID: number; userStatus: UserStatus }) => {
					setUser((user: User) => {
						if (!user) return user;
						if (user.id === body.userID) {
							return {
								...user,
								status: body.userStatus,
							};
						} else {
							return user;
						}
					});
					setFriends((friends: Friend[]) => {
						if (!friends) return friends;
						return friends.map((friend: Friend) => {
							if (friend.id === body.userID) {
								return {
									...friend,
									status: body.userStatus,
								};
							} else return friend;
						});
					});
				}
			);
			socket.on("is in game", (isActive: boolean) => {
				// cannot challenge the user if I'm in a game
				setICanChallenge(!isActive);
			});
			return () => {
				socket.off("status change");
				socket.off("in a game");
			};
		}
	}, [socket]);

	// Check game status via socket
	useEffect(() => {
		if (socket) {
			socket.emit("is in game", cookies["token"]);
		}
	}, [cookies, socket]);

	// Check url hash for settings
	useEffect(() => {
		if (
			user &&
			location.hash === "#settings" &&
			authenticatedUserID === profileUserID
		) {
			setIsEditingProfile(true);
		}
	}, [user, authenticatedUserID, location.hash, profileUserID]);

	useEffect(() => {
		if (!authenticatedUserID) {
			navigate("/not-found");
		}
	}, [authenticatedUserID, navigate]);

	return (
		<div id="profile" className=" md:grid md:grid-cols-2">
			<div className="flex flex-col">
				<div className="background-element flex flex-row">
					<img
						className="object-cover w-20 h-20 rounded-full xl:w-60 xl:h-60 m-4"
						alt="Avatar"
						src={profilePicture}
					></img>
					<div className="relative grow grid grid-rows-3">
						{titleProfile(isMyPage, user)}
						{userDetails(user)}
						{interactWithUser(
							isMyPage,
							isMyFriend,
							setIsMyFriend,
							isBlocked,
							setIsBlocked,
							user,
							authenticatedUserID,
							cookies,
							navigate,
							socket,
							iCanChallenge
						)}
						{editProfileButton(
							isMyPage,
							user,
							isEditingProfile,
							setIsEditingProfile
						)}
					</div>
				</div>
				{FriendsList(isMyPage, user, cookies, friends, setFriends)}
			</div>
			<div className="">{GameHistory(user, cookies)}</div>
			{ProfileSettings(
				user,
				cookies,
				isEditingProfile,
				setIsEditingProfile,
				authenticatedUserID,
				setBanners,
				setChangeProfile
			)}
		</div>
	);
}

export default Profile;
