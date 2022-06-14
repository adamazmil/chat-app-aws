import "./ChatBox.css";
import { useState, useEffect } from "react";
import ChatFrame from "./ChatFrame"

const webSocket = new WebSocket(process.env.REACT_APP_API_KEY);

function ChatBox() {
  const [currentMsg, setCurrentMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const time = new Date()

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
        default: {
        }
      }
    };
    webSocket.onopen = () => {
      let payload = { action: "getguest" }
      webSocket.send(JSON.stringify(payload));
    }
  }, []);

  function handleSubmit(event) {
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
  }

  return (
    <div className='ChatBox'>
      <ChatFrame messages={messages}/>
      <div className="ChatBox-form">
        <form onSubmit={handleSubmit}>
          <input disabled={user===null} type="text" value={currentMsg} onChange={handleChange} placeholder='Type something...'/>
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}

export default ChatBox;
