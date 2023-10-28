from typing import Dict
import requests
import time

Res = requests.Response

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

def print_header() -> None:
    print('{:-^80}'.format(''))
    print(f'{color.INFO}Populating ft_transcendance database{color.RESET}')
    print('{:-^80}'.format(''))

# ---------------------------
# Requests
# ---------------------------
def wait_for_database(url: str) -> None:
    while 1:
        try:
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

def post_to_url(url: str, body: dict[str, str]) -> Res:
    header: dict[str, str] = {"User-Agent":USER_AGENT}
    r: Res = requests.post(url, headers = header, json = body, timeout = 5)
    r.raise_for_status()
    return r

def create_user(username: str, password: str) -> None:
    try:
        url: str = 'http://localhost:3001/users'
        body: dict[str, str] = {
            "username": username,
            "password": password,
            "email": username + '@mail.com'
        }
        print(f'Creating user: {body}{color.RESET}')
        r: Res = post_to_url(url, body)
        print(f'{color.SUCCESS}+ Status OK ({r.status_code} response): {url}{color.RESET}')
    except Exception as e:
        print(f'{color.ERROR}+ Error: {e}{color.RESET}')

def login_user(username: str, password: str) -> str:
    try:
        url: str = 'http://localhost:3001/auth/login'
        body: dict[str, str] = {
            "username": username,
            "password": password,
        }
        print(f'Logging in with user: {body}{color.RESET}')
        r: Res = post_to_url(url, body)
        print(f'{color.SUCCESS}+ Status OK ({r.status_code} response): {url}{color.RESET}')
        return r.json()['access_token']
    except Exception as e:
        print(f'{color.ERROR}+ Error: {e}{color.RESET}')
        return ''

def create_users() -> None:
    create_user('alice', 'pass')
    create_user('bob', 'pass')
    create_user('chloe', 'pass')
    create_user('dante', 'pass')

# ---------------------------
# Main
# ---------------------------
def populate_database() -> None:
    try:
        wait_for_database('http://localhost:3000')
        create_users()
        token: str = login_user('alice', 'pass')
        print(f'Token = {token}')
    except Exception as e:
        print(f'{color.ERROR}Error: {e}{color.RESET}')

def main() -> None:
    print_header()
    populate_database()

if __name__ == '__main__':
    main()
