import { ReceivedInfo } from "../chat/types";
import { useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useCookies } from "react-cookie";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import FriendsList from "./friendsList";
import GameHistory from "./history";
import ProfileSettings from "./profileSettings";
import { AuthenticationContext } from "../authenticationState";
import { typeInvite } from "../chat/types";
import { Socket } from "socket.io-client";

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
	let statusColor: string;
	switch (user.status) {
		case UserStatus.Online:
			statusColor = "bg-online";
			break;

		case UserStatus.Offline:
			statusColor = "bg-offline";

			break;

		default:
			statusColor = "bg-ingame";
			break;
	}
	return (
		<div className="flex items-center">
			<h2 className="w-full font-bold text-3xl ">{user.username}</h2>
			<div className="flex items-center bg-sage rounded-lg p-1.5">
				<span className={`rounded-full w-1 h-1 p-1.5 m-2 ${statusColor}`} />
				<p className="px-2"> {user.status}</p>
			</div>
		</div>
	);
}

function userDetails(user: User) {
	if (user === undefined) return <div />;
	return (
		<p>
			{user.login42 ? " aka " + user.login42 : ""}
			<br /> Email is : {user.email}
		</p>
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
			console.log("Error inviting friend");
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
		console.log("response");
		console.log(response);
		if (!response.ok) {
			console.log("Error removing friend");
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
			console.log("Fetch friends bad request");
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
				console.log("Fetch is user blocked bad request");
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
	console.log("blocking user");
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
			console.log("Error blocking user");
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
	console.log("Unblocking user");
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
		console.log("response");
		console.log(response);
		if (!response.ok) {
			console.log("Error unblocking user");
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
	// TODO: check if need be async
	if (isBlocked) return <div></div>;
	if (isMyFriend) {
		return (
			<button
				onClick={() => {
					if (unfriend(user.id, authenticatedUserID, cookies)) {
						setIsMyFriend(false);
					}
				}}
			>
				Unfriend
			</button>
		);
	}
	return (
		<button
			onClick={() => {
				if (befriend(user.id, authenticatedUserID, cookies)) {
					setIsMyFriend(true);
				}
			}}
		>
			Add friend
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
				onClick={() => {
					if (unblockUser(user.id, authenticatedUserID, cookies))
						setIsBlocked(false);
				}}
			>
				Unblock
			</button>
		);
	}
	return (
		<button
			onClick={() => {
				if (blockUser(user.id, authenticatedUserID, cookies))
					setIsBlocked(true);
			}}
		>
			Block
		</button>
	);
}

async function challenge(
	user: User,
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
			invitedUserID: user.id,
		}),
	};
	const inviteID = await fetch("/backend/invites", request).then(
		async (response) => {
			const data = await response.json();
			if (!response.ok) {
				console.log("Error inviting friend to play");
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
			onClick={() => challenge(user, authenticatedUserID, cookies, navigate)}
		>
			Challenge
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
		<button onClick={() => DM(user, cookies, navigate, socket)}>
			Send message
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
	if (isMyPage) return <p></p>;
	return (
		<p>
			{friendButton(
				user,
				authenticatedUserID,
				cookies,
				isMyFriend,
				setIsMyFriend,
				isBlocked
			)}
			{blockButton(user, authenticatedUserID, cookies, isBlocked, setIsBlocked)}
			{iCanChallenge ? (
				challengeButton(user, authenticatedUserID, cookies, navigate)
			) : (
				<></>
			)}
			{DMButton(user, cookies, navigate, socket)}
		</p>
	);
}

function editProfile(
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
			onClick={() => {
				setIsEditingProfile(true);
			}}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				className="w-10 h-10"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495"
				/>
			</svg>
		</button>
	);
}

function Profile() {
	var profileUserID: number = Number(useParams().id);
	const [user, setUser] = useState<User>();
	const [isMyPage, setIsMyPage] = useState(false);
	const [cookies] = useCookies(["token"]);
	const socket = useContext(WebSocketContext);
	const [isEditingProfile, setIsEditingProfile] = useState(false);
	const [isMyFriend, setIsMyFriend] = useState(false);
	const [isBlocked, setIsBlocked] = useState(false);
	const { authenticatedUserID } = useContext(AuthenticationContext);
	const [profilePicture, setProfilePicture] = useState(null);
	const [friends, setFriends] = useState<Friend[]>();
	const [iCanChallenge, setICanChallenge] = useState<boolean>(false);
	const navigate = useNavigate();

	async function fetchUser() {
		var request = {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${cookies["token"]}`,
			},
		};

		fetch(`/backend/users/${profileUserID}`, request).then(async (response) => {
			const data = await response.json();
			if (!response.ok) {
				console.log("error response fetching user");
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
					console.log("error fetching avatar");
					return <h1>No such user</h1>;
				}
				const src = URL.createObjectURL(data);
				setProfilePicture(src);
			}
		);
	}

	useEffect(() => {
		fetchUser();
		if (authenticatedUserID === profileUserID) {
			setIsMyPage(true);
		}
	}, [cookies, socket, profileUserID]);

	useEffect(() => {
		checkIfIsMyFriend(user, authenticatedUserID, cookies, setIsMyFriend);
		checkIfIsBlocked(user, authenticatedUserID, cookies, setIsBlocked);
	}, [user]);

	useEffect(() => {
		socket.on(
			"status change",
			(body: { userID: number; userStatus: UserStatus }) => {
				setUser((user: User) => {
					if (!user) return user;
					console.log("user inside", user);
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
	}, []);

	useEffect(() => {
		socket.emit("is in game", cookies["token"]);
	}, []);

	return (
		<div id="profile" className="grid grid-cols-2 gap-4">
			<div>
				<div className="background-element grid grid-cols-2">
					<img
						src={profilePicture}
						className="rounded-full w-60 h-60 m-4"
					></img>
					<div>
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
						{editProfile(isMyPage, user, isEditingProfile, setIsEditingProfile)}
						{ProfileSettings(
							user,
							cookies,
							isEditingProfile,
							setIsEditingProfile,
							authenticatedUserID
						)}
					</div>
				</div>
				{FriendsList(isMyPage, user, cookies, friends, setFriends)}
			</div>
			<div className="background-element">{GameHistory(user, cookies)}</div>
		</div>
	);
}

export default Profile;
