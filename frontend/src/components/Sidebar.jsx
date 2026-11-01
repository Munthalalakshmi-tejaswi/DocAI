import React, { useState } from "react";
import {
  Plus,
  Search,
  FileText,
  MessageSquare,
  ChevronsLeft,
  ChevronRight,
  Sparkles,
  ChevronDown,
} from "lucide-react";

export default function Sidebar({
  filename,
  onNewDocument,
  searchHistory = [],
  onSelectHistory,
  collapsed,
  onToggleCollapse,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const defaultHistoryToday = [
    "what are the biggest risk in plan?",
    "write a LinkedIn post about this...",
    "who will approve the final budget.",
  ];

  const defaultHistory7Days = [
    "Scan & Pay Shopping",
    "who is Michael L. Green and what...",
    "what is SOPHY's main focus as a...",
    "Write summary of this documents.",
    "What is main focus as a commerc...",
  ];

  const defaultHistory30Days = [
    "write description for this docum...",
    "what are the biggest risk in plan?",
  ];

  // Merge user history into Today
  const todayList = [
    ...searchHistory.filter((h) => !defaultHistoryToday.includes(h)),
    ...defaultHistoryToday,
  ].filter((item) => item.toLowerCase().includes(searchTerm.toLowerCase()));

  const sevenDaysList = defaultHistory7Days.filter((item) =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const thirtyDaysList = defaultHistory30Days.filter((item) =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-logo-circle">
            <div className="swirl-inner" />
          </div>
          <span className="brand-title">TalkPDF</span>
        </div>
        <button
          className="collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronsLeft size={18} />
        </button>
      </div>

      {/* Primary Action Button */}
      <div className="sidebar-action-wrap">
        <button className="new-doc-btn" onClick={onNewDocument}>
          <Plus size={18} />
          <span>New Document</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="sidebar-search-wrap">
        <div className="sidebar-search-box">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Active Document Card */}
      <div className="active-doc-section">
        {filename ? (
          <div className="active-doc-card">
            <button className="doc-nav-btn prev">
              <ChevronsLeft size={14} />
            </button>
            <div className="doc-card-icon">
              <FileText size={18} />
            </div>
            <div className="doc-card-info">
              <span className="doc-card-name" title={filename}>
                {filename.length > 15 ? filename.slice(0, 14) + "..." : filename}
              </span>
              <span className="doc-card-date">12 Mar 2024</span>
            </div>
            <button className="doc-nav-btn next">
              <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <div className="active-doc-card empty" onClick={onNewDocument}>
            <div className="doc-card-icon empty">
              <Plus size={16} />
            </div>
            <div className="doc-card-info">
              <span className="doc-card-name">No active document</span>
              <span className="doc-card-date">Click to upload</span>
            </div>
          </div>
        )}
      </div>

      {/* Search History Sections */}
      <div className="sidebar-history-scroll">
        <div className="history-main-label">Search History</div>

        {/* Today */}
        {todayList.length > 0 && (
          <div className="history-group">
            <div className="history-group-title">Today</div>
            <div className="history-items">
              {todayList.map((item, idx) => (
                <button
                  key={`today-${idx}`}
                  className="history-item"
                  onClick={() => onSelectHistory(item)}
                >
                  <MessageSquare size={14} className="history-icon" />
                  <span className="history-text">{item}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Previous 7 Days */}
        {sevenDaysList.length > 0 && (
          <div className="history-group">
            <div className="history-group-title">Previous 7 Days</div>
            <div className="history-items">
              {sevenDaysList.map((item, idx) => (
                <button
                  key={`7d-${idx}`}
                  className="history-item"
                  onClick={() => onSelectHistory(item)}
                >
                  <MessageSquare size={14} className="history-icon" />
                  <span className="history-text">{item}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Previous 30 Days */}
        {thirtyDaysList.length > 0 && (
          <div className="history-group">
            <div className="history-group-title">Previous 30 Days</div>
            <div className="history-items">
              {thirtyDaysList.map((item, idx) => (
                <button
                  key={`30d-${idx}`}
                  className="history-item"
                  onClick={() => onSelectHistory(item)}
                >
                  <MessageSquare size={14} className="history-icon" />
                  <span className="history-text">{item}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
