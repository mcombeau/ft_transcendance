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
import { canManageUser, canToggleOperator } from "./ListParticipants";

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
		target: { id: number; username: string },
		type: typeInvite,
		chat?: ChatRoom
	) {
		var info: ReceivedInfo = {
			token: cookies["token"],
			targetID: target.id,
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
		console.log("Sent invite", info);
		console.log("Invite info", info.inviteInfo);
		ChangeStatus(info, "invite", socket);
		setContextMenu(false);
		setInvitesMenu(false);
	}

	function displayChatInviteButton(chat: ChatRoom) {
		return (
			<div
				className="hover:text-darkblue rounded-md m-1"
				onClick={() => invite(target, typeInvite.Chat, chat)}
			>
				{chat.name}
			</div>
		);
	}

	function onPageClick(event: any) {
		event.stopPropagation();
		if (menuRef && menuRef.current && !menuRef.current.contains(event.target)) {
			console.log("Deactivated context menu");
			console.log(event);
			console.log(menuRef.current.getBoundingClientRect());
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
	// useEffect(() => {
	// 	if (contextMenu) {
	// 		console.log("activated event listener");
	// 		document.addEventListener("click", onPageClick, { capture: true });
	// 	} else {
	// 		console.log("removed event listener");
	// 		document.removeEventListener("click", onPageClick);
	// 	}
	// 	return () => document.removeEventListener("click", onPageClick);
	// }, [contextMenu]);

	if (!contextMenu) {
		return <div></div>;
	}

	function blockButton() {
		if (userIsBlocked) {
			return (
				<div
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
				</div>
			);
		}
		return (
			<div
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
			</div>
		);
	}

	function muteButton() {
		return (
			<div
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
			</div>
		);
	}

	function kickButton() {
		return (
			<div
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
			</div>
		);
	}

	function banButton() {
		return (
			<div
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
			</div>
		);
	}
	function operatorButton() {
		return (
			<div
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
			</div>
		);
	}

	function dmButton() {
		return (
			<div
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
			</div>
		);
	}

	function inviteToChannelButton() {
		return (
			<div
				onClick={() => {
					console.log("Invited " + target.username);
					setInvitesMenu(true);
				}}
			>
				{getButtonIcon(ButtonIconType.invite, "button-sm w-6 h-6")}
			</div>
		);
	}

	function challengeButton() {
		return (
			<div
				onClick={() => {
					console.log("Challenged " + target.username);
					invite(target, typeInvite.Game);
				}}
			>
				{getButtonIcon(ButtonIconType.challenge, "button-sm  w-6 h-6")}
			</div>
		);
	}

	function friendButton() {
		return (
			<div
				onClick={(e) => {
					console.log("Added as friend " + target.username);
					invite(target, typeInvite.Friend);
				}}
			>
				{getButtonIcon(ButtonIconType.friend, "button-sm w-6 h-6")}
			</div>
		);
	}

	function closeMenuButton() {
		return (
			<div
				className="flex justify-end"
				onClick={(e) => {
					setContextMenu(false);
					setInvitesMenu(false);
				}}
			>
				{getButtonIcon(
					ButtonIconType.closeSettings,
					"w-6 h-6 px-1 pt-1 text-sage"
				)}
			</div>
		);
	}

	if (!invitesMenu) {
		var options = (
			<>
				{closeMenuButton()}
				{blockButton()}
				{inviteToChannelButton()}
				{iCanChallenge ? challengeButton() : <></>}
				{friendButton()}
				{channel.isDM === false ? dmButton() : <></>}
				{canManageUser(target.id, authenticatedUserID, channel) ? (
					<div>
						{muteButton()}
						{kickButton()}
						{banButton()}
					</div>
				) : (
					<div></div>
				)}
				{canToggleOperator(target.id, authenticatedUserID, channel) ? ( // TODO: check if admin and switch button
					<div>{operatorButton()}</div>
				) : (
					<div></div>
				)}
			</>
		);
	} else {
		// List chat you can join
		var options = (
			<>
				{closeMenuButton()}
				{myChats.filter((chat) => !chat.isDM).map(displayChatInviteButton)}
			</>
		);
	}

	return (
		<div
			ref={menuRef}
			className={`bg-teal rounded-md text-sage absolute p-0 overflow-y-scroll z-40 scrollbar-hide font-light text-xs`}
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
