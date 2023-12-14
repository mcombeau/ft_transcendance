- Appearance

  - CSS fix buttons
  - User profile -> Update user profile in background of settings menu instead of on settings menu close?

- Backend

  - update or delete on table \"users\" violates foreign key constraint \"FK_fb6add83b1a7acc94433d385692\" on table \"chat_participants\"
  - remove unused controller paths (i.e. chats controller since all is done through sockets)

- Bugs

  - all libraries are in latest stable version
  - remove unused libraries/modules + fix dependancy issues on frontend backend container creation?
  - Fix offline/online AGAIN

- Project validation

  - reset game score to 10
  - remove passwords for users
  - remove login page
  - force HTTPS and force redirect HTTP port 80 to HTTPS port 443
  - choose domain (localhost or ft_transcendance or whatever) and then fix callback URL for 42 auth

- Nice to have
  - all tokens are taken directly from socket
  - replay button on you won/ you lost screens
  - dark mode
  - publish website (see clevercloud)
