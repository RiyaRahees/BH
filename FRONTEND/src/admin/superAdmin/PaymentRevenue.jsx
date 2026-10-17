import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '../../context/ToastContext';

export default function PaymentRevenue() {
  const toast = useToast();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [religionFilter, setReligionFilter] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get('/admin/payments');
        setTransactions(response.data);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Failed to load transactions');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  // Calculations
  const totalRevenue = transactions
    .filter(t => t.status === 'Success')
    .reduce((sum, t) => sum + t.amount, 0);

  const activeSubsCount = transactions.filter(t => t.status === 'Success').length;

  // Filter transactions
  const filteredTxns = transactions.filter(txn => {
    const matchesSearch =
      txn.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.reference.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlan =
      planFilter === 'All' ||
      txn.packageName.toLowerCase().includes(planFilter.toLowerCase());

    const matchesReligion =
      religionFilter === 'All' ||
      (txn.userReligion && txn.userReligion.toLowerCase() === religionFilter.toLowerCase());

    const matchesStartDate = !startDate || txn.date >= startDate;
    const matchesEndDate = !endDate || txn.date <= endDate;

    return matchesSearch && matchesPlan && matchesReligion && matchesStartDate && matchesEndDate;
  });

  const handleDownloadReport = () => {
    if (filteredTxns.length === 0) {
      toast.error("No data available to download.");
      return;
    }

    const doc = new jsPDF();
    
    // Add header
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text("Payments & Revenue Report", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    // Summary info
    doc.setFontSize(10);
    doc.text(`Total Revenue: INR ${totalRevenue.toLocaleString()}`, 14, 38);
    doc.text(`Paid Subscribers: ${activeSubsCount}`, 14, 44);

    // Prepare table data
    const tableColumn = ["Txn ID", "Member", "Plan", "Amount (INR)", "Date", "Expire Date", "Status"];
    const tableRows = [];

    filteredTxns.forEach(txn => {
      const rowData = [
        txn.id,
        `${txn.userName}\n(${txn.userId})`,
        txn.packageName,
        `Rs. ${txn.amount}`,
        txn.date,
        txn.expireDate || '-',
        txn.status
      ];
      tableRows.push(rowData);
    });

    // Generate table
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [136, 19, 55], textColor: 255 }, // deep-maroon background (#881337)
    });

    // Save the PDF
    doc.save(`matrimony_revenue_report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    // overflow-x-hidden here is what stops the WHOLE PAGE from scrolling
    // sideways on mobile. Everything except the table must fit inside
    // this width, so the table's own scroller (below) is the only
    // horizontally-scrollable region on the page.
    <div className="space-y-6 text-left w-full max-w-full overflow-x-hidden">
      {/* Header section */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-deep-maroon"></span>
          Payments & Revenue
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Track financial activities, transaction logs, and membership subscription revenue.
        </p>
      </div>

      {/* Finance Stats cards grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
        {/* Card 1: Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-3 sm:p-4 shadow-xs flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-base sm:text-xl">payments</span>
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Revenue</span>
            <span className="text-sm sm:text-xl font-black text-slate-800 truncate block">₹{totalRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 2: Active Subs */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-3 sm:p-4 shadow-xs flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-heritage-gold flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-base sm:text-xl">workspace_premium</span>
          </div>
          <div className="min-w-0">
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Paid Subscribers</span>
            <span className="text-sm sm:text-xl font-black text-slate-800 truncate block">{activeSubsCount} Members</span>
          </div>
        </div>
      </div>

      {/* Control panel with filter and download */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-xs flex flex-col gap-4 text-xs font-semibold text-slate-700 w-full max-w-full">

        {/* Filters Row: stacked & full-width on mobile, inline on larger screens */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-3.5 w-full">
          {/* Search */}
          <div className="relative w-full sm:max-w-[280px]">
            <span className="material-symbols-outlined absolute left-3 top-2 text-slate-400 text-lg leading-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-surface-variant rounded-xl py-1.5 pl-10 pr-4 text-xs bg-slate-50/50 text-charcoal-text focus:outline-none focus:ring-1 focus:ring-deep-maroon placeholder-soft-gray/40"
              placeholder="Search by Txn, member, plan..."
            />
          </div>

          {/* Plan filter select */}
          <div className="flex items-center gap-1.5 w-full sm:w-fit">
            <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0">Plan:</span>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="border border-surface-variant rounded-lg py-1 px-2 bg-white text-slate-700 focus:ring-1 focus:ring-deep-maroon focus:outline-none w-full sm:w-[120px] text-[11px]"
            >
              <option value="All">All Plans</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Platinum">Platinum</option>
              <option value="Diamond">Diamond</option>
            </select>
          </div>

          {/* Religion filter select */}
          <div className="flex items-center gap-1.5 w-full sm:w-fit">
            <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0">Religion:</span>
            <select
              value={religionFilter}
              onChange={(e) => setReligionFilter(e.target.value)}
              className="border border-surface-variant rounded-lg py-1 px-2 bg-white text-slate-700 focus:ring-1 focus:ring-deep-maroon focus:outline-none w-full sm:w-[120px] text-[11px]"
            >
              <option value="All">All Religions</option>
              <option value="Hindu">Hindu</option>
              <option value="Muslim">Muslim</option>
              <option value="Christian">Christian</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Date range selection */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-fit">
            <div className="flex items-center gap-1 flex-1 sm:flex-initial min-w-0">
              <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-surface-variant rounded-lg py-1 px-1.5 w-full sm:w-[110px] min-w-0 bg-white text-slate-700 focus:ring-1 focus:ring-deep-maroon focus:outline-none text-[11px]"
              />
            </div>

            <div className="flex items-center gap-1 flex-1 sm:flex-initial min-w-0">
              <span className="text-[10px] uppercase text-slate-400 font-bold shrink-0">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-surface-variant rounded-lg py-1 px-1.5 w-full sm:w-[110px] min-w-0 bg-white text-slate-700 focus:ring-1 focus:ring-deep-maroon focus:outline-none text-[11px]"
              />
            </div>

            {/* Clear Dates option */}
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer shrink-0"
                type="button"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Download CSV button */}
        <button
          onClick={handleDownloadReport}
          className="w-full sm:w-fit px-4 py-1.5 bg-deep-maroon hover:bg-primary text-white font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm text-xs shrink-0 self-stretch sm:self-end"
        >
          <span className="material-symbols-outlined text-xs">download</span>
          Download Report
        </button>
      </div>

      {/* Transactions Table Layout */}
      {/* This is the ONLY element that should ever scroll horizontally. */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden w-full max-w-full">
        <div className="overflow-x-auto w-full max-w-full [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[1080px] text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4 font-bold text-[10px] whitespace-nowrap">Txn ID</th>
                <th className="py-3.5 px-4 font-bold text-[10px] whitespace-nowrap min-w-[150px]">Member</th>
                <th className="py-3.5 px-4 font-bold text-[10px] whitespace-nowrap">Plan Name</th>
                <th className="py-3.5 px-4 font-bold text-[10px] whitespace-nowrap">Amount</th>
                <th className="py-3.5 px-4 font-bold text-[10px] whitespace-nowrap text-center">Method</th>
                <th className="py-3.5 px-4 font-bold text-[10px] whitespace-nowrap">Date</th>
                <th className="py-3.5 px-4 font-bold text-[10px] whitespace-nowrap">Expire Date</th>
                <th className="py-3.5 px-4 font-bold text-[10px] whitespace-nowrap">Reference ID</th>
                <th className="py-3.5 px-4 font-bold text-[10px] whitespace-nowrap text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 font-semibold">
                    <span className="material-symbols-outlined text-3xl mb-1 block animate-spin">refresh</span>
                    Loading transactions...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-rose-500 font-semibold">
                    <span className="material-symbols-outlined text-3xl mb-1 block">error</span>
                    {error}
                  </td>
                </tr>
              ) : filteredTxns.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400 font-semibold">
                    <span className="material-symbols-outlined text-3xl mb-1 block">payments</span>
                    No transactions match criteria.
                  </td>
                </tr>
              ) : (
                filteredTxns.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors align-middle">
                    <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap align-middle">{txn.id}</td>
                    <td className="py-3.5 px-4 align-middle">
                      <div>
                        <p className="font-bold text-slate-800 leading-snug">{txn.userName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{txn.userId}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 align-middle font-medium">{txn.packageName}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap align-middle">₹{txn.amount.toLocaleString()}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-center align-middle">
                      <span className="inline-block px-2.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100">
                        {txn.method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 align-middle font-medium">{txn.date}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap align-middle font-medium">
                      {txn.expireDate && txn.expireDate !== 'N/A' ? (
                        <span className="font-semibold text-slate-700">{txn.expireDate}</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap align-middle">
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                        {txn.reference}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-center align-middle">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase border bg-emerald-50 border-emerald-200 text-emerald-700">
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}