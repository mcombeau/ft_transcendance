import { useContext } from "react";
import { AuthenticationContext } from "../authenticationState";

export default function NotFound() {
	const { authenticatedUserID } = useContext(AuthenticationContext);

	return (
		<div className="background-element">
			<h2 className="title-element">404 - Page not found</h2>
			<p className="mb-4 pl-2">Oops! You seem to be lost.</p>
			{!authenticatedUserID ? (
				<div className="flex w-full justify-center">
					<form action="/backend/auth/42login">
						<button className="bg-darkblue dark:bg-darkdarkblue text-sage dark:text-darksage rounded-md m-2 p-2 px-4 whitespace-nowrap">
							Login with 42
						</button>
					</form>
				</div>
			) : (
				<></>
			)}
		</div>
	);
}
