# Tiny Board v1.0 사용 매뉴얼

## 1. 준비와 기본 실행

JDK 21, Node.js 24, PostgreSQL 16을 준비합니다. PostgreSQL은 직접 설치하거나 루트의 `compose.yml`로 실행할 수 있습니다.

1. 저장소를 내려받고 루트 폴더를 IDE에서 엽니다.
2. `backend/.env.sample`을 `backend/.env`로 복사합니다.
3. 본인의 DB URL·사용자·비밀번호와 JWT 서명 키를 입력합니다.
4. `frontend`에서 `npm ci`로 lockfile 기준 패키지를 설치합니다. Windows PowerShell에서는 `npm.cmd ci`도 사용할 수 있습니다.
5. `backend`에서 `./gradlew bootRun`을 실행합니다. Windows에서는 `.\gradlew.bat bootRun`입니다.
6. 다른 터미널의 `frontend`에서 `npm run dev`를 실행합니다.
7. `http://localhost:5173`과 `http://localhost:5173/api/health`를 확인합니다.

VS Code 루트 작업 `Dev: Start All (Backend + Frontend)` 또는 `Ctrl+Shift+B`로 두 서버를 함께 실행할 수도 있습니다.
백엔드는 작업 디렉터리의 `.env`를 읽으므로 터미널 직접 실행은 `backend`에서 진행합니다.
macOS·Linux Git 체크아웃의 `backend/gradlew`는 실행 권한을 포함합니다. ZIP을 풀어 권한이 사라졌다면 `chmod +x backend/gradlew`로 설정합니다.

JWT 키 생성 예시입니다.

```sh
openssl rand -base64 32
```

```powershell
[Convert]::ToBase64String((1..32 | % { [byte](Get-Random -Max 256) }))
```

## 2. 환경변수

| 변수 | 위치 | 용도 |
|---|---|---|
| `DB_URL` | 백엔드 | `jdbc:postgresql://localhost:5432/tinyboard_db` 형태의 JDBC URL |
| `DB_USERNAME` | 백엔드·Compose | DB 사용자 |
| `DB_PASSWORD` | 백엔드·Compose | DB 비밀번호 |
| `JWT_SECRET` | 백엔드 | 최소 32바이트 랜덤 데이터로 만든 Base64 서명 키 |
| `PORT` | 백엔드 | HTTP 포트. 생략 시 `8080` |
| `DB_PORT` | Compose | 호스트에 연결할 DB 포트. 생략 시 `5432` |
| `CORS_ALLOWED_ORIGINS` | 백엔드 | 분리 배포 프론트 Origin. 여러 주소는 쉼표 구분 |
| `VITE_API_BASE_URL` | 프론트 빌드 | API 기본 주소. 생략 시 `/api` |

로컬 기본 구성은 프론트의 `.env` 없이 동작합니다. 다른 API 주소가 필요하면 `frontend/.env.sample`을 `frontend/.env`로 복사해 설정합니다.
Vite 환경변수는 빌드 시 반영되므로 수정 후 개발 서버를 재시작하거나 다시 빌드합니다.
`.env` 파일은 Git 추적에서 제외됩니다.

## 3. PostgreSQL Docker 실행과 데이터 보존

`backend/.env`를 준비한 후 루트에서 실행합니다.

```sh
docker compose --env-file backend/.env up -d db
docker compose --env-file backend/.env ps
docker compose --env-file backend/.env logs db
```

DB 서비스는 `postgres:16-alpine`이며 DB 이름은 `tinyboard_db`입니다.
호스트 연결은 `127.0.0.1`로 제한되고 데이터는 `postgres_data` named volume에 저장됩니다.
백엔드와 프론트는 IDE 또는 터미널에서 별도로 실행합니다.

```sh
docker compose --env-file backend/.env down
docker compose --env-file backend/.env up -d db
```

위 종료·재시작은 데이터를 보존합니다. `down -v`는 데이터를 삭제하므로 새 DB로 초기화할 때만 사용합니다.
기존 볼륨에 데이터가 있으면 `.env`의 비밀번호 변경만으로 DB 비밀번호가 변경되지 않습니다.
직접 설치한 PostgreSQL 데이터와 Docker DB 데이터는 별도로 보관됩니다.

## 4. 실제 관리자 계정 설정

관리자 회원 화면에서 실제 일반 회원을 관리자로 지정할 수 있습니다.

1. 사용할 이메일로 일반 회원가입합니다.
2. 로그아웃한 뒤 목관리자 `admin / 1234` 또는 기존 실제 관리자로 로그인합니다.
3. `관리 메뉴 → 유저 관리`에서 해당 회원의 `관리자 지정` 버튼을 누릅니다.
4. 확인창에서 대상 닉네임·이메일을 확인하고 확정합니다.
5. 목관리자로 지정했다면 현재 목계정은 즉시 자동 탈퇴하고 로그인 화면으로 이동합니다.
6. 지정된 실제 관리자 계정으로 로그인하고 관리 메뉴를 확인합니다.

활성 상태의 실제 USER만 지정할 수 있습니다. 목계정·정지·탈퇴 계정·기존 ADMIN은 지정 대상에서 제외됩니다.
실제 관리자가 다른 회원을 지정한 경우 로그인 상태를 유지하고 목록을 갱신합니다.
승격된 회원의 기존 JWT도 다음 요청부터 ADMIN 권한을 사용합니다. 이미 열어둔 화면의 메뉴 표시는 새로고침하면 갱신됩니다.
관리자 지정과 목계정 동기화는 같은 트랜잭션에서 처리합니다. 유일한 실제 USER가 승격돼 실제 USER가 0명이 되면 목회원 `user`가 다시 생성됩니다.

## 5. 초기 계정·가이드와 주요 기능

| 항목 | 동작 |
|---|---|
| 목관리자 | 해당 권한의 실제 계정이 없을 때 `admin / 1234` 생성 |
| 목회원 | 해당 권한의 실제 계정이 없을 때 `user / 1234` 생성 |
| 수명주기 | ADMIN·USER 각각의 실제 계정 수에 따라 독립적으로 동기화 |
| 동기화 시점 | 앱 시작·회원가입·회원탈퇴·관리자 지정 |
| 작성물 | 계정 탈퇴 후 작성물은 `탈퇴한계정`으로 보존. 재생성한 목계정은 이전 소유권을 받지 않음 |
| 가이드 | 첫 초기화에서 `ex1~ex3` 생성. 실제 글 번호와 별도로 관리 |

기본 자유게시판은 비회원 글쓰기·회원 댓글, 문의게시판은 회원 글쓰기·관리자 댓글, FAQ는 관리자 글쓰기·댓글로 구성됩니다.
관리자는 게시판의 글·댓글 작성 권한, 노출 여부, 관리자 전용 여부를 설정할 수 있습니다.
FREE는 기본 게시판으로 삭제·숨김·관리자 전용 전환·코드 변경이 제한됩니다.

비회원 글은 작성 시 정한 비밀번호로 수정·삭제합니다.
댓글은 1단계 대댓글을 지원합니다. 자식이 남은 글·댓글 삭제 시 삭제 안내를 남기고, 연결된 마지막 자식 삭제 시 잔여 항목을 정리합니다.
로그인 회원은 실제 게시글·댓글·대댓글을 추천·비추천할 수 있고, 같은 버튼은 취소, 반대 버튼은 전환합니다.

## 6. 분리 배포

### 백엔드

Render 등 Java·Docker 실행 환경에 `backend`를 배포합니다. Dockerfile을 사용할 때 빌드 컨텍스트도 `backend`로 지정합니다.
본인의 PostgreSQL 접속정보와 JWT 키를 서버 환경변수에 등록합니다.
배포된 프론트가 `https://my-board.example.com`이면 다음 값을 등록합니다.

```properties
CORS_ALLOWED_ORIGINS=https://my-board.example.com
```

허용 주소에는 `/` 뒤의 경로를 넣지 않습니다. Preview 주소를 쓸 때는 해당 Origin도 쉼표로 추가합니다.
먼저 `https://내백엔드주소/api/health`의 `ok` 응답을 확인합니다.

### 프론트

Vercel 등 정적 호스팅 환경에 다음 값을 설정합니다.

| 항목 | 값 |
|---|---|
| Root Directory | `frontend` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| 빌드 환경변수 | `VITE_API_BASE_URL=https://내백엔드주소/api` |

`frontend/vercel.json`은 직접 주소 접근·새로고침 시 React 라우터를 여는 SPA 설정입니다.
프론트는 지정한 백엔드 API에 직접 요청하며 백엔드는 `CORS_ALLOWED_ORIGINS`로 허용합니다.
HTTPS 프론트에는 HTTPS 백엔드 주소를 사용합니다.
프론트 주소를 정한 뒤 백엔드 허용 Origin을 맞추고, API 주소 변경 후 프론트를 재배포합니다.

### 배포 후 확인

1. 목록과 가이드 글을 확인합니다.
2. 회원 로그인·로그아웃과 회원가입을 확인합니다.
3. 게시글·댓글 작성과 추천을 확인합니다.
4. `/boards/FREE`와 `/login`을 직접 열고 새로고침합니다.
5. 실제 관리자 계정을 설정하고 관리자 메뉴를 확인합니다.

## 7. 빌드와 종료

```sh
# backend
./gradlew test build
# frontend
npm run build
npm run lint
```

백엔드 테스트에는 사용할 PostgreSQL 접속정보와 JWT 키가 필요합니다. 별도의 테스트 DB를 지정해 실행합니다.
서버는 각 터미널에서 `Ctrl+C`로 종료합니다. VS Code 디버거는 `Shift+F5`로 종료합니다.

## 8. 오류 확인

| 증상 | 확인할 내용 |
|---|---|
| DB 연결 거부 | DB 실행 상태, `DB_URL`의 호스트·포트, 사용자·비밀번호 |
| `.env` 값 미인식 | 백엔드 실행 작업 디렉터리가 `backend`인지 확인 |
| 로컬 `/api` 오류 | 백엔드가 8080에서 실행되는지 확인. 포트를 바꾸면 Vite 프록시도 조정 |
| 분리 배포 CORS 오류 | 백엔드 허용 Origin이 현재 프론트 프로토콜·호스트·포트와 일치하는지 확인 |
| API 응답이 HTML | `VITE_API_BASE_URL`에 본인 백엔드 `/api` 주소를 넣고 프론트 재배포 |
| Docker 포트 충돌 | `DB_PORT`와 `DB_URL` 포트를 함께 변경 |
| DB 비밀번호 변경이 반영되지 않음 | 기존 볼륨의 계정은 SQL로 비밀번호 변경 |
| 목계정 로그인 실패 | 해당 권한의 실제 계정이 생겨 목계정이 탈퇴 처리됐는지 확인 |
| Gradle Permission denied | `chmod +x backend/gradlew` 후 실행 |
