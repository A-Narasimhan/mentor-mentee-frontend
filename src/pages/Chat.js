import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import "./Chat.css";

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
  const bottomRef = useRef(null);
  const activeUserRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    activeUserRef.current = activeUser;
  }, [activeUser]);

  useEffect(() => {
    socket = io("http://https://mentor-backend-8zgn.onrender.com");
    socket.emit("join", user._id.toString());

    socket.on("receiveMessage", ({ senderId, message, timestamp }) => {
      const activeConvUserId = activeUserRef.current
        ? activeUserRef.current._id
        : null;
      const isActiveConv =
        activeConvUserId &&
        activeConvUserId.toString() === senderId.toString();

      if (isActiveConv) {
        setMessages(function(prev) {
          return prev.concat([{
            sender: { _id: senderId },
            content: message,
            createdAt: timestamp,
          }]);
        });
      }

      setConversations(function(prev) {
        var exists = prev.find(function(c) {
          return c.partner._id.toString() === senderId.toString();
        });
        if (exists) {
          return prev.map(function(c) {
            if (c.partner._id.toString() === senderId.toString()) {
              return { ...c, lastMessage: { content: message, createdAt: timestamp } };
            }
            return c;
          });
        }
        axios.get("/api/messages/conversations").then(function(res) {
          setConversations(res.data);
        });
        return prev;
      });
    });

    return function() {
      socket.disconnect();
    };
  }, [user._id]);

  const loadConversations = useCallback(function() {
    axios.get("/api/messages/conversations").then(function(res) {
      setConversations(res.data);
    }).catch(function(err) {
      console.error("Failed to load conversations", err);
    }).finally(function() {
      setConvLoading(false);
    });
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const openConversation = useCallback(function(targetUser) {
    if (!targetUser || !targetUser._id) return;
    setActiveUser(targetUser);
    setLoading(true);
    navigate("/chat/" + targetUser._id, { replace: true });
    axios.get("/api/messages/" + targetUser._id).then(function(res) {
      setMessages(res.data);
    }).catch(function(err) {
      console.error("Failed to load messages", err);
    }).finally(function() {
      setLoading(false);
    });
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    if (activeUser && activeUser._id === userId) return;
    axios.get("/api/users/" + userId).then(function(res) {
      openConversation(res.data);
    }).catch(function(err) {
      console.error("User not found", err);
    });
  }, [userId, openConversation]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const uploadFile = function(file) {
    if (!activeUser) return;
    setUploading(true);
    var formData = new FormData();
    formData.append("file", file);
    formData.append("receiverId", activeUser._id.toString());
    axios.post("/api/messages/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then(function(res) {
      setMessages(function(prev) { return prev.concat([res.data]); });
      socket.emit("sendMessage", {
        senderId: user._id.toString(),
        receiverId: activeUser._id.toString(),
        message: res.data.content,
      });
    }).catch(function(err) {
      console.error("Upload failed", err);
    }).finally(function() {
      setUploading(false);
    });
  };

  const handleFileChange = function(e) {
    var file = e.target.files[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const sendMessage = function() {
    if (!input.trim() || !activeUser) return;
    var content = input.trim();
    setInput("");
    var timestamp = new Date();

    setMessages(function(prev) {
      return prev.concat([{ sender: { _id: user._id }, content: content, createdAt: timestamp }]);
    });

    setConversations(function(prev) {
      var exists = prev.find(function(c) { return c.partner._id === activeUser._id; });
      if (exists) {
        return prev.map(function(c) {
          if (c.partner._id === activeUser._id) {
            return { ...c, lastMessage: { content: content, createdAt: timestamp } };
          }
          return c;
        });
      }
      return [{ partner: activeUser, lastMessage: { content: content, createdAt: timestamp } }].concat(prev);
    });

    axios.post("/api/messages/send", {
      receiverId: activeUser._id,
      content: content,
    }).then(function() {
      socket.emit("sendMessage", {
        senderId: user._id.toString(),
        receiverId: activeUser._id.toString(),
        message: content,
      });
    }).catch(function(err) {
      console.error("Failed to send message", err);
    });
  };

  const handleKey = function(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessageContent = function(msg) {
    if (msg.type === "image" && msg.fileUrl) {
      return React.createElement(
        "div",
        null,
        React.createElement("img", {
          src: msg.fileUrl,
          alt: "sent",
          style: {
            maxWidth: "220px",
            borderRadius: 10,
            display: "block",
            marginBottom: 4,
            cursor: "pointer",
          },
          onClick: function() { window.open(msg.fileUrl, "_blank"); },
        }),
        React.createElement(
          "div",
          { style: { fontSize: 11, opacity: 0.7 } },
          msg.fileName
        )
      );
    }

    if (msg.type === "file" && msg.fileUrl) {
      return React.createElement(
        "a",
        {
          href: msg.fileUrl,
          target: "_blank",
          rel: "noreferrer",
          style: { color: "inherit", textDecoration: "none" },
        },
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.1)",
              padding: "8px 12px",
              borderRadius: 8,
            },
          },
          React.createElement("span", { style: { fontSize: 24 } }, "📎"),
          React.createElement(
            "div",
            null,
            React.createElement(
              "div",
              { style: { fontWeight: 600, fontSize: 13 } },
              msg.fileName
            ),
            React.createElement(
              "div",
              { style: { fontSize: 11, opacity: 0.7 } },
              msg.fileSize
            )
          )
        )
      );
    }

    return React.createElement("span", null, msg.content);
  };

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>Messages</h3>
        </div>
        {convLoading ? (
          <div className="spinner" style={{ margin: "20px auto" }} />
        ) : conversations.length === 0 ? (
          <div className="chat-empty-sidebar">
            <p>No conversations yet.</p>
            <p style={{ fontSize: 12 }}>Start by messaging from a profile!</p>
          </div>
        ) : (
          conversations.map(function(item) {
            var partner = item.partner;
            var lastMessage = item.lastMessage;
            var isActive = activeUser && activeUser._id === partner._id;
            return (
              <div
                key={partner._id}
                className={isActive ? "conv-item active" : "conv-item"}
                onClick={function() { openConversation(partner); }}
              >
                <div className="conv-avatar">
                  {partner.name ? partner.name[0] : "?"}
                </div>
                <div className="conv-info">
                  <div className="conv-name">{partner.name}</div>
                  <div className="conv-last">
                    {lastMessage && lastMessage.content
                      ? lastMessage.content.slice(0, 30) +
                        (lastMessage.content.length > 30 ? "..." : "")
                      : ""}
                  </div>
                </div>
                <div
                  className={"role-badge " + partner.role}
                  style={{ fontSize: 10, padding: "2px 6px" }}
                >
                  {partner.role}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="chat-main">
        {!activeUser ? (
          <div className="chat-placeholder">
            <span>💬</span>
            <h3>Select a conversation</h3>
            <p>Choose from your conversations or start a new one.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div className="chat-header">
              <div className="conv-avatar">
                {activeUser.name ? activeUser.name[0] : "?"}
              </div>
              <div>
                <div className="chat-header-name">{activeUser.name}</div>
                <div className="chat-header-role">
                  {activeUser.role} • {activeUser.domain || ""}
                </div>
              </div>
              <button
                className="btn-outline"
                style={{ marginLeft: "auto", padding: "8px 14px", fontSize: 13 }}
                onClick={function() { navigate("/mentors/" + activeUser._id); }}
              >
                👤 View Profile
              </button>
            </div>

            <div className="messages-area">
              {loading ? (
                <div className="spinner" style={{ margin: "40px auto" }} />
              ) : messages.length === 0 ? (
                <div className="no-messages">
                  Send a message to start the conversation!
                </div>
              ) : (
                messages.map(function(msg, i) {
                  var isMe =
                    (msg.sender && msg.sender._id === user._id) ||
                    (msg.sender && msg.sender._id &&
                      msg.sender._id.toString() === user._id.toString()) ||
                    msg.sender === user._id;
                  return (
                    <div
                      key={i}
                      className={isMe ? "message-wrap me" : "message-wrap them"}
                    >
                      {!isMe && (
                        <div className="msg-avatar">
                          {activeUser.name ? activeUser.name[0] : "?"}
                        </div>
                      )}
                      <div className={isMe ? "message-bubble me" : "message-bubble them"}>
                        {renderMessageContent(msg)}
                        <div className="msg-time">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            <div className="chat-input-area">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx,.txt,.zip"
              />
              <button
                className="btn-outline"
                style={{ padding: "10px 12px", fontSize: 18, flexShrink: 0 }}
                onClick={function() {
                  if (fileInputRef.current) fileInputRef.current.click();
                }}
                disabled={uploading}
                title="Attach file"
              >
                {uploading ? "⏳" : "📎"}
              </button>
              <textarea
                className="chat-input"
                rows={1}
                placeholder="Type a message... (Enter to send)"
                value={input}
                onChange={function(e) { setInput(e.target.value); }}
                onKeyDown={handleKey}
              />
              <button className="btn-primary send-btn" onClick={sendMessage}>
                Send ↑
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}