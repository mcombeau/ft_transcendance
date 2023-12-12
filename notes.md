- LEADERBOARD !

- Game

  - deal with broadband/network issues

- Appearance

  - CSS fix buttons

- Backend

  - update or delete on table \"users\" violates foreign key constraint \"FK_fb6add83b1a7acc94433d385692\" on table \"chat_participants\"

- Bugs

  - Fix offline/online AGAIN

- Project validation

  - reset game score to 10
  - all libraries are in latest stable version
  - remove unused libraries/modules + fix dependancy issues on frontend backend container creation?
  - remove passwords for users
  - remove login page
  - rename finalize login page to login
  - force HTTPS and force redirect HTTP port 80 to HTTPS port 443
  - choose domain (localhost or ft_transcendance or whatever) and then fix callback URL for 42 auth
  - remove unused controller paths (i.e. chats controller since all is done through sockets)

- Nice to have
  - ping front for token refresh (can continue to use chat if you mess up token because token is only rechecked on page reload/navigate)
  - invite notif on profile ?
  - reload chat when joining ?
  - notifs dans la navbar
  - notification banner from chat on all pages
  - achievements (display in profile)
  - all tokens are taken directly from socket
  - game start countdown
  - replay button on you won/ you lost screens
  - use 42 profile picture as default user pic
  - avatars in chats
  - notifs for chat events everywhere
  - dark mode
  - publish website (see clevercloud)
  - game difficulty choice
