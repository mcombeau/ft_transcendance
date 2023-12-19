- Bugs

  - Profile settings -> choose avatar -> close settings panel before saving new avatar -> big red error ?? Can't reproduce
  - Mute is weird when we unmute someone + mute broken when mute from context menu + mute from settings menu
  - Fix offline/online AGAIN: Switch to offline everytime we click on a link
  - Frontend console logs: Remove errors from front to not scare correctors
  - On Leaderboard page, there is a DOM error about not having a unique key for each child
  - On Banner.tsx:59, there is a DOM error about not having a unique key for each child (profile settings -> bad png upload -> save new avatar)

- Project validation

  - set score back to 10 for game
  - remove passwords for users
  - remove login page
  - force HTTPS and force redirect HTTP port 80 to HTTPS port 443
  - choose domain (localhost or ft_transcendance or whatever) and then fix callback URL for 42 auth
  - remove unused controller paths (i.e. chats controller since all is done through sockets)

- Nice to have

  - warn when an invite to play is refused (right now we just wait for the game to start)
  - search bar to find other users more easily
  - all tokens are taken directly from socket
  - publish website (see clevercloud)

- IF PROBLEMS WITH LOGOUT/BAD TOKEN:
  - Add window force reload: window.location.reload(); in function LogoutUser

Fiona :

- on my computer (ubuntu), I need to change all the "docker-compose" command with "docker compose" (remove the '-')
- when I make fclean on my computer (ubuntu), I have this error :
  `docker volume rm ft_transcendance_database
     Error response from daemon: get ft_transcendance_database: no such volume
     make: *** [Makefile:39 : delete_db] Erreur 1
`
  but it might be me that did not use the project right
