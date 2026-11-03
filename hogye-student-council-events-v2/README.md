# 호계고 학생회 행사 사이트

학생회 행사를 카드로 보여주고, 카드를 누르면 **행사 설명 팝업**이 열리고,
그 안의 **네이버폼 바로가기** 버튼으로 신청 폼에 이동하는 사이트입니다.
관리자는 `/admin` 에서 비밀번호로 로그인해 행사를 등록 · 수정 · 삭제할 수 있습니다.

## 폴더 구조

```
app/
  page.tsx                 -> 메인 화면 (서버에서 행사 목록을 불러와요)
  EventList.tsx            -> 카드 목록 + 필터 + 상세 팝업
  admin/page.tsx           -> 관리자 로그인
  admin/dashboard/page.tsx -> 관리자 대시보드 (등록/수정/삭제)
  api/events/              -> 행사 조회/등록/수정/삭제 API
  api/upload/route.ts      -> 사진 업로드 API
  api/admin/login/route.ts -> 로그인/로그아웃 API
lib/
  auth.ts      -> 로그인 쿠키 만들기/검사 (서명된 쿠키)
  admin.ts     -> API에서 "관리자인지" 확인
  status.ts    -> 진행중/예정/마감 상태 계산
  validate.ts  -> 등록/수정 입력값 검사
prisma/schema.prisma       -> 데이터베이스 구조
middleware.ts              -> 로그인 안 하면 /admin/dashboard 접근 막기
```

## 환경변수 (Vercel → Settings → Environment Variables)

| 이름 | 설명 |
| --- | --- |
| `DATABASE_URL` | Postgres 데이터베이스 주소 |
| `ADMIN_PASSWORD` | 관리자 비밀번호 (**꼭 설정**, 없으면 로그인이 막혀요. 길게 정할수록 안전해요) |
| `BLOB_READ_WRITE_TOKEN` | 사진 업로드용 (Vercel Blob을 연결하면 자동 추가) |

환경변수를 바꾼 뒤에는 **Redeploy** 해야 적용돼요.

## 행사 상태

- 관리자가 "진행중으로 표시"를 끄면 → **마감**
- 마감일이 지나면 → 자동으로 **마감**
- 시작일이 아직 안 됐으면 → **예정** (신청 버튼은 비활성)
- 그 외 → **진행중**

## 로컬 실행

```
npm install
# .env 파일에 DATABASE_URL, ADMIN_PASSWORD, BLOB_READ_WRITE_TOKEN 설정
npx prisma db push
npm run dev
```

## 참고

- 빌드할 때 `prisma db push`가 실행돼요. 예전과 달리 `--accept-data-loss`를 뺐기 때문에,
  데이터가 지워질 수 있는 구조 변경이 있으면 빌드가 멈추고 알려줘요.
- `.env` 파일은 절대 깃허브에 올리지 마세요.
