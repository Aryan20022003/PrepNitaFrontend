import React, { useEffect, useRef, useState } from "react";
import Client from "../components/Client";
import logo from "../n.png";
import Editor from "../components/Editor";
import { useNavigate, useLocation, useParams, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { initSocket } from "../socket";

const EditorPage = () => {
  const codeRef = useRef(null);
  const [clients, setClients] = useState([]);
  const [connected, setConnected] = useState(false);
  const location = useLocation();
  const { roomId } = useParams();
  const socketRef = useRef(null);
  const reactnavigate = useNavigate();

  const handleLeave = () => {
    socketRef.current.disconnect();
    toast.success("You left the room");
    reactnavigate("/");
  };

  async function handleCopyBtn() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied");
    } catch (error) {
      toast.error("Error in copying ID");
      console.error("Error in copying", error);
    }
  }

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();

      socketRef.current.on("connect", () => {
        setConnected(true);
      });

      socketRef.current.on("disconnect", () => {
        setConnected(false);
      });

      socketRef.current.on("connect_error", (err) => handleError(err));
      socketRef.current.on("connect_failed", (err) => handleError(err));

      const handleError = (e) => {
        console.log("socket error", e);
        toast.error("Socket connection failed");
        reactnavigate("/");
      };

      socketRef.current.emit("join-room", {
        roomId,
        userName: location.state?.userName,
      });

      socketRef.current.on("user-connected", ({ clients, userName, socketId }) => {
        if (userName !== location.state?.userName) {
          toast.success(`${userName} joined`);
        }
        setClients(clients);
        
        if (codeRef.current) {
          socketRef.current.emit("codesync", {
            code: codeRef.current,
            socketId,
          });
        }
      });

      socketRef.current.on("user-disconnected", ({ socketId, userName }) => {
        toast.success(`${userName} left`);
        setClients((prev) => prev.filter((client) => client.socketId !== socketId));
      });
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off("user-connected");
        socketRef.current.off("user-disconnected");
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
      }
    };
  }, [location.state?.userName, roomId, reactnavigate]);

  if (!location.state) {
    return <Navigate to="/" />;
  }

  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <img src={logo} alt="Code Sync Logo" className="logoImg" />
          </div>
          <h3>Status: {connected ? "Connected" : "Disconnected"}</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client userName={client.userName} key={client.socketId} />
            ))}
          </div>
        </div>
        <button className="btn copyBtn" onClick={handleCopyBtn}>
          Copy ROOM ID
        </button>
        <button className="btn leaveBtn" onClick={handleLeave}>
          Leave
        </button>
      </div>
      <div className="editor">
        <Editor
          socketRef={socketRef}
          roomId={roomId}
          onCodeChange={(code) => {
            codeRef.current = code;
          }}
        />
      </div>
    </div>
  );
};

export default EditorPage;