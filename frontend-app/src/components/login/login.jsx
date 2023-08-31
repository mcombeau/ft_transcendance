import styled from "styled-components";
import Button from "./Button";
import Icon from "./Icon";
import Input from "./Input";
import "./login.css";
import { FaInstagram } from "react-icons/fa";
import { useState } from "react";
import { useCookies } from "react-cookie";
import { WebSocketContext } from "../../contexts/WebsocketContext";
import { useContext } from "react";
import { getUserID, getUserIDFromToken } from "../../cookies";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [email, setEmail] = useState("");
  const [cookies, setCookie, removeCookie] = useCookies(["cookie-name"]);
  const socket = useContext(WebSocketContext);
  let navigate = useNavigate();

  const InstagramBackground =
    "linear-gradient(to right, #A12AC4 0%, #ED586C 40%, #F0A853 100%)";

  const sendAuth = async (e) => {
    e.preventDefault();
    if (username === "" || password === "") return;
    var request = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username: username, password: password }),
    };
    await fetch("http://localhost:3001/auth/login", request).then(
      async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.log("error user login");
          return;
        }
        setCookie("token", data.access_token, { path: "/" }); // TODO: check if await is needed/if it does anything
        console.log("Access Token " + data.access_token);
        // socket.emit("login", data.access_token);
        navigate(`/user/${getUserIDFromToken(data.access_token)}`);
      }
    );
    setUsername("");
    setPassword("");
  };

  const signIn = (e) => {
    e.preventDefault();
    if (newUsername === "" || newPassword === "" || email === "") return;
    var request = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: newUsername,
        password: newPassword,
        email: email,
      }),
    };
    fetch("http://localhost:3001/users", request).then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        console.log("error user creation");
        return;
      }
      console.log("Response: ", data);
      console.log("New user ", newUsername, " ", newPassword, " ", email);
    });
    setNewUsername("");
    setNewPassword("");
    setEmail("");
  };

  return (
    <MainContainer id="login">
      <div className="log">
        <WelcomeText>Welcome to the Game</WelcomeText>
        <form onSubmit={sendAuth}>
          {/* <InputContainer> */}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
          />
          {/* </InputContainer> */}
          <ButtonContainer>
            <Button content="Login" />
          </ButtonContainer>
        </form>
        <form onSubmit={signIn}>
          {/* <InputContainer> */}
          <input
            type="text"
            placeholder="Username"
            value={newUsername}
            onChange={(e) => {
              setNewUsername(e.target.value);
            }}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
            }}
          />
          {/* </InputContainer> */}
          <ButtonContainer>
            <Button content="Sign Up" />
          </ButtonContainer>
        </form>
        <form action="http://localhost:3001/auth/42login">
          <button
          // onClick={() => {
          //   fetch("http://localhost:3001/auth/42login", { mode: 'cors' }).then(
          //     async (response) => {
          //       const data = await response.json();
          //       if (!response.ok) {
          //         console.log("error response load channels");
          //         return;
          //       }
          //       console.log("Logged in with 42 !!!");
          //       console.log(data);
          //     }
          //   );
          // }}
          >
            Login with 42
          </button>
        </form>
        <LoginWith>OR LOGIN WITH</LoginWith>
        <HorizontalRule />
        <IconsContainer>
          <Icon color={InstagramBackground}>
            <FaInstagram />
          </Icon>
        </IconsContainer>
        <ForgotPassword>Forgot Password ?</ForgotPassword>
      </div>
    </MainContainer>
  );
}

const MainContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  height: 80vh;
  width: 30vw;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  backdrop-filter: blur(8.5px);
  -webkit-backdrop-filter: blur(8.5px);
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.4rem;
  @media only screen and (max-width: 320px) {
    width: 80vw;
    height: 90vh;
    hr {
      margin-bottom: 0.3rem;
    }
    h4 {
      font-size: small;
    }
  }
  @media only screen and (min-width: 360px) {
    width: 80vw;
    height: 90vh;
    h4 {
      font-size: small;
    }
  }
  @media only screen and (min-width: 411px) {
    width: 80vw;
    height: 90vh;
  }

  @media only screen and (min-width: 768px) {
    width: 80vw;
    height: 80vh;
  }
  @media only screen and (min-width: 1024px) {
    width: 70vw;
    height: 50vh;
  }
  @media only screen and (min-width: 1280px) {
    width: 30vw;
    height: 80vh;
  }
`;

const WelcomeText = styled.h2`
  margin: 3rem 0 2rem 0;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  height: 20%;
  width: 100%;
`;

const ButtonContainer = styled.div`
  margin: 1rem 0 2rem 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoginWith = styled.h5`
  cursor: pointer;
`;

const HorizontalRule = styled.hr`
  width: 90%;
  height: 0.3rem;
  border-radius: 0.8rem;
  border: none;
  background: linear-gradient(to right, #14163c 0%, #03217b 79%);
  background-color: #ebd0d0;
  margin: 1.5rem 0 1rem 0;
  backdrop-filter: blur(25px);
`;

const IconsContainer = styled.div`
  display: flex;
  justify-content: space-evenly;
  margin: 2rem 0 3rem 0;
  width: 80%;
`;

const ForgotPassword = styled.h4`
  cursor: pointer;
`;

export default Login;
