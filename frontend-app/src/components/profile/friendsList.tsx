import {
	Dispatch,
	ReactElement,
	SetStateAction,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import { AuthenticationContext } from "../authenticationState";
import { getButtonIcon, ButtonIconType } from "../styles/icons";
import {
	blockUser,
	challenge,
	getUserStatusColor,
	unblockUser,
	unfriend,
	User,
} from "./profile";
import { Friend } from "./profile";
import { GameInfo } from "../play/play";
import { IoEye } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

type BlockedUser = Friend;

function getFriendGame(friend: Friend, gameInfos: GameInfo[]) {
	return gameInfos.find(
		(gameInfo: GameInfo) =>
			gameInfo.player1.userID === friend.id ||
			gameInfo.player2.userID === friend.id
	);
}

function removeFriendFromList(userID: number, setFriends: any) {
	setFriends((friends: Friend[]) =>
		friends.filter((friend) => friend.id !== userID)
	);
}

export function linkToGame(gameInfo: GameInfo) {
	return (
		<a
			className=" hover:text-lightblue hover:dark:text-darklightblue"
			href={"/watch/" + gameInfo.socketRoomID}
		>
			<IoEye className="w-6 h-6" />
		</a>
	);
}

function blockButton(
	myID: number,
	targetID: number,
	cookies: any,
	setFriends: any
) {
	return (
		<button
			className="button-sm"
			onClick={() => {
				if (blockUser(targetID, myID, cookies)) {
					removeFriendFromList(targetID, setFriends);
				}
			}}
		>
			{getButtonIcon(ButtonIconType.block, "button-icon-sm")}
		</button>
	);
}

function unblockButton(
	myID: number,
	targetID: number,
	cookies: any,
	setFriends: any
) {
	return (
		<button
			className="button-sm"
			onClick={() => {
				if (unblockUser(targetID, myID, cookies)) {
					removeFriendFromList(targetID, setFriends);
				}
			}}
		>
			{getButtonIcon(ButtonIconType.unblock, "button-icon-sm")}
		</button>
	);
}

function unfriendButton(
	myID: number,
	targetID: number,
	cookies: any,
	setFriends: any
) {
	return (
		<button
			className="button-sm"
			onClick={() => {
				if (unfriend(targetID, myID, cookies)) {
					removeFriendFromList(targetID, setFriends);
				}
			}}
		>
			{getButtonIcon(ButtonIconType.unfriend, "button-icon-sm")}
		</button>
	);
}

function challengeButton(
	myID: number,
	friendID: number,
	cookies: any,
	navigate: any
) {
	return (
		<button
			className="button-sm"
			onClick={() => challenge(friendID, myID, cookies, navigate)}
		>
			{getButtonIcon(ButtonIconType.challenge, "button-icon-sm")}
		</button>
	);
}

function displayFriend(
	friend: Friend,
	isMyPage: boolean,
	myID: number,
	cookies: any,
	setFriends: any,
	gameInfos: GameInfo[],
	navigate: any,
	key: number,
	blocked: boolean = false
) {
	if (blocked) {
		return (
			<li
				className="grid grid-cols-2 border border-sage dark:border-darksage rounded-md my-2"
				key={key}
			>
				<a className="flex items-center" href={"/user/" + friend.id}>
					<p className="font-bold m-2">{friend.username}</p>
				</a>
				<div className="justify-self-end">
					{unblockButton(myID, friend.id, cookies, setFriends)}
				</div>
			</li>
		);
	}
	const friendGame = getFriendGame(friend, gameInfos);

	let showButtons: ReactElement;
	if (isMyPage) {
		showButtons = (
			<div className="justify-self-end">
				{blockButton(myID, friend.id, cookies, setFriends)}
				{unfriendButton(myID, friend.id, cookies, setFriends)}
				{challengeButton(myID, friend.id, cookies, navigate)}
			</div>
		);
	} else {
		showButtons = <div></div>;
	}

	return (
		<li
			className="grid grid-cols-2 border border-sage dark:border-darksage rounded-md my-2"
			key={key}
		>
			<div className="flex items-center">
				<a className="relative px-1" href={"/user/" + friend.id}>
					<img
						className="rounded-full h-8 w-8 m-2"
						alt="Friend Avatar"
						src={friend.avatar}
					/>
					<span
						className={`absolute bottom-0 right-0 rounded-full w-1 h-1 p-1.5 m-2 ${getUserStatusColor(
							friend.status
						)}`}
					/>
				</a>
				<a className="font-bold m-2" href={"/user/" + friend.id}>
					{friend.username}
				</a>
				{friendGame ? (
					<div className="hidden lg:block"> {linkToGame(friendGame)}</div>
				) : (
					""
				)}
			</div>
			{showButtons}
		</li>
	);
}

function displayFriends(
	friends: Friend[],
	isMyPage: boolean,
	myID: number,
	cookies: any,
	setFriends: any,
	gameInfos: GameInfo[],
	navigate: any,
	blocked: boolean = false
) {
	if (friends === undefined)
		return <ul>{blocked ? "Nobody blocked" : "No friends"}</ul>;
	return (
		<ul>
			{friends.map((friend: Friend, key: number) =>
				displayFriend(
					friend,
					isMyPage,
					myID,
					cookies,
					setFriends,
					gameInfos,
					navigate,
					key,
					blocked
				)
			)}
		</ul>
	);
}

function FriendsList(
	isMyPage: boolean,
	user: User,
	cookies: any,
	friends: Friend[],
	setFriends: Dispatch<SetStateAction<Friend[]>>
) {
	const [gameInfos, setGameInfos] = useState<GameInfo[]>([]);
	const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>();
	const { authenticatedUserID } = useContext(AuthenticationContext);
	const socket = useContext(WebSocketContext);
	const navigate = useNavigate();

	const fetchFriends = useCallback(
		async (userID: number, cookies: any) => {
			var request = {
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${cookies["token"]}`,
				},
			};
			await fetch(`/backend/users/${userID}/friends`, request).then(
				async (response) => {
					const friendsData = await response.json();
					if (!response.ok) {
						console.warn("error response loading friends list");
						return <h1>No Friends loaded</h1>;
					}
					var fetchedFriends = await Promise.all(
						friendsData.map(async (fetchedFriend: any) => {
							const amIUser1 = fetchedFriend.userID1 === user.id;

							const avatar: string = await fetch(
								`/backend/users/${
									amIUser1 ? fetchedFriend.userID2 : fetchedFriend.userID1
								}/avatar`,
								request
							).then(async (response) => {
								const data = await response.blob();
								if (!response.ok) {
									console.warn("error fetching avatar");
									return null;
								}
								const src = URL.createObjectURL(data);
								return src;
							});
							let newFriend: Friend;
							if (!amIUser1) {
								newFriend = {
									id: fetchedFriend.userID1,
									username: fetchedFriend.username1,
									status: fetchedFriend.userStatus1,
									avatar: avatar,
								};
							} else {
								newFriend = {
									id: fetchedFriend.userID2,
									username: fetchedFriend.username2,
									status: fetchedFriend.userStatus2,
									avatar: avatar,
								};
							}
							return newFriend;
						})
					);
					setFriends([...fetchedFriends]);
				}
			);
			if (isMyPage) {
				fetch(`/backend/users/${userID}/blockedUsers`, request).then(
					async (response) => {
						const blockedData = await response.json();
						if (!response.ok) {
							console.warn("error response loading blocked users list");
							return <h1>No Blocked Users loaded</h1>;
						}
						var fetchedBlockedUsers = blockedData.map(
							(fetchedBlockedUser: any) => {
								const amIUser1 = fetchedBlockedUser.userID1 === user.id;
								let newBlockedUser: BlockedUser;
								if (!amIUser1) {
									newBlockedUser = {
										id: fetchedBlockedUser.blockedUserID,
										username: fetchedBlockedUser.blockedUsername,
										status: fetchedBlockedUser.blockedUserStatus,
									};
								} else {
									newBlockedUser = {
										id: fetchedBlockedUser.blockedUserID,
										username: fetchedBlockedUser.blockedUsername,
										status: fetchedBlockedUser.blockedUserStatus,
									};
								}
								return newBlockedUser;
							}
						);
						setBlockedUsers([...fetchedBlockedUsers]);
					}
				);
			}
		},
		[setFriends, user, isMyPage]
	);

	useEffect(() => {
		if (user !== undefined) {
			fetchFriends(user.id, cookies);
		}

		socket.emit("get games", cookies["token"]);
	}, [user, cookies, fetchFriends, socket]);

	useEffect(() => {
		socket.on("get games", (data: GameInfo[]) => {
			if (data) {
				setGameInfos(data);
			}
		});
	}, [socket]);

	if (user === undefined) {
		return <div></div>;
	}

	return (
		<div className="background-element flex-1">
			<div className="my-2">
				<h3 className="title-element">Friends list:</h3>
				{displayFriends(
					friends,
					isMyPage,
					authenticatedUserID,
					cookies,
					setFriends,
					gameInfos,
					navigate
				)}
			</div>
			{isMyPage ? (
				<div className="border-t border-sage dark:border-darksage">
					<h3 className="title-element">Blocked Users:</h3>
					{displayFriends(
						blockedUsers,
						isMyPage,
						authenticatedUserID,
						cookies,
						setBlockedUsers,
						gameInfos,
						navigate,
						true
					)}
				</div>
			) : (
				<div></div>
			)}
		</div>
	);
}

export default FriendsList;
