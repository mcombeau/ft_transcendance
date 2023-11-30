import { ChatRoom, ReceivedInfo, Status, User } from "./types";
import { NavigateFunction } from "react-router-dom";
import { Socket } from "socket.io-client";
import { ChangeStatus, isUserMuted } from "./Chat";
import { checkStatus } from "./Chat";
import { ButtonIconType, getButtonIcon } from "../styles/icons";
import { ReactElement } from "react";

export function canManageUser(
	targetID: number,
	authenticatedUserID: number,
	channel: ChatRoom
) {
	if (authenticatedUserID === targetID) return false;
	if (channel.isDM) return false;

	const myStatus: Status = checkStatus(channel, authenticatedUserID);
	const targetStatus: Status = checkStatus(channel, targetID);

	if (myStatus === Status.Normal) return false;
	if (targetStatus === Status.Owner) return false;
	if (targetStatus === Status.Operator && myStatus !== Status.Owner)
		return false;

	return true;
}

export function canToggleOperator(
	targetID: number,
	authenticatedUserID: number,
	channel: ChatRoom
) {
	if (authenticatedUserID === targetID) return false;
	if (channel.isDM) return false;

	const myStatus: Status = checkStatus(channel, authenticatedUserID);
	const targetStatus: Status = checkStatus(channel, targetID);

	if (myStatus !== Status.Owner) return false;
	if (targetStatus === Status.Owner) return false;

	return true;
}

export const ListParticipants = (
	channel: ChatRoom,
	navigate: NavigateFunction,
	socket: Socket,
	cookies: any,
	authenticatedUserID: number
) => {
	function displayUser(participant: User) {
		var name = participant.username;
		var status: ReactElement;
		if (participant.isOwner) {
			status = <span className="text-xs font-extralight"> owner</span>;
		} else if (participant.isOperator) {
			status = <span className="text-xs font-extralight"> operator</span>;
		}
		return (
			<span
				onClick={() => {
					navigate("/user/" + participant.userID);
				}}
			>
				{name}
				{status}
			</span>
		);
	}

	function unmuteButton(participant: User) {
		return (
			<button
				className="button"
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
		);
	}

	function muteButton(participant: User) {
		return (
			<>
				<select
					className="rounded-md bg-sage px-2 py-0 h-8"
					id={"mute " + participant.username}
				>
					<option value="1">1 minute</option>
					<option value="5">5 minutes</option>
					<option value="60">1 hour</option>
					<option value="1440">1 day</option>
				</select>
				<button
					className="button"
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
		);
	}

	function kickButton(participant: User) {
		return (
			<button
				className="button"
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
		);
	}

	function banButton(participant: User) {
		return (
			<button
				className="button"
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
		);
	}

	function operatorButton(participant: User) {
		return (
			<>
				<button
					className="button flex"
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
		);
	}

	function displayParticipant(participant: User) {
		return (
			<div className="items-center grid grid-cols-5 bg-sage rounded m-2 p-2 py-0">
				<div id="username" className="col-span-1">
					{displayUser(participant)}
				</div>
				<div id="buttons" className="flex col-span-4 items-center space-x-2">
					{canManageUser(participant.userID, authenticatedUserID, channel) ? (
						<>
							{isUserMuted(participant)
								? unmuteButton(participant)
								: muteButton(participant)}
							{kickButton(participant)}
							{banButton(participant)}
						</>
					) : (
						<></>
					)}
					{canToggleOperator(
						participant.userID,
						authenticatedUserID,
						channel
					) ? (
						operatorButton(participant)
					) : (
						<></>
					)}
				</div>
			</div>
		);
	}

	function displayBanned(participant: User) {
		return (
			<div className="grid grid-cols-5 bg-sage rounded m-2 p-2 items-center py-0">
				<div className="col-span-1">
					<span>{participant.username}</span>
				</div>
				<div className="flex col-span-2">
					{checkStatus(channel, authenticatedUserID) !== Status.Normal ? (
						<button
							className="button"
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
			</div>
		);
	}

	function displayInvited(participant: User) {
		return (
			<div className="bg-sage rounded m-2 p-2 py-2 items-center ">
				<span>{participant.username}</span>
			</div>
		);
	}

	return (
		<div className="participant_list">
			{channel.participants.map(displayParticipant)}
			<h3 className="font-bold text-xl mb-1 mt-4">Banned users</h3>
			<hr className={`bg-darkblue border-0 h-0.5 mb-4`}></hr>
			{channel.banned.map(displayBanned)}
			<h3 className="font-bold text-xl mb-1 mt-4">Invited users</h3>
			<hr className={`bg-darkblue border-0 h-0.5 mb-4`}></hr>
			{channel.invited.map(displayInvited)}
		</div>
	);
};
