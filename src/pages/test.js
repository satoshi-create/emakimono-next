import { supabase } from '@/libs/supabaseClient'; // 作成したクライアントをインポート

export default function TestPage() {
  const fetchTestData = async () => {
    // scene_titlesを起点に、紐づくマスターテキストと画像をまとめて取得
    const { data, error } = await supabase
      .from('scene_titles')
      .select(`
        *,
        master_texts ( title, description ),
        images ( src, sort_key )
      `)
      .eq('scroll_id', 'test-scroll'); // テスト用のIDで絞り込み

    if (error) {
      console.error('エラー発生:', error);
    } else {
      console.log('取得成功！データの中身:', data);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Supabase 接続テスト</h1>
      <button onClick={fetchTestData}>データを取得してコンソールに表示</button>
    </div>
  );
}
