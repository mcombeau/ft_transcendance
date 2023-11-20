.PHONY: all re up down start stop status logs prune clean fclean db blog flog nlog plog pop delete_db system_prune
include .env
export

all: up blog

re: down up blog

up: setup
	 docker-compose -f docker-compose.yml up -d --build

down:
	docker-compose -f docker-compose.yml down

start:
	docker-compose -f docker-compose.yml start

stop:
	docker-compose -f docker-compose.yml stop

status:
	docker-compose ps

logs:
	docker-compose logs

setup:
	./configure-host.sh
	mkdir -p ${DATA_PATH}
	mkdir -p ${DATA_PATH}/database

clean: down
	rm -f ./backend-app/user_data/*
	sudo rm -rf ${DATA_PATH}

db: clean delete_db all blog

delete_db:
	docker volume rm ft_transcendance_database

system_prune:
	docker system prune -f -a --volumes

fclean: clean system_prune delete_db
	
blog:
	docker-compose logs --follow backend

flog:
	docker-compose logs --follow frontend

nlog:
	docker-compose logs --follow nginx

plog:
	docker-compose logs --follow postgresql

pop:
	python3 test/populate_database.py
