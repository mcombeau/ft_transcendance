import { useState } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { BannerType, createBanner } from "../banner/Banner";

function SearchBar({ setBanners }) {
	const [searchedUsername, setSearchedUsername] = useState<string>("");
	const [cookies] = useCookies(["token"]);
	const navigate = useNavigate();

	function searchForUser(e: any) {
		e.preventDefault();
		var request = {
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${cookies["token"]}`,
			},
		};

		fetch(`/backend/users/username/${searchedUsername}`, request).then(
			async (response) => {
				const data = await response.json();
				if (!response.ok) {
					createBanner(
						"The user you are searching for does not exist",
						setBanners
					);
					setSearchedUsername("");
					return;
				}
				navigate(`/user/${data.id}`);
				setSearchedUsername("");
			}
		);
	}

	return (
		<div className="background-element">
			<h1 className="title-element">Search</h1>
			<form className="items-center" onSubmit={searchForUser}>
				<input
					className="bg-sage dark:bg-darksage rounded-md p-2 placeholder:text-darkblue placeholder:dark:text-darkdarkblue placeholder:opacity-40"
					placeholder="username"
					type="text"
					value={searchedUsername}
					onChange={(e) => {
						setSearchedUsername(e.target.value);
					}}
				/>
				<button className="button px-2">Search</button>
			</form>
		</div>
	);
}

export default SearchBar;
