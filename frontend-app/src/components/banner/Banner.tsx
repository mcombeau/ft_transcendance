import { Dispatch, SetStateAction } from "react";
import { Banner } from "../../App";

function Banners(
	banners: Banner[],
	setBanners: Dispatch<SetStateAction<Banner[]>>
) {
	function displayBanner(banner: Banner) {
		return (
			<div className="bg-teal rounded-md px-6 p-4 m-4 text-sage shadow-md">
				{banner.message}
			</div>
		);
	}

	return (
		<div className="absolute top-24 right-0 z-30 m-2">
			{banners.map(displayBanner)}
		</div>
	);
}

export default Banners;
