import { Status, ChatRoom, typeInvite } from "./types";
import { ChangeStatus } from "./Chat";
import {
	Dispatch,
	MutableRefObject,
	SetStateAction,
	useEffect,
	useRef,
	useState,
} from "react";
import { Socket } from "socket.io-client";
import { checkStatus } from "./Chat";
import { ReceivedInfo } from "./types";
import { blockUser, unblockUser } from "../profile/profile";
import { ButtonIconType, getButtonIcon } from "../styles/icons";

export const ContextMenuEl = (
	contextMenu: boolean,
	target: { id: number; username: string },
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
	const [iCanChallenge, setICanChallenge] = useState<boolean>(false);

	useEffect(() => {
		setUserIsBlocked(blockedUsers.includes(target.id));
	}, []);

	function invite(
		e: any,
		target: { id: number; username: string },
		type: typeInvite
	) {
		var info: ReceivedInfo = {
			token: cookies["token"],
			targetID: target.id,
			inviteInfo: {
				type: type,
			},
		};
		if (type === typeInvite.Chat) {
			info.chatRoomID = parseInt(
				(e.target as HTMLInputElement).getAttribute("value")
			);
		}
		console.log("Sent invite", info);
		console.log("Invite info", info.inviteInfo);
		ChangeStatus(info, "invite", socket);
		setContextMenu(false);
		setInvitesMenu(false);
	}

	function displayChatInviteButton(chat: ChatRoom) {
		return (
			<li
				value={chat.chatRoomID}
				onClick={(e) => invite(e, target, typeInvite.Chat)}
			>
				{chat.name}
			</li>
		);
	}

	function onPageClick(event: any) {
		event.stopPropagation();
		if (menuRef && menuRef.current && !menuRef.current.contains(event.target)) {
			setContextMenu(false);
		}
	}

	// Socket receiver for game status
	useEffect(() => {
		socket.on("is in game", (isActive: boolean) => {
			// cannot challenge the user if I'm in a game
			setICanChallenge(!isActive);
		});
		return () => {
			socket.off("in a game");
		};
	}, [contextMenu]);

	// Check via socket the game status
	useEffect(() => {
		socket.emit("is in game", cookies["token"]);
		setInvitesMenu(false);
	}, [contextMenu]);

	// Add event listener
	useEffect(() => {
		document.addEventListener("click", onPageClick);
	}, []);

	if (!contextMenu) {
		return <div></div>;
	}

	function blockButton() {
		if (userIsBlocked) {
			return (
				<li
					onClick={() => {
						console.log("Unblocked " + target.username);
						if (unblockUser(target.id, authenticatedUserID, cookies)) {
							setBlockedUsers((prev) =>
								prev.filter((userID: number) => userID !== target.id)
							);
							setUserIsBlocked(false);
						}
						setContextMenu(false);
					}}
				>
					{getButtonIcon(ButtonIconType.unblock, "button-sm w-6 h-6")}
				</li>
			);
		}
		return (
			<li
				onClick={() => {
					console.log("Blocked " + target.username);
					if (blockUser(target.id, authenticatedUserID, cookies)) {
						setBlockedUsers([...blockedUsers, target.id]);
						setUserIsBlocked(true);
					}
					setContextMenu(false);
				}}
			>
				{getButtonIcon(ButtonIconType.block, "button-sm w-6 h-6")}
			</li>
		);
	}

	function muteButton() {
		return (
			<li
				onClick={() => {
					var info: ReceivedInfo = {
						token: cookies["token"],
						chatRoomID: channel.chatRoomID,
						targetID: target.id,
						participantInfo: {
							mutedUntil: 1,
						},
					};
					ChangeStatus(info, "mute", socket);
					setContextMenu(false);
				}}
			>
				{getButtonIcon(ButtonIconType.mute, "button-sm w-6 h-6")}
			</li>
		);
	}

	function kickButton() {
		return (
			<li
				onClick={() => {
					console.log("Kicked " + target.username);
					var info: ReceivedInfo = {
						token: cookies["token"],
						chatRoomID: channel.chatRoomID,
						targetID: target.id,
					};
					ChangeStatus(info, "kick", socket);
					setContextMenu(false);
				}}
			>
				{getButtonIcon(ButtonIconType.kick, "button-sm w-6 h-6")}
			</li>
		);
	}

	function banButton() {
		return (
			<li
				onClick={() => {
					console.log("Banned " + target.username);
					var info: ReceivedInfo = {
						token: cookies["token"],
						chatRoomID: channel.chatRoomID,
						targetID: target.id,
					};
					ChangeStatus(info, "ban", socket);
					setContextMenu(false);
				}}
			>
				{getButtonIcon(ButtonIconType.ban, "button-sm w-6 h-6")}
			</li>
		);
	}
	function operatorButton() {
		return (
			<li
				onClick={() => {
					console.log("Made operator " + target.username);
					var info: ReceivedInfo = {
						token: cookies["token"],
						chatRoomID: channel.chatRoomID,
						targetID: target.id,
					};
					ChangeStatus(info, "operator", socket);
					setContextMenu(false);
				}}
			>
				{
					// TODO: find icon for removing from operators
					checkStatus(channel, target.id) === Status.Operator
						? getButtonIcon(ButtonIconType.operator, "button-sm w-6 h-6")
						: getButtonIcon(ButtonIconType.operator, "button-sm w-6 h-6")
				}
			</li>
		);
	}

	function dmButton() {
		return (
			<li
				onClick={() => {
					console.log("DM " + target.username);
					var info: ReceivedInfo = {
						token: cookies["token"],
						chatRoomID: channel.chatRoomID,
						targetID: target.id,
					};
					ChangeStatus(info, "dm", socket);
					setContextMenu(false);
				}}
			>
				{getButtonIcon(ButtonIconType.dm, "button-sm w-6 h-6")}
			</li>
		);
	}

	function inviteToChannelButton() {
		return (
			<li
				onClick={() => {
					console.log("Invited " + target.username);
					setInvitesMenu(true);
				}}
			>
				{getButtonIcon(ButtonIconType.invite, "button-sm w-6 h-6")}
			</li>
		);
	}

	function challengeButton() {
		return (
			<li
				onClick={(e) => {
					console.log("Challenged " + target.username);
					invite(e, target, typeInvite.Game);
				}}
			>
				{getButtonIcon(ButtonIconType.challenge, "button-sm  w-6 h-6")}
			</li>
		);
	}

	function friendButton() {
		return (
			<li
				onClick={(e) => {
					console.log("Added as friend " + target.username);
					invite(e, target, typeInvite.Friend);
				}}
			>
				{getButtonIcon(ButtonIconType.friend, "button-sm w-6 h-6")}
			</li>
		);
	}

	if (!invitesMenu) {
		var options = (
			<ul>
				{blockButton()}
				{inviteToChannelButton()}
				{iCanChallenge ? challengeButton() : <></>}
				{friendButton()}
				{channel.isDM === false ? dmButton() : <></>}
				{channel.isDM === false &&
				checkStatus(channel, authenticatedUserID) !== Status.Normal &&
				checkStatus(channel, target.id) !== Status.Owner ? (
					<div>
						{muteButton()}
						{kickButton()}
						{banButton()}
					</div>
				) : (
					<div></div>
				)}
				{checkStatus(channel, authenticatedUserID) === Status.Owner ? ( // TODO: check if admin and switch button
					<div>{operatorButton()}</div>
				) : (
					<div></div>
				)}
			</ul>
		);
	} else {
		// List chat you can join
		var options = (
			<ul>
				{myChats.filter((chat) => !chat.isDM).map(displayChatInviteButton)}
			</ul>
		);
	}

	return (
		<div
			ref={menuRef}
			className={`bg-teal rounded-md text-sage absolute p-0 overflow-y-scroll z-40 scrollbar-hide`}
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
