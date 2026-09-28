This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 배포 (Vercel)

이 저장소는 Vercel 에 연결되어 있고, 원래는 `main` 에 푸시하면 바로 운영에 반영된다.

**자동 배포가 켜져 있다.** `main` 에 푸시하면 Vercel 이 빌드해서 운영 주소에 반영한다.
따로 실행할 명령은 없다 — 푸시가 곧 배포다.

### 배포를 막고 싶을 때

작업 내용은 올리되 대표님이 보는 화면은 그대로 두고 싶은 경우가 있다. 두 가지 방법이 있고
**성격이 다르다.**

**한 번만 건너뛰기** — 커밋 메시지에 `[vercel skip]` 을 넣는다. 그 커밋만 배포되지 않는다.

> `[skip ci]` 는 쓰지 않는다. GitHub Actions 까지 같이 건너뛰어서 빌드·린트 검사가 사라진다.
> `[vercel skip]` 은 Vercel 만 본다.

**당분간 계속 막기** — `vercel.json` 에 이 블록을 넣는다:

```json
"git": { "deploymentEnabled": { "main": false } }
```

이게 들어 있는 동안에는 `main` 에 푸시해도 배포가 만들어지지 않는다.
다시 켤 때는 블록을 지우고 푸시한다 — 그 푸시가 곧 배포다.

> 이 방법의 함정: JSON 에는 주석을 달 수 없어서, 왜 꺼져 있는지가 파일만 봐서는 안 보인다.
> 껐다면 이 문서에 이유와 시점을 같이 적는다. 안 적으면 몇 주 뒤에 "왜 배포가 안 되지" 가 된다.

### 검색 노출

배포와 별개로, 이 사이트는 아직 검색에 잡히면 안 된다.
`X-Robots-Tag: noindex, nofollow` 헤더(`vercel.json`)와 `robots.txt` 가 그 역할을 한다.
정식 오픈 때 두 곳을 같이 걷어낸다 — 한쪽만 지우면 나머지가 계속 막는다.
