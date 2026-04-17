import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import "./Chat.css";
import axios from "axios";

// ✅ API instance
const API = axios.create({
  baseURL: "https://mentor-backend-8zgn.onrender.com"
});

// ✅ Attach token
API.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

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

  // ✅ SOCKET
  useEffect(() => {
    socket = io("https://mentor-backend-8zgn.onrender.com");
    socket.emit("join", user._id.toString());

    socket.on("receiveMessage", ({ senderId, message, timestamp }) => {
      const activeId = activeUserRef.current?._id;

      if (activeId && activeId.toString() === senderId.toString()) {
        setMessages((prev) =>
          Array.isArray(prev)
            ? prev.concat([
                {
                  sender: { _id: senderId },
                  content: message,
                  createdAt: timestamp
                }
              ])
            : []
        );
      }

      // refresh conversations
      loadConversations();
    });

    return () => socket.disconnect();
  }, [user._id]);

  // ✅ LOAD CONVERSATIONS
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

  // ✅ OPEN CHAT
  const openConversation = useCallback(
    (targetUser) => {
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
    },
    [navigate]
  );

  // ✅ LOAD USER IF DIRECT URL
  useEffect(() => {
    if (!userId) return;

    API.get("/api/users/" + userId)
      .then((res) => openConversation(res.data))
      .catch(() => console.error("User not found"));
  }, [userId, openConversation]);

  // ✅ SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ✅ SEND MESSAGE
  const sendMessage = () => {
    if (!input.trim() || !activeUser) return;

    const content = input.trim();
    setInput("");

    const newMsg = {
      sender: { _id: user._id },
      content,
      createdAt: new Date()
    };

    setMessages((prev) =>
      Array.isArray(prev) ? prev.concat([newMsg]) : []
    );

    API.post("/api/messages/send", {
      receiverId: activeUser._id,
      content
    }).then(() => {
      socket.emit("sendMessage", {
        senderId: user._id,
        receiverId: activeUser._id,
        message: content
      });
    });
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-page">
      {/* SIDEBAR */}
      <div className="chat-sidebar">
        <h3>Messages</h3>

        {convLoading ? (
          <div className="spinner" />
        ) : !Array.isArray(conversations) || conversations.length === 0 ? (
          <p>No conversations</p>
        ) : (
          conversations.map((c) => (
            <div
              key={c.partner._id}
              onClick={() => openConversation(c.partner)}
            >
              {c.partner.name}
            </div>
          ))
        )}
      </div>

      {/* MAIN */}
      <div className="chat-main">
        {!activeUser ? (
          <div>Select a chat</div>
        ) : (
          <>
            <div className="messages-area">
              {loading ? (
                <div className="spinner" />
              ) : !Array.isArray(messages) || messages.length === 0 ? (
                <div>No messages</div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i}>{msg.content}</div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
            />

            <button onClick={sendMessage}>Send</button>
          </>
        )}
      </div>
    </div>
  );
}