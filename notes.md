- CSS

  - game
  - add styling for service announcements in chats
  - display chats on invite to chat in context menu

- Sign in

  - Prompt for 2fa when signing in when activated in profile settings

- Profile

  - My profile
    - change 2fa activation
    - disable

- Cleanup

  - deal with all issues from backend in the front
  - passwords
    - limit number of password retries on join/accept invite
    - tell user to fuck off if wrong username/password
  - allow access to chat/leaderboard ... but prompt for sign in

- Game

  - draw background in css (refacto constants)
  - personalization
  - deal with broadband/network issues
  - remove socket from Player game gateway

- Bugs

  - Error in back if token expired => handle it
  - too many options contextMenu in dms

- Appearance

  - css for lobby play
  - css for login page
  - css for settings profile
  - css for game

- Project validation

  - all libraries are in latest stable version
  - remove unused libraries/modules + fix dependancy issues on frontend backend container creation?
  - remove passwords for users
  - force HTTPS and force redirect HTTP port 80 to HTTPS port 443
  - choose domain (localhost or ft_transcendance or whatever) and then fix callback URL for 42 auth

- Nice to have
  - invite notif on profile ?
  - reload chat when joining ?
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
  - Extended navbar
  - avatars in chats
