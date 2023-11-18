#!/bin/bash

echo "[Configure host] Adding host to /etc/hosts..."
if [ ${FT_TRANSCENDANCE_HOST} == "localhost" ]; then
	echo "[Configure host] Host is ${FT_TRANSCENDANCE_HOST} (localhost)."
	exit 0
fi
if ! grep -q ${FT_TRANSCENDANCE_HOST} "/etc/hosts"; then
	echo "127.0.0.1 ${FT_TRANSCENDANCE_HOST}" | sudo tee -a /etc/hosts
	echo "[Configure host] Added ${FT_TRANSCENDANCE_HOST} to /etc/hosts."
else
	echo "[Configure host] ${FT_TRANSCENDANCE_HOST} already in /etc/hosts."
fi
