import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import io from 'socket.io-client';
import axiosInstance from '../../src/utils/axiosInstance';
import { useAuth } from '../../src/context/AuthContext';
import { useToast } from '../../src/context/ToastContext';
import LoadingSpinner from '../LoadingSpinner';

function getMessageDateLabel(dateInput) {
  if (!dateInput) return 'Today';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Today';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  if (msgDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (msgDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return msgDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

export default function InboxView({ hidden = false }) {
  const toast = useToast();
  const location = useLocation();
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendLoading, setSendLoading] = useState(false);

  const [fetchingMsgs, setFetchingMsgs] = useState(false);
  const textareaRef = useRef(null);

  // Video Call Modal State & WebRTC Refs
  const [videoCallModal, setVideoCallModal] = useState({
    isOpen: false,
    chat: null,
    status: 'connecting',
    isMuted: false,
    isVideoOff: false,
    callDuration: 0,
  });

  const [incomingCall, setIncomingCall] = useState(null); // { callerName, callerAvatar, callerId, offer }
  const [offlineModal, setOfflineModal] = useState({ isOpen: false, chat: null, reason: 'offline' });

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);
  const callTimeoutRef = useRef(null);

  // Initialize Socket.IO for WebRTC signaling
  useEffect(() => {
    const storedUser = user || JSON.parse(localStorage.getItem('user') || '{}');
    const myProfileIdStr = (storedUser?.profile_id || storedUser?.id || '').toString().toLowerCase();

    // Determine backend Socket.IO URL dynamically based on current location
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const socketUrl = isLocal ? 'http://localhost:5000' : `${window.location.protocol}//${window.location.host}`;
    const socketOptions = { path: '/api/socket.io', transports: ['websocket', 'polling'] };
    
    const socket = io(socketUrl, socketOptions);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('register', {
        profile_id: storedUser?.profile_id,
        id: storedUser?.id
      });
    });

    socket.on('webrtc_signaling', async (data) => {
      if (!data) return;

      // 0. User Unavailable / Offline
      if (data.type === 'USER_UNAVAILABLE') {
        if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
        endVideoCall(false);
        setOfflineModal({
          isOpen: true,
          chat: activeChat || { name: 'Member' },
          reason: 'unreachable'
        });
      }

      // 1. Incoming Call Request
      if (data.type === 'OFFER_CALL') {
        setIncomingCall({
          callerName: data.callerName,
          callerAvatar: data.callerAvatar,
          callerId: data.callerId,
          offer: data.offer
        });
      }

      // 2. Call Answered by Remote Peer
      if (data.type === 'ANSWER_CALL') {
        if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
        if (peerConnectionRef.current && data.answer) {
          try {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            setVideoCallModal((prev) => ({ ...prev, status: 'connected' }));

            // Process queued ICE candidates
            if (iceCandidatesQueueRef.current.length > 0) {
              for (const cand of iceCandidatesQueueRef.current) {
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(cand)).catch((e) => console.warn(e));
              }
              iceCandidatesQueueRef.current = [];
            }
          } catch (e) {
            console.warn("Set remote description error:", e);
          }
        }
      }

      // 3. ICE Candidate Exchanged
      if (data.type === 'ICE_CANDIDATE') {
        if (data.candidate) {
          try {
            if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            } else {
              console.log("[WebRTC Queue] Queuing ICE candidate for when remoteDescription is ready.");
              iceCandidatesQueueRef.current.push(data.candidate);
            }
          } catch (e) {
            console.warn("ICE candidate error:", e);
          }
        }
      }

      // 4. Call Rejected or Ended by Remote Peer
      if (data.type === 'END_CALL') {
        if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
        setIncomingCall(null);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
          peerConnectionRef.current = null;
        }
        remoteStreamRef.current = null;
        iceCandidatesQueueRef.current = [];
        setVideoCallModal({ isOpen: false, chat: null, status: 'ended', isMuted: false, isVideoOff: false, callDuration: 0 });
      }
    });

    // Real-time peer online / offline status broadcasts
    socket.on('USER_STATUS_CHANGE', (data) => {
      if (!data) return;
      const { profileId, userId, online } = data;
      setChats((prev) =>
        prev.map((c) => {
          const pid = (c.profileId || c.profile_id || '').toString().toLowerCase();
          const cid = (c.id || '').toString().toLowerCase();
          const isMatch =
            (profileId && (pid === profileId.toLowerCase() || cid === profileId.toLowerCase())) ||
            (userId && (cid === userId.toString().toLowerCase() || pid === userId.toString().toLowerCase()));
          return isMatch ? { ...c, online: Boolean(online) } : c;
        })
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Effect to continuously ensure media streams are bound to video DOM elements when modal opens or updates status
  useEffect(() => {
    if (videoCallModal.isOpen) {
      if (localVideoRef.current && mediaStreamRef.current && localVideoRef.current.srcObject !== mediaStreamRef.current) {
        localVideoRef.current.srcObject = mediaStreamRef.current;
      }
      if (remoteVideoRef.current && remoteStreamRef.current && remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        remoteVideoRef.current.play().catch((err) => console.warn("Remote video play error:", err));
      }
    }
  }, [videoCallModal.isOpen, videoCallModal.status]);

  // Helper to create RTCPeerConnection
  const createPeerConnection = (targetUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        {
          urls: [
            'turn:openrelay.metered.ca:80',
            'turn:openrelay.metered.ca:443',
            'turn:openrelay.metered.ca:443?transport=tcp'
          ],
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      iceTransportPolicy: 'all',
      iceCandidatePoolSize: 10
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ICE_CANDIDATE', {
          targetId: targetUserId,
          candidate: event.candidate
        });
      }
    };

    const handleConnected = () => {
      setVideoCallModal((prev) => ({ ...prev, status: 'connected' }));
      if (remoteVideoRef.current && remoteStreamRef.current) {
        if (remoteVideoRef.current.srcObject !== remoteStreamRef.current) {
          remoteVideoRef.current.srcObject = remoteStreamRef.current;
        }
        remoteVideoRef.current.play().catch((err) => console.warn("Remote play error:", err));
      }
    };

    pc.ontrack = (event) => {
      console.log("[WebRTC] Received remote track:", event.track.kind, event.streams);
      
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
      } else {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        if (!remoteStreamRef.current.getTracks().some(t => t.id === event.track.id)) {
          remoteStreamRef.current.addTrack(event.track);
        }
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
        remoteVideoRef.current.play().catch((err) => console.warn("Remote play ontrack error:", err));
      }
      handleConnected();
    };

    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", pc.connectionState);
      if (pc.connectionState === 'connected') {
        handleConnected();
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        console.warn("[WebRTC] Connection state change requires recovery...");
        try {
          if (pc.restartIce) pc.restartIce();
        } catch (e) {
          console.error("ICE restart error:", e);
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE Connection state:", pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        handleConnected();
      } else if (pc.iceConnectionState === 'failed') {
        console.warn("[WebRTC] ICE Connection failed. Restarting ICE...");
        try {
          if (pc.restartIce) pc.restartIce();
        } catch (e) {
          console.error("ICE restart error:", e);
        }
      }
    };

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, mediaStreamRef.current);
      });
    }

    peerConnectionRef.current = pc;
    return pc;
  };

  // Start Call (Caller)
  const startVideoCall = async (chat) => {
    const plan = (user?.plan || '').toLowerCase();
    if (plan !== 'diamond' && plan !== 'platinum') {
      toast.error("Video Calling is an exclusive feature of the Premium Plans. Upgrade to enable Video Calls!");
      return;
    }

    if (!chat?.online) {
      setOfflineModal({ isOpen: true, chat, reason: 'offline' });
      return;
    }

    const targetUserId = chat.profileId || chat.id;

    setVideoCallModal({
      isOpen: true,
      chat,
      status: 'connecting',
      isMuted: false,
      isVideoOff: false,
      callDuration: 0,
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      mediaStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection(targetUserId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);

      const defaultAvatar = chat.gender === 'Female' ? 'https://www.w3schools.com/howto/img_avatar2.png' : 'https://www.w3schools.com/howto/img_avatar.png';
      const myAvatar = user?.photo_1 || defaultAvatar;

      if (socketRef.current) {
        socketRef.current.emit('OFFER_CALL', {
          targetId: targetUserId,
          targetProfileId: chat.profileId || chat.profile_id || chat.id,
          targetName: chat.name,
          callerId: user?.profile_id || user?.id,
          callerName: user?.full_name || 'Member',
          callerAvatar: myAvatar,
          offer
        });
      }

      // Set 40-second ringing timeout so caller does not hang indefinitely
      if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = setTimeout(() => {
        if (peerConnectionRef.current && peerConnectionRef.current.connectionState !== 'connected') {
          toast.info("No answer from member. Call timed out.");
          endVideoCall();
        }
      }, 40000);
    } catch (err) {
      console.error("Camera access error:", err);
      toast.error("Could not access camera/microphone. Please allow camera permissions to place a video call.");
      setVideoCallModal({ isOpen: false, chat: null, status: 'connecting', isMuted: false, isVideoOff: false, callDuration: 0 });
      return;
    }
  };

  // Accept Incoming Call (Receiver)
  const acceptIncomingCall = async () => {
    if (!incomingCall) return;
    const { callerId, callerName, callerAvatar, offer } = incomingCall;
    setIncomingCall(null);

    const dummyChat = {
      id: callerId,
      profileId: callerId,
      name: callerName,
      image: callerAvatar,
      online: true
    };

    setVideoCallModal({
      isOpen: true,
      chat: dummyChat,
      status: 'connected',
      isMuted: false,
      isVideoOff: false,
      callDuration: 0,
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      mediaStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection(callerId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Process any ICE candidates that arrived before remote description was set
      if (iceCandidatesQueueRef.current.length > 0) {
        for (const cand of iceCandidatesQueueRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(cand)).catch((e) => console.warn(e));
        }
        iceCandidatesQueueRef.current = [];
      }

      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(answer);

      if (socketRef.current) {
        socketRef.current.emit('ANSWER_CALL', {
          targetId: callerId,
          answer
        });
      }
    } catch (err) {
      console.warn("Accept call stream error:", err);
    }
  };

  // Reject Incoming Call (Receiver)
  const rejectIncomingCall = () => {
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    if (incomingCall && socketRef.current) {
      socketRef.current.emit('END_CALL', {
        targetId: incomingCall.callerId
      });
    }
    setIncomingCall(null);
  };

  const endVideoCall = async (shouldLog = true) => {
    if (callTimeoutRef.current) clearTimeout(callTimeoutRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    const duration = videoCallModal.callDuration;
    const targetChat = videoCallModal.chat;

    if (targetChat && socketRef.current) {
      socketRef.current.emit('END_CALL', {
        targetId: targetChat.profileId || targetChat.id
      });
    }

    setVideoCallModal({
      isOpen: false,
      chat: null,
      status: 'ended',
      isMuted: false,
      isVideoOff: false,
      callDuration: 0,
    });

    // Only post call end message if call was actually established and connected
    if (shouldLog && targetChat && duration > 0) {
      const durationText = formatDuration(duration);
      const callLogMessage = `📹 Video Call (${durationText})`;
      const receiverId = targetChat.profileId || targetChat.id;
      try {
        const { data } = await axiosInstance.post('/users/chats/messages', {
          receiverId,
          message: callLogMessage
        });
        if (data.success && data.message) {
          setChats((prev) =>
            prev.map((c) =>
              c.id === targetChat.id || c.profileId === targetChat.profileId
                ? {
                    ...c,
                    messages: [...(c.messages || []), data.message],
                    lastMessage: callLogMessage,
                    lastTime: 'Now'
                  }
                : c
            )
          );
        }
      } catch (err) {
        console.error("Failed to log call end message:", err);
      }
    }
  };

  const toggleMute = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setVideoCallModal((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setVideoCallModal((prev) => ({ ...prev, isVideoOff: !prev.isVideoOff }));
  };

  useEffect(() => {
    let timer;
    if (videoCallModal.isOpen && videoCallModal.status === 'connected') {
      timer = setInterval(() => {
        setVideoCallModal((prev) => ({ ...prev, callDuration: prev.callDuration + 1 }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [videoCallModal.isOpen, videoCallModal.status]);

  const formatDuration = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const selectTargetProfile = (targetProfile, currentChats) => {
    if (!targetProfile) return currentChats;

    const pid = (targetProfile.profile_id || (typeof targetProfile.id === 'string' ? targetProfile.id : '')).toString().toLowerCase();
    const pname = (targetProfile.name || targetProfile.full_name || '').toString().toLowerCase();

    let matched = currentChats.find(
      (c) =>
        (pid && c.profileId && c.profileId.toString().toLowerCase() === pid) ||
        (pid && c.profile_id && c.profile_id.toString().toLowerCase() === pid) ||
        (pid && c.id && c.id.toString().toLowerCase() === pid) ||
        (pname && c.name && c.name.toLowerCase() === pname)
    );

    let updatedChats = [...currentChats];

    if (!matched) {
      const defaultAvatar =
        targetProfile.gender === 'Female'
          ? 'https://www.w3schools.com/howto/img_avatar2.png'
          : 'https://www.w3schools.com/howto/img_avatar.png';

      const image =
        targetProfile.photo_1 && targetProfile.photo_1.includes('/uploads/')
          ? targetProfile.photo_1
          : defaultAvatar;

      const targetStringId = targetProfile.profile_id || targetProfile.id;

      matched = {
        id: targetStringId,
        profileId: targetStringId,
        name: targetProfile.name || targetProfile.full_name || 'Member',
        image,
        lastMessage: 'No messages yet',
        lastTime: 'Now',
        unread: 0,
        online: false,
        messages: []
      };

      updatedChats = [matched, ...updatedChats];
    }

    return updatedChats;
  };

  const handledProfileRef = useRef(null);

  // 1. Fetch Conversations List from Backend (Preserves loaded messages)
  const fetchConversations = async () => {
    try {
      const response = await axiosInstance.get('/users/chats/conversations');
      const dbChats = response.data.conversations || [];

      setChats((prev) => {
        // Merge dbChats with prev to PRESERVE currently loaded messages in state
        const mergedDb = dbChats.map((newChat) => {
          const existing = prev.find((p) => p.id === newChat.id || p.profileId === newChat.profileId);
          return {
            ...newChat,
            messages: existing?.messages || newChat.messages || []
          };
        });

        // If target profile from initial navigation was not in DB, keep it
        const targetProfile = location.state?.selectedProfile;
        if (targetProfile && !mergedDb.some(c => c.profileId === targetProfile.profile_id || c.id === targetProfile.id)) {
          return selectTargetProfile(targetProfile, mergedDb);
        }
        return mergedDb;
      });
    } catch (err) {
      console.error('Error fetching chat history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle selectedProfile from navigation state (Runs only ONCE when navigating with state)
  useEffect(() => {
    const targetProfile = location.state?.selectedProfile;
    if (targetProfile) {
      const targetId = (targetProfile.profile_id || targetProfile.id || '').toString();
      if (targetId && handledProfileRef.current !== targetId) {
        handledProfileRef.current = targetId;
        setChats((prev) => selectTargetProfile(targetProfile, prev));
        setActiveId(targetId);
        try {
          window.history.replaceState({}, document.title);
        } catch (e) {
          // ignore
        }
      }
    }
  }, [location.state]);

  const activeChat = chats.find((c) => 
    c.id === activeId || 
    c.profileId === activeId || 
    (activeId && c.id && c.id.toString() === activeId.toString()) || 
    (activeId && c.profileId && c.profileId.toString() === activeId.toString())
  );
  const messagesContainerRef = useRef(null);

  // 2. Fetch Active Chat Messages (Silent polling prevents flickering)
  const fetchActiveMessages = async (chatId, isSilent = false) => {
    if (!chatId) return;
    if (!isSilent) setFetchingMsgs(true);
    try {
      const response = await axiosInstance.get(`/users/chats/messages/${chatId}`);
      const fetchedMsgs = response.data.messages || [];

      setChats((prev) =>
        prev.map((c) => {
          if (c.id === chatId || c.profileId === chatId) {
            return {
              ...c,
              unread: 0,
              messages: fetchedMsgs,
              lastMessage: fetchedMsgs.length > 0 ? fetchedMsgs[fetchedMsgs.length - 1].text : c.lastMessage
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error("Failed to fetch messages", err);
    } finally {
      if (!isSilent) setFetchingMsgs(false);
    }
  };

  useEffect(() => {
    if (activeId) {
      fetchActiveMessages(activeId, false);
      const interval = setInterval(() => fetchActiveMessages(activeId, true), 3000);
      return () => clearInterval(interval);
    }
  }, [activeId]);

  // Auto-scroll messages container to bottom
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [activeId, activeChat?.messages?.length]);

  const openChat = (id) => {
    setActiveId(id);
    setInput('');
    fetchActiveMessages(id);
  };

  // 3. Send Message to Backend API
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeId || sendLoading) return;

    const messageText = input.trim();
    const targetChat = activeChat;
    const receiverId = targetChat?.profileId || targetChat?.id;
    const tempId = 'temp-' + Date.now();

    const optimisticMsg = {
      id: tempId,
      sender_id: user?.id,
      receiver_id: receiverId,
      text: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      from: 'me',
      isSelf: true,
      isRead: false
    };

    // Instant local UI update
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeId || c.profileId === activeId
          ? {
              ...c,
              messages: [...(c.messages || []), optimisticMsg],
              lastMessage: messageText,
              lastTime: 'Now'
            }
          : c
      )
    );

    setSendLoading(true);
    try {
      const { data } = await axiosInstance.post('/users/chats/messages', {
        receiverId,
        message: messageText
      });

      if (data.success && data.message) {
        // Swap temp msg with actual server msg
        setChats((prev) =>
          prev.map((c) =>
            c.id === activeId || c.profileId === activeId
              ? {
                  ...c,
                  messages: (c.messages || []).map((m) => (m.id === tempId ? data.message : m)),
                  lastMessage: messageText,
                  lastTime: 'Now'
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to send message", err);
      // Rollback optimistic message on error
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeId || c.profileId === activeId
            ? {
                ...c,
                messages: (c.messages || []).filter((m) => m.id !== tempId)
              }
            : c
        )
      );
      const errorMsg = err.response?.data?.error || "Failed to send message";
      toast.error(errorMsg);
    } finally {
      setSendLoading(false);
    }
  };

  const isModalActive = videoCallModal.isOpen || Boolean(incomingCall) || offlineModal.isOpen;

  return (
    <div className={`w-full ${hidden && !isModalActive ? 'hidden' : 'block'}`}>
      {/* Outer card — fits strictly in one screen viewport */}
      <div 
        className={`rounded-xl border border-slate-200/70 bg-white shadow-sm overflow-hidden flex flex-col w-full h-[calc(100vh-125px)] max-h-[calc(100vh-125px)] min-h-[480px] ${hidden ? 'hidden' : 'flex'}`}
      >

        {/* Header */}
        <div className="px-4 md:px-6 py-2.5 border-b border-slate-100 bg-white shrink-0">
          <h2 className="text-sm font-bold text-charcoal-text uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-deep-maroon" />
            Inbox Messages
          </h2>
          <p className="text-[10px] text-soft-gray mt-0.5">Select a conversation to start chatting</p>
        </div>

        {/* Body: list + chat side by side */}
        <div className="flex flex-1 min-h-0">

          {/* ── LEFT: Conversation list ── */}
          <div
            className={`flex flex-col overflow-y-auto border-r border-slate-100 shrink-0 bg-white
              ${activeId ? 'hidden sm:flex sm:w-[260px] md:w-[310px]' : 'flex w-full sm:w-[260px] md:w-[310px]'}`}
          >
            {loading && chats.length === 0 ? (
              <LoadingSpinner text="" />
            ) : chats.length === 0 ? (
              <p className="text-xs text-soft-gray text-center py-10 px-4">No conversations yet.</p>
            ) : null}

            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => openChat(chat.id)}
                className={`flex items-center gap-2.5 px-3 py-3 text-left transition-colors cursor-pointer border-b border-slate-50 hover:bg-slate-50 w-full
                  ${activeId === chat.id ? 'bg-deep-maroon/5 border-l-2 border-l-deep-maroon' : 'border-l-2 border-l-transparent'}`}
              >
                <div className="relative shrink-0">
                  <img
                    src={chat.image}
                    alt={chat.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${chat.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} title={chat.online ? 'Online' : 'Offline'} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs truncate ${activeId === chat.id ? 'font-bold text-deep-maroon' : 'font-semibold text-charcoal-text'}`}>
                      {chat.name}
                    </span>
                    <span className="text-[9px] text-slate-400 shrink-0 ml-1">{chat.lastTime}</span>
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <p className="text-[10px] text-soft-gray truncate">{chat.lastMessage}</p>
                    {chat.unread > 0 && (
                      <span className="ml-1 shrink-0 w-4 h-4 rounded-full bg-deep-maroon text-white text-[9px] font-bold flex items-center justify-center">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* ── RIGHT: Chat panel ── */}
          <div className={`flex-1 flex flex-col min-w-0 ${!activeId ? 'hidden sm:flex' : 'flex'}`}>

            {activeChat ? (
              <>
                {/* Chat header */}
                <div className="flex items-center justify-between px-3.5 md:px-5 py-2.5 border-b border-slate-200/70 bg-white shrink-0 shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Back (mobile) */}
                    <button
                      onClick={() => setActiveId(null)}
                      className="sm:hidden text-slate-500 hover:text-charcoal-text cursor-pointer p-1 -ml-1.5 rounded-full hover:bg-slate-100"
                    >
                      <span className="material-symbols-outlined text-[20px] leading-none">arrow_back</span>
                    </button>

                    <Link 
                      to={`/profile/${activeChat.profileId || activeChat.id}`} 
                      className="flex items-center gap-2.5 min-w-0 group"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={activeChat.image}
                          alt={activeChat.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs group-hover:ring-2 group-hover:ring-deep-maroon/30 transition-all"
                        />
                        <span 
                          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                            activeChat.online ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                          }`} 
                        />
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-charcoal-text text-xs leading-snug group-hover:text-deep-maroon transition-colors truncate">
                            {activeChat.name}
                          </p>
                        </div>
                        <div className="text-[10px] flex items-center gap-1.5 truncate mt-0.5">
                          {activeChat.online ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Online
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                              Offline
                            </span>
                          )}
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-500 truncate">
                            {activeChat.age ? `${activeChat.age} yrs, ` : ''}{activeChat.location || 'Kerala'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (!activeChat.online) {
                          setOfflineModal({ isOpen: true, chat: activeChat, reason: 'offline' });
                        } else {
                          startVideoCall(activeChat);
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 text-xs font-semibold ${
                        activeChat.online
                          ? 'text-deep-maroon bg-deep-maroon/10 hover:bg-deep-maroon hover:text-white hover:shadow-sm active:scale-95'
                          : 'text-slate-400 bg-slate-100 hover:bg-slate-200/80 active:scale-95'
                      }`}
                      title={activeChat.online ? `Start HD Video Call with ${activeChat.name}` : `${activeChat.name} is currently offline · Click to leave a notice`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {activeChat.online ? 'videocam' : 'videocam_off'}
                      </span>
                      <span className="hidden sm:inline text-[11px]">
                        {activeChat.online ? 'Video Call' : 'Offline'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Messages — scrollable container with WhatsApp authentic warm background */}
                <div 
                  ref={messagesContainerRef} 
                  className="flex-1 overflow-y-auto px-4 md:px-6 py-4 flex flex-col bg-[#efeae2] relative"
                >
                  {fetchingMsgs && (!activeChat.messages || activeChat.messages.length === 0) ? (
                    <div className="flex-1 flex items-center justify-center p-4 my-auto">
                      <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-deep-maroon"></div>
                    </div>
                  ) : (!activeChat.messages || activeChat.messages.length === 0) ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 gap-2 my-auto">
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200/80 flex items-center justify-center text-deep-maroon">
                        <span className="material-symbols-outlined text-[24px]">chat</span>
                      </div>
                      <p className="text-xs font-bold text-slate-700">Say hello to {activeChat.name}!</p>
                      <p className="text-[11px] text-slate-400 max-w-xs">Start the conversation with a warm greeting or inquiry.</p>
                    </div>
                  ) : (
                    activeChat.messages.map((msg, idx) => {
                      const isSelf = msg.from === 'me' || msg.isSelf;
                      const currentDateLabel = getMessageDateLabel(msg.createdAt || msg.created_at || msg.time);
                      const prevMsg = activeChat.messages[idx - 1];
                      const prevDateLabel = prevMsg ? getMessageDateLabel(prevMsg.createdAt || prevMsg.created_at || prevMsg.time) : null;
                      const showDateDivider = !prevMsg || currentDateLabel !== prevDateLabel;

                      const isCall = msg.text && (msg.text.includes('📹') || msg.text.toLowerCase().includes('video call'));
                      const isZeroDuration = isCall && (msg.text.includes('(00:00)') || msg.text.includes('(0s)') || msg.text.toLowerCase().includes('no answer'));
                      const durationMatch = msg.text ? msg.text.match(/\(([\d:]+)\)/) : null;
                      const duration = durationMatch ? durationMatch[1] : '';

                      return (
                        <React.Fragment key={msg.id || idx}>
                          {/* WhatsApp-Style Date Pill */}
                          {showDateDivider && (
                            <div className="flex justify-center my-3 select-none">
                              <span className="bg-white/95 text-[#54656f] text-[11px] font-semibold px-3.5 py-1 rounded-lg shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] uppercase tracking-wide border border-black/5">
                                {currentDateLabel}
                              </span>
                            </div>
                          )}

                          {/* Message or Call rendering */}
                          {isCall ? (
                            <div className={`flex items-end gap-1.5 ${isSelf ? 'justify-end' : 'justify-start'} my-1.5`}>
                              {!isSelf && (
                                <img
                                  src={activeChat.image}
                                  alt=""
                                  className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200 mb-0.5 shadow-2xs"
                                />
                              )}
                              <div
                                onClick={() => !isSelf && startVideoCall(activeChat)}
                                className={`relative w-full max-w-[270px] p-2.5 rounded-xl shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] transition-all ${
                                  !isSelf ? 'cursor-pointer hover:shadow-sm' : ''
                                } ${
                                  isSelf
                                    ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none'
                                    : isZeroDuration
                                    ? 'bg-white text-[#111b21] rounded-tl-none border border-rose-100'
                                    : 'bg-white text-[#111b21] rounded-tl-none border border-slate-100'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                                      !isSelf && isZeroDuration
                                        ? 'bg-rose-50 text-rose-600'
                                        : isSelf
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-emerald-50 text-emerald-600'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[19px]">
                                      {!isSelf && isZeroDuration
                                        ? 'call_missed'
                                        : isSelf
                                        ? (isZeroDuration ? 'call_made' : 'videocam')
                                        : (isZeroDuration ? 'call_missed' : 'videocam')}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-[12px] font-bold leading-tight ${!isSelf && isZeroDuration ? 'text-rose-600' : 'text-[#111b21]'}`}>
                                      {!isSelf && isZeroDuration
                                        ? 'Missed Video Call'
                                        : isSelf
                                        ? (isZeroDuration ? 'Outgoing Video Call' : 'Video Call')
                                        : (isZeroDuration ? 'Missed Video Call' : 'Incoming Video Call')}
                                    </p>
                                    <div className="text-[10px] text-[#667781] mt-0.5 flex items-center justify-between">
                                      <span>{isZeroDuration ? (!isSelf ? 'Tap to call back' : 'No answer') : (duration ? `${duration}` : 'Ended')}</span>
                                      <span className="text-[9.5px] ml-1">{msg.time}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className={`flex items-end gap-1.5 ${isSelf ? 'justify-end' : 'justify-start'} my-1`}>
                              {!isSelf && (
                                <img
                                  src={activeChat.image}
                                  alt=""
                                  className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200 mb-0.5 shadow-2xs"
                                />
                              )}
                              <div
                                className={`relative max-w-[82%] sm:max-w-[65%] px-2.5 py-1.5 text-[13px] shadow-[0_1px_0.5px_rgba(11,20,26,0.13)] ${
                                  isSelf
                                    ? 'bg-[#d9fdd3] text-[#111b21] rounded-lg rounded-tr-none'
                                    : 'bg-white text-[#111b21] rounded-lg rounded-tl-none border border-slate-100'
                                }`}
                              >
                                <div className="inline">
                                  <span className="break-words font-normal leading-[19px] whitespace-pre-wrap">{msg.text}</span>
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] align-bottom float-right ml-2.5 mt-1 select-none ${
                                      isSelf ? 'text-[#667781]' : 'text-[#667781]'
                                    }`}
                                  >
                                    <span>{msg.time}</span>
                                    {isSelf && (
                                      <span
                                        className={`material-symbols-outlined leading-none ${
                                          msg.isRead ? 'text-[#53bdeb]' : 'text-[#8696a0]'
                                        }`}
                                        style={{ fontSize: '13px' }}
                                        title={msg.isRead ? 'Read (Seen)' : 'Delivered'}
                                      >
                                        done_all
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </div>

                {/* Input bar — authentic WhatsApp style with Shift+Enter multiline support */}
                <form
                  onSubmit={sendMessage}
                  className="flex items-end gap-2 px-3 md:px-4 py-2.5 bg-[#f0f2f5] border-t border-[#e9edef] shrink-0"
                >
                  <div className="flex-1 flex items-center bg-white rounded-lg px-3 py-1.5 shadow-[0_1px_0.5px_rgba(11,20,26,0.05)] border border-transparent focus-within:border-slate-300 transition-all min-h-[42px]">
                    <span className="material-symbols-outlined text-[20px] text-[#54656f] mr-2 select-none shrink-0 cursor-pointer hover:text-slate-700 self-center">
                      mood
                    </span>
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = 'auto';
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage(e);
                        }
                      }}
                      placeholder="Type a message…"
                      className="flex-1 min-w-0 bg-transparent text-[13px] text-[#111b21] placeholder-[#8696a0] focus:outline-none resize-none max-h-24 py-1 leading-snug"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!input.trim() || sendLoading}
                    className="w-10 h-10 rounded-full bg-deep-maroon hover:bg-primary text-white flex items-center justify-center shrink-0 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md hover:shadow-lg mb-0.5"
                  >
                    {sendLoading ? (
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    ) : (
                      <span className="material-symbols-outlined text-[18px] leading-none">send</span>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* No chat selected — empty state */
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3 bg-slate-50/40">
                <div className="w-14 h-14 rounded-full bg-deep-maroon/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[32px] text-deep-maroon/25">forum</span>
                </div>
                <p className="font-semibold text-charcoal-text text-sm">No chat selected</p>
                <p className="text-xs text-soft-gray max-w-[200px]">Pick a conversation from the list to start chatting</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Interactive HD Video Call Modal */}
      {videoCallModal.isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-6 animate-fade-in">
          <div className="relative w-full max-w-3xl h-[92vh] sm:h-auto sm:aspect-[16/10] max-h-[700px] min-h-[480px] bg-slate-900 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col justify-between p-3 sm:p-6">
            
            {/* Top Header Bar */}
            <div className="relative z-20 flex items-center justify-between bg-slate-900/80 backdrop-blur-md p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
                <img
                  src={videoCallModal.chat?.image}
                  alt={videoCallModal.chat?.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-heritage-gold shadow-md shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-white font-bold text-xs sm:text-sm leading-tight flex items-center gap-1.5 truncate">
                    <span className="truncate">{videoCallModal.chat?.name}</span>
                    <span className="bg-amber-500/20 text-amber-300 text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-500/30 shrink-0">HD</span>
                  </h4>
                  <p className="text-[9px] sm:text-[10px] text-slate-300 font-medium truncate mt-0.5">
                    {videoCallModal.status === 'connecting' ? 'Connecting...' : `Connected · ${formatDuration(videoCallModal.callDuration)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <span className="material-symbols-outlined text-emerald-400 text-[14px] sm:text-xs animate-pulse">lock</span>
                <span className="text-[9px] sm:text-[10px] text-slate-300 font-semibold uppercase tracking-wider hidden xs:inline sm:inline">Encrypted</span>
              </div>
            </div>

            {/* Remote Video Container */}
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950 overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {videoCallModal.status === 'connecting' ? (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 sm:gap-4 text-center p-4 sm:p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-20 h-20 sm:w-28 sm:h-28 bg-deep-maroon/30 rounded-full animate-ping"></div>
                    <img
                      src={videoCallModal.chat?.image}
                      alt={videoCallModal.chat?.name}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-heritage-gold shadow-2xl z-10"
                    />
                  </div>
                  <div>
                    <p className="text-white font-bold text-base sm:text-lg">Calling {videoCallModal.chat?.name}...</p>
                    <p className="text-[10px] sm:text-xs text-slate-400 mt-1">Establishing secure Diamond VIP video stream</p>
                  </div>
                </div>
              ) : (
                <div className="absolute top-16 sm:top-20 left-3 sm:left-4 z-20 bg-slate-950/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 text-white text-[10px] sm:text-xs font-bold">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live 2-Way HD
                </div>
              )}
            </div>

            {/* Picture-in-Picture Local Camera Feed */}
            <div className="absolute bottom-20 sm:bottom-24 right-3 sm:right-6 z-30 w-24 sm:w-36 md:w-44 aspect-[4/3] bg-slate-950 rounded-xl sm:rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform -scale-x-100 ${videoCallModal.isVideoOff ? 'hidden' : 'block'}`}
              />
              {videoCallModal.isVideoOff && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 gap-1 p-1">
                  <span className="material-symbols-outlined text-[18px] sm:text-[24px]">videocam_off</span>
                  <span className="text-[8px] sm:text-[9px] font-semibold">Camera Off</span>
                </div>
              )}
              <span className="absolute bottom-1 left-1.5 sm:bottom-2 sm:left-2 bg-black/60 text-white text-[7px] sm:text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wider backdrop-blur-xs">You</span>
            </div>

            {/* Action Controls Bar */}
            <div className="relative z-30 flex items-center justify-center gap-3 sm:gap-6 bg-slate-900/90 backdrop-blur-xl p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-white/10 max-w-xs sm:max-w-md mx-auto w-full shrink-0">
              {/* Mute Button */}
              <button
                onClick={toggleMute}
                className={`p-2.5 sm:p-3.5 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center text-white ${
                  videoCallModal.isMuted ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30' : 'bg-slate-800 hover:bg-slate-700 border border-white/10'
                }`}
                title={videoCallModal.isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                  {videoCallModal.isMuted ? 'mic_off' : 'mic'}
                </span>
              </button>

              {/* Toggle Camera Button */}
              <button
                onClick={toggleCamera}
                className={`p-2.5 sm:p-3.5 rounded-full transition-all duration-200 cursor-pointer flex items-center justify-center text-white ${
                  videoCallModal.isVideoOff ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30' : 'bg-slate-800 hover:bg-slate-700 border border-white/10'
                }`}
                title={videoCallModal.isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
              >
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                  {videoCallModal.isVideoOff ? 'videocam_off' : 'videocam'}
                </span>
              </button>

              {/* End Call Button */}
              <button
                onClick={endVideoCall}
                className="p-3 sm:p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/40 transition-all duration-200 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
                title="End Video Call"
              >
                <span className="material-symbols-outlined text-[20px] sm:text-[24px]">call_end</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Incoming Call Ringing Dialog */}
      {incomingCall && (
        <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center flex flex-col items-center gap-5 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none"></div>
            
            <div className="relative flex items-center justify-center my-2">
              <div className="absolute w-24 h-24 bg-emerald-500/30 rounded-full animate-ping"></div>
              <img
                src={incomingCall.callerAvatar}
                alt={incomingCall.callerName}
                className="relative w-20 h-20 rounded-full object-cover border-4 border-heritage-gold shadow-2xl z-10"
              />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Incoming HD Video Call
              </span>
              <h3 className="text-white font-bold text-xl mt-3">{incomingCall.callerName}</h3>
              <p className="text-xs text-slate-400 mt-1">is inviting you to a live video call</p>
            </div>

            <div className="flex items-center justify-center gap-4 w-full mt-2">
              {/* Decline Button */}
              <button
                onClick={rejectIncomingCall}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">call_end</span>
                Decline
              </button>

              {/* Accept Button */}
              <button
                onClick={acceptIncomingCall}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-2xl shadow-lg shadow-emerald-600/40 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer animate-bounce"
              >
                <span className="material-symbols-outlined text-[20px]">call</span>
                Accept
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smooth Offline / Unreachable Notice Modal */}
      {offlineModal.isOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center flex flex-col items-center gap-4 shadow-2xl border border-slate-100 relative overflow-hidden animate-fade-in">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-deep-maroon via-heritage-gold to-deep-maroon"></div>

            {/* Avatar & Offline Badge */}
            <div className="relative mt-2">
              <img
                src={offlineModal.chat?.image || 'https://www.w3schools.com/howto/img_avatar2.png'}
                alt={offlineModal.chat?.name || 'Member'}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg bg-slate-100"
              />
              <div 
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-slate-500 border-2 border-white flex items-center justify-center text-white shadow-sm"
                title="Offline"
              >
                <span className="material-symbols-outlined text-[14px]">videocam_off</span>
              </div>
            </div>

            {/* Title & Info */}
            <div className="w-full">
              <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full mb-2">
                {offlineModal.reason === 'unreachable' ? 'Member Unavailable' : 'Member is Offline'}
              </span>
              <h3 className="text-base font-extrabold text-charcoal-text">
                {offlineModal.chat?.name || 'Member'} is Currently Offline
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed px-1">
                {offlineModal.reason === 'unreachable'
                  ? `${offlineModal.chat?.name || 'Member'} couldn't be reached right now. Leave a chat message so they can connect with you as soon as they are back!`
                  : `Video calling requires both members to be online simultaneously. Leave a message now so they can reply or schedule a call when they log in!`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 w-full mt-1">
              <button
                onClick={() => {
                  const chatName = offlineModal.chat?.name || 'there';
                  setOfflineModal({ isOpen: false, chat: null, reason: 'offline' });
                  setInput((prev) => prev ? prev : `Hi ${chatName}, let me know when you're available for a video call!`);
                  setTimeout(() => {
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                    }
                  }, 100);
                }}
                className="w-full bg-deep-maroon hover:bg-deep-maroon/90 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">chat</span>
                Leave a Chat Message
              </button>

              <button
                onClick={() => setOfflineModal({ isOpen: false, chat: null, reason: 'offline' })}
                className="w-full py-2 text-slate-400 hover:text-slate-600 font-semibold text-xs transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
