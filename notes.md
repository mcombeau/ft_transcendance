- Fix game

  - Fix leave page and rejoin
  - fix watch
  - forbid room creation/watching if you have a game on
  - forbid challenge (game invite) when you are in game
  - Make it possible for challenger to leave game room with button. make invite expire for the player's opponent.
    - If oppenent logs out, game keeps goins when it should do leave game

- Cleanup

  - change alerts to smth else (notifs ?)
  - allow access to chat/leaderboard ... but prompt for sign in

- Game

  - explain controls
  - draw background in css (refacto constants)
  - personalization
  - deal with broadband/network issues

- Profile

  - My profile
    - change 2fa activation
    - disable

- Bugs

  - 404 if page not exist (not tostring business)
  - people offline when logged
  - Error in back if token expired => handle it
  - When user plays a game and goes to another page during the game, when they return to the play page, they are not correctly added back to the game.

- passwords:

  - limit number of password retries on join/accept invite
  - tell user to fuck off if wrong username/password

- Appearance

  - css for lobby play
  - css for login page
  - css for settings profile
  - make friend avatars look pretty
  - css live game page

- Project validation

  - all libraries are in latest stable version
  - remove passwords for users

- Prompt for info first sign
- Prompt for 2fa when activated

- Nginx

  - fix callback URL for 42 auth
  - use HTTPS/443 instead of HTTP/80

- Nice to have
  - invite notif on profile ?
  - reload chat when joining ?
  - fix going to page for user that does not exist -- Make 404 page
  - notifs dans la navbar
  - pop up de notification
  - achievements (display in profile)
  - all tokens are taken directly from socket
  - change police chat
  - game start countdown
  - you won/ you lost screen + replay button
  - limit game history to X games
  - Achievements
  - Extended navbar
  - avatars in chats
