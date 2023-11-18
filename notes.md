%% TODO: Update with subject todo (from notion)

- Cleanup

  - change alerts to smth else (notifs ?)
  - allow access to chat/leaderboard ... but prompt for sign in

- Game

  - explain controls
  - draw background in css
  - personalization
  - deal with broadband/network issues
  - Make it possible for challenger to leave game room with button. make invite expire for the player's opponent.
  - make it impossible to watch a game you are playing in 

- Profile

  - My profile
    - change 2fa activation
    - disable
  - Dm button on other people

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

  - css for lobby play
  - css for login page
  - css for settings profile
  - make friend avatars look pretty
  - css live game page

- Project validation

  - check we are protected against sql injections
  - all libraries are in latest stable version
  - server side validation for forms and user input
  - check no credientials are in git
  - remove passwords for users

- Prompt for info first sign
- Prompt for 2fa when activated

- Nginx

  - have an actual url

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
  - ladder in history ?
  - avatars in chats
