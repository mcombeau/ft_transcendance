import { ChatRoom, ReceivedInfo, Status, User } from "./types";
import { NavigateFunction } from "react-router-dom";
import { Socket } from "socket.io-client";
import { ChangeStatus, isUserMuted } from "./Chat";
import { checkStatus } from "./Chat";
import { ButtonIconType, getButtonIcon } from "../styles/icons";

export const ListParticipants = (
	channel: ChatRoom,
	navigate: NavigateFunction,
	socket: Socket,
	cookies: any,
	authenticatedUserID: number
) => {
	function displayUser(participant: User) {
		var name = participant.username;
		var style = {};
		if (participant.isOwner) {
			style = { textDecoration: "underline" };
		} else if (participant.isOperator) {
			name += " ★";
		}
		if (isUserMuted(participant)) {
			name += " 🔇";
			style = { fontStyle: "italic" };
		}
		return (
			<li
				onClick={() => {
					navigate("/user/" + participant.userID);
				}}
				style={style}
			>
				{name}
			</li>
		);
	}

	function displayParticipant(participant: User) {
		return (
			<div className="flex items-center">
				{displayUser(participant)}
				{checkStatus(channel, authenticatedUserID) !== Status.Normal &&
				checkStatus(channel, participant.userID) !== Status.Owner &&
				authenticatedUserID !== participant.userID ? (
					<>
						{isUserMuted(participant) ? (
							<button
								className="button-sm"
								onClick={() => {
									console.log("Muted");
									var info: ReceivedInfo = {
										token: cookies["token"],
										chatRoomID: channel.chatRoomID,
										targetID: participant.userID,
										participantInfo: {
											mutedUntil: 0,
										},
									};
									ChangeStatus(info, "mute", socket);
								}}
							>
								{getButtonIcon(ButtonIconType.unmute, "button-icon-sm")}
							</button>
						) : (
							<>
								<select id={"mute " + participant.username}>
									<option value="1">1 minute</option>
									<option value="5">5 minutes</option>
									<option value="60">1 hour</option>
									<option value="1440">1 day</option>
								</select>
								<button
									className="button-sm"
									onClick={() => {
										var muteTime = document.getElementById(
											"mute " + participant.username
										)["value"];
										muteTime = parseInt(muteTime);
										console.log("Muted for ", muteTime);
										var info: ReceivedInfo = {
											token: cookies["token"],
											chatRoomID: channel.chatRoomID,
											targetID: participant.userID,
											participantInfo: {
												mutedUntil: muteTime,
											},
										};
										ChangeStatus(info, "mute", socket);
									}}
								>
									{getButtonIcon(ButtonIconType.mute, "button-icon-sm")}
								</button>
							</>
						)}
						<button
							className="button-sm"
							onClick={() => {
								console.log("Kicked");
								var info: ReceivedInfo = {
									token: cookies["token"],
									chatRoomID: channel.chatRoomID,
									targetID: participant.userID,
								};
								ChangeStatus(info, "kick", socket);
							}}
						>
							{getButtonIcon(ButtonIconType.kick, "button-icon-sm")}
						</button>
						<button
							className="button-sm"
							onClick={() => {
								console.log("Banned " + participant);
								var info: ReceivedInfo = {
									token: cookies["token"],
									chatRoomID: channel.chatRoomID,
									targetID: participant.userID,
								};
								ChangeStatus(info, "ban", socket);
							}}
						>
							{getButtonIcon(ButtonIconType.ban, "button-icon-sm")}
						</button>
					</>
				) : (
					<div></div>
				)}
				{checkStatus(channel, authenticatedUserID) === Status.Owner &&
				checkStatus(channel, participant.userID) !== Status.Owner &&
				authenticatedUserID !== participant.userID ? (
					<>
						<button
							className="button-sm flex"
							onClick={() => {
								console.log("Made operator " + participant);
								var info: ReceivedInfo = {
									token: cookies["token"],
									chatRoomID: channel.chatRoomID,
									targetID: participant.userID,
								};
								ChangeStatus(info, "operator", socket);
							}}
						>
							{getButtonIcon(ButtonIconType.operator, "button-icon-sm")}
							{checkStatus(channel, participant.userID) == Status.Operator
								? "Remove from admins"
								: "Make admin"}
						</button>
					</>
				) : (
					<div></div>
				)}
			</div>
		);
	}

	function displayBanned(participant: User) {
		return (
			<div>
				<li>{participant.username}</li>
				{checkStatus(channel, authenticatedUserID) !== Status.Normal ? (
					<button
						className="button-sm"
						onClick={() => {
							console.log("unban " + participant.username);
							var info: ReceivedInfo = {
								token: cookies["token"],
								chatRoomID: channel.chatRoomID,
								targetID: participant.userID,
							};
							ChangeStatus(info, "ban", socket);
						}}
					>
						{getButtonIcon(ButtonIconType.unban, "button-icon-sm")}
					</button>
				) : (
					""
				)}
			</div>
		);
	}

	function displayInvited(participant: User) {
		return (
			<div>
				<li>{participant.username}</li>
			</div>
		);
	}

	return (
		<ul className="participant_list">
			<div>{channel.participants.map(displayParticipant)}</div>
			<h3 className="font-bold text-xl mb-1 mt-4">Banned users</h3>
			<hr className={`bg-darkblue border-0 h-0.5 mb-4`}></hr>
			{channel.banned.map(displayBanned)}
			<h3 className="font-bold text-xl mb-1 mt-4">Invited users</h3>
			<hr className={`bg-darkblue border-0 h-0.5 mb-4`}></hr>
			{channel.invited.map(displayInvited)}
		</ul>
	);
};
