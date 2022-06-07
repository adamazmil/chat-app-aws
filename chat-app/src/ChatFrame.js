import ChatMessage from './ChatMessage'

function ChatFrame(props) {
  return (
    <div className='ChatFrame'>
      {props.messages.map((value, index) => {
        return <ChatMessage key={index} value={value} />;
      })}
    </div>
  );
}

export default ChatFrame;
