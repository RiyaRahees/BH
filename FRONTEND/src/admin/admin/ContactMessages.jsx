import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { useToast } from '../../context/ToastContext';

export default function ContactMessages() {
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedMessage, setSelectedMessage] = useState(null);

  const [replyText, setReplyText] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const isSuperAdmin = localStorage.getItem('adminRole') === 'superadmin';
      const adminFranchise = !isSuperAdmin ? localStorage.getItem('adminFranchise') : null;
      
      let url = '/admin/contact-messages';
      if (adminFranchise && adminFranchise !== 'HEAD_OFFICE' && adminFranchise !== 'null' && adminFranchise !== 'undefined' && adminFranchise !== 'All' && adminFranchise !== 'ALL') {
        url += `?franchise_id=${adminFranchise}`;
      }
      
      const response = await axiosInstance.get(url);
      setMessages(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching general enquiries:', err);
      setError('Failed to load general enquiries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleOpenModal = (msg) => {
    setSelectedMessage(msg);
    setReplyText(msg.admin_reply || '');
  };

  const handleUpdateStatus = async (id, newStatus, customReply = null) => {
    setUpdatingId(id);
    try {
      const payload = {
        status: newStatus,
        adminReply: customReply !== null ? customReply : (replyText || undefined)
      };

      const response = await axiosInstance.put(`/admin/contact-messages/${id}/status`, payload);
      
      setMessages(prev =>
        prev.map(msg => (msg.id === id ? { 
          ...msg, 
          status: newStatus, 
          admin_reply: customReply !== null ? customReply : replyText,
          admin_responded_at: new Date().toISOString()
        } : msg))
      );

      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(prev => ({ 
          ...prev, 
          status: newStatus,
          admin_reply: customReply !== null ? customReply : replyText,
          admin_responded_at: new Date().toISOString()
        }));
      }

      toast.success(response.data?.message || `Enquiry marked as ${newStatus}. Email sent to user.`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this general enquiry?')) return;
    try {
      await axiosInstance.delete(`/admin/contact-messages/${id}`);
      setMessages(prev => prev.filter(msg => msg.id !== id));
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null);
      }
      toast.success('Enquiry deleted successfully!');
    } catch (err) {
      console.error('Error deleting enquiry:', err);
      toast.error('Failed to delete enquiry.');
    }
  };

  // Strictly filter out franchise partnership requests - only show general enquiries
  const generalEnquiries = messages.filter(msg => {
    const sub = (msg.subject || '').toLowerCase();
    const body = (msg.message || '').toLowerCase();
    return !sub.includes('franchise') && !body.includes('[franchise partnership request');
  });

  // Filter enquiries by search query and status
  const filteredMessages = generalEnquiries.filter(msg => {
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      msg.name?.toLowerCase().includes(query) ||
      msg.email?.toLowerCase().includes(query) ||
      msg.phone?.toLowerCase().includes(query) ||
      msg.subject?.toLowerCase().includes(query) ||
      msg.message?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'ALL' || msg.status?.toUpperCase() === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const pendingCount = generalEnquiries.filter(m => m.status?.toUpperCase() === 'PENDING').length;
  const resolvedCount = generalEnquiries.filter(m => m.status?.toUpperCase() === 'RESOLVED').length;

  return (
    <div className="space-y-6 text-left w-full max-w-full overflow-x-hidden">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-deep-maroon">mark_email_unread</span>
            General Enquiries
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Customer enquiries, support requests, and feedback submitted through the Contact Us page.
          </p>
        </div>

        {/* Stats summary badges */}
        <div className="flex items-center gap-2">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Pending: {pendingCount}
          </div>
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Resolved: {resolvedCount}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, subject..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 font-medium shrink-0">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-700 bg-white focus:outline-none focus:border-deep-maroon cursor-pointer"
          >
            <option value="ALL">All Statuses ({generalEnquiries.length})</option>
            <option value="PENDING">Pending ({pendingCount})</option>
            <option value="RESOLVED">Resolved ({resolvedCount})</option>
          </select>

          <button
            onClick={fetchMessages}
            title="Refresh list"
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg leading-none">refresh</span>
          </button>
        </div>
      </div>

      {/* Content Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Loading enquiries...</div>
        ) : error ? (
          <div className="py-12 text-center text-rose-500 text-sm">{error}</div>
        ) : filteredMessages.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            No general enquiries found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/60 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Name & Contact</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredMessages.map((msg) => {
                  const isPending = msg.status?.toUpperCase() === 'PENDING';
                  const isUpdating = updatingId === msg.id;

                  return (
                    <tr key={msg.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(msg.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800">{msg.name}</div>
                        <div className="text-xs text-slate-500">{msg.email}</div>
                        {msg.phone && <div className="text-[11px] text-slate-400">{msg.phone}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 capitalize">
                        {msg.subject}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                            isPending
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isPending ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          ></span>
                          {msg.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(msg)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-deep-maroon hover:text-white text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                            title="Delete enquiry"
                          >
                            <span className="material-symbols-outlined text-lg leading-none">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details & Action View Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 text-left animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-deep-maroon to-primary p-5 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-heritage-gold uppercase">
                  GENERAL ENQUIRY DETAILS • TICKET #{selectedMessage.id}
                </span>
                <h3 className="text-lg font-bold mt-0.5">{selectedMessage.subject}</h3>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 text-xs sm:text-sm overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Full Name</label>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedMessage.name}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Date Received</label>
                  <p className="font-semibold text-slate-700 mt-0.5">
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Email Address</label>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedMessage.email}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Phone Number</label>
                  <p className="font-semibold text-slate-700 mt-0.5">
                    {selectedMessage.phone || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">
                  Customer Enquiry Message
                </label>
                <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap min-h-[80px]">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Admin Action & Response Composer */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold uppercase text-deep-maroon flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">outgoing_mail</span>
                    Official Support Response / Action Note (Sent to User Email)
                  </label>
                  {selectedMessage.admin_responded_at && (
                    <span className="text-[10px] text-slate-400">
                      Last Sent: {new Date(selectedMessage.admin_responded_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official reply or resolution message to be emailed to the user..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl p-3 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-deep-maroon/20 focus:border-deep-maroon resize-none bg-rose-50/10 placeholder-slate-400"
                />
                <p className="text-[10.5px] text-slate-400 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-emerald-600">mark_email_read</span>
                  Saving or resolving will automatically email this response and action result to <strong>{selectedMessage.email}</strong>.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {selectedMessage.status?.toUpperCase() === 'PENDING' ? (
                  <button
                    disabled={updatingId === selectedMessage.id}
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'RESOLVED')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    {updatingId === selectedMessage.id ? 'Sending Email...' : 'Resolve & Email User'}
                  </button>
                ) : (
                  <button
                    disabled={updatingId === selectedMessage.id}
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'RESOLVED')}
                    className="px-4 py-2 bg-deep-maroon hover:bg-primary text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">send</span>
                    {updatingId === selectedMessage.id ? 'Sending...' : 'Send Updated Email'}
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
