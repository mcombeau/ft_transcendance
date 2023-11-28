import { useState } from "react";
import { Socket } from "socket.io-client";
import { getUsername } from "../../cookies";
import { isMuted } from "./Chat";
import { ReceivedInfo } from "./types";
import { ChatRoom, User } from "./types";

export const SendForm = (
	currentChatRoom: ChatRoom,
	cookies: any,
	socket: Socket,
	authenticatedUserID: number
) => {
	const [value, setValue] = useState("");

	const handleSendMessage = (e: any) => {
		e.preventDefault();
		if (
			!currentChatRoom ||
			value === "" ||
			currentChatRoom.name === "" ||
			!getUsername(cookies) ||
			!currentChatRoom.participants.some(
				(p: User) => p.userID === authenticatedUserID
			) ||
			isMuted(currentChatRoom, authenticatedUserID)
		) {
			console.log(
				"Message is empty or channel is not defined or not logged in. Or not in the channel"
			);
			return;
		}
		var info: ReceivedInfo = {
			token: cookies["token"],
			messageInfo: {
				message: value,
				sentAt: new Date(),
			},
			chatRoomID: currentChatRoom.chatRoomID,
		};
		socket.emit("chat message", info);
		setValue("");
	};

	if (
		!currentChatRoom ||
		!currentChatRoom.participants.find(
			(p: User) => p.userID === authenticatedUserID
		)
	) {
		return;
	}
	return (
		<form
			className="bg-lightblue absolute bottom-0 left-0 right-0 h-10 m-2 flex space-x-2"
			id="form"
			onSubmit={handleSendMessage}
		>
			<input
				className="rounded-md bg-sage flex-1 focus:outline-none p-2 placeholder:text-darkblue placeholder:opacity-40 text-darkblue"
				placeholder="New message ... "
				type="text"
				value={value}
				onChange={(e) => {
					setValue(e.target.value);
				}}
			/>
			<button className="bg-darkblue text-sage hover:bg-teal p-2 px-4 rounded-md">
				Send
			</button>
		</form>
	);
};

export default SendForm;
