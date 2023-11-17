%% TODO: Update with subject todo (from notion)

- Cleanup
  - change alerts to smth else (notifs ?)
  - move to typescript everywhere
  - cleanup all errors/warnings front
  - allow access to chat/leaderboard ... but prompt for sign in

- Game
  - explain controls
  - draw background in css
  - personalization
  - deal with broadband/network issues
  - Make it possible for challenger to leave game room with button. make invite expire for the player's opponent.

- Profile
  - Ladder level
  - ladder (whatever that is ?)
  - frontend give feedback when invalid avatar image sent to back (400 response from back)
  - see friends avatar
  - My profile
    - change 2fa activation
    - disable
  - other people
    - ( dm button )

- Bugs
  - 404 if page not exist (not tostring business)
  - people offline when logged
  - Error in back if token expired => handle it

- validation:
  - validation channel name
  - validate passwords

- passwords:
  - limit number of passwgrd retries on join/accept invite
  - tell user to fuck off if wrong username/password

- Appearance
  - css for game/lobby/endgamescreen
  - css profile settings
  - redo the login page (without styled components)

- Project validation
  - check we are protected against sql injections
  - all libraries are in latest stable version
  - server side validation for forms and user input
  - remove passwords for users

- Prompt for info first sign
- Prompt for 2fa when activated

- Nginx

  - have an actual url

- Live games page

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
  - use 42 profile picture as default user pic
