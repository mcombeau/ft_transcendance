- Bugs

  - Fix offline/online AGAIN
  - There should be an alert banner when you try to challenge someone you blocked to a game (or just remove challenge button of the profile pages of users you're blocking, like with the add friend button)
  - Frontend console logs: Remove errors from front to not scare correctors
    - On Leaderboard page, there is a DOM error about not having a unique key for each child

- Game Bugs:

  - Weird speed up x2 when ball hits corner of skate
  - random initial move should be limited to not be too close to x +/-1 and y +/-1

- Project validation

  - remove passwords for users
  - remove login page
  - force HTTPS and force redirect HTTP port 80 to HTTPS port 443
  - choose domain (localhost or ft_transcendance or whatever) and then fix callback URL for 42 auth
  - remove unused controller paths (i.e. chats controller since all is done through sockets)

- Nice to have

  - all tokens are taken directly from socket
  - publish website (see clevercloud)

- IF PROBLEMS WITH LOGOUT/BAD TOKEN:
  - Add window force reload: window.location.reload(); in function LogoutUser
