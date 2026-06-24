import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import "./Chat.css";
import { API } from "../context/AuthContext";

const SOCKET_URL = "https://mentor-backend-8zgn.onrender.com";
let socket;

export default function Chat() {
  const { userId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convLoading, setConvLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [resourceUrl, setResourceUrl] = useState("");
  const [showResourcePanel, setShowResourcePanel] = useState(false);

  const bottomRef = useRef(null);
  const activeUserRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    activeUserRef.current = activeUser;
  }, [activeUser]);

  useEffect(() => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.emit("join", user._id.toString());

    socket.on("receiveMessage", ({ senderId, message, timestamp, type }) => {
      const activeId = activeUserRef.current?._id;
      if (activeId && activeId.toString() === senderId.toString()) {
        setMessages((prev) =>
          Array.isArray(prev)
            ? prev.concat([{
                sender: { _id: senderId },
                content: message,
                type: type || "text",
                createdAt: timestamp,
              }])
            : []
        );
      }
      loadConversations();
    });

    return () => socket.disconnect();
  }, [user._id]);

  const loadConversations = useCallback(() => {
    API.get("/api/messages/conversations")
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.conversations || res.data.data || [];
        setConversations(data);
      })
      .catch((err) => console.error("Failed to load conversations", err))
      .finally(() => setConvLoading(false));
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const openConversation = useCallback((targetUser) => {
    if (!targetUser?._id) return;
    setActiveUser(targetUser);
    setLoading(true);
    navigate("/chat/" + targetUser._id, { replace: true });
    API.get("/api/messages/" + targetUser._id)
      .then((res) => {
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.messages || res.data.data || [];
        setMessages(data);
      })
      .catch((err) => console.error("Failed to load messages", err))
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    API.get("/api/users/" + userId)
      .then((res) => openConversation(res.data))
      .catch(() => console.error("User not found"));
  }, [userId, openConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (type = "text", content = input.trim()) => {
    if (!content || !activeUser) return;
    if (type === "text") setInput("");

    setMessages((prev) =>
      Array.isArray(prev)
        ? prev.concat([{
            sender: { _id: user._id },
            content,
            type,
            createdAt: new Date(),
          }])
        : []
    );

    API.post("/api/messages/send", {
      receiverId: activeUser._id,
      content,
      type,
    }).then(() => {
      socket.emit("sendMessage", {
        senderId: user._id,
        receiverId: activeUser._id,
        message: content,
        type,
      });
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = [
      "application/pdf", "image/png", "image/jpeg", "image/gif",
      "text/plain",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    if (!allowed.includes(file.type)) {
      alert("Unsupported file type. Please upload PDF, image, or PPT.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum 10MB.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await API.post("/api/messages/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      sendMessage("file", data.fileUrl);
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const shareResourceLink = () => {
    const url = resourceUrl.trim();
    if (!url) return;
    try { new URL(url); } catch {
      alert("Please enter a valid URL including https://");
      return;
    }
    sendMessage("resource", url);
    setResourceUrl("");
    setShowResourcePanel(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderMessageContent = (msg) => {
    if (msg.type === "file") {
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(msg.content);
      if (isImage) {
        return (
          <img
            src={msg.content}
            alt="shared"
            style={{ maxWidth: 220, borderRadius: 8, display: "block" }}
          />
        );
      }
      return (
        <a href={msg.content} target="_blank" rel="noreferrer"
          style={{ color: "inherit", textDecoration: "underline" }}>
          📎 {msg.content.split("/").pop()}
        </a>
      );
    }
    if (msg.type === "resource") {
      return (
        <a href={msg.content} target="_blank" rel="noreferrer"
          style={{ color: "inherit", textDecoration: "underline" }}>
          🔗 {msg.content}
        </a>
      );
    }
    return <span>{msg.content}</span>;
  };

  return (
    <div className="chat-page">
      {/* SIDEBAR */}
      <div className="chat-sidebar">
        <h3>Messages</h3>
        {convLoading ? (
          <div className="spinner" />
        ) : conversations.length === 0 ? (
          <div style={{ padding: "16px 12px", color: "var(--text-dim)", fontSize: 13 }}>
            <p>No conversations yet.</p>
            <p style={{ marginTop: 8 }}>
              Go to <strong>Find Mentors</strong> and click 💬 to start chatting.
            </p>
          </div>
        ) : (
          conversations.map((c) => (
            <div
              key={c.partner._id}
              onClick={() => openConversation(c.partner)}
              style={{
                cursor: "pointer", padding: "10px 12px", borderRadius: 8,
                background: activeUser?._id === c.partner._id
                  ? "var(--bg-secondary)" : "transparent",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "var(--accent)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 15, color: "#fff",
                }}>
                  {c.partner.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.partner.name}</div>
                  {c.lastMessage && (
                    <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                      {c.lastMessage.content?.slice(0, 30)}
                      {c.lastMessage.content?.length > 30 ? "..." : ""}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MAIN */}
      <div className="chat-main">
        {!activeUser ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: "100%", color: "var(--text-dim)", fontSize: 15,
          }}>
            Select a conversation to start messaging
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              padding: "12px 16px", borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--accent)", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontWeight: 700, color: "#fff",
              }}>
                {activeUser.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{activeUser.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                  {activeUser.domain || "MentorMatch member"}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="messages-area">
              {loading ? (
                <div className="spinner" />
              ) : messages.length === 0 ? (
                <div style={{
                  textAlign: "center", color: "var(--text-dim)",
                  padding: "40px 20px", fontSize: 14,
                }}>
                  No messages yet. Say hello! 👋
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.sender?._id?.toString() === user._id?.toString();
                  return (
                    <div key={i} style={{
                      display: "flex",
                      justifyContent: isMine ? "flex-end" : "flex-start",
                      marginBottom: 8, padding: "0 12px",
                    }}>
                      <div style={{
                        maxWidth: "70%",
                        background: isMine ? "var(--accent)" : "var(--bg-secondary)",
                        color: isMine ? "#fff" : "var(--text-primary)",
                        padding: "10px 14px",
                        borderRadius: isMine
                          ? "18px 18px 4px 18px"
                          : "18px 18px 18px 4px",
                        fontSize: 14, lineHeight: 1.5,
                      }}>
                        {renderMessageContent(msg)}
                        <div style={{
                          fontSize: 10, marginTop: 4, opacity: 0.7,
                          textAlign: isMine ? "right" : "left",
                        }}>
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Resource link panel */}
            {showResourcePanel && (
              <div style={{
                padding: "10px 16px", borderTop: "1px solid var(--border)",
                display: "flex", gap: 8, alignItems: "center",
                background: "var(--bg-secondary)",
              }}>
                <input
                  type="url"
                  placeholder="Paste a link (article, GitHub, YouTube...)"
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && shareResourceLink()}
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg-primary)",
                    color: "var(--text-primary)", fontSize: 13,
                  }}
                />
                <button onClick={shareResourceLink} className="btn-primary"
                  style={{ padding: "8px 14px", fontSize: 13 }}>
                  Share
                </button>
                <button onClick={() => setShowResourcePanel(false)}
                  className="btn-outline" style={{ padding: "8px 12px", fontSize: 13 }}>
                  Cancel
                </button>
              </div>
            )}

            {/* Input bar */}
            <div style={{
              padding: "12px 16px", borderTop: "1px solid var(--border)",
              display: "flex", gap: 8, alignItems: "flex-end",
            }}>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                accept=".pdf,.png,.jpg,.jpeg,.gif,.ppt,.pptx,.txt"
                onChange={handleFileUpload}
              />
              <button
                title="Share a file"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 20, padding: "4px 6px", color: "var(--text-dim)",
                }}
              >
                {uploading ? "⏳" : "📎"}
              </button>
              <button
                title="Share a resource link"
                onClick={() => setShowResourcePanel(!showResourcePanel)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 20, padding: "4px 6px",
                  color: showResourcePanel ? "var(--accent)" : "var(--text-dim)",
                }}
              >
                🔗
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                rows={1}
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 12,
                  border: "1px solid var(--border)", resize: "none",
                  background: "var(--bg-secondary)",
                  color: "var(--text-primary)", fontSize: 14,
                  lineHeight: 1.5, outline: "none",
                }}
              />
              <button
                onClick={() => sendMessage()}
                className="btn-primary"
                style={{ padding: "10px 18px", fontSize: 14, borderRadius: 12 }}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}