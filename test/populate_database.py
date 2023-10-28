import requests

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
def get_url_content(url: str, verbose: bool = False) -> bytes:
    header: dict[str, str] = {"User-Agent":USER_AGENT}
    r: Res = requests.get(url, headers = header, timeout = 5)
    r.raise_for_status()
    if verbose:
        print(f'{color.SUCCESS}URL OK ({r.status_code} response): {url}{color.RESET}')
    return r.content

def post_to_url(url: str, body: dict[str, str], verbose: bool = False) -> bytes:
    header: dict[str, str] = {"User-Agent":USER_AGENT}
    r: Res = requests.post(url, headers = header, json = body, timeout = 5)
    r.raise_for_status()
    if verbose:
        print(f'{color.SUCCESS}URL OK ({r.status_code} response): {url}{color.RESET}')
    return r.content

def create_user(username: str, password: str) -> None:
    print(f'Creating user: {username} (password: {password}):{color.RESET}')
    try:
        url: str = 'http://localhost:3001/users'
        body: dict[str, str] = {
            "username": username,
            "password": password,
            "email": username + '@mail.com'
        }
        post_to_url(url, body, True)
        print(f'{color.SUCCESS}Created user: {username} (password: {password}){color.RESET}')
    except Exception as e:
        print(f'{color.ERROR}Could not create user: {username} with password {password}: {e}{color.RESET}')

# ---------------------------
# Main
# ---------------------------
def populate_database() -> None:
    try:
        get_url_content('http://localhost:3001', True)
        create_user('xxx', 'pass')
    except Exception as e:
        print(f'{color.ERROR}Error: {e}{color.RESET}')

def main() -> None:
    print_header()
    populate_database()

if __name__ == '__main__':
    main()
