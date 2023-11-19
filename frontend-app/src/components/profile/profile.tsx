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
import "./profile.css";
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

function titleProfile(isMyPage: boolean, user: User) {
	if (user === undefined) return <h2>User not found</h2>;
	if (isMyPage)
		return (
			<h2>
				My user page ({user.username} - {user.status})
			</h2>
		);

	return (
		<h2>
			User page for {user.username} ({user.status})
		</h2>
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
	socket: Socket
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
			{challengeButton(user, authenticatedUserID, cookies, navigate)}
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
			Edit profile
		</button>
	);
}

function Profile() {
	const [userExists, setUserExists] = useState(false);
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
				console.log("error response load channels");
				return <h1>No such user</h1>;
			}
			setUserExists(true);
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
		if (authenticatedUserID === profileUserID) {
			socket.emit("login", cookies["token"]);
			socket.emit("connection");
			setIsMyPage(true);
		}

		fetchUser();
	}, [cookies, socket, profileUserID]);

	useEffect(() => {
		checkIfIsMyFriend(user, authenticatedUserID, cookies, setIsMyFriend);
		checkIfIsBlocked(user, authenticatedUserID, cookies, setIsBlocked);
	}, [user]);

	return (
		<div id="profile">
			<h3 style={{ color: "white" }}>
				<header>
					<i className="fa fa-bars" aria-hidden="true"></i>
				</header>
				<div className="left-section">
					<img src={profilePicture} className="photo"></img>
					{!userExists ? "User is not logged in" : ""}
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
						socket
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
				<div className="right-section">
					<div className="stats row">
						<div className="stat col-xs-4">
							{FriendsList(isMyPage, user, cookies)}
						</div>
						<div className="stat col-xs-4">{GameHistory(user, cookies)}</div>
					</div>
				</div>
			</h3>
		</div>
	);
}

export default Profile;
