FROM	alpine:3.17

# Install MariaDB
RUN		apk update && apk upgrade &&\
		apk add postgresql

# Copy MariaDB configuration files
COPY	./conf/configure-postgresql.sh /tmp/configure-postgresql.sh
RUN		chmod +x /tmp/configure-postgresql.sh

# Run MariaDB configuration script as entry point
ENTRYPOINT	[ "sh", "/tmp/configure-postgresql.sh" ]
