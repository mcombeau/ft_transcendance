- Bugs

- Maybe Bugs

  - Profile settings -> choose avatar -> close settings panel before saving new avatar -> big red error ?? Can't reproduce
  - Fix CSS on chat settings for small height screens
  - SidePannel.tx:181 each child in list shoudl have a unique key prop

---

- Project validation

  - fix make fclean on school computers
  - fix callback URL with 42API to use machine IP address port 8080
  - set score back to 10 for game
  - remove login page

- Nice to have

  - warn when an invite to play is refused (right now we just wait for the game to start)
  - search bar to find other users more easily
  - all tokens are taken directly from socket

- IF PROBLEMS WITH LOGOUT/BAD TOKEN:
  - Add window force reload: window.location.reload(); in function LogoutUser
