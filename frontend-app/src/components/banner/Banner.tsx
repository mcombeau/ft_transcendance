import { Dispatch, SetStateAction } from "react";
export type Banner = {
	id: number;
	message: string;
	display: boolean;
	style?: string;
};

export function createBanner(
	message: string,
	setBanners: Dispatch<SetStateAction<Banner[]>>,
	displayTime: number = 2000
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
			},
		];
	});
}

function Banners(
	banners: Banner[],
	setBanners: Dispatch<SetStateAction<Banner[]>>
) {
	function displayBanner(banner: Banner) {
		return (
			<div
				className={`bg-teal rounded-md px-6 p-4 m-4 text-sage shadow-md ${banner.style}`}
			>
				{banner.message}
			</div>
		);
	}

	return (
		<div className="absolute top-24 right-0 z-30 m-2">
			{banners.filter((banner: Banner) => banner.display).map(displayBanner)}
		</div>
	);
}

export default Banners;
