#!/bin/bash

echo "[Configure host] Adding host to /etc/hosts..."
if [ ${HOST} == "localhost" ]; then
	echo "[Configure host] Host is ${HOST} (localhost)."
	exit 0
fi
if ! grep -q ${HOST} "/etc/hosts"; then
	echo "127.0.0.1 ${HOST}" | sudo tee -a /etc/hosts
	echo "[Configure host] Added ${HOST} to /etc/hosts."
else
	echo "[Configure host] ${HOST} already in /etc/hosts."
fi
