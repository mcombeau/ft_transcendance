export function separatorLine(
	title: string,
	textColor: string = "darkblue",
	backgroundColor: string = "lightblue"
) {
	return (
		<div className={`w-full flex justify-center mb-6 relative mt-4`}>
			<hr className={`bg-${textColor} border-0 h-0.5 w-3/4 mt-2.5`}></hr>
			<div
				className={`bg-${backgroundColor} text-${textColor} text-sm italic absolute px-4 top-0`}
			>
				{title}
			</div>
		</div>
	);
}
