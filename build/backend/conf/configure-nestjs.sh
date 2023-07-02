echo "[Configure backend] Installing NestJS CLI..."
npm install -g @nestjs/cli

echo "[Configure backend] Installing app requirements..."
yarn add @nestjs/typeorm typeorm pg
yarn install

# Uncomment for production
# echo "[Configure backend] Building app..."
# yarn build
echo "[Configure backend] Starting app..."
yarn start:dev
