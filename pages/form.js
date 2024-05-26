import React, { useState } from "react";
import { useRouter } from "next/router";

const Form = () => {
  const router = useRouter();
  // 初回表示か否かを判定するステートを定義しておく
  const [isFirst, setIsFirst] = useState(true);

  // フォーム回答後はリダイレクトさせる
  const redirect = () => {
    // 初回表示時はリダイレクトさせない
    if (isFirst) {
      setIsFirst(false);
      return;
    }

    router.push({
      // リダイレクト先のページ
      pathname: `/`,
    });
  };
  return (
    <div onLoad={redirect}>
      <iframe
        src="https://docs.google.com/forms/d/e/1FAIpQLScLvpswhpnpEuJwFvlcH_rsXr6ZTi2kPo25Fv1uZYaaMZFBwg/viewform?embedded=true"
        width="640"
        height="509"
        frameBorder="0"
        marginHeight="0"
        marginWidth="0"
      >
        読み込んでいます…
      </iframe>
      ;
    </div>
  );
};

export default Form;
