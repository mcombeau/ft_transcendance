echo "[Configure backend] Setting PORT 3001..."
echo "PORT=3001" > .env
echo "[Configure backend] Installing NestJS CLI..."
npm install @nestjs/cli
echo "[Configure backend] Installing app requirements..."
npm install
# Uncomment for production
# echo "[Configure backend] Building app..."
# npm build
echo "[Configure backend] Starting app..."
npm start
