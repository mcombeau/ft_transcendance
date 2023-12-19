import { Dispatch, ReactElement, SetStateAction } from "react";

export enum BannerType {
	Alert,
	Notif,
}

export type Banner = {
	id: number;
	message: string | ReactElement;
	display: boolean;
	type: BannerType;
	style?: string;
};

export function createBanner(
	message: string | ReactElement,
	setBanners: Dispatch<SetStateAction<Banner[]>>,
	bannerType: BannerType = BannerType.Notif,
	displayTime: number = 2000 * 2
) {
	setBanners((prev: Banner[]) => {
		const id = prev.length;
		setTimeout(
			() =>
				setBanners((prev) => prev.filter((banner: Banner) => banner.id !== id)),
			displayTime
		);
		return [
			...prev,
			{
				id: id,
				message: message,
				display: true,
				type: bannerType,
			},
		];
	});
}

function Banners(
	banners: Banner[],
	setBanners: Dispatch<SetStateAction<Banner[]>>
) {
	function displayBanner(banner: Banner) {
		let style: string = "rounded-md px-6 p-4 m-4 shadow-md";
		switch (banner.type) {
			case BannerType.Notif:
				style += " bg-teal dark:bg-darkteal text-sage dark:text-darksage ";
				break;
			case BannerType.Alert:
				style += " bg-red-500 text-sage dark:text-darksage ";
				break;
		}
		style += " " + banner.style;
		return <div className={style}>{banner.message}</div>;
	}

	return (
		<div className="absolute top-16 lg:top-24 right-0 z-30 m-2">
			{banners.filter((banner: Banner) => banner.display).map(displayBanner)}
		</div>
	);
}

export default Banners;
