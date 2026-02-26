import React from "react";

const ChatWindow = ({ userText, botReply }) => {
  return (
    <div>
      <h3>User:</h3>
      <p>{userText}</p>

      <h3>Bot:</h3>
      <p>{botReply}</p>
    </div>
  );
};

export default ChatWindow;