- Bugs

  - all libraries are in latest stable version
  - remove unused libraries/modules + fix dependancy issues on frontend backend container creation?
  - Fix offline/online AGAIN
  - upload avatar: large file size breaks everything ([mcombeau]kali-cubism.jpg image is also a problem)
  - new 42 user login broken (500 server error)
  - button challenge in profile doesn't work

- Project validation

  - reset game score to 10
  - remove passwords for users
  - remove login page
  - force HTTPS and force redirect HTTP port 80 to HTTPS port 443
  - choose domain (localhost or ft_transcendance or whatever) and then fix callback URL for 42 auth
  - remove unused controller paths (i.e. chats controller since all is done through sockets)

- Nice to have

  - all tokens are taken directly from socket
  - replay button on you won/ you lost screens
  - publish website (see clevercloud)

- IF PROBLEMS WITH LOGOUT/BAD TOKEN:
  - Add window force reload: window.location.reload(); in function LogoutUser
