- CSS

  - game

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

  - update or delete on table \"users\" violates foreign key constraint \"FK_fb6add83b1a7acc94433d385692\" on table \"chat_participants\"
  - might be duplicate dm (on context menu)

- Appearance

  - css for lobby play
  - css for login page
  - css for game

- Project validation

  - all libraries are in latest stable version
  - remove unused libraries/modules + fix dependancy issues on frontend backend container creation?
  - remove passwords for users
  - force HTTPS and force redirect HTTP port 80 to HTTPS port 443
  - choose domain (localhost or ft_transcendance or whatever) and then fix callback URL for 42 auth
  - enforce authorizations on contollers - check if user actually has the right to do what they're doing

- Nice to have
  - ping front for token refresh (can continue to use chat if you mess up token because token is only rechecked on page reload/navigate)
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
  - notifs for chat events everywhere
