import React, { useEffect } from "react";
import ScrollHint from "scroll-hint";
import styles from "../styles/ScrollHint.module.css";

const ScrollHintPage = () => {
  useEffect(() => {
// new ScrollHint(".js-scrollable");

new ScrollHint(".js-scrollable", {
  suggestiveShadow: true,
});

  }, []);

  return (
    <div className="js-scrollable entry-container">
      <h2>動物について</h2>
      <table className="dataframe animal-table">
        <thead>
          <tr>
            <th>動物</th>
            <th>生息地</th>
            <th>食性</th>
            <th>寿命（年）</th>
            <th>保全状況</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ライオン</td>
            <td>サバンナ</td>
            <td>肉食</td>
            <td>14</td>
            <td>脆弱</td>
          </tr>
          <tr>
            <td>ゾウ</td>
            <td>森林</td>
            <td>草食</td>
            <td>60</td>
            <td>絶滅危惧</td>
          </tr>
          <tr>
            <td>パンダ</td>
            <td>竹林</td>
            <td>草食</td>
            <td>20</td>
            <td>脆弱</td>
          </tr>
          <tr>
            <td>カンガルー</td>
            <td>アウトバック</td>
            <td>草食</td>
            <td>23</td>
            <td>脅威なし</td>
          </tr>
          <tr>
            <td>ペンギン</td>
            <td>南極</td>
            <td>肉食</td>
            <td>15</td>
            <td>危険に近い</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ScrollHintPage;
