echo "[Configure backend] Installing NestJS CLI..."
npm install -g @nestjs/cli
echo "[Configure backend] Installing app requirements..."
npm install
# Uncomment for production
# echo "[Configure backend] Building app..."
# npm build
echo "[Configure backend] Starting app..."
npm start
