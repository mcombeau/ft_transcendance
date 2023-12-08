# ft_transcendance

ft_transcendance is a 42 school team project where we must build a website where users can create accounts via the 42 API, play a multiplayer game of Pong, and chat in public and private chat rooms.

This project is made with:

- docker & docker-compose
- React
- NestJS
- Postgresql

## Usage

### Pre-requisites

To launch ft_transcendance, you need docker and docker-compose.

An example environment file is provided. It should be filled out and renamed `.env` before building the project.

### Building ft_transcendance

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
