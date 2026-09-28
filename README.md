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

**지금은 자동 배포를 꺼 둔 상태다.** `vercel.json` 의 이 부분이 스위치다:

```json
"git": { "deploymentEnabled": { "main": false } }
```

`false` 인 동안에는 `main` 에 푸시해도 Vercel 이 배포를 만들지 않는다.
코드는 올라가지만 사이트는 그대로다 — 작업 내용을 백업·공유하면서
대표님이 보는 화면은 건드리지 않기 위한 것이다.

**다시 켜려면** 위 값을 `true` 로 바꾸거나 `git` 블록을 통째로 지우고 푸시한다.
그 푸시 자체가 곧 배포가 된다.

> 한 번만 건너뛰고 싶을 때는 설정을 바꾸지 말고 커밋 메시지에 `[vercel skip]` 을 넣는다.
> (`[skip ci]` 는 GitHub Actions 까지 같이 건너뛰므로 쓰지 않는다 — 빌드·린트 검사가 사라진다)

배포 자체를 막는 것과 별개로, 이 사이트는 아직 검색에 노출되면 안 된다.
`X-Robots-Tag: noindex, nofollow` 헤더와 `robots.txt` 가 그 역할을 한다.
