import {Dispatch, SetStateAction, useState} from "react";
import {NavigateFunction} from "react-router-dom";
import {Socket} from "socket.io-client";
import {Message, ChatRoom, Invite, PublicChatRoom} from "./types";
import {ContextMenuEl} from "./ContextMenu";
import {ReceivedInfo, typeInvite} from "./types";

export const Messages = (
	currentChatRoom: ChatRoom,
	navigate: NavigateFunction,
	settings: boolean,
	contextMenu: boolean,
	setContextMenu: Dispatch<SetStateAction<boolean>>,
	socket: Socket,
	invitesPannel: boolean,
	invites: Invite[],
	publicChats: PublicChatRoom[],
	publicChatsPannel: boolean,
	cookies: any,
	myChats: ChatRoom[],
	authenticatedUserID: number,
	blockedUsers: number[],
	setBlockedUsers: Dispatch<SetStateAction<number[]>>
) => {
	const [contextMenuPos, setContextMenuPos] = useState({x: 0, y: 0});
	const [contextMenuTarget, setContextMenuTarget] = useState({
		id: null,
		username: null,
	});

	const messageStatus = (msg: Message) => {
		if (msg.system) {
			return (
				<div id="announcement">
					<li>{msg.msg}</li>
				</div>
			);
		}
		if (msg.senderID === authenticatedUserID) {
			return (
				<div id="rightmessage">
					<span
						id="sender"
						onClick={() => {
							navigate("/user/" + msg.senderID); // TODO: create front profile page and go there
						}}
					>
						{msg.senderUsername}
					</span>
					<span id="date">{msg.datestamp.toString().split("G")[0]}</span>
					<li id="mine">{msg.msg}</li>
				</div>
			);
		}
		return (
			<div id="leftmessage">
				<span
					id="sender"
					onClick={() => {
						navigate("/user/" + msg.senderID); // TODO: create front profile page and go there
					}}
					onContextMenu={(e) => {
						e.preventDefault();
						if (currentChatRoom.name !== "" && settings === false) {
							setContextMenu(true);
							setContextMenuPos({x: e.pageX, y: e.pageY});
							setContextMenuTarget({
								id: msg.senderID,
								username: msg.senderUsername,
							});
						}
					}}
				>
					{msg.senderUsername}
				</span>
				<span id="date">{msg.datestamp.toString().split("G")[0]}</span>
				<li id="othermsg">{msg.msg}</li>
			</div>
		);
	};

	function acceptInvite(invite: Invite) {
		var info: ReceivedInfo = {
			token: cookies["token"],
			inviteInfo: invite,
		};
		if (invite.type === typeInvite.Chat) {
			if (invite.chatHasPassword) {
				var getPassword = prompt(
					`${invite.chatRoomName} is password protected. Please enter password:`
				);
			}
			info.chatInfo = {
				password: getPassword,
			};
		}
		socket.emit("accept invite", info);
	}

	const inviteStatus = (invite: Invite) => {
		// MAKE SURE THIS WORKS BECAUSE ITS FUCKING WEIIIIIIRD
		var date = new Date(parseInt(invite.expiresAt.toString()));
		var messageInvite: string;
		switch (invite.type) {
			case typeInvite.Game:
				messageInvite = "wants to play";
				break;

			case typeInvite.Friend:
				messageInvite = "wants to be your friend";
				break;

			case typeInvite.Chat:
				messageInvite =
					"invites you to join chat " + <i>invite.chatRoomName</i>;
				break;

			default:
				messageInvite = "sent you an unknown invite";
				break;
		}
		return (
			<div id="messages_invite">
				<p>
					<b>{invite.senderUsername}</b> {messageInvite} <br />
					<small>
						(this invite expires on {date.toString().split("GMT")[0]})
					</small>
				</p>
				<button
					id="accept"
					onClick={() => {
						acceptInvite(invite);
					}}
				>
					Accept
				</button>

				<button
					id="refuse"
					onClick={() => {
						const info = {
							token: cookies["token"],
							inviteInfo: invite,
						};
						socket.emit("refuse invite", info);
					}}
				>
					Refuse
				</button>
			</div>
		);
	};

	if (invitesPannel) {
		return (
			<div id="messages">
				{invites.map((invite: Invite) => inviteStatus(invite))}
				{ContextMenuEl(
					contextMenu,
					contextMenuTarget,
					setContextMenu,
					contextMenuPos,
					socket,
					currentChatRoom,
					cookies,
					myChats,
					authenticatedUserID,
					blockedUsers,
					setBlockedUsers
				)}
			</div>
		);
	}

	function displayPublicChat(chat: PublicChatRoom) {
		var joinButton = (
			<button
				className="joinchan"
				value={chat.chatRoomID}
				onClick={(e) => {
					if (chat.hasPassword) {
						var getPassword = prompt(
							`${chat.name} is password protected. Please enter password:`
						);
					} else {
						getPassword = "";
					}
					var info: ReceivedInfo = {
						chatRoomID: parseInt(
							(e.target as HTMLInputElement).getAttribute("value")
						),
						token: cookies["token"],
					};
					if (getPassword !== "") {
						info.chatInfo = {
							password: getPassword,
						};
					}
					socket.emit("join chat", info);
				}}
			>
				Join
			</button>
		);
		return (
			<div id="publicchat">
				{chat.name}
				{joinButton}
			</div>
		);
	}

	function displayPublicChats() {
		if (!publicChatsPannel) {
			return <div></div>;
		}
		return (
			<div>
				{publicChats
					.sort((a, b) => a.name.localeCompare(b.name))
					.map((chat: PublicChatRoom) => displayPublicChat(chat))}
			</div>
		);
	}

	function displayMessages(currentChatRoom: ChatRoom) {
		if (currentChatRoom === undefined) return <div></div>;
		return currentChatRoom.messages
			.filter((message: Message) => {
				return !blockedUsers.includes(message.senderID);
			})
			.map(messageStatus);
	}

	return (
		<div id="messages">
			{displayMessages(currentChatRoom)}
			{displayPublicChats()}
			{ContextMenuEl(
				contextMenu,
				contextMenuTarget,
				setContextMenu,
				contextMenuPos,
				socket,
				currentChatRoom,
				cookies,
				myChats,
				authenticatedUserID,
				blockedUsers,
				setBlockedUsers
			)}
		</div>
	);
};

export default Messages;
