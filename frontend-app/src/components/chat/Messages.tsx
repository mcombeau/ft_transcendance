import { Dispatch, SetStateAction, useState } from "react";
import { NavigateFunction } from "react-router-dom";
import { Socket } from "socket.io-client";
import { Message, ChatRoom, Invite, PublicChatRoom } from "./types";
import { ContextMenuEl } from "./ContextMenu";
import { ReceivedInfo, typeInvite } from "./types";

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
	const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
	const [contextMenuTarget, setContextMenuTarget] = useState({
		id: null,
		username: null,
	});

	function sameDay(date1: Date, date2: Date) {
		date1 = new Date(date1);
		date2 = new Date(date2);
		return (
			date1.getFullYear() === date2.getFullYear() &&
			date1.getMonth() === date2.getMonth() &&
			date1.getDate() === date2.getDate()
		);
	}

	function formatDate(inputDate: Date) {
		const inputDatestamp: number = new Date(inputDate).getTime();
		const fulldays = [
			"Sunday",
			"Monday",
			"Tuesday",
			"Wednesday",
			"Thursday",
			"Friday",
			"Saturday",
		];
		const months = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		];
		var dt = new Date(inputDatestamp),
			date = dt.getDate(),
			month = months[dt.getMonth()],
			timeDiff = inputDatestamp - Date.now(),
			diffDays = new Date().getDate() - date,
			diffMonths = new Date().getMonth() - dt.getMonth(),
			diffYears = new Date().getFullYear() - dt.getFullYear();

		if (diffYears === 0 && diffDays === 0 && diffMonths === 0) {
			return "Today";
		} else if (diffYears === 0 && diffDays === 1) {
			return "Yesterday";
		} else if (diffYears === 0 && diffDays === -1) {
			return "Tomorrow";
		} else if (diffYears === 0 && diffDays < -1 && diffDays > -7) {
			return fulldays[dt.getDay()];
		} else if (diffYears >= 1) {
			return month + " " + date + ", " + new Date(inputDatestamp).getFullYear();
		} else {
			return month + " " + date;
		}
	}

	const messageStatus = (msg: Message, key: number, messages: Message[]) => {
		if (msg.system) {
			return (
				<div id="announcement" key={key}>
					<li>{msg.msg}</li>
				</div>
			);
		}
		let firstOfDay: boolean;
		if (key === 0) firstOfDay = true;
		else firstOfDay = !sameDay(msg.datestamp, messages[key - 1].datestamp);
		const selfSent: boolean = authenticatedUserID === msg.senderID;
		return (
			<>
				{firstOfDay ? <div>{formatDate(msg.datestamp)}</div> : <div></div>}
				<div
					className={`w-full flex ${
						selfSent ? "justify-end" : "justify-start"
					}`}
				>
					<div
						key={key}
						className={`rounded-md text-sage max-w-xl flex flex-col m-2 p-2 ${
							selfSent ? "bg-teal" : "bg-darkblue "
						}`}
					>
						<a
							className={`text-sm italic hover:text-lightblue hover:underline ${
								selfSent ? "hidden" : ""
							}`}
							onClick={() => {
								navigate("/user/" + msg.senderID); // TODO: create front profile page and go there
							}}
							onContextMenu={(e) => {
								e.preventDefault();
								if (currentChatRoom.name !== "" && settings === false) {
									setContextMenu(true);
									setContextMenuPos({ x: e.pageX, y: e.pageY });
									setContextMenuTarget({
										id: msg.senderID,
										username: msg.senderUsername,
									});
								}
							}}
						>
							{msg.senderUsername}
						</a>
						<div className="flex-1 break-words">{msg.msg}</div>
						<div className="hidden">
							{msg.datestamp.toString().split("G")[0]}
						</div>
					</div>
				</div>
			</>
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
		var date = new Date(parseInt(invite.expiresAt.toString()));
		switch (invite.type) {
			case typeInvite.Game:
				var messageInvite = <>wants to play</>;
				break;

			case typeInvite.Friend:
				messageInvite = <>wants to be your friend</>;
				break;

			case typeInvite.Chat:
				const chatRoomName: string = invite.chatRoomName;
				messageInvite = (
					<>
						invites you to join chat <i>{chatRoomName}</i>
					</>
				);
				break;

			default:
				messageInvite = <>sent you an unknown invite</>;
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
		const messages = currentChatRoom.messages
			.filter((message: Message) => {
				return !blockedUsers.includes(message.senderID);
			})
			.map((message: Message, index: number, messages: Message[]) =>
				messageStatus(message, index, messages)
			);
		return <div>{messages}</div>;
	}

	return (
		<div
			className={`absolute top-0 left-0 right-0 bottom-14 overflow-y-scroll flex flex-col-reverse`}
		>
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
