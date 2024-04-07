import React from "react";
import styles from "../styles/IntersectionObserver.module.css";

const IntersectionObserver = () => {
  return (
    <>
      <h1 className={styles.mainTitle}>Intersection Observer API Demo</h1>
      <div className={styles.wrapper}>
        <aside className={styles.indexWrapper}>
          <h1>目次</h1>
          <ol id="indexList" className={styles.index}>
            <li>
              <a href="#index1">Lorem</a>
            </li>
            <li>
              <a href="#index2">Ipsum </a>
            </li>
            <li>
              <a href="#index3">Dolor</a>
            </li>
            <li>
              <a href="#index4">Sit amet</a>
            </li>
            <li>
              <a href="#index5">Consectetur</a>
            </li>
          </ol>
        </aside>
        <main className={styles.contents}>
          <div className="box" id="index1">
            <h1>Lorem</h1>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Accusantium asperiores expedita minus nisi praesentium provident
              quisquam repellat sapiente ut vitae. Aut corporis deleniti
              deserunt eos error facere, maiores necessitatibus quo. Lorem ipsum
              dolor sit amet, consectetur adipisicing elit. Accusantium
              asperiores expedita minus nisi praesentium provident quisquam
              repellat sapiente ut vitae. Aut corporis deleniti deserunt eos
              error facere, maiores necessitatibus quo.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Accusantium asperiores expedita minus nisi praesentium provident
              quisquam repellat sapiente ut vitae. Aut corporis deleniti
              deserunt eos error facere, maiores necessitatibus quo. Lorem ipsum
              dolor sit amet, consectetur adipisicing elit. Accusantium
              asperiores expedita minus nisi praesentium provident quisquam
              repellat sapiente ut vitae. Aut corporis deleniti deserunt eos
              error facere, maiores necessitatibus quo.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Accusantium asperiores expedita minus nisi praesentium provident
              quisquam repellat sapiente ut vitae. Aut corporis deleniti
              deserunt eos error facere, maiores necessitatibus quo. Lorem ipsum
              dolor sit amet, consectetur adipisicing elit. Accusantium
              asperiores expedita minus nisi praesentium provident quisquam
              repellat sapiente ut vitae. Aut corporis deleniti deserunt eos
              error facere, maiores necessitatibus quo.
            </p>
          </div>

          <div className="box" id="index2">
            <h1>Ipsum</h1>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Accusantium asperiores expedita minus nisi praesentium provident
              quisquam repellat sapiente ut vitae. Aut corporis deleniti
              deserunt eos error facere, maiores necessitatibus quo. Lorem ipsum
              dolor sit amet, consectetur adipisicing elit. Accusantium
              asperiores expedita minus nisi praesentium provident quisquam
              repellat sapiente ut vitae. Aut corporis deleniti deserunt eos
              error facere, maiores necessitatibus quo.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Accusantium asperiores expedita minus nisi praesentium provident
              quisquam repellat sapiente ut vitae. Aut corporis deleniti
              deserunt eos error facere, maiores necessitatibus quo. Lorem ipsum
              dolor sit amet, consectetur adipisicing elit. Accusantium
              asperiores expedita minus nisi praesentium provident quisquam
              repellat sapiente ut vitae. Aut corporis deleniti deserunt eos
              error facere, maiores necessitatibus quo.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Accusantium asperiores expedita minus nisi praesentium provident
              quisquam repellat sapiente ut vitae. Aut corporis deleniti
              deserunt eos error facere, maiores necessitatibus quo. Lorem ipsum
              dolor sit amet, consectetur adipisicing elit. Accusantium
              asperiores expedita minus nisi praesentium provident quisquam
              repellat sapiente ut vitae. Aut corporis deleniti deserunt eos
              error facere, maiores necessitatibus quo.
            </p>
          </div>

          <div className="box" id="index3">
            <h1>Dolor</h1>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Accusantium asperiores expedita minus nisi praesentium provident
              quisquam repellat sapiente ut vitae. Aut corporis deleniti
              deserunt eos error facere, maiores necessitatibus quo. Lorem ipsum
              dolor sit amet, consectetur adipisicing elit. Accusantium
              asperiores expedita minus nisi praesentium provident quisquam
              repellat sapiente ut vitae. Aut corporis deleniti deserunt eos
              error facere, maiores necessitatibus quo.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Accusantium asperiores expedita minus nisi praesentium provident
              quisquam repellat sapiente ut vitae. Aut corporis deleniti
              deserunt eos error facere, maiores necessitatibus quo. Lorem ipsum
              dolor sit amet, consectetur adipisicing elit. Accusantium
              asperiores expedita minus nisi praesentium provident quisquam
              repellat sapiente ut vitae. Aut corporis deleniti deserunt eos
              error facere, maiores necessitatibus quo.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Accusantium asperiores expedita minus nisi praesentium provident
              quisquam repellat sapiente ut vitae. Aut corporis deleniti
              deserunt eos error facere, maiores necessitatibus quo. Lorem ipsum
              dolor sit amet, consectetur adipisicing elit. Accusantium
              asperiores expedita minus nisi praesentium provident quisquam
              repellat sapiente ut vitae. Aut corporis deleniti deserunt eos
              error facere, maiores necessitatibus quo.
            </p>
          </div>

          <div className="box" id="index4">
            <h1>Sit amet</h1>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Accusantium asperiores expedita minus nisi praesentium provident
              quisquam repellat sapiente ut vitae. Aut corporis deleniti
              deserunt eos error facere, maiores necessitatibus quo. Lorem ipsum
              dolor sit amet, consectetur adipisicing elit. Accusantium
              asperiores expedita minus nisi praesentium provident quisquam
              repellat sapiente ut vitae. Aut corporis deleniti deserunt eos
              error facere, maiores necessitatibus quo.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Accusantium asperiores expedita minus nisi praesentium provident
              quisquam repellat sapiente ut vitae. Aut corporis deleniti
              deserunt eos error facere, maiores necessitatibus quo. Lorem ipsum
              dolor sit amet, consectetur adipisicing elit. Accusantium
              asperiores expedita minus nisi praesentium provident quisquam
              repellat sapiente ut vitae. Aut corporis deleniti deserunt eos
              error facere, maiores necessitatibus quo.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Accusantium asperiores expedita minus nisi praesentium provident
              quisquam repellat sapiente ut vitae. Aut corporis deleniti
              deserunt eos error facere, maiores necessitatibus quo. Lorem ipsum
              dolor sit amet, consectetur adipisicing elit. Accusantium
              asperiores expedita minus nisi praesentium provident quisquam
              repellat sapiente ut vitae. Aut corporis deleniti deserunt eos
              error facere, maiores necessitatibus quo.
            </p>
          </div>

          <div className="box" id="index5">
            <h1>Consectetur</h1>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Accusantium asperiores expedita minus nisi praesentium provident
              quisquam repellat sapiente ut vitae. Aut corporis deleniti
              deserunt eos error facere, maiores necessitatibus quo. Lorem ipsum
              dolor sit amet, consectetur adipisicing elit. Accusantium
              asperiores expedita minus nisi praesentium provident quisquam
              repellat sapiente ut vitae. Aut corporis deleniti deserunt eos
              error facere, maiores necessitatibus quo.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Accusantium asperiores expedita minus nisi praesentium provident
              quisquam repellat sapiente ut vitae. Aut corporis deleniti
              deserunt eos error facere, maiores necessitatibus quo. Lorem ipsum
              dolor sit amet, consectetur adipisicing elit. Accusantium
              asperiores expedita minus nisi praesentium provident quisquam
              repellat sapiente ut vitae. Aut corporis deleniti deserunt eos
              error facere, maiores necessitatibus quo.
            </p>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipisicing elit.
              Accusantium asperiores expedita minus nisi praesentium provident
              quisquam repellat sapiente ut vitae. Aut corporis deleniti
              deserunt eos error facere, maiores necessitatibus quo. Lorem ipsum
              dolor sit amet, consectetur adipisicing elit. Accusantium
              asperiores expedita minus nisi praesentium provident quisquam
              repellat sapiente ut vitae. Aut corporis deleniti deserunt eos
              error facere, maiores necessitatibus quo.
            </p>
          </div>
        </main>
      </div>
    </>
  );
};

export default IntersectionObserver;
