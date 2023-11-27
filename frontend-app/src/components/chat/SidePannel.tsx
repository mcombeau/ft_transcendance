import { Dispatch, ReactElement, SetStateAction } from "react";
import { Socket } from "socket.io-client";
import { ReceivedInfo, ChatRoom } from "./types";
import { MdOutlineMessage } from "react-icons/md";
import { getButtonIcon, ButtonIconType } from "../styles/icons";
import { separatorLine } from "../styles/separator";
import { PiChatsDuotone } from "react-icons/pi";
import { BiCommentAdd } from "react-icons/bi";

enum ChanType {
	Channel,
	DM,
	Invites,
	PublicChans,
}

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

	const channelInfo = (type: ChanType, channel?: ChatRoom, key?: number) => {
		let isCurrent: boolean = false;
		let channel_alias: ReactElement;
		let settingButton: ReactElement;

		let select = (type: ChanType) => {
			setContextMenu(false);
			setSettings(!settings);
			setCurrentChatRoomID(null);
			setPublicChatsPannel(false);
			setInvitesPannel(false);
			switch (type) {
				case ChanType.Invites:
					setInvitesPannel(true);
					break;
				case ChanType.PublicChans:
					setPublicChatsPannel(true);
					break;
				default:
					setCurrentChatRoomID(channel.chatRoomID);
					break;
			}
		};

		switch (type) {
			case ChanType.Invites:
				if (invitesPannel) isCurrent = true;
				channel_alias = <>Invites</>;
				settingButton = <></>;
				break;
			case ChanType.PublicChans:
				if (publicChatsPannel) isCurrent = true;
				channel_alias = <>Public Chats</>;
				settingButton = <></>;
				break;

			default:
				if (channel.chatRoomID == currentChatRoomID) isCurrent = true;
				channel_alias = channel.isDM ? ( // TODO: change with actual name (get from back)
					<>
						<MdOutlineMessage className="m-1 mr-2" />{" "}
						{getDMChannelAlias(channel)}
					</>
				) : (
					<>
						<PiChatsDuotone className="m-1 mr-2" /> {channel.name}
					</>
				);
				settingButton = (
					<button
						className={`border-2 border-darkblue text-sage m-2 rounded-md w-5 h-5 items-center ${
							settings && isCurrent
								? "bg-teal hover:bg-darkblue"
								: "bg-darkblue hover:bg-teal"
						}`}
						onClick={() => {
							setSettings(!settings);
							setCurrentChatRoomID(channel.chatRoomID);
							setInvitesPannel(false);
							setContextMenu(false);
							setPublicChatsPannel(false);
						}}
					>
						{getButtonIcon(ButtonIconType.settings, "h-4 w-4")}
					</button>
				);
				select = () => {
					var targetChannel = channel.chatRoomID;
					setCurrentChatRoomID(targetChannel);
					setInvitesPannel(false);
					setPublicChatsPannel(false);
				};

				break;
		}
		return (
			<div
				onClick={() => select(type)}
				className={`text-darkblue rounded-md p-2 m-2 flex ${
					isCurrent ? "bg-sage border-2 border-darkblue" : "bg-sage"
				}`}
			>
				<div className="flex-1 flex align-middle items-center ml-2">
					{channel_alias}
				</div>
				{settingButton}
			</div>
		);
	};

	return (
		<>
			<form className="flex m-2 space-x-2" onSubmit={createChannel}>
				<input
					className="rounded-md flex-1 bg-sage p-2 placeholder:text-darkblue placeholder:opacity-50 focus:outline-none"
					type="text"
					placeholder="Create new channel"
					value={newchannel}
					onChange={(e) => {
						setNewchannel(e.target.value);
					}}
				/>
				<button className="bg-darkblue text-sage hover:bg-teal py-1 px-4 rounded-md">
					<BiCommentAdd className="w-5 h-5" />
				</button>
			</form>
			<hr className="bg-lightblue h-1 border-0 mx-2"></hr>
			<div id="flex flex-col">
				{channelInfo(ChanType.Invites)}
				{channelInfo(ChanType.PublicChans)}
				{separatorLine("Private messages")}
				{myChats
					.filter((chat: ChatRoom) => chat.isDM)
					.sort((a, b) => a.name.localeCompare(b.name))
					.map((channel: ChatRoom, key: number) =>
						channelInfo(ChanType.Channel, channel, key)
					)}
				{separatorLine("Public chatrooms")}
				{myChats
					.filter((chat: ChatRoom) => !chat.isDM)
					.sort((a, b) => a.name.localeCompare(b.name))
					.map((channel: ChatRoom, key: number) =>
						channelInfo(ChanType.Channel, channel, key)
					)}
			</div>
		</>
	);
};

export default SidePannel;
