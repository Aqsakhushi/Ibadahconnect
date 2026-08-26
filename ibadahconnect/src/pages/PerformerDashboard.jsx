import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { FaTasks, FaSignOutAlt, FaCheckCircle, FaUserCircle, FaVideo, FaHistory, FaStar, FaRegComment, FaCog, FaWallet, FaCommentDots, FaSearch, FaBell, FaPaperPlane, FaTimesCircle, FaCheck, FaUserTag, FaMoneyBillWave, FaPrayingHands } from 'react-icons/fa';

const PerformerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [profilePic, setProfilePic] = useState(localStorage.getItem('performerPic') || '');
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState('tasks');
  const [searchQuery, setSearchQuery] = useState('');

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'Admin', text: 'Assalamu Alaikum! Welcome to IbadahConnect Performer Portal.' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await API.get('/orders/all'); 
        setAllOrders(res.data);
      } catch (err) {
        console.log("Error fetching tasks");
      }
    };
    fetchTasks();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  // Task Accept karne ka function (With DB Update)
  const handleAcceptTask = async (orderId) => {
    try {
      await API.put(`/orders/accept-task/${orderId}`, { performerId: user.id });
      const res = await API.get('/orders/all');
      setAllOrders(res.data);
      alert("Task Accepted! It is now assigned to you.");
    } catch (err) {
      alert(err.response?.data?.message || "Error accepting task.");
    }
  };

  const handleUpdateMilestone = async (orderId, milestoneIndex) => {
    const proofUrl = window.prompt("Enter Video/Photo Proof Link (YouTube, Drive, etc.):");
    if (proofUrl !== null) {
      setLoading(true);
      try {
        await API.put(`/orders/update-milestone/${orderId}`, { milestoneIndex, proofUrl });
        const res = await API.get('/orders/all');
        setAllOrders(res.data);
        alert("Milestone updated successfully!");
      } catch (err) {
        alert("Error updating milestone.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setChatMessages([...chatMessages, { sender: 'Me', text: newMessage }]);
    setNewMessage('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, { sender: 'Admin', text: 'Noted. JazakAllah Khair.' }]);
    }, 1500);
  };

  // Filter Logic: Sirf us performer ka active task
  const myActiveTask = allOrders.find(o => o.status === 'In Progress' && o.performer === user.id);
  const newRequests = allOrders.filter(o => o.status === 'Pending');
  const completedTasks = allOrders.filter(o => o.status === 'Completed');
  
  const isBusy = !!myActiveTask; // Agar active task hai toh busy hai

  const menuItems = [
    { id: 'tasks', icon: <FaTasks />, label: 'Dashboard' },
    { id: 'history', icon: <FaHistory />, label: 'History' },
    { id: 'feedbacks', icon: <FaRegComment />, label: 'Feedbacks' },
    { id: 'earnings', icon: <FaWallet />, label: 'Earnings' },
    { id: 'settings', icon: <FaCog />, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-800 font-outfit pb-20 md:pb-0">
      
      <header className="bg-[#1B5E20] text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 flex-shrink-0">
            <svg className="w-8 h-8 text-accent" viewBox="0 0 100 100" fill="currentColor">
              <polygon points="50,5 61,35 95,35 68,55 79,90 50,70 21,90 32,55 5,35 39,35" stroke="#D4AF37" strokeWidth="5"/>
              <path d="M35 70 Q50 35 65 70 Z" fill="#D4AF37" />
            </svg>
            <h1 className="text-xl font-bold tracking-wide hidden md:block">Performer Portal</h1>
          </div>

          <div className="relative flex-1 max-w-md hidden md:block">
            <input 
              type="text" 
              placeholder="Search active tasks..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/10 text-white placeholder-white/70 focus:outline-none focus:bg-white/20 text-sm"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="relative text-lg hover:bg-white/10 p-2 rounded-lg">
              <FaBell />
              {!isBusy && newRequests.length > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#1B5E20] text-[10px] flex items-center justify-center font-bold">{newRequests.length}</span>}
            </button>
            <button onClick={() => setIsChatOpen(true)} className="text-sm font-semibold hover:bg-white/10 px-3 py-2 rounded-lg hidden md:flex items-center gap-2">
              <FaCommentDots /> Live Chat
            </button>
            <button onClick={handleLogout} className="text-sm font-semibold hover:bg-white/10 px-3 py-2 rounded-lg flex items-center gap-2">
              <FaSignOutAlt /> <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 py-6 px-4">
        
        {/* Left Sidebar */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-20">
            {/* Profile Cover Image */}
            <div className="h-28 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=400&auto=format&fit=crop')" }}></div>
            <div className="p-4 flex flex-col items-center -mt-12">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-4xl border-4 border-white shadow-md">
                  <FaUserCircle />
                </div>
              )}
              <h2 className="text-lg font-bold text-gray-900 mt-3 text-center">{user?.firstName} {user?.lastName}</h2>
              
              {/* Status Indicator (Available / Busy) */}
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mt-2 ${isBusy ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                <span className={`w-2 h-2 rounded-full ${isBusy ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></span>
                {isBusy ? 'Busy with Task' : 'Available for Tasks'}
              </div>
            </div>
            
            <nav className="p-4 border-t border-gray-100 space-y-1 mt-2">
              {menuItems.map(item => (
                <button 
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                    activeTab === item.id ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.icon} {item.label}
                  {item.id === 'tasks' && newRequests.length > 0 && !isBusy && (
                    <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{newRequests.length}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Middle Content */}
        <main className="lg:col-span-6 space-y-6">
          
          {activeTab === 'tasks' && (
            <>
              {/* Welcome Banner */}
              <div className="relative rounded-xl overflow-hidden h-32 flex items-center p-6 bg-gradient-to-r from-[#1B5E20] to-[#0a1a14] shadow-md">
                <div className="relative z-10">
                  <h2 className="text-2xl font-extrabold text-white">Assalamu Alaikum, {user?.firstName}!</h2>
                  <p className="text-white/80 text-sm mt-1">{isBusy ? "You have an active task in progress." : "You are available. Check new requests below."}</p>
                </div>
                <FaPrayingHands className="absolute right-4 bottom-2 text-white/10 text-8xl" />
              </div>

              {/* My Active Task Section (If assigned) */}
              {isBusy && myActiveTask && (
                <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200">
                  <div className="p-4 border-b border-gray-100 bg-blue-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2"><FaTasks /> Your Active Task</h3>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{myActiveTask.serviceType} for {myActiveTask.recipientName}</h4>
                        <p className="text-sm text-gray-500">Sponsor: {myActiveTask.sponsor?.firstName} {myActiveTask.sponsor?.lastName}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">In Progress</span>
                    </div>
                    <div className="space-y-2">
                      {myActiveTask.milestones.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${m.isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                              {m.isCompleted ? '✓' : idx + 1}
                            </span>
                            <p className={`font-bold text-sm ${m.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{m.step}</p>
                          </div>
                          {!m.isCompleted && (
                            <button onClick={() => handleUpdateMilestone(myActiveTask._id, idx)} className="bg-[#1B5E20] text-white font-bold px-3 py-1.5 rounded-lg text-xs">Mark Complete</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* New Requests Section */}
              {!isBusy && newRequests.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-red-200">
                  <div className="p-4 border-b border-gray-100 bg-red-50 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-red-600 flex items-center gap-2"><FaBell /> New Task Requests ({newRequests.length})</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {newRequests.map(order => (
                      <div key={order._id} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        {/* Full Details of Request */}
                        <div className="space-y-1">
                          <h4 className="text-lg font-bold text-gray-900">{order.serviceType}</h4>
                          <p className="text-sm text-gray-500 flex items-center gap-2"><FaUserTag /> Recipient: {order.recipientName} ({order.recipientRelation || 'N/A'})</p>
                          <p className="text-sm text-gray-500">Sponsor: {order.sponsor?.firstName} {order.sponsor?.lastName}</p>
                          <p className="text-sm text-green-600 font-bold mt-2 flex items-center gap-2"><FaMoneyBillWave /> Your Earning: PKR {Math.round(order.price * 0.85).toLocaleString()}</p>
                        </div>
                        <button 
                          onClick={() => handleAcceptTask(order._id)}
                          className="bg-primary text-white font-bold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                        >
                          <FaCheck /> Accept Task
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!isBusy && newRequests.length === 0 && (
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                    <FaTasks className="text-5xl text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">No new requests at the moment. Please check back later.</p>
                 </div>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-100"><h3 className="text-lg font-bold text-gray-800">Task History</h3></div>
              <div className="divide-y divide-gray-100">
                {completedTasks.length === 0 ? <div className="p-12 text-center text-gray-400">No completed tasks yet.</div> : completedTasks.map(order => (
                  <div key={order._id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div><h4 className="font-bold text-gray-900">{order.serviceType} for {order.recipientName}</h4><p className="text-xs text-gray-500">Completed on: {new Date(order.updatedAt).toLocaleDateString()}</p></div>
                    <span className="text-green-600 font-bold text-sm">PKR {Math.round(order.price * 0.85).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'earnings' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-[#1B5E20] to-[#0a1a14] p-6 rounded-xl shadow-sm text-white">
                <p className="text-sm opacity-80">Total Available Balance</p>
                <h3 className="text-4xl font-extrabold mt-2">PKR 120,000</h3>
                <button className="mt-4 bg-accent text-dark font-bold px-6 py-2 rounded-lg text-sm hover:bg-yellow-500">Withdraw Funds</button>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm border-b pb-2"><span className="text-gray-600">Task Payment - Umrah Badal</span><span className="font-bold text-green-600">+ PKR 42,500</span></div>
                  <div className="flex justify-between text-sm border-b pb-2"><span className="text-gray-600">Platform Fee</span><span className="font-bold text-red-500">- PKR 7,500</span></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'feedbacks' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Sponsor Feedbacks</h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex justify-between mb-2"><h4 className="font-bold text-gray-900">Aqsa Khan</h4><div className="flex text-yellow-400 text-sm"><FaStar /><FaStar /><FaStar /><FaStar /><FaStar /></div></div>
                  <p className="text-sm text-gray-600">JazakAllah Khair! The video proof gave me immense peace. Highly recommended.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6">Profile Settings</h3>
              <div className="space-y-4">
                <div><label className="block text-xs font-bold text-gray-500 mb-1">First Name</label><input type="text" defaultValue={user?.firstName} className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" /></div>
                <div><label className="block text-xs font-bold text-gray-500 mb-1">Email</label><input type="email" defaultValue={user?.email} className="w-full px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none" /></div>
                <button className="bg-primary text-white font-bold px-6 py-2 rounded-lg hover:bg-primary/90">Save Changes</button>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-20">
            <h3 className="text-md font-bold text-gray-800 mb-4 border-b pb-2">Performer Stats</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center"><span className="text-gray-500">Total Earnings</span><span className="font-bold text-green-600">PKR 120,000</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Tasks Completed</span><span className="font-bold text-gray-800">{completedTasks.length}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">Response Rate</span><span className="font-bold text-gray-800">100%</span></div>
            </div>
            <button className="w-full mt-4 bg-gray-100 text-gray-700 font-bold py-2 rounded-lg hover:bg-gray-200 text-xs">View Detailed Report</button>
          </div>
        </aside>
      </div>

      {/* Live Chat Popup UI */}
      {isChatOpen && (
        <div className="fixed bottom-0 right-0 m-4 w-full max-w-sm bg-white rounded-t-2xl shadow-2xl border border-gray-200 z-50 flex flex-col" style={{ height: '500px' }}>
          <div className="bg-primary text-white p-4 flex justify-between items-center rounded-t-2xl">
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div><h3 className="font-bold">Live Support / Admin</h3></div>
            <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><FaTimesCircle /></button>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'Me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${msg.sender === 'Me' ? 'bg-primary text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'}`}>{msg.text}</div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 flex gap-2 bg-white rounded-b-2xl">
            <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 px-4 py-2 rounded-full bg-gray-100 focus:outline-none text-sm" />
            <button type="submit" className="bg-accent text-dark p-2.5 rounded-full hover:bg-yellow-500 transition-colors w-10 h-10 flex items-center justify-center"><FaPaperPlane className="text-sm" /></button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PerformerDashboard;