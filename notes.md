- Bugs

  - Mute is weird when we unmute someone + mute broken when mute from context menu + mute from settings menu
  - warn when an invite to play is refused (right now we just wait for the game to start)
  - Fix offline/online AGAIN: Switch to offline everytime we click on a link
  - There should be an alert banner when you try to challenge someone you blocked to a game (or just remove challenge button of the profile pages of users you're blocking, like with the add friend button)
  - Frontend console logs: Remove errors from front to not scare correctors
  - On Leaderboard page, there is a DOM error about not having a unique key for each child

- Game Bugs:

  - Celerity max for ball (when the ball goes too fast, the ball goes behond the paddle and marks a point when it shoud not)
  - Weird speed up x2 when ball hits corner of skate (the ball speeds up too mutch because it is in contact with a paddle multiple times) (limit to 1 bonce on each paddle)
  - random initial move should be limited to not be too close to x +/-1 and y +/-1

- Project validation

  - remove passwords for users
  - remove login page
  - force HTTPS and force redirect HTTP port 80 to HTTPS port 443
  - choose domain (localhost or ft_transcendance or whatever) and then fix callback URL for 42 auth
  - remove unused controller paths (i.e. chats controller since all is done through sockets)

- Nice to have

  - when we print an error because of invalid charset, we should specify what are the invalid charsets
  - all tokens are taken directly from socket
  - publish website (see clevercloud)

- IF PROBLEMS WITH LOGOUT/BAD TOKEN:
  - Add window force reload: window.location.reload(); in function LogoutUser

Fiona :

- search bar ?

- on my computer (ubuntu), I need to change all the "docker-compose" command with "docker compose" (remove the '-')
- when I make fclean on my computer (ubuntu), I have this error :
  `docker volume rm ft_transcendance_database
     Error response from daemon: get ft_transcendance_database: no such volume
     make: *** [Makefile:39 : delete_db] Erreur 1
`
  but it might be me that did not use the project right
