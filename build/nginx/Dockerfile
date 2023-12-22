FROM	nginx:latest

COPY    conf/default.conf /etc/nginx/conf.d/default.conf

ENTRYPOINT	["nginx"]
CMD			["-g", "daemon off;"]
