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
import { BsEnvelopePaper } from "react-icons/bs";

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

	useEffect(() => {
		socket.on("is in game", (isActive: boolean) => {
			// cannot challenge the user if I'm in a game
			setICanChallenge(!isActive);
		});
		return () => {
			socket.off("in a game");
		};
	}, [contextMenu]);

	useEffect(() => {
		socket.emit("is in game", cookies["token"]);
		setInvitesMenu(false);
	}, [contextMenu]);

	useEffect(() => {
		document.addEventListener("click", onPageClick);
	}, []);

	useEffect(() => {
		console.log("Position contextMenu", contextMenuPos);
		console.log(
			"Position parent",
			messagesContainer.current.getBoundingClientRect()
		);
	}, [contextMenuPos]);

	if (!contextMenu) {
		return <div></div>;
	}
	// TODO: refact li

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

	if (!invitesMenu) {
		var options = (
			<ul>
				{blockButton()}
				<li
					onClick={() => {
						console.log("Invited " + target.username);
						setInvitesMenu(true);
					}}
				>
					<BsEnvelopePaper className="button-sm w-6 h-6" />
				</li>
				{iCanChallenge ? (
					<li
						onClick={(e) => {
							console.log("Challenged " + target.username);
							invite(e, target, typeInvite.Game);
						}}
					>
						{getButtonIcon(ButtonIconType.challenge, "button-sm  w-6 h-6")}
					</li>
				) : (
					<></>
				)}
				<li
					onClick={(e) => {
						console.log("Added as friend " + target.username);
						invite(e, target, typeInvite.Friend);
					}}
				>
					{getButtonIcon(ButtonIconType.friend, "button-sm w-6 h-6")}
				</li>
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
				{checkStatus(channel, authenticatedUserID) !== Status.Operator && // TODO: double check logic
				checkStatus(channel, target.id) !== Status.Owner ? (
					<div>
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
					</div>
				) : (
					<div></div>
				)}
				{checkStatus(channel, authenticatedUserID) === Status.Owner ? ( // TODO: check if admin and switch button
					<div>
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
					</div>
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
			className={`bg-teal rounded-md text-sage absolute p-2`}
			style={{
				top: `${
					contextMenuPos.y - messagesContainer.current.getBoundingClientRect().y
				}px`,
				left: `${
					contextMenuPos.x - messagesContainer.current.getBoundingClientRect().x
				}px`,
			}}
		>
			{options}
		</div>
	);
};

export default ContextMenuEl;
