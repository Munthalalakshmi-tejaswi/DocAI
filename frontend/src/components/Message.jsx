import { Bot, FileText, User } from "lucide-react";

function Message({ message }) {
  const isUser = message.role === "user";

  return (
    <article className={`message-row ${isUser ? "user-row" : "assistant-row"}`}>
      <div className={`message-avatar ${isUser ? "user-avatar" : "assistant-avatar"}`}>
        {isUser ? <User size={18} /> : <Bot size={19} />}
      </div>

      <div className="message-content">
        <div className="message-author">
          {isUser ? "You" : "DocAI Assistant"}
        </div>

        <div className="message-bubble">{message.text}</div>

        {!isUser && message.sources?.length > 0 && (
          <div className="source-pages">
            <FileText size={14} />
            <span>
              Source pages: {message.sources.join(", ")}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

export default Message;
