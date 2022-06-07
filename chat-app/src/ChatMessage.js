import './ChatMessage.css';

function ChatMessage(props) {
  
  return (
    <div className='ChatMessage'>
      <p>{props.value}</p>
    </div>
  )
}

export default ChatMessage;