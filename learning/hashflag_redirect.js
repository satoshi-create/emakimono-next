import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Test() {
  const router = useRouter();

  useEffect(() => {
    // 実際の処理
    const checkHashFlag = () => {
      const hashflag = router.asPath.split("#")[1];
      // ハッシュフラグが存在する場合の処理
      if (hashflag) {
        switch (hashflag.toLowerCase()) {
          case "gyagu":
            router.replace("/gyagu");
        }
      }
    };

    // URLが直に書き換えられたときにイベントを発火
    if (typeof window == "object") {
      window.addEventListener("hashchange", checkHashFlag);
    }

    // ウィンドウのレンダリング完了時に発火
    checkHashFlag();
  });
}
