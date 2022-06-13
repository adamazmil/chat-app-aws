import './ChatMessage.css'
import Message from './Message';
import Sender from './Sender';

function ChatMessage(props) {
  return (
    <div className='ChatMessage'>
      <Sender sender={props.value.sender} />
      <Message message={props.value.msg} />
    </div>
  );
}

export default ChatMessage
