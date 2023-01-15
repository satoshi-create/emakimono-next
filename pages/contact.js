import React, { useState } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import "lazysizes";
import Head from "../components/Meta";
import styles from "../styles/contact.module.css";
import { FormControl, Textarea, Input } from "@chakra-ui/react";
import Title from "../components/Title";
import { useRouter } from "next/router";
import Breadcrumbs from "../components/Breadcrumbs";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { locale } = useRouter();

  const send = async (e) => {
    e.preventDefault();
    console.log("送信中");

    let data = {
      name,
      email,
      message,
    };

    await fetch("/api/contact", {
      method: "POST",
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then((res) => {
      if (res.status === 200) {
        console.log("送信が成功しました");
        setSubmitted(true);
        setName("");
        setTitle("");
        setEmail("");
        setMessage("");
      }
    });
  };

  return (
    <>
      <Head />
      <Header />
      <Breadcrumbs name={locale === "en" ? "contact" : "お問い合わせ"} />
      <section className="section-grid section-padding">
        <Title sectiontitle={"お問い合わせ"} sectiontitleen={"contact"} />
        <form className={styles.form}>
          <FormControl isRequired>
            <Input
              placeholder="お名前"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
            />
          </FormControl>
          <FormControl isRequired>
            <Input
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
            />
          </FormControl>
          <FormControl isRequired>
            <Input
              placeholder="お問い合わせ内容"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
            />
          </FormControl>
          <Textarea
            placeholder="メッセージ"
            size="sm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`${styles.input} ${styles.textarea}`}
          />
          <button className={styles.btn} type="submit" onClick={(e) => send(e)}>
            送信する
          </button>
          {submitted && <p className={styles.submitted}>送信が完了しました</p>}
        </form>
      </section>
      <Footer />
    </>
  );
};

export default Contact;
