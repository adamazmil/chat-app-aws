import "./ChatBox.css";
import { useState, useEffect } from "react";
import ChatFrame from "./ChatFrame"

const webSocket = new WebSocket(process.env.REACT_APP_API_KEY);
function ChatBox() {
  const [currentMsg, setCurrentMsg] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    webSocket.onmessage = (message) => {
      setMessages((prev) => [...prev, message.data]);
    };
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    const payload = { action: "sendmessage", message: currentMsg };
    setCurrentMsg("");
    if (webSocket.readyState === 1) {
      webSocket.send(JSON.stringify(payload));
      setMessages((prev) => [...prev, payload.message]);
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
          <input type="text" value={currentMsg} onChange={handleChange} />
          <button type="submit" >Submit</button>
        </form>
      </div>
    </div>
  );
}

export default ChatBox;
