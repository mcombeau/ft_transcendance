import { Dispatch, SetStateAction } from "react";
import { Socket } from "socket.io-client";
import { ReceivedInfo, ChatRoom } from "./types";

export const SidePannel = (
	newchannel: string,
	setNewchannel: Dispatch<SetStateAction<string>>,
	currentChatRoomID: number,
	setCurrentChatRoomID: Dispatch<SetStateAction<number>>,
	socket: Socket,
	settings: boolean,
	setSettings: Dispatch<SetStateAction<boolean>>,
	setContextMenu: Dispatch<SetStateAction<boolean>>,
	myChats: ChatRoom[],
	invitesPannel: boolean,
	setInvitesPannel: Dispatch<SetStateAction<boolean>>,
	publicChatsPannel: boolean,
	setPublicChatsPannel: Dispatch<SetStateAction<boolean>>,
	cookies: any,
	authenticatedUserID: number
) => {
	const createChannel = (e: any) => {
		console.log(e); // TODO: maybe change any
		e.preventDefault();
		if (newchannel === "") return;
		console.log("Emit new chan");
		var info: ReceivedInfo = {
			chatInfo: {
				name: newchannel,
				isPrivate: false,
			},
			token: cookies["token"],
		};
		socket.emit("add chat", info);
		setNewchannel("");
	};

	function getDMChannelAlias(channel: ChatRoom) {
		return channel.participants.find((p) => p.userID !== authenticatedUserID)
			.username;
	}

	const invitesPannelElement = () => {
		var classname = "channotCurrent";
		if (invitesPannel) {
			classname = "chanCurrent";
		}
		return (
			<div id="channel-info">
				<li
					value={"INVITES"}
					onClick={() => {
						setCurrentChatRoomID(null);
						setInvitesPannel(true);
						setPublicChatsPannel(false);
					}}
					className={classname}
				>
					INVITES
				</li>
			</div>
		);
	};

	const publicChatsPannelElement = () => {
		var classname = "channotCurrent";
		if (publicChatsPannel) {
			classname = "chanCurrent";
		}
		return (
			<div id="channel-info">
				<li
					value={"PUBLIC CHATS"}
					onClick={() => {
						setCurrentChatRoomID(null);
						setInvitesPannel(false);
						setPublicChatsPannel(true);
					}}
					className={classname}
				>
					PUBLIC CHATS
				</li>
			</div>
		);
	};

	const channelInfo = (channel: ChatRoom, key: number) => {
		var isCurrent = channel.chatRoomID == currentChatRoomID;
		// var unreadMessages: number = messages
		//   .filter((msg: Message) => {
		//     return msg.chatRoomID == channel.chatRoomID;
		//   })
		//   .filter((msg: Message) => {
		//     return msg.read == false;
		//   }).length;
		var channel_alias = channel.isDM // TODO: change with actual name (get from back)
			? `💬 ${getDMChannelAlias(channel)}`
			: channel.name;
		var classname = "channotCurrent";
		if (isCurrent) {
			classname = "chanCurrent";
		}
		if (channel.isDM) {
			classname += " dm";
		}
		return (
			<div id="channel-info" key={key}>
				<li
					value={channel.chatRoomID}
					onClick={(e) => {
						var targetChannel = parseInt(
							(e.target as HTMLInputElement).getAttribute("value")
						);
						setCurrentChatRoomID(targetChannel);
						setInvitesPannel(false);
						setPublicChatsPannel(false);
						// setMessages(
						//   messages.map((msg: Message) => {
						//     if (msg.chatRoomID === targetChannel) {
						//       return { ...msg, read: true };
						//     } else {
						//       return { ...msg };
						//     }
						//   })
						// );
					}}
					className={classname}
				>
					{/*unreadMessages > 0 && <p>{unreadMessages}</p>*/}
					{channel_alias}
					<button
						value={channel.chatRoomID}
						onClick={(e) => {
							setSettings(!settings);
							setCurrentChatRoomID(
								parseInt((e.target as HTMLInputElement).getAttribute("value"))
							);
							setInvitesPannel(false);
							setContextMenu(false);
						}}
					>
						⚙
					</button>
				</li>
			</div>
		);
	};
	return (
		<div className="sidepannel">
			<form className="newchan" onSubmit={createChannel}>
				<input
					type="text"
					value={newchannel}
					onChange={(e) => {
						setNewchannel(e.target.value);
					}}
				/>
				<button>+</button>
			</form>
			<div id="channels">
				{invitesPannelElement()}
				{publicChatsPannelElement()}
				{myChats
					.sort((a, b) => a.name.localeCompare(b.name))
					.map((channel: ChatRoom, key: number) => channelInfo(channel, key))}
			</div>
		</div>
	);
};

export default SidePannel;
