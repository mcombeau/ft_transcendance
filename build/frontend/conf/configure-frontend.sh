echo "[Configure backend] Installing NestJS CLI..."
npm install -g @nestjs/cli
# echo "[Configure frontend] Creating react app..."
# yarn create react-app ./ --template typescript
echo "[Configure frontend] Installing requirements..."
yarn install
# Uncomment build rule for production
# echo "[Configure frontend] Building app..."
# yarn build
echo "[Configure frontend] Starting frontend app..."
yarn start
