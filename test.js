$(window).on('load',function(){
	$(function() {
	    let url = location.href;
	    if(url.indexOf("?id=") != -1){
	        let id = url.split("?id=");
	        let $target = $('#' + id[id.length - 1]);
	        if($target.length){
	            let position = $target.offset().top;
	            $("html, body").animate({scrollTop:position}, 1);
	        }
	    }
	});
})

// 5行目 let url = location.hrefでURLを取得します。
// 6行目 URLに?id=が含まれていたら
// 7行目 ?id=で前後に分割してリストに入れて
// 8行目 先のリストの一番最後（?id=の後が入っている）と同じid名の要素を取得
// 10行目 先の要素の位置を取得
// 11行目 先の要素の位置までスクロール


const [createQuiz, setCreateQuiz] = useState(false);
	
useEffect(()=> {
    const reRender = () => {
        setCreateQuiz(true)
    }
    window.onload=function(){
      document.getElementById("myBtn").addEventListener("click", reRender);
    } 
    // return document.getElementById("myBtn").removeEventListener("click", reRender);
  }, [createQuiz])

return (
    <QuizContextProvider>
      {
      (createQuiz) ? (
        <div>Form</div>
      ) : (
        <div>
        <Modal/>
        <Question question={questions[questionNumber]} next={goToTheNext} />
        </div>
      )
      }
      {console.log(createQuiz)}
    </QuizContextProvider>
  );
}