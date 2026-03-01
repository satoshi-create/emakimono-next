// pages/scrolls/[id].tsx
import { GetServerSideProps, NextPage } from 'next';
import { getScrollData } from '@/libs/api/scrollService'; // ステップ3で作った関数
import { ScrollResponse } from '@/types/scroll'; // ステップ2で作った型

interface Props {
  data: ScrollResponse | null;
}

const ScrollDetailPage: NextPage<Props> = ({ data }) => {
  console.log(data);

  // データがない場合の処理
  if (!data) return <div>作品が見つかりませんでした。</div>;

  const { metadata } = data;
  const keywords = metadata.keyword ?? [];
  const source = metadata.source;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* 1. タイトルと基本情報 */}
      <header>
        <p style={{ color: '#666' }}>{metadata.era} / {metadata.author}</p>
        <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>{metadata.title}</h1>
      </header>

      {/* 2. サムネイル（あれば） */}
      {metadata.thumbnail && (
        <img
          src={metadata.thumbnail}
          alt={metadata.title}
          style={{ width: '100%', borderRadius: '8px' }}
        />
      )}

      {/* 3. 解説文 */}
      <section style={{ marginTop: '30px' }}>
        <h2>作品解説</h2>
        <p style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
          {metadata.description}
        </p>
      </section>

      {/* 4. キーワード（タグ表示） */}
      {keywords.length > 0 && (
        <section style={{ marginTop: '20px' }}>
          {keywords.map((k) => (
            <span key={k.id} style={{
              display: 'inline-block',
              backgroundColor: '#eee',
              padding: '4px 10px',
              marginRight: '8px',
              borderRadius: '15px',
              fontSize: '0.8rem'
            }}>
              #{k.name}
            </span>
          ))}
        </section>
      )}

      {/* 5. 出典元リンク */}
      {source?.url && (
        <footer style={{ marginTop: '40px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
          <p>出典: <a href={source.url} target="_blank" rel="noreferrer">
            {source.name ?? source.url}
          </a></p>
        </footer>
      )}
    </div>
  );
};

/**
 * サーバーサイドでデータを取得する（Pages Router）
 * データが取得できなかった場合は 404 を返す
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  const id = context.params?.id as string;

  const data = await getScrollData(id);

  if (!data) {
    return { notFound: true };
  }

  return {
    props: {
      data,
    },
  };
};

export default ScrollDetailPage;
