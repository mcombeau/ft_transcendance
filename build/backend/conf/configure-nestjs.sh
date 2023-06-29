echo "[Configure backend] Setting PORT 3001..."
echo "PORT=3001" > .env
echo "[Configure backend] Installing NestJS CLI..."
# yarn global add @nestjs/cli
npm install @nestjs/cli
echo "[Configure backend] Installing app requirements..."
npm install
# yarn install
# Uncomment for production
# echo "[Configure backend] Building app..."
# npm build
echo "[Configure backend] Starting app..."
npm start
