import { Dispatch, ReactElement, SetStateAction } from "react";
import { Socket } from "socket.io-client";
import { ReceivedInfo, ChatRoom } from "./types";
import { MdOutlineMessage } from "react-icons/md";
import { getButtonIcon, ButtonIconType } from "../profile/icons";

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
				channel_alias = <>INVITES</>;
				settingButton = <></>;
				break;
			case ChanType.PublicChans:
				if (publicChatsPannel) isCurrent = true;
				channel_alias = <>PUBLIC CHATS</>;
				settingButton = <></>;
				break;

			default:
				if (channel.chatRoomID == currentChatRoomID) isCurrent = true;
				channel_alias = channel.isDM ? ( // TODO: change with actual name (get from back)
					<>
						<MdOutlineMessage /> {getDMChannelAlias(channel)}
					</>
				) : (
					<>{channel.name}</>
				);
				settingButton = (
					<button onClick={() => {}}>
						{getButtonIcon(ButtonIconType.settings)}
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
				className={`rounded-md p-2 m-2 flex relative ${
					isCurrent ? "bg-darkblue" : "bg-teal"
				}`}
			>
				{channel_alias}
				{settingButton}
			</div>
		);
	};

	return (
		<>
			<form className="" onSubmit={createChannel}>
				<input
					type="text"
					value={newchannel}
					onChange={(e) => {
						setNewchannel(e.target.value);
					}}
				/>
				<button>+</button>
			</form>
			<div id="flex flex-col">
				{channelInfo(ChanType.Invites)}
				{channelInfo(ChanType.PublicChans)}
				{myChats
					.sort((a, b) => a.name.localeCompare(b.name))
					.map((channel: ChatRoom, key: number) =>
						channelInfo(ChanType.Channel, channel, key)
					)}
			</div>
		</>
	);
};

export default SidePannel;
