import {
	Dispatch,
	ReactElement,
	SetStateAction,
	useEffect,
	useRef,
	useState,
} from "react";
import { NavigateFunction } from "react-router-dom";
import { Socket } from "socket.io-client";
import { Message, ChatRoom, Invite, PublicChatRoom, User } from "./types";
import { ContextMenuEl } from "./ContextMenu";
import { ReceivedInfo, typeInvite } from "./types";
import { separatorLine } from "../styles/separator";
import { CurrentPannel, PannelType } from "./Chat";
import { formatDate, getFormattedTime, sameDay } from "../styles/dateFormat";
import { ButtonIconType, getButtonIcon } from "../styles/icons";

export function inviteMessage(invite: Invite) {
	switch (invite.type) {
		case typeInvite.Game:
			return <>challenges you to a match of pong!</>;

		case typeInvite.Friend:
			return <>wants to be your friend</>;

		case typeInvite.Chat:
			const chatRoomName: string = invite.chatRoomName;
			return (
				<>
					invites you to join chat <i>{chatRoomName}</i>
				</>
			);

		default:
			return <>sent you an unknown invite</>;
	}
}

export const Messages = (
	currentChatRoom: ChatRoom,
	navigate: NavigateFunction,
	settings: boolean,
	contextMenu: boolean,
	setContextMenu: Dispatch<SetStateAction<boolean>>,
	socket: Socket,
	invites: Invite[],
	publicChats: PublicChatRoom[],
	cookies: any,
	myChats: ChatRoom[],
	authenticatedUserID: number,
	blockedUsers: number[],
	setBlockedUsers: Dispatch<SetStateAction<number[]>>,
	currentPannel: CurrentPannel,
	setCurrentPannel: Dispatch<SetStateAction<CurrentPannel>>
) => {
	const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
	const [contextMenuTarget, setContextMenuTarget] = useState<User>(null);
	const messagesContainer = useRef<HTMLInputElement>(null);
	const [passwordPrompt, setPasswordPrompt] = useState<boolean>(false);
	const [newPassword, setNewPassword] = useState<string>("");
	const [promptedPublicChatRoom, setPromptedPublicChatRoom] =
		useState<PublicChatRoom>(null);
	const [promptedInvite, setPromptedInvite] = useState<Invite>(null);

	useEffect(() => {
		setPasswordPrompt(false);
		setPromptedInvite(null);
		setPromptedPublicChatRoom(null);
		setNewPassword("");
	}, [currentPannel]);

	const messageStatus = (msg: Message, key: number, messages: Message[]) => {
		if (msg.system) {
			return (
				<div id="announcement" key={key}>
					{separatorLine(msg.msg, "teal")}
				</div>
			);
		}
		let firstOfDay: boolean;
		if (key === 0) firstOfDay = true;
		else firstOfDay = !sameDay(msg.datestamp, messages[key - 1].datestamp);
		const selfSent: boolean = authenticatedUserID === msg.senderID;
		return (
			<>
				{firstOfDay ? (
					separatorLine(formatDate(msg.datestamp), "sage")
				) : (
					<div></div>
				)}
				<div
					className={`w-full flex justify-end ${
						selfSent ? "flex-row" : "flex-row-reverse"
					}`}
				>
					<div
						className={`flex flex-col mx-2 my-1 group ${
							selfSent ? "items-end" : "items-start"
						}`}
					>
						<div className="flex text-sm p-1">
							<a
								className={`text-darkblue dark:text-darkdarkblue hover:text-teal hover:dark:text-darkteal 
								}`}
								href={`/user/${msg.senderID}`}
								onContextMenu={(e) => {
									e.preventDefault();
									if (currentChatRoom.name !== "" && settings === false) {
										setContextMenu(true);
										setContextMenuPos({ x: e.pageX, y: e.pageY });
										var targetUser: User = currentChatRoom.participants.find(
											(user: User) => user.userID === msg.senderID
										);
										if (!targetUser) {
											var request = {
												headers: {
													"Content-Type": "application/json",
													Authorization: `Bearer ${cookies["token"]}`,
												},
											};

											fetch(`/backend/users/${msg.senderID}`, request).then(
												async (response) => {
													const data = await response.json();
													if (!response.ok) {
														console.warn("error response fetching user");
														navigate("/not-found");
														return;
													}

													setContextMenuTarget({
														userID: data.id,
														username: data.username,
														isInChatRoom: false,
													});
												}
											);
										} else {
											setContextMenuTarget(targetUser);
										}
									}
								}}
							>
								{msg.senderID === authenticatedUserID
									? "me"
									: msg.senderUsername}
							</a>
							<p className="hidden text-darkblue dark:text-darkdarkblue group-hover:block">
								&nbsp;{"- "}
								{getFormattedTime(msg.datestamp)}
							</p>
						</div>
						<div
							key={key}
							className={`peer rounded-md text-sage dark:text-darkdarkblue max-w-xl flex flex-col p-2 ${
								selfSent
									? "bg-teal dark:bg-darkteal"
									: "bg-darkblue dark:bg-darksage "
							}`}
						>
							<div className="flex-1 break-words">{msg.msg}</div>
						</div>
					</div>
				</div>
			</>
		);
	};

	function submitPassword() {
		const isInvite: boolean = Boolean(promptedInvite);
		let info: ReceivedInfo;
		if (isInvite) {
			info = {
				token: cookies["token"],
				inviteInfo: promptedInvite,
				chatInfo: {
					password: newPassword,
				},
			};
			socket.emit("accept invite", info);
		} else {
			info = {
				chatRoomID: promptedPublicChatRoom.chatRoomID,
				token: cookies["token"],
				chatInfo: {
					password: newPassword,
				},
			};
			socket.emit("join chat", info);
		}
		setPasswordPrompt(false);
		setNewPassword("");
		setPromptedPublicChatRoom(null);
		setPromptedInvite(null);
	}

	function passwordPromptPannel() {
		return (
			<div className="absolute bg-teal dark:bg-darkteal border-2 border-sage dark:border-darksage rounded-md top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%]">
				<div className="flex justify-between m-2">
					<h2 className="font-bold text-sage dark:text-darksage text-lg">
						Attempting to join{" "}
						{promptedInvite
							? promptedInvite.chatRoomName
							: promptedPublicChatRoom.name}
					</h2>
					<button
						onClick={() => {
							setPasswordPrompt(false);
							setNewPassword("");
							setPromptedPublicChatRoom(null);
							setPromptedInvite(null);
						}}
					>
						{getButtonIcon(
							ButtonIconType.closeSettings,
							"w-6 h-6 text-sage dark:text-darksage"
						)}
					</button>
				</div>
				<div>
					<form
						className="p-2"
						onSubmit={(e: any) => {
							e.preventDefault();
							submitPassword();
						}}
					>
						<input
							type="password"
							className="bg-sage dark:bg-darksage rounded-md p-2 m-2 focus:outline-none focus:text-darkblue focus:dark:text-darkdarkblue"
							placeholder="Password"
							value={newPassword}
							onChange={(e) => {
								setNewPassword(e.target.value);
							}}
						/>
						<button className="button">Submit</button>
					</form>
				</div>
			</div>
		);
	}

	function acceptInvite(invite: Invite) {
		var info: ReceivedInfo = {
			token: cookies["token"],
			inviteInfo: invite,
		};
		if (invite.type === typeInvite.Chat) {
			if (invite.chatHasPassword) {
				setPromptedInvite(invite);
				setPasswordPrompt(true);
			} else {
				socket.emit("accept invite", info);
			}
		} else {
			socket.emit("accept invite", info);
		}
	}

	const inviteStatus = (invite: Invite) => {
		var date = new Date(parseInt(invite.expiresAt.toString()));
		const messageInvite: ReactElement = inviteMessage(invite);
		return (
			<div
				id="messages_invite"
				className="bg-teal dark:bg-darkteal rounded-md p-2 m-2 text-sage dark:text-darkdarkblue flex flex-col"
			>
				<div className="self-center">
					<b>{invite.senderUsername}</b> {messageInvite}
				</div>
				<div className="self-center">
					<small>
						(this invite expires on {date.toString().split("GMT")[0]})
					</small>
				</div>
				<div className="self-center">
					<button
						className="bg-sage dark:bg-darksage rounded-md p-2 m-2 text-teal dark:text-darkdarkblue hover:bg-darkblue hover:dark:bg-darkdarkblue hover:text-sage hover:dark:text-darksage "
						id="accept"
						onClick={() => {
							acceptInvite(invite);
						}}
					>
						Accept
					</button>

					<button
						id="refuse"
						className="bg-sage dark:bg-darksage rounded-md p-2 m-2 text-teal dark:text-darkdarkblue hover:bg-darkblue hover:dark:bg-darkdarkblue hover:text-sage hover:dark:text-darksage "
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
			</div>
		);
	};

	function displayPublicChat(chat: PublicChatRoom, index: number) {
		const alreadyInChat: boolean = myChats.some(
			(myChat: ChatRoom) => myChat.chatRoomID === chat.chatRoomID
		);
		if (alreadyInChat) return <></>;
		var joinButton = (
			<button
				className="bg-sage dark:bg-darksage rounded-md p-2 m-2 text-teal dark:text-darkdarkblue hover:bg-darkblue hover:dark:bg-darkdarkblue hover:text-sage hover:dark:text-darksage "
				value={chat.chatRoomID}
				onClick={(e) => {
					if (chat.hasPassword) {
						setPromptedPublicChatRoom(chat);
						setPasswordPrompt(true);
					} else {
						var info: ReceivedInfo = {
							chatRoomID: parseInt(
								(e.target as HTMLInputElement).getAttribute("value")
							),
							token: cookies["token"],
						};
						socket.emit("join chat", info);
					}
				}}
			>
				Join
			</button>
		);
		return (
			<div
				className="bg-teal dark:bg-darkteal rounded-md p-1 m-2 text-sage dark:text-darkdarkblue flex justify-between items-center"
				id="publicchat"
				key={index}
			>
				<span className="pl-3">{chat.name}</span>
				{joinButton}
			</div>
		);
	}

	function displayPublicChats() {
		if (currentPannel.type !== PannelType.publicChats) {
			return <div></div>;
		}
		return (
			<div className="w-full">
				{publicChats
					.sort((a, b) => a.name.localeCompare(b.name))
					.map((chat: PublicChatRoom, index: number) =>
						displayPublicChat(chat, index)
					)}
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
		return <div key="messages">{messages}</div>;
	}

	if (currentPannel.type === PannelType.invite) {
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
					setBlockedUsers,
					messagesContainer
				)}
				{passwordPrompt ? passwordPromptPannel() : <></>}
			</div>
		);
	}

	if (currentPannel.type === PannelType.publicChats) {
		return (
			<div
				className={`absolute top-0 left-0 right-0 bottom-14 overflow-y-scroll flex scrollbar-hide`}
			>
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
					setBlockedUsers,
					messagesContainer
				)}
				{passwordPrompt ? passwordPromptPannel() : <></>}
			</div>
		);
	}

	return (
		<div
			id="messages"
			className={`absolute top-0 left-0 right-0 bottom-14 overflow-y-scroll flex flex-col-reverse scrollbar-hide`}
			ref={messagesContainer}
		>
			{displayMessages(currentChatRoom)}
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
				setBlockedUsers,
				messagesContainer
			)}
		</div>
	);
};

export default Messages;
