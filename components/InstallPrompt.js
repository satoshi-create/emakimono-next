import { useState, useEffect } from "react";
import { useRouter } from "next/router";

const InstallPrompt = () => {
  const { locale } = useRouter();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // `beforeinstallprompt` イベントを監視
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault(); // デフォルトのプロンプト表示を防ぐ
      setDeferredPrompt(event); // イベントを保存
      setIsInstallable(true); // インストール可能フラグを設定
      console.log("beforeinstallprompt event triggered"); // イベント発火を確認
      console.log(isInstallable);
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
        console.log("App installed");
      } else {
        console.log(
          `${
            locale === "en"
              ? "You canceled the installation."
              : "インストールがキャンセルされました。"
          }`
        );
        setIsInstallable(false); // キャンセル時にボタンを非表示に
      }

      setDeferredPrompt(null); // イベントをリセット
    } catch (error) {
      console.error("Failed to show the install prompt:", error);
    }
  };

  return (
    // <div>
    //   {isInstallable && (
    //     <button onClick={handleInstallClick} style={styles.installButton}>
    //       {locale === "en" ? "Install App" : "アプリをインストール"}
    //     </button>
    //   )}
    // </div>
    <div>
        <button onClick={handleInstallClick} style={styles.installButton}>
          {locale === "en" ? "Install App" : "アプリをインストール"}
        </button>
    </div>
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
