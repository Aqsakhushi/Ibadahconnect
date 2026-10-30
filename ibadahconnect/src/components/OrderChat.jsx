import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPaperPlane, FaComments } from 'react-icons/fa';
import API from '../api';
import { getCurrentUser } from '../utils/auth';
import toast from 'react-hot-toast';

export default function OrderChat({ orderId, orderCode, onClose }) {
  const current = getCurrentUser();
  const myId = String(current?.id || current?._id || '');
  const myName = `${current?.firstName || ''} ${current?.lastName || ''}`.trim() || 'Me';

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bodyRef = useRef(null);

  const load = async () => {
    try {
      const res = await API.get(`/chat/${orderId}`);
      setMessages(Array.isArray(res.data?.messages) ? res.data.messages : []);
    } catch (e) {
      console.error('Chat load failed:', e.message);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 4000); // live polling every 4s
    return () => clearInterval(t);
  }, [orderId]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    setText('');
    try {
      await API.post('/chat/send', {
        orderId,
        senderId: myId,
        senderName: myName,
        senderRole: 'Sponsor',
        text: t,
      });
      await load();
    } catch (e) {
      toast.error('Message could not be sent. Please try again.');
      setText(t);
    } finally {
      setSending(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const fmtTime = (d) => {
    try {
      return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-end p-3 sm:p-6 pointer-events-none">
      <div className="pointer-events-auto w-full sm:w-[380px] h-[70vh] sm:h-[520px] max-h-[600px] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-950 text-white px-4 py-3.5 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full bg-amber-400/90 text-emerald-950 flex items-center justify-center shrink-0"><FaComments /></div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight">Performer Chat</p>
            {orderCode ? <p className="text-[10px] text-emerald-200/70 font-mono truncate">{orderCode}</p> : null}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"><FaTimes /></button>
        </div>

        {/* Messages */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 bg-[#f5f7f6]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <FaComments className="text-4xl text-gray-200 mb-3" />
              <p className="text-xs text-gray-500 font-semibold">No messages yet.</p>
              <p className="text-[11px] text-gray-400 mt-1">Say Salam and ask your performer about the progress of your Ibadah.</p>
            </div>
          ) : (
            messages.map((m) => {
              const mine = String(m.senderId) === myId;
              return (
                <div key={m._id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] px-3.5 py-2 text-sm shadow-sm ${mine ? 'bg-emerald-800 text-white rounded-2xl rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-sm'}`}>
                    {!mine && <p className="text-[10px] font-bold text-emerald-700 mb-0.5">{m.senderName}{m.senderRole ? ` · ${m.senderRole}` : ''}</p>}
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  </div>
                  <p className="text-[9px] text-gray-400 mt-0.5 px-1">{fmtTime(m.createdAt)}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 p-3 flex items-center gap-2 shrink-0 bg-white">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder="Type a message..."
            className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
          <button onClick={send} disabled={sending || !text.trim()}
            className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-900 transition disabled:opacity-40 shrink-0">
            <FaPaperPlane className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}