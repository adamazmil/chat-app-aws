import './Timestamp.css';

function Timestamp(props) {
  const t = new Date();
  t.setTime(props.timestamp)
  const text = t.toLocaleTimeString('en-US',{ hour: 'numeric', minute: 'numeric', hour12: true })
  
  return(
  <div className='Timestamp'>
      <p>{text}</p>
    </div>
  )
}

export default Timestamp;