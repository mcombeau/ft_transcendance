import { Status, ChatRoom, typeInvite, User } from "./types";
import { ChangeStatus, isUserMuted } from "./Chat";
import {
	Dispatch,
	MutableRefObject,
	ReactElement,
	SetStateAction,
	useEffect,
	useRef,
	useState,
} from "react";
import { Socket } from "socket.io-client";
import { checkStatus } from "./Chat";
import { ReceivedInfo } from "./types";
import { blockUser, unblockUser, unfriend } from "../profile/profile";
import { ButtonIconType, getButtonIcon } from "../styles/icons";
import { canManageUser, canToggleOperator } from "./ListParticipants";

async function checkIfIsMyFriend(
	user: User,
	authenticatedUserID: number,
	cookies: any,
	setUserIsMyFriend: any
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
			userID2: user.userID,
		}),
	};
	return await fetch(`/backend/friends/isMyFriend`, request).then(
		async (response) => {
			const data = await response.json();
			if (!response.ok) {
				console.warn("Fetch friends bad request");
				return;
			}
			setUserIsMyFriend(data.areFriends);
		}
	);
}

export const ContextMenuEl = (
	contextMenu: boolean,
	target: User,
	setContextMenu: Dispatch<SetStateAction<boolean>>,
	contextMenuPos: { x: number; y: number },
	socket: Socket,
	channel: ChatRoom,
	cookies: any,
	myChats: ChatRoom[],
	authenticatedUserID: number,
	blockedUsers: number[],
	setBlockedUsers: Dispatch<SetStateAction<number[]>>,
	messagesContainer: MutableRefObject<HTMLInputElement>
) => {
	const menuRef = useRef<HTMLDivElement>(null);
	const [invitesMenu, setInvitesMenu] = useState(false);
	const [userIsBlocked, setUserIsBlocked] = useState(false);
	const [userIsMyFriend, setUserIsMyFriend] = useState(false);
	const [iCanChallenge, setICanChallenge] = useState<boolean>(false);
	const iconClass: string = "w-6 h-6 p-1";
	const buttonClass: string =
		"flex items-center pr-2 hover:bg-darkblue hover:dark:bg-darkdarkblue rounded-md m-1";
	const labelClass: string = "";

	useEffect(() => {
		if (target) {
			setUserIsBlocked(blockedUsers.includes(target.userID));
			checkIfIsMyFriend(
				target,
				authenticatedUserID,
				cookies,
				setUserIsMyFriend
			);
		}
	}, [blockedUsers, target, contextMenu]);

	function invite(target: User, type: typeInvite, chat?: ChatRoom) {
		var info: ReceivedInfo = {
			targetID: target.userID,
			inviteInfo: {
				type: type,
			},
		};
		if (type === typeInvite.Chat) {
			if (!chat) {
				console.warn("Invite type chat but no chatroom provided!");
				return;
			}
			info.chatRoomID = chat.chatRoomID;
		}
		ChangeStatus(info, "invite", socket);
		setContextMenu(false);
		setInvitesMenu(false);
	}

	function displayChatInviteButton(chat: ChatRoom) {
		return (
			<div
				className="hover:text-darkblue hover:dark:text-darkdarkblue rounded-md m-1"
				onClick={() => invite(target, typeInvite.Chat, chat)}
			>
				{chat.name}
			</div>
		);
	}

	// Socket receiver for game status
	useEffect(() => {
		if (!socket) {
			return;
		}
		socket.on("is in game", (isActive: boolean) => {
			// cannot challenge the user if I'm in a game
			setICanChallenge(!isActive);
		});
		return () => {
			socket.off("in a game");
		};
	}, [contextMenu, socket]);

	// Check via socket the game status
	useEffect(() => {
		if (!socket) {
			return;
		}
		socket.emit("is in game");
		setInvitesMenu(false);
	}, [contextMenu, cookies, socket]);

	if (!contextMenu || !target) {
		return <div></div>;
	}

	function blockButton() {
		if (userIsBlocked) {
			return (
				<div
					className={buttonClass}
					onClick={() => {
						if (unblockUser(target.userID, authenticatedUserID, cookies)) {
							setBlockedUsers((prev) =>
								prev.filter((userID: number) => userID !== target.userID)
							);
							setUserIsBlocked(false);
						}
						setContextMenu(false);
					}}
				>
					{getButtonIcon(ButtonIconType.unblock, iconClass)}
					<span className={labelClass}>Unblock</span>
				</div>
			);
		}
		return (
			<div
				className={buttonClass}
				onClick={() => {
					if (blockUser(target.userID, authenticatedUserID, cookies)) {
						setBlockedUsers([...blockedUsers, target.userID]);
						setUserIsBlocked(true);
					}
					setContextMenu(false);
				}}
			>
				{getButtonIcon(ButtonIconType.block, iconClass)}
				<span className={labelClass}>Block</span>
			</div>
		);
	}

	function muteButton() {
		return (
			<div
				className={buttonClass}
				onClick={() => {
					var info: ReceivedInfo = {
						chatRoomID: channel.chatRoomID,
						targetID: target.userID,
						participantInfo: {
							mutedUntil: 1,
						},
					};
					ChangeStatus(info, "mute", socket);
					setContextMenu(false);
				}}
			>
				{getButtonIcon(ButtonIconType.mute, iconClass)}
				<span className={labelClass}>Mute</span>
			</div>
		);
	}

	function unmuteButton() {
		return (
			<div
				className={buttonClass}
				onClick={() => {
					var info: ReceivedInfo = {
						chatRoomID: channel.chatRoomID,
						targetID: target.userID,
						participantInfo: {
							mutedUntil: 0,
						},
					};
					ChangeStatus(info, "mute", socket);
					setContextMenu(false);
				}}
			>
				{getButtonIcon(ButtonIconType.unmute, iconClass)}
				<span className={labelClass}>Unmute</span>
			</div>
		);
	}

	function kickButton() {
		return (
			<div
				className={buttonClass}
				onClick={() => {
					var info: ReceivedInfo = {
						chatRoomID: channel.chatRoomID,
						targetID: target.userID,
					};
					ChangeStatus(info, "kick", socket);
					setContextMenu(false);
				}}
			>
				{getButtonIcon(ButtonIconType.kick, iconClass)}
				<span className={labelClass}>Kick</span>
			</div>
		);
	}

	function banButton() {
		return (
			<div
				className={buttonClass}
				onClick={() => {
					var info: ReceivedInfo = {
						chatRoomID: channel.chatRoomID,
						targetID: target.userID,
					};
					ChangeStatus(info, "ban", socket);
					setContextMenu(false);
				}}
			>
				{getButtonIcon(ButtonIconType.ban, iconClass)}
				<span className={labelClass}>Ban</span>
			</div>
		);
	}
	function operatorButton() {
		return (
			<div
				className={buttonClass}
				onClick={() => {
					var info: ReceivedInfo = {
						chatRoomID: channel.chatRoomID,
						targetID: target.userID,
					};
					ChangeStatus(info, "operator", socket);
					setContextMenu(false);
				}}
			>
				{checkStatus(channel, target.userID) === Status.Operator
					? getButtonIcon(ButtonIconType.operator, iconClass)
					: getButtonIcon(ButtonIconType.operator, iconClass)}
				{checkStatus(channel, target.userID) === Status.Operator ? (
					<span className={labelClass}>Remove admin</span>
				) : (
					<span className={labelClass}>Make admin</span>
				)}
			</div>
		);
	}

	function dmButton() {
		return (
			<div
				className={buttonClass}
				onClick={() => {
					var info: ReceivedInfo = {
						chatRoomID: channel.chatRoomID,
						targetID: target.userID,
					};
					ChangeStatus(info, "dm", socket);
					setContextMenu(false);
				}}
			>
				{getButtonIcon(ButtonIconType.dm, iconClass)}
				<span className={labelClass}>DM</span>
			</div>
		);
	}

	function inviteToChannelButton() {
		return (
			<div
				className={buttonClass}
				onClick={() => {
					setInvitesMenu(true);
				}}
			>
				{getButtonIcon(ButtonIconType.invite, iconClass)}
				<span className={labelClass}>Invite to channel</span>
			</div>
		);
	}

	function challengeButton() {
		return (
			<div
				className={buttonClass}
				onClick={() => {
					invite(target, typeInvite.Game);
					setContextMenu(false);
				}}
			>
				{getButtonIcon(ButtonIconType.challenge, iconClass)}
				<span className={labelClass}>Challenge</span>
			</div>
		);
	}
	function unfriendButton() {
		return (
			<div
				className={buttonClass}
				onClick={() => {
					unfriend(target.userID, authenticatedUserID, cookies);
					setContextMenu(false);
				}}
			>
				{getButtonIcon(ButtonIconType.unfriend, iconClass)}
				<span className={labelClass}>Unfriend</span>
			</div>
		);
	}

	function friendButton() {
		return (
			<div
				className={buttonClass}
				onClick={() => {
					invite(target, typeInvite.Friend);
					setContextMenu(false);
				}}
			>
				{getButtonIcon(ButtonIconType.friend, iconClass)}
				<span className={labelClass}>Add friend</span>
			</div>
		);
	}

	function closeMenuButton() {
		return (
			<div
				className=""
				onClick={() => {
					setContextMenu(false);
					setInvitesMenu(false);
				}}
			>
				{getButtonIcon(
					ButtonIconType.closeSettings,
					"w-5 h-5 text-sage dark:text-sagedark"
				)}
			</div>
		);
	}

	let options: ReactElement;
	if (!invitesMenu) {
		options = (
			<>
				<div className="flex justify-between items-center p-1">
					<span className="text-sm">{target.username}</span>
					{closeMenuButton()}
				</div>
				{blockButton()}
				{inviteToChannelButton()}
				{iCanChallenge ? challengeButton() : <></>}
				{userIsMyFriend ? unfriendButton() : friendButton()}
				{channel.isDM === false ? dmButton() : <></>}
				{canManageUser(target, authenticatedUserID, channel) ? (
					<div>
						{isUserMuted(target) ? unmuteButton() : muteButton()}
						{kickButton()}
						{banButton()}
					</div>
				) : (
					<div></div>
				)}
				{canToggleOperator(target, authenticatedUserID, channel) ? (
					<div>{operatorButton()}</div>
				) : (
					<div></div>
				)}
			</>
		);
	} else {
		// List chat you can join
		options = (
			<>
				<div className="flex justify-between p-1">
					<span>{target.username}</span>
					{closeMenuButton()}
				</div>
				{myChats.filter((chat) => !chat.isDM).map(displayChatInviteButton)}
			</>
		);
	}

	return (
		<div
			ref={menuRef}
			className={`bg-teal dark:bg-darkteal rounded-md text-sage dark:text-darksage absolute p-0 overflow-y-scroll z-40 scrollbar-hide font-light text-xs`}
			style={{
				top: `${
					contextMenuPos.y - messagesContainer.current.getBoundingClientRect().y
				}px`,
				left: `${
					contextMenuPos.x - messagesContainer.current.getBoundingClientRect().x
				}px`,
				maxHeight: `${
					messagesContainer.current.getBoundingClientRect().height -
					(contextMenuPos.y -
						messagesContainer.current.getBoundingClientRect().y)
				}px`,
			}}
		>
			{options}
		</div>
	);
};

export default ContextMenuEl;
