import { useState } from "react";
import { useEffect } from "react";
import { supabase } from "./supabase";

export const App =() => {
  const [titleText, setTitleText] = useState('');
  const [timeText, setTimeText] = useState('');
  const [totalTime, setTotalTime] = useState(0);
  const [records, setRecords] = useState([]);
  const [isIncompleteText, setIsIncompleteText] = useState(false);
  const [loading, setLoading] = useState(true);

  

  const getRecords = async () => {
    setLoading(true);

    const {data, error} = await supabase.from('study-record').select('*');

    if (error) {
      console.log(error);
      setLoading(false);
      return;
    }

    setRecords(data);

    const total = data.reduce(
      (sum, record) => sum + record.time, 
      0
    );

    setTotalTime(total);

    setLoading(false);

  }
  const onChangeTitleText = (event) => setTitleText(event.target.value);
  const onChangeTimeText = (event) => setTimeText(event.target.value);
  const onClickRegister = async () => {
    if (titleText === "") {
      setIsIncompleteText(true);
      return;
    }

    const {error} = await supabase
    .from('study-record')
    .insert([
      {
        title: titleText,
        time: Number(timeText)
      }
    ]);

    if (error) {
      console.log(error);
      return;
    }


    setTimeText('');
    setTitleText('');
    
    await getRecords();
  }
  const onClickDelete = async (id) => {
    const {error} = await supabase
    .from('study-record')
    .delete()
    .eq('id', id);

    if (error) {
      console.log(error);
      return;
    }

    getRecords();
  }

  useEffect(() => {
      getRecords();
    }, []);

  if (loading) {
   return <p>Loading...</p>;
  }
  return (
    <>
      <div>
        <h1>学習記録一覧</h1>
        <label htmlFor="title-input">学習内容</label>
        <input id="title-input" type="text" value={titleText} onChange={onChangeTitleText}/>
        <label htmlFor="time-input">学習時間</label>
        <input id="time-input" type="text" value={timeText} onChange={onChangeTimeText}/>
        <p>時間</p>
      </div>
      <div>
        <p>入力されている学習内容：{titleText}</p>
        <p>入力されている時間：{timeText}</p>
        <button onClick={onClickRegister}>登録</button>
      </div>
      <div>
        <ul>
          {records.map((record) => (
            <li key={record.id}>
              <div>
                <p>{record.title}：{record.time}</p>
                <button onClick={() => onClickDelete(record.id)}>削除</button>   
              </div>
            </li>
           
          ))}
        </ul>
        {isIncompleteText && (
         <p role="alert">入力されていない項目があります</p>)
         }
        
      </div>
      <div>
        <p>合計時間：{totalTime} / 1000（h）</p>
      </div>

    </>
  );
};
