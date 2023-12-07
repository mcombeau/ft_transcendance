- Login
    - Login with 42 in navbar
    - Fuck off from finalize login if not signing in
	- for each page check authentication and redirect with 404 if not authenticated

- Chat
    - limit number of password retries on join/accept invite
    - tell user to fuck off if wrong chat password

- Game

  - deal with broadband/network issues
  - check that when reloading lobby properly ejected from waitlist
  - CSS maybe nicer You won/lost screen

- Bugs

  - update or delete on table \"users\" violates foreign key constraint \"FK_fb6add83b1a7acc94433d385692\" on table \"chat_participants\"

- Appearance

  - CSS fix navbar resizing when between small and big screen size
  - CSS fix buttons and maybe font size on smaller screen
  - Add global CSS rule to adapt front size to screen size

- Backend

  - enforce authorizations on contollers - check if user actually has the right to do what they're doing
  - check that 2fa is completed before accepting token

- Project validation

  - reset game score to 10
  - all libraries are in latest stable version
  - remove unused libraries/modules + fix dependancy issues on frontend backend container creation?
  - remove passwords for users
  - remove login page
  - rename finalize login page to login
  - force HTTPS and force redirect HTTP port 80 to HTTPS port 443
  - choose domain (localhost or ft_transcendance or whatever) and then fix callback URL for 42 auth

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
  - publish website
  - game difficulty choice
