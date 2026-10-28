/**
 * 택배사 배송 조회 주소 (2026-10-28) — 관리자 발송 화면의 택배사 목록(AdminOrderDetail COURIERS)과 같은 이름.
 * 서버 발송 메일(OrderNotifier.TRACKING_URL)과 같은 표다 — 한쪽을 고치면 다른 쪽도.
 * 모르는 택배사면 null — 화면은 링크 없이 번호만 보여 준다.
 */
const TRACKING_URL: Record<string, string> = {
  CJ대한통운: "https://trace.cjlogistics.com/next/tracking.html?wblNo=",
  한진택배: "https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2=",
  롯데택배: "https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=",
  우체국택배: "https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=",
  로젠택배: "https://www.ilogen.com/web/personal/trace/",
};

export function trackingUrl(courier: string | null | undefined, trackingNumber: string | null | undefined): string | null {
  if (!courier || !trackingNumber) return null;
  const base = TRACKING_URL[courier.replace(/\s/g, "")];
  return base ? base + encodeURIComponent(trackingNumber) : null;
}
