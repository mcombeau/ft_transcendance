.PHONY: all up down start stop status logs prune clean fclean

DATA_PATH = ${HOME}/ft_transcendance
ENV =		DATA_PATH=${DATA_PATH}

all: up

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
	mkdir -p ${DATA_PATH}/frontend_data
	mkdir -p ${DATA_PATH}/backend_data
	mkdir -p ${DATA_PATH}/postgresql_data

clean:
	sudo rm -rf ${DATA_PATH}

fclean: clean
	docker system prune -f -a --volumes
	docker volume rm ft_transcendance_backend_data ft_transcendance_frontend_data ft_transcendance_postgresql_data

