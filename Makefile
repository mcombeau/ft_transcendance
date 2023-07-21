.PHONY: all re up down start stop status logs prune clean fclean db blog flog nlog plog

DATA_PATH = ${HOME}/ft_transcendance
ENV =		DATA_PATH=${DATA_PATH}

all: up

re: down up

up: setup
	 ${ENV} docker-compose -f docker-compose.yml up -d --build

down:
	${ENV} docker-compose -f docker-compose.yml down

start:
	${ENV} docker-compose -f docker-compose.yml start

stop:
	${ENV} docker-compose -f docker-compose.yml stop

status:
	docker-compose ps

logs:
	docker-compose logs

setup:
	mkdir -p ${DATA_PATH}
	mkdir -p ${DATA_PATH}/database

clean: down
	sudo rm -rf ${DATA_PATH}

db: clean
	docker volume rm ft_transcendance_database
	make

fclean: clean
	docker system prune -f -a --volumes
	docker volume rm ft_transcendance_database
	
blog:
	docker-compose logs --follow backend

flog:
	docker-compose logs --follow frontend

nlog:
	docker-compose logs --follow nginx

plog:
	docker-compose logs --follow postgresql
