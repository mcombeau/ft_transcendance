import requests
import time
import typing

Res = requests.Response
Any = typing.Any

USER_AGENT = 'user_agent'
URL_USER_CREATION = 'http://localhost:3001/users'
URL_USER_LOGIN = 'http://localhost:3001/auth/login'

# ---------------------------
# Prettify
# ---------------------------
class color:
    HEADER = '\033[36m'
    INFO = '\033[96m'
    SUCCESS = '\033[92m'
    WARNING = '\033[93m'
    ERROR = '\033[91m'
    RESET = '\033[0m'

def print_header(message: str) -> None:
    print('{:-^80}'.format(''))
    print(f'{color.INFO}{message}{color.RESET}')
    print('{:-^80}'.format(''))

def print_users(users: dict[str, dict[str, str]]) -> None:
    for u in users:
        print(f'----- USER')
        for i in users[u]:
            print(f'{i}: {users[u][i]}')

# ---------------------------
# Requests
# ---------------------------
def wait_for_database(url: str) -> None:
    print_header('Establishing ft_transcendance backend connection')
    while 1:
        try:
            get_from_url(url)
            time.sleep(2)
            get_from_url(url)
            print(f'{color.SUCCESS}+ Database connection established on {url}.{color.RESET}')
            break
        except Exception or ConnectionResetError:
            print(f'Waiting for database connection...')
            time.sleep(2)
            continue

def get_from_url(url: str, verbose: bool = False) -> Res:
    header: dict[str, str] = {"User-Agent":USER_AGENT}
    r: Res = requests.get(url, headers = header, timeout = 5)
    r.raise_for_status()
    if verbose:
        print(f'{color.SUCCESS}OK ({r.status_code} response): {url}{color.RESET}')
    return r

def post_to_url(url: str, body: dict[str, str], token: str = '') -> Res:
    try:
        header: dict[str, str] = {"User-Agent":USER_AGENT}
        if token != '':
            header['Authorization'] = 'Bearer ' + token
        r: Res = requests.post(url, headers = header, json = body, timeout = 5)
        r.raise_for_status()
        print(f'{color.SUCCESS}+ Status OK ({r.status_code} response): {url}{color.RESET}')
        return r
    except Exception as e:
        print(f'{color.ERROR}+ Error: {e}{color.RESET}')
        raise Exception(e)

# ---------------------------
# User Creation
# ---------------------------
def add_user_to_db(body: dict[str, str]) -> str:
    try:
        print(f'Creating user: {body}{color.RESET}')
        r: Res = post_to_url('http://localhost:3001/users', body)
        return r.json()['id']
    except Exception:
        r: Res = get_from_url('http://localhost:3001/users')
        for i in r.json():
            if i['username'] == body['username']:
                print(f"{color.INFO}+ User '{body['username']}' already exists in database{color.RESET}")
                return i['id']
        return '0'

def get_user_access_token(body: dict[str, str]) -> str:
    try:
        r: Res = post_to_url('http://localhost:3001/auth/login', body)
        return r.json()['access_token']
    except Exception:
        return ''

def create_user(username: str, password: str) -> dict[str, str]:
    userInfo: dict[str, str] = {
        "username": username,
        "password": password,
        "email": username + '@mail.com'
    }
    userInfo['id'] = add_user_to_db(userInfo)
    userInfo['token'] = get_user_access_token(userInfo)
    return userInfo

def create_users() -> dict[str, dict[str, str]]:
    print_header('Creating Users')
    userInfo: dict[str, dict[str, str]] = {}
    userInfo['alice'] = create_user('alice', 'pass')
    userInfo['bob'] = create_user('bob', 'pass')
    userInfo['chloe'] = create_user('chloe', 'pass')
    userInfo['dante'] = create_user('dante', 'pass')
    for u in userInfo:
        if userInfo[u]['id'] == '0':
            del userInfo[u]
    return userInfo

# ---------------------------
# Games Creation
# ---------------------------
def create_game(users: dict[str, dict[str, str]],
                winner: str,
                loser: str,
                winScore: int,
                loseScore: int) -> None:
    body: dict[str, Any] = {
        "winnerID": users[winner]['id'],
        "loserID": users[loser]['id'],
        "winnerScore": winScore,
        "loserScore": loseScore
    }
    print(f'{body}')
    post_to_url('http://localhost:3001/games', body, users[winner]['token'])

def create_games(users: dict[str, dict[str, str]]) -> None:
    print_header('Creating games')
    create_game(users, 'alice', 'bob', 10, 5)
    create_game(users, 'dante', 'bob', 7, 1)
    create_game(users, 'chloe', 'dante', 9, 2)
    create_game(users, 'dante', 'chloe', 5, 0)
    create_game(users, 'alice', 'dante', 9, 3)
    create_game(users, 'chloe', 'alice', 5, 1)
    create_game(users, 'bob', 'dante', 1, 0)

# ---------------------------
# Friend Relations Creation
# ---------------------------
def create_friendship(users: dict[str, dict[str, str]],
                user1: str,
                user2: str) -> None:
    body: dict[str, Any] = {
        "userID1": users[user1]['id'],
        "userID2": users[user2]['id']
    }
    print(f'{body}')
    post_to_url('http://localhost:3001/friends', body, users[user1]['token'])

def create_friends(users: dict[str, dict[str, str]]) -> None:
    print_header('Creating friend relations')
    create_friendship(users, 'alice', 'bob')
    create_friendship(users, 'chloe', 'bob')
    create_friendship(users, 'dante', 'chloe')

# ---------------------------
# Main
# ---------------------------
def populate_database() -> None:
    try:
        wait_for_database('http://localhost:3000')
        userInfo: dict[str, dict[str, str]] = create_users()
        print()
        print_users(userInfo)
        create_friends(userInfo)
        create_games(userInfo)
    except Exception as e:
        print(f'{color.ERROR}Error: {e}{color.RESET}')

def main() -> None:
    populate_database()

if __name__ == '__main__':
    main()
