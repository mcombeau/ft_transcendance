- Bugs

  - Profile settings -> choose avatar -> close settings panel before saving new avatar -> big red error ?? Can't reproduce
  - Fix CSS on chat settings for small height screens
  - SidePannel.tx:181 each child in list shoudl have a unique key prop

- Project validation

  - fix callback URL with 42API to use machine IP address port 8080
  - set score back to 10 for game
  - remove passwords for users
  - remove login page
  - remove unused controller paths (i.e. chats controller since all is done through sockets)

- Nice to have

  - Fix offline/online AGAIN: Switch to offline everytime we click on a link
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
