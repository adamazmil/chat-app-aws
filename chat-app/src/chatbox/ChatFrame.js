import './ChatFrame.css'
import ChatMessage from './chat-message/ChatMessage'
import Typer from './Typer'
function ChatFrame(props) {
  return (
    <div className='ChatFrame'>
      {props.messages.map((value, index) => {
        return (<ChatMessage key={index} value={value}/>);
      })}
      <Typer typers={props.typer} />
    </div>
  );
}

export default ChatFrame;
