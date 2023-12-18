export function getFormattedTime(inputTime: Date) {
	const time: Date = new Date(inputTime);
	const hours: string = time.getHours().toString().padStart(2, "0");
	const minutes: string = time.getMinutes().toString().padStart(2, "0");
	return hours + ":" + minutes;
}
export function sameDay(date1: Date, date2: Date) {
	date1 = new Date(date1);
	date2 = new Date(date2);
	return (
		date1.getFullYear() === date2.getFullYear() &&
		date1.getMonth() === date2.getMonth() &&
		date1.getDate() === date2.getDate()
	);
}

export function formatDate(inputDate: Date) {
	const inputDatestamp: number = new Date(inputDate).getTime();
	const fulldays = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
	var dt = new Date(inputDatestamp),
		date = dt.getDate(),
		month = months[dt.getMonth()],
		// timeDiff = inputDatestamp - Date.now(),
		diffDays = new Date().getDate() - date,
		diffMonths = new Date().getMonth() - dt.getMonth(),
		diffYears = new Date().getFullYear() - dt.getFullYear();

	if (diffYears === 0 && diffDays === 0 && diffMonths === 0) {
		return "Today";
	} else if (diffYears === 0 && diffDays === 1) {
		return "Yesterday";
	} else if (diffYears === 0 && diffDays === -1) {
		return "Tomorrow";
	} else if (diffYears === 0 && diffDays < -1 && diffDays > -7) {
		return fulldays[dt.getDay()];
	} else if (diffYears >= 1) {
		return month + " " + date + ", " + new Date(inputDatestamp).getFullYear();
	} else {
		return month + " " + date;
	}
}
