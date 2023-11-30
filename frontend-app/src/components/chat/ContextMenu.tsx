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
	const iconClass: string = "w-6 h-6 p-1";
	const buttonClass: string =
		"flex items-center pr-2 hover:bg-darkblue rounded-md m-1";
	const labelClass: string = "";

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
					className={buttonClass}
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
					{getButtonIcon(ButtonIconType.unblock, iconClass)}
					<span className={labelClass}>Unblock</span>
				</div>
			);
		}
		return (
			<div
				className={buttonClass}
				onClick={() => {
					console.log("Blocked " + target.username);
					if (blockUser(target.id, authenticatedUserID, cookies)) {
						setBlockedUsers([...blockedUsers, target.id]);
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
				{getButtonIcon(ButtonIconType.mute, iconClass)}
				<span className={labelClass}>Mute</span>
			</div>
		);
	}

	function kickButton() {
		return (
			<div
				className={buttonClass}
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
						? getButtonIcon(ButtonIconType.operator, iconClass)
						: getButtonIcon(ButtonIconType.operator, iconClass)
				}
				<span className={labelClass}>Toggle operator</span>
			</div>
		);
	}

	function dmButton() {
		return (
			<div
				className={buttonClass}
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
					console.log("Invited " + target.username);
					setInvitesMenu(true);
				}}
			>
				{getButtonIcon(ButtonIconType.invite, iconClass)}
				<span className={labelClass}>Unblock</span>
			</div>
		);
	}

	function challengeButton() {
		return (
			<div
				className={buttonClass}
				onClick={() => {
					console.log("Challenged " + target.username);
					invite(target, typeInvite.Game);
				}}
			>
				{getButtonIcon(ButtonIconType.challenge, iconClass)}
				<span className={labelClass}>Challenge</span>
			</div>
		);
	}

	function friendButton() {
		return (
			<div
				className={buttonClass}
				onClick={(e) => {
					console.log("Added as friend " + target.username);
					invite(target, typeInvite.Friend);
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
				onClick={(e) => {
					setContextMenu(false);
					setInvitesMenu(false);
				}}
			>
				{getButtonIcon(ButtonIconType.closeSettings, "w-5 h-5 text-sage")}
			</div>
		);
	}

	if (!invitesMenu) {
		var options = (
			<>
				<div className="flex justify-between items-center p-1">
					<span className="text-sm">{target.username}</span>
					{closeMenuButton()}
				</div>
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
