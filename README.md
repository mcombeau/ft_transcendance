# ft_transcendance

<p align="center">
  <img src="https://github.com/Ellana42/ft_transcendance/blob/main/frontend-app/public/ft_transcendencee.png" alt="ft_transcendance 42 project badge"/>
</p>

Ft_transcendance is a 42 school team project where we must build a website where users can create accounts via the 42 API, play a real-time multiplayer game of Pong, and chat in public and private chat rooms.

This project is made with:

- [docker & docker-compose](https://www.docker.com/)
- [React](https://react.dev/)
- [NestJS](https://nestjs.com/)
- [Postgresql](https://www.postgresql.org/)

## Usage

### Requirements

To launch ft_transcendance, you need docker and docker-compose.

An example environment file is provided. It should be filled out and renamed `.env` before building the project.

### Building Ft_transcendance

To build ft_transcendance, clone the project and cd into it:

```
git clone git@github.com:Ellana42/ft_transcendance.git && cd ft_transcendance
```

Then run the build command (requires `sudo` permissions):

```
make
```

Once the front and backend have both compiled, you can view the website at: `https://localhost` or the custom domain specified in the `.env` file.

Other useful commands after the build is complete:

- `make pop`: run a python script to populate the database with users, match history and chat rooms.
- `make blog`: view the backend logs
- `make flog`: view the frontend logs

## Features

Ft_transcendance is a single-page application which includes a real-time multiplayer game of pong and a live chat.

### User Account/Profile Features

On this website, users are able to:

- create an account via the 42 OAuth API, by logging in with their 42 student account,
- enable or disable 2 factor authentication (with, for example, Google Authenticator),
- customize their profile with a unique username and avatar,
- add and remove friends,
- block or unblock users,
- keep track of their stats, match history and leaderboard ranking

### Pong Game Features

The game of Pong features:

- a responsive, 1v1, 2D multiplayer game of pong,
- a matchmaking system,
- the ability to invite other players to a game,
- the ability to watch other player's matches live,
- customization of the appearance of the game,
- reconnect to the current game in case of network issues

### Chat Features

The live chat features:

- creation of private and public chats, as well as direct messages between two users,
- the ability to block individual users so as not to see messages from blocked accounts,
- the ability for chat room creators to manage their chat rooms:
  - promote others as operators,
  - add or change the chat room password,
  - toggle the chat room from public to private and vice versa,
- the ability for chat room operators and creators to:
  - kick participants,
  - ban participants,
  - mute other users for a limited time
- a context menu enabling users to challenge others to a game of pong, invite them to a chat room, add them as friends, etc.

---

Made by mkaploun, mcombeau and iazimzha
