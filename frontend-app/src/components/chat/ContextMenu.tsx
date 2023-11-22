import { Status, ChatRoom, typeInvite } from "./types";
import { ChangeStatus } from "./Chat";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { checkStatus } from "./Chat";
import { ReceivedInfo } from "./types";
import { blockUser, unblockUser } from "../profile/profile";

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
	setBlockedUsers: Dispatch<SetStateAction<number[]>>
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
	}, [contextMenu]);
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
					Unblock
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
				Block
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
					Invite to chat
				</li>
				{iCanChallenge ? (
					<li
						onClick={(e) => {
							console.log("Challenged " + target.username);
							invite(e, target, typeInvite.Game);
						}}
					>
						Challenge
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
					Add friend
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
					DM
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
							{"Mute (1 min)"}
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
							Kick
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
							Ban
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
							{checkStatus(channel, target.id) === Status.Operator
								? "Remove from admins"
								: "Make admin"}
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
			className="contextMenu"
			style={{
				top: contextMenuPos.y - 10,
				left: contextMenuPos.x + 15,
			}}
		>
			<p>{target.username}</p>
			{options}
			<button onClick={() => setContextMenu(false)}>✕</button>
		</div>
	);
};

export default ContextMenuEl;
