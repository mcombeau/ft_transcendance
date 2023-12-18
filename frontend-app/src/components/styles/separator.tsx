export function separatorLine(
	title: string,
	textColor: string = "darkblue",
	backgroundColor: string = "lightblue"
) {
	let dmTextColor = "darkblue";
	if (textColor === "sage") {
		dmTextColor = "teal";
	}

	const bgLine: string = `bg-${textColor} dark:bg-dark${dmTextColor}`;
	const bgText: string = `bg-${backgroundColor} dark:bg-dark${backgroundColor}`;
	const textText: string = `text-${textColor} dark:text-dark${dmTextColor}`;
	return (
		<div className={`w-full flex justify-center mb-6 relative mt-4`}>
			<hr className={`${bgLine} border-0 h-0.5 w-3/4 mt-2.5`}></hr>
			<div
				className={`${bgText} ${textText} text-sm italic absolute px-4 top-0`}
			>
				{title}
			</div>
		</div>
	);
}
