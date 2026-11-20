# Tiny Board 프론트엔드

React 19 · TypeScript · Vite · Tailwind CSS로 구성됩니다.

```sh
npm ci
npm run dev
npm run build
npm run lint
```

로컬 `/api` 요청은 Vite가 `http://localhost:8080`으로 전달합니다.
분리 배포 시 `VITE_API_BASE_URL=https://내백엔드주소/api`를 프론트 빌드 환경변수로 지정합니다.
백엔드에는 현재 프론트 Origin을 `CORS_ALLOWED_ORIGINS`로 등록합니다.
환경변수 예시는 [.env.sample](.env.sample), 실행·배포 안내는 [루트 매뉴얼](../MANUAL.md)을 참고합니다.
