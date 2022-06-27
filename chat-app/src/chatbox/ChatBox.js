import "./ChatBox.css";
import { useState, useEffect } from "react";
import ChatFrame from "./ChatFrame"

const webSocket = new WebSocket(process.env.REACT_APP_API_KEY);

function ChatBox() {
  const [currentMsg, setCurrentMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [disable, setDisable] = useState(true);
  const [isTyping, setIsTyping] = useState(null);
  const [len, setLen] = useState(0);
  const [typingUser,setTypingUsers] = useState([])
  const time = new Date()

  /* 
    sets up event listeners.
    json = [type: String, message: Object]: Array
    json.message = {msg:String ,sender: String,timestamp: String}: Object
  */
  useEffect(() => {
     webSocket.onmessage = (message) => {
       const json = JSON.parse(message.data)
      switch (json.type) {
        case 'message': {
          setMessages((prev) => [...prev, json.message]);
          break;
        }
        case 'getGuest': {
          setUser(json.message)
          break;
        }
        case 'isTyping': {
          setTypingUsers((prev) => [...prev, json.message]);
          break;
        }
        case 'notTyping': {
          setTypingUsers((prev) => prev.filter((x)=>x.typer!==json.message.typer))
          break;
        }
        default: {
        }
      }
    };
    webSocket.onopen = () => {
      let payload = { action: "getguest" }
      webSocket.send(JSON.stringify(payload));
    }
    webSocket.onclose = () => {
      setDisable(true);
    }
  }, []);

  // checks whether user is not null to allow typing in form. 
  useEffect(() => {
    if (user !== null)
      setDisable(false)
  }, [user]);

  /* sets up a timeout for isTyping that is allowed to 
  resolve if len remains unchanged. clearTimeout clears our 
  timeout if we continue typing.
  */
  useEffect(() => {
    if (len >= 3) {
      setIsTyping(true);
      var timeout = setTimeout(() => {
        setIsTyping(false);
      }, 5000);
    }
    return () => {
      clearTimeout(timeout);
    }
  }, [len]);
  
  // sends a message to the websocket when user is typing
  useEffect(() => {
    let json;
    if (isTyping === true) {
      json = { action: 'istyping', message: user }
      webSocket.send(JSON.stringify(json))
    } else if(isTyping===false){
      json = { action: 'nottyping', message: user }
      webSocket.send(JSON.stringify(json))
    }
  }, [isTyping,user]);
  
  function handleSubmit(event) {
    setIsTyping(false);
    event.preventDefault();
    if (currentMsg.length >= 0 && currentMsg.replace(/\s/g, '').length === 0) {
      // user tried to send only spaces
      setCurrentMsg('');
    } else {
      const payload = { action: "sendmessage", message: currentMsg };
      const msg = { msg: currentMsg, sender: user, timestamp: time.getTime() };
      setCurrentMsg('');
      if (webSocket.readyState === 1) {
        webSocket.send(JSON.stringify(payload));
        setMessages((prev) => [...prev, msg]);
      }
    }
  }
  function handleChange(event) {
    setCurrentMsg(event.target.value);
    setLen(event.target.value.length);
  }

  return (
    <div className='ChatBox'>
      <ChatFrame messages={messages} typer={typingUser} />
      <div className="ChatBox-form">
        <form onSubmit={handleSubmit}>
          <input disabled={disable} type="text" value={currentMsg} onChange={handleChange} placeholder='Type something...'/>
          <button disabled={disable} type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default ChatBox;
