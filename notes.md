- CSS
	- Removed dot from profile
	- Context menu chat
	- game  
	- profile settigns

- Sign in

  - Prompt for info on first sign
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
  - "bob invites you to join chat [object Object]" -> Chat room name missing

- Appearance

  - use Tailwind CSS
  - css for lobby play
  - css for login page
  - css for settings profile
  - make friend avatars look pretty
  - css live game page

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
  - Extended navbar
  - avatars in chats
