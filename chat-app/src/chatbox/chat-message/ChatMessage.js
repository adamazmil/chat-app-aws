import './ChatMessage.scss'
import Message from './Message'
import Sender from './Sender'
import Timestamp from './Timestamp'

function ChatMessage (props) {
  return (
    <div className='ChatMessage'>
      <Sender sender={props.value.sender} />
      <Message message={props.value.msg} />
      <Timestamp timestamp={props.value.timestamp} />
    </div>
  )
}

export default ChatMessage
