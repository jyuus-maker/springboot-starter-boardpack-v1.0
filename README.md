# Tiny Board

Spring Boot + React 기반 게시판 스타터 팩입니다. (VS Code + PostgreSQL 로컬 개발환경 기준)

```text
springboot-starter-boardpack-v1.0/
├── .vscode/    VS Code 권장 확장·실행·디버깅 설정
├── compose.yml PostgreSQL 16만 실행하는 선택 구성
├── MANUAL.md   실행·배포·관리자 전환 매뉴얼
├── backend/    Spring Boot 4.1.2 (Java 21, Gradle)
└── frontend/   React 19 + TypeScript (Vite)
```

---

## 1. 사전 준비 프로그램

| 프로그램 | 권장 버전 | 확인 명령 |
|---|---|---|
| Visual Studio Code | 최신 버전 | 무료 IDE |
| JDK (Java) | **21** (Temurin 등) | `java -version` |
| Node.js | **24.x (LTS)** | `node -v` |
| PostgreSQL | **16.x** | 로컬 DB 서버 |
| Git | 최신 버전 | `git --version` |

> `java -version`이 21이 아니면 시스템 환경변수 `JAVA_HOME`을 JDK 21 경로로 설정하고, `PATH`에서 `%JAVA_HOME%\bin`을 우선순위에 둔 뒤 새 터미널에서 다시 확인하세요.

---

## 2. 프로젝트 내려받기 및 VS Code 열기

```bash
git clone https://github.com/jyuus-maker/springboot-starter-boardpack-v1.0.git
cd springboot-starter-boardpack-v1.0
```

VS Code에서 **파일(File) → 폴더 열기(Open Folder)** 로 `springboot-starter-boardpack-v1.0` **최상위(루트) 폴더**를 엽니다.

우측 하단에 **권장 확장 설치** 알림이 뜨면 설치해 주세요. (모두 무료 확장입니다.)
- `vscjava.vscode-java-pack` (Java 21 인식 및 디버깅)
- `vscjava.vscode-gradle` (Gradle 프로젝트 인식)
- `vmware.vscode-spring-boot` (Spring Boot 지원)
- `bradlc.vscode-tailwindcss` (Tailwind CSS 자동완성)

---

## 3. PostgreSQL 준비 및 환경변수(`backend/.env`) 설정

### ① 로컬 DB 생성
DB를 직접 설치하는 방법입니다. Docker를 사용하려면 [6절](#6-docker로-postgresql만-실행선택)을 따릅니다.
pgAdmin 또는 `psql -U postgres`로 접속해 빈 데이터베이스를 만듭니다. (테이블은 백엔드 실행 시 자동 생성됩니다.)

```sql
CREATE USER 내사용자이름 WITH PASSWORD '내비밀번호';
CREATE DATABASE tinyboard_db OWNER 내사용자이름;
```

### ② `backend/.env` 파일 작성
[backend/.env.sample](backend/.env.sample)을 복사해 `backend/.env` 파일을 만들고 본인 환경에 맞게 채웁니다. (`.env`는 Git에 올라가지 않습니다.)

```properties
DB_URL=jdbc:postgresql://localhost:5432/tinyboard_db
DB_USERNAME=내사용자이름
DB_PASSWORD=내비밀번호
JWT_SECRET=생성한_랜덤_Base64_문자열
```

- PostgreSQL 설치 시 포트를 5433 등으로 바꿨다면 `DB_URL`의 포트를 맞게 수정하세요.
- `JWT_SECRET`은 아래 명령으로 32바이트 이상 랜덤 문자열을 생성해 붙여 넣습니다.
  ```powershell
  # Windows PowerShell
  [Convert]::ToBase64String((1..32 | % { [byte](Get-Random -Max 256) }))
  ```
  ```bash
  # macOS / Linux
  openssl rand -base64 32
  ```

---

## 4. 의존성 설치 및 서버 실행

### ① 프론트엔드 패키지 설치 (최초 1회)
```powershell
# Windows PowerShell (실행 정책 오류 방지를 위해 npm.cmd 사용)
cd frontend
npm.cmd install
```
```bash
# macOS / Linux
cd frontend
npm install
```

### ② 서버 실행 방법

**방법 A — VS Code에서 백엔드·프론트 한 번에 실행 (추천)**
- `Ctrl + Shift + B` (또는 **터미널 → 작업 실행 → `Dev: Start All (Backend + Frontend)`**)

**방법 B — 백엔드 디버깅 + 프론트 따로 실행**
1. 백엔드: `Ctrl + Shift + D` → **`Spring Boot - Backend (Debug)`** → `F5`
2. 프론트: **터미널 → 작업 실행 → `Frontend: dev`**

**방법 C — 터미널에서 직접 실행**
- 백엔드(`backend/`): Windows `.\gradlew.bat bootRun` / macOS·Linux `./gradlew bootRun`
- 프론트(`frontend/`): Windows `npm.cmd run dev` / macOS·Linux `npm run dev`

### ③ 접속 확인 및 종료
- **서비스 접속**: http://localhost:5173
- **API 헬스 체크**: http://localhost:5173/api/health (`ok` 응답 확인)
- **종료**: 디버거는 `Shift + F5`, 터미널/Task는 각 터미널에서 `Ctrl + C`

---

## 5. 첫 실행 시 자동 구성 및 기본 기능 안내

별도의 SQL 파일을 수동으로 실행하지 않아도, 백엔드 첫 기동 시 아래 항목이 자동으로 준비됩니다.

### ① 초기 테스트용 목계정 (`admin` / `user`)
실제 회원이 0명인 초기 상태에서는 아래 목계정이 자동 생성되어 바로 로그인할 수 있습니다.

| 권한 | 아이디 | 비밀번호 | 비고 |
|---|---|---|---|
| 관리자 (`ADMIN`) | `admin` | `1234` | 관리자 메뉴(`/admin/users`, `/admin/boards`) 및 공지 상단 고정 가능 |
| 일반 회원 (`USER`) | `user` | `1234` | 일반 회원 기능 테스트용 |

- 실제 `ADMIN` 또는 `USER` 계정이 생기면 해당 권한의 목계정은 동기화 시 자동으로 탈퇴 처리되며(`탈퇴한계정`으로 기존 작성물 보존), 실제 계정이 모두 탈퇴하면 다시 자동 생성됩니다. 두 권한은 독립적으로 처리됩니다.
- 일반 회원가입은 `USER`를 생성합니다. 목관리자로 로그인해 어드민 회원 화면에서 활성 상태의 실제 회원을 `관리자 지정`할 수 있습니다. [관리자 전환 절차](MANUAL.md#4-실제-관리자-계정-설정)를 참고합니다.
- 일반 회원가입 시 이메일에는 `admin`/`user`가 들어가도 되지만, **닉네임(사용자명)** 에는 예약어(`admin`, `user`)를 포함할 수 없습니다.

### ② 기본 제공 게시판 및 가이드 게시물
- **기본 게시판**: `자유게시판`(코드 `FREE`, 비로그인 글 작성 가능 / 회원 댓글), `문의게시판`(코드 `ASK`, 회원 글 작성 / 관리자 답변), `FAQ`(코드 `FAQ`, 관리자 작성·댓글)
- **가이드 목게시물(`ex1~ex3`)**: 작성자 `사용가이드`로 상단에 예시 게시글·댓글이 자동 등록되며, 관리자만 수정·삭제할 수 있습니다. (실제 게시글 번호는 `1, 2, 3...`으로 분리 부여됩니다.)

### ③ 주요 포함 기능
- **게시판·게시글**: 전체 목록(`/`), 게시판별 목록, 페이지당 10개 페이지네이션, 검색·정렬, 관리자 전용 공지 `상단 고정`, 비로그인 글 작성(작성자·비밀번호 확인 수정/삭제)
- **댓글·1단계 대댓글 & 추천·비추천**: 게시글·댓글·대댓글 각각 추천/비추천 토글·취소·전환(로그인 회원), 자식 댓글 잔존 시 `삭제된 게시물입니다.` / `삭제된 댓글입니다.` 표시 및 마지막 대댓글 삭제 시 연쇄 정리
- **회원·관리자**: 회원가입·JWT 로그인·마이페이지(비밀번호 변경·회원 탈퇴), 관리자 회원 관리(목계정 표시·관리자 지정·정지·해제) 및 관리자 게시판 관리(생성·수정·노출 ON/OFF·관리자 전용·권한 설정·초기화·삭제)

---

## 6. Docker로 PostgreSQL만 실행(선택)

Docker Engine 또는 Docker Desktop과 Docker Compose가 필요합니다.
`backend/.env`에서 `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`을 채우고 DB 접속정보를 맞춥니다.

```properties
DB_URL=jdbc:postgresql://localhost:5432/tinyboard_db
DB_PORT=5432
```

저장소 루트에서 실행합니다.

```sh
docker compose --env-file backend/.env up -d db
docker compose --env-file backend/.env ps
```

DB가 healthy가 되면 4절대로 IDE 또는 터미널에서 백엔드·프론트를 실행합니다.
기존 PostgreSQL이 5432를 사용 중이면 `DB_PORT`를 5433 등으로 바꾸고 `DB_URL`의 포트도 동일하게 맞춥니다.

```sh
# 종료. DB 데이터는 named volume에 보존됩니다.
docker compose --env-file backend/.env down
```

`down -v`는 DB 볼륨과 데이터를 삭제합니다. `DB_USERNAME`·`DB_PASSWORD`는 빈 볼륨의 최초 초기화에 적용되며, 기존 DB의 계정·비밀번호를 바꾸려면 SQL로 변경해야 합니다.

## 7. 프론트·백엔드 분리 배포

| 위치 | 설정 |
|---|---|
| 백엔드 환경변수 | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` |
| 백엔드 환경변수 | `CORS_ALLOWED_ORIGINS=https://내프론트주소` |
| 프론트 빌드 환경변수 | `VITE_API_BASE_URL=https://내백엔드주소/api` |

프론트 주소는 프로토콜과 호스트·필요한 포트까지 넣고 경로와 끝 슬래시는 생략합니다. 여러 허용 주소는 쉼표로 구분합니다.
API 주소에는 `/api`까지 포함합니다. `VITE_API_BASE_URL` 변경 후에는 프론트를 다시 빌드·배포합니다.

- Vercel 프론트 Root Directory는 `frontend`, Build Command는 `npm run build`, Output Directory는 `dist`입니다.
- Render 백엔드는 Docker 서비스로 만들고 Root Directory를 `backend`로 지정합니다. `PORT`는 실행 환경에서 제공한 값을 사용합니다.
- 프론트의 `VITE_` 변수에는 브라우저에 공개할 API 주소만 넣습니다. DB 비밀번호와 JWT 서명 키는 백엔드 환경변수에 넣습니다.
- 로컬 기본값은 `/api`이며 Vite가 `localhost:8080`으로 전달합니다.

자세한 실행·배포 확인과 관리자 설정은 [MANUAL.md](MANUAL.md)에 있습니다.
