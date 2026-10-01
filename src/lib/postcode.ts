/**
 * 주소 검색 — 카카오 우편번호 서비스.
 *
 * 키도 계약도 필요 없는 무료 서비스다. 스크립트는 버튼을 누를 때 한 번만 불러온다 —
 * 주문서를 열 때마다 외부 스크립트를 싣지 않는다.
 * 불러오지 못하면(차단 · 네트워크) 직접 입력하면 된다. 주소 칸은 그대로 열려 있다.
 */

const SCRIPT = "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

export interface PickedAddress {
  zipCode: string;
  /** 도로명 주소 (+ 건물명) */
  address1: string;
}

interface PostcodeData {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  userSelectedType: "R" | "J";
  buildingName: string;
  apartment: "Y" | "N";
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (opts: { oncomplete: (d: PostcodeData) => void; onclose?: () => void }) => {
        open: (opts?: { popupTitle?: string }) => void;
      };
    };
  }
}

let loading: Promise<void> | null = null;

function load(): Promise<void> {
  if (window.daum?.Postcode) return Promise.resolve();
  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loading = null;
        reject(new Error("postcode script"));
      };
      document.head.appendChild(s);
    });
  }
  return loading;
}

/** 주소 검색 창을 연다. 고르면 우편번호 · 주소를, 그냥 닫으면 null 을 돌려준다. */
export async function searchAddress(): Promise<PickedAddress | null> {
  await load();
  return new Promise((resolve) => {
    let picked = false;
    new window.daum!.Postcode({
      oncomplete: (d) => {
        picked = true;
        const base = d.userSelectedType === "J" && d.jibunAddress ? d.jibunAddress : d.roadAddress;
        // 아파트 · 건물명은 배송 기사가 찾는 데 도움이 된다 (도로명 주소일 때만 붙인다)
        const extra = d.userSelectedType === "R" && d.buildingName ? ` (${d.buildingName})` : "";
        resolve({ zipCode: d.zonecode, address1: (base + extra).slice(0, 200) });
      },
      onclose: () => {
        if (!picked) resolve(null);
      },
    }).open({ popupTitle: "주소 검색" });
  });
}
