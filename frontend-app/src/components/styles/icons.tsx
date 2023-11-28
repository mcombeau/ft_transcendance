import { LuGamepad } from "react-icons/lu";
import { CgUnblock } from "react-icons/cg";
import { BiVolumeFull, BiVolumeMute } from "react-icons/bi";
import { RxExit } from "react-icons/rx";
import { MdAdminPanelSettings } from "react-icons/md";
import { LiaUserAltSlashSolid } from "react-icons/lia";

export enum ButtonIconType {
	challenge,
	friend,
	unfriend,
	block,
	unblock,
	dm,
	settings,
	mute,
	unmute,
	kick,
	ban,
	unban,
	operator,
}

export function getButtonIcon(
	buttonType: ButtonIconType,
	className: string = "button-icon"
) {
	switch (buttonType) {
		case ButtonIconType.operator:
			return <MdAdminPanelSettings className={className} />;
		case ButtonIconType.challenge:
			return <LuGamepad className={className}></LuGamepad>;
		case ButtonIconType.kick:
			return <RxExit className={className} />;
		case ButtonIconType.mute:
			return <BiVolumeMute className={className} />;
		case ButtonIconType.unmute:
			return <BiVolumeFull className={className} />;
		case ButtonIconType.friend:
			return (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="currentColor"
					className={className}
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
					/>
				</svg>
			);
		case ButtonIconType.unfriend:
			return (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="currentColor"
					className={className}
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z"
					/>
				</svg>
			);
		case ButtonIconType.block:
			return (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					strokeWidth={1.5}
					stroke="currentColor"
					className={className}
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
					/>
				</svg>
			);
		case ButtonIconType.ban:
			return <LiaUserAltSlashSolid className={className} />;
		case ButtonIconType.unban:
			return <CgUnblock className={className} />;
		case ButtonIconType.unblock:
			return <CgUnblock className={className} />;
		case ButtonIconType.unblock:
			return <CgUnblock className={className} />;
		case ButtonIconType.dm:
			return (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					className={className}
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
					/>
				</svg>
			);
		case ButtonIconType.settings:
			return (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					className={className}
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495"
					/>
				</svg>
			);
	}
}
