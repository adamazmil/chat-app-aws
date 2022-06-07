import "./ChatBox.css";
import React, { useState, useEffect } from "react";
const webSocket = new WebSocket(process.env.REACT_APP_API_KEY);
function ChatBox() {
  const [currentMsg, setCurrentMsg] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    webSocket.onmessage = (message) => {
      setMessages((prev) => [...prev, message.data]);
    };
  }, []);

  useEffect(() => {
    
  }, [messages]);

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
    <div className="ChatBox-form">
      <form onSubmit={handleSubmit}>
        <input type="text" value={currentMsg} onChange={handleChange} />
        <input type="submit" value="Submit"></input>
      </form>
    </div>
  );
}

export default ChatBox;
