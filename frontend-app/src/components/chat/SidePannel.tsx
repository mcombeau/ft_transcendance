import { Dispatch, ReactElement, SetStateAction } from "react";
import { Socket } from "socket.io-client";
import { ReceivedInfo, ChatRoom } from "./types";
import { MdOutlineMessage } from "react-icons/md";
import { getButtonIcon, ButtonIconType } from "../styles/icons";
import { separatorLine } from "../styles/separator";
import { PiChatsDuotone } from "react-icons/pi";
import { BiCommentAdd } from "react-icons/bi";
import { CurrentPannel, PannelType } from "./Chat";

enum ChanType {
	Channel,
	DM,
	Invites,
	PublicChans,
}

export const SidePannel = (
	newchannel: string,
	setNewchannel: Dispatch<SetStateAction<string>>,
	socket: Socket,
	settings: boolean,
	setSettings: Dispatch<SetStateAction<boolean>>,
	setContextMenu: Dispatch<SetStateAction<boolean>>,
	myChats: ChatRoom[],
	cookies: any,
	authenticatedUserID: number,
	currentPannel: CurrentPannel,
	setCurrentPannel: Dispatch<SetStateAction<CurrentPannel>>
) => {
	const createChannel = (e: any) => {
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
			setSettings(false);
			switch (type) {
				case ChanType.Invites:
					setCurrentPannel({ type: PannelType.invite, chatRoomID: null });
					break;
				case ChanType.PublicChans:
					setCurrentPannel({ type: PannelType.publicChats, chatRoomID: null });
					break;
				default:
					setCurrentPannel({
						type: PannelType.chat,
						chatRoomID: channel.chatRoomID,
					});
					break;
			}
		};

		switch (type) {
			case ChanType.Invites:
				if (currentPannel.type === PannelType.invite) isCurrent = true;
				channel_alias = <>Invites</>;
				settingButton = <></>;
				break;
			case ChanType.PublicChans:
				if (currentPannel.type === PannelType.publicChats) isCurrent = true;
				channel_alias = <>Public Chats</>;
				settingButton = <></>;
				break;

			default:
				if (
					currentPannel.type === PannelType.chat &&
					channel.chatRoomID === currentPannel.chatRoomID
				)
					isCurrent = true;
				channel_alias = channel.isDM ? (
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
						className={`border-2 border-darkblue dark:border-darkdarkblue text-sage dark:text-darksage m-2 rounded-md w-5 h-5 items-center ${
							settings && isCurrent
								? "bg-teal dark:bg-darkteal hover:bg-darkblue hover:dark:bg-darkdarkblue"
								: "bg-darkblue dark:bg-darkdarkblue hover:bg-teal hover:dark:bg-darkteal"
						}`}
						onClick={() => {
							setSettings(!settings);
							setContextMenu(false);
							setCurrentPannel({
								type: PannelType.chat,
								chatRoomID: channel.chatRoomID,
							});
						}}
					>
						{getButtonIcon(ButtonIconType.settings, "h-4 w-4")}
					</button>
				);
				select = () => {
					var targetChannel = channel.chatRoomID;
					setCurrentPannel({
						type: PannelType.chat,
						chatRoomID: targetChannel,
					});
				};

				break;
		}
		return (
			<div
				onClick={() => select(type)}
				className={`text-darkblue dark:text-darkdarkblue rounded-md p-2 m-2 flex ${
					isCurrent
						? "bg-sage dark:bg-darksage border-2 border-darkblue dark:border-darkdarkblue"
						: "bg-sage dark:bg-darksage"
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
					className="rounded-md flex-1 bg-sage dark:bg-darksage p-2 placeholder:text-darkblue placeholder:dark:text-darkdarkblue placeholder:opacity-50 focus:outline-none"
					type="text"
					placeholder="Create new channel"
					value={newchannel}
					onChange={(e) => {
						setNewchannel(e.target.value);
					}}
				/>
				<button className="bg-darkblue dark:bg-darkdarkblue text-sage dark:text-darksage hover:bg-teal hover:dark:bg-darkteal py-1 px-4 rounded-md hidden xl:block">
					<BiCommentAdd className="w-5 h-5" />
				</button>
			</form>
			<hr className="bg-lightblue dark:bg-darklightblue h-1 border-0 mx-2"></hr>
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
