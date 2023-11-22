FROM	nginx:latest

RUN		openssl req -x509 -nodes -days 365 -newkey rsa:2048\
			-keyout /etc/ssl/private/nginx-selfsigned.key\
			-out /etc/ssl/certs/nginx-selfsigned.crt\
			-subj "/C=FR/ST=IDF/L=Paris/O=42Network/OU=42Paris/CN=nginx_ft_transcendance"

COPY    conf/default.conf /etc/nginx/conf.d/default.conf

ENTRYPOINT	["nginx"]
CMD			["-g", "daemon off;"]
