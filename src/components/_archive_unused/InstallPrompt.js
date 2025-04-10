import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/router";
import { AppContext } from "../../pages/_app";

const InstallPrompt = () => {
  const { toggleFullscreen, stickyClass } = useContext(AppContext);
  const { locale } = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(true);

  useEffect(() => {
    // 初期化処理をクライアントサイド限定で実行
    if (typeof window !== "undefined") {
      const wasPromptShown =
        localStorage.getItem("installPromptShown") === "true";
      setIsInstallable(!wasPromptShown); // ボタンを表示するか決定
    }

    // `beforeinstallprompt` イベントを監視
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault(); // デフォルトのプロンプト表示を防ぐ
      setDeferredPrompt(event); // イベントを保存
      // console.log("beforeinstallprompt event triggered"); // イベント発火を確認
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  // const handleInstallClick = async () => {
  //   if (!deferredPrompt) return;

  //   // 手動でインストールプロンプトを表示
  //   deferredPrompt.prompt();

  //   // ユーザーの選択結果を取得
  //   const choiceResult = await deferredPrompt.userChoice;

  //   if (choiceResult.outcome === "accepted") {
  //     console.log("App installed");
  //   } else {
  //     console.log(
  //       `${
  //         locale === "en"
  //           ? "You canceled the installation."
  //           : "インストールがキャンセルされました。"
  //       }`
  //     );
  //     setIsInstallable(false); // キャンセル時にボタンを非表示に
  //   }

  //   setDeferredPrompt(null); // イベントをリセット
  // };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // 手動でインストールプロンプトを表示
    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult.outcome === "accepted") {
        // console.log("App installed");
        trackPWAInstall(); // Google Analytics にイベントを送信
        clarity("set", "pwa_install", true); // Clarity にイベントを送信
      } else {
        // console.log(
        //   `${
        //     locale === "en"
        //       ? "You canceled the installation."
        //       : "インストールがキャンセルされました。"
        //   }`
        // );
      }

      setDeferredPrompt(null); // イベントをリセット
      if (typeof window !== "undefined") {
        localStorage.setItem("installPromptShown", "true"); // ボタンを非表示状態として保存
      }
    } catch (error) {
      console.error("Failed to show the install prompt:", error);
    }
  };

  const trackPWAInstall = () => {
    // Google Analytics 4 用
    if (window.gtag) {
      gtag("event", "pwa_install", {
        event_category: "PWA",
        event_label: "User installed the PWA",
      });
    }
  };

  return (
    <div>
      {!stickyClass && !toggleFullscreen && isInstallable && (
        <button onClick={handleInstallClick} style={styles.installButton}>
          {locale === "en" ? "Install App" : "アプリをインストール"}
        </button>
      )}
    </div>
    // <div>
    //     <button onClick={handleInstallClick} style={styles.installButton}>
    //       {locale === "en" ? "Install App" : "アプリをインストール"}
    //     </button>
    // </div>
  );
};

const styles = {
  installButton: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    padding: "10px 20px",
    backgroundColor: "#ff8c77",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    zIndex: 1000,
  },
};

export default InstallPrompt;
