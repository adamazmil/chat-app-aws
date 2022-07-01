import './Message.scss'

function Message (props) {
  return (
    <div className='Message'>
      <p>{props.message}</p>
    </div>
  )
}

export default Message
