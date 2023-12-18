import { Status, ChatRoom, ReceivedInfo } from "./types";
import { checkStatus, CurrentPannel, PannelType } from "./Chat";
import { Socket } from "socket.io-client";
import { Dispatch, SetStateAction, useState } from "react";
import { ListParticipants } from "./ListParticipants";
import { NavigateFunction } from "react-router-dom";
import { CgCloseO } from "react-icons/cg";
import { MdLockOpen, MdLockOutline } from "react-icons/md";

export const SettingsMenu = (
	settings: boolean,
	setSettings: Dispatch<SetStateAction<boolean>>,
	currentChatRoom: ChatRoom,
	setCurrentPannel: Dispatch<SetStateAction<CurrentPannel>>,
	socket: Socket,
	navigate: NavigateFunction,
	cookies: any,
	authenticatedUserID: number
) => {
	const [newPassword, setNewPassword] = useState("");

	function removePassword() {
		var info: ReceivedInfo = {
			token: cookies["token"],
			chatRoomID: currentChatRoom.chatRoomID,
			chatInfo: {
				password: "",
			},
		};
		socket.emit("set password", info);
	}

	function submitNewPassword(e: any) {
		e.preventDefault();
		var info: ReceivedInfo = {
			token: cookies["token"],
			chatRoomID: currentChatRoom.chatRoomID,
			chatInfo: {
				password: newPassword,
			},
		};
		socket.emit("set password", info);
		setNewPassword("");
	}

	function getDMChannelAlias(channel: ChatRoom) {
		return (
			"DM with " +
			channel.participants.find((p) => p.userID !== authenticatedUserID)
				.username
		);
	}

	if (settings && currentChatRoom) {
		var leave_button = (
			<button
				className="button"
				onClick={() => {
					var info: ReceivedInfo = {
						token: cookies["token"],
						chatRoomID: currentChatRoom.chatRoomID,
					};
					socket.emit("leave chat", info);
					setSettings(false);
					setCurrentPannel({ type: PannelType.home, chatRoomID: null });
				}}
			>
				Leave channel
			</button>
		);
		var password_form = <div></div>;
		if (currentChatRoom.isDM) {
			leave_button = <br></br>;
		}
		// if (settings && currentChatRoom && currentChatRoom.isDM)
		//   var leave_button = <br></br>;
		if (checkStatus(currentChatRoom, authenticatedUserID) === Status.Owner) {
			leave_button = (
				<button
					className="button"
					onClick={() => {
						var info: ReceivedInfo = {
							chatRoomID: currentChatRoom.chatRoomID,
							token: cookies["token"],
						};
						socket.emit("delete chat", info);
					}}
				>
					Delete channel
				</button>
			);
			password_form = (
				<div>
					<form
						className="set_password items-center"
						onSubmit={submitNewPassword}
					>
						<input
							className="bg-sage dark:bg-darksage rounded-md p-2 placeholder:text-darkblue placeholder:dark:text-darkdarkblue placeholder:opacity-40"
							placeholder="password"
							type="password"
							value={newPassword}
							onChange={(e) => {
								setNewPassword(e.target.value);
							}}
						/>
						<button className="button px-2">
							{currentChatRoom.hasPassword ? "Update" : "Set"}
						</button>
					</form>
					{currentChatRoom.hasPassword ? (
						<button onClick={removePassword}>Remove password</button>
					) : (
						<div></div>
					)}
				</div>
			);
			var private_public = (
				<div className="rounded-md my-4">
					<input
						type="checkbox"
						className="mx-2"
						checked={currentChatRoom.isPrivate}
						onChange={() => {
							var info: ReceivedInfo = {
								chatRoomID: currentChatRoom.chatRoomID,
								token: cookies["token"],
							};
							socket.emit("toggle private", info);
						}}
					/>
					<span className="private switch">Set channel as private</span>
				</div>
			);
		}
		return (
			<div className="relative m-4 text-darkblue dark:text-darkdarkblue">
				<h3>
					<span className="font-bold text-xl">Settings</span> for{" "}
					{currentChatRoom.isDM
						? getDMChannelAlias(currentChatRoom)
						: currentChatRoom.name}{" "}
					({currentChatRoom.isPrivate ? "private" : "public"})
				</h3>
				<hr
					className={`bg-darkblue dark:bg-darkdarkblue border-0 h-0.5 mt-1 mb-6`}
				></hr>
				{leave_button}
				{private_public}
				<hr
					className={`bg-darkblue dark:bg-darkdarkblue border-0 h-0.5 mt-1 mb-6`}
				></hr>
				<div className="ml-2">
					<div className="flex items-center mb-4">
						{currentChatRoom.hasPassword ? (
							<>
								<MdLockOutline className="mr-2" /> Password protected
							</>
						) : (
							<>
								<MdLockOpen className="mr-2" />
								Not password protected
							</>
						)}
					</div>
					{password_form}
				</div>
				<h3 className="font-bold text-xl mb-1 mt-4">Channel members</h3>
				<hr
					className={`bg-darkblue dark:bg-darkdarkblue border-0 h-0.5 mb-4`}
				></hr>
				{ListParticipants(
					currentChatRoom,
					navigate,
					socket,
					cookies,
					authenticatedUserID
				)}
				<button
					className="absolute top-0 right-0"
					onClick={() => {
						setSettings(false);
					}}
				>
					<CgCloseO />
				</button>
			</div>
		);
	}
};

export default SettingsMenu;
