function Login() {

	const auth42 = () => {
		console.log("here");
		fetch("/auth")
         .then((data) => {
            console.log(data);
         })
         .catch((err) => {
            console.log(err.message);
         });
	}

    return (
		<button onClick={auth42}>Login</button>
    )
}

export default Login;
