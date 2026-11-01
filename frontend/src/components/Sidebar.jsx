import React, { useState } from "react";
import {
  Plus,
  Search,
  FileText,
  MessageSquare,
  ChevronsLeft,
  ChevronRight,
  Trash2,
  X,
} from "lucide-react";

export default function Sidebar({
  filename,
  uploadDate,
  onNewDocument,
  searchHistory = [],
  onSelectHistory,
  onDeleteHistoryItem,
  onClearHistory,
  collapsed,
  onToggleCollapse,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter history items by search box
  const filtered = searchHistory.filter((item) =>
    (typeof item === "string" ? item : item.query)
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Group items into Today, Past 7 Days, Past 30 Days dynamically
  const now = new Date();
  const todayItems = [];
  const past7DaysItems = [];
  const past30DaysItems = [];

  filtered.forEach((item) => {
    const queryText = typeof item === "string" ? item : item.query;
    const itemDate = item.timestamp ? new Date(item.timestamp) : new Date();
    const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);

    const record = {
      id: item.id || queryText,
      query: queryText,
      timestamp: item.timestamp,
    };

    if (diffDays < 1) {
      todayItems.push(record);
    } else if (diffDays < 7) {
      past7DaysItems.push(record);
    } else {
      past30DaysItems.push(record);
    }
  });

  return (
    <aside className={`app-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-logo-circle">
            <div className="swirl-inner" />
          </div>
          <span className="brand-title">DocAI</span>
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
            placeholder="Search your questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear-btn" onClick={() => setSearchTerm("")}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Active Document Card */}
      <div className="active-doc-section">
        {filename ? (
          <div className="active-doc-card">
            <div className="doc-card-icon">
              <FileText size={18} />
            </div>
            <div className="doc-card-info">
              <span className="doc-card-name" title={filename}>
                {filename}
              </span>
              <span className="doc-card-date">
                {uploadDate || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>
          </div>
        ) : (
          <div className="active-doc-card empty" onClick={onNewDocument}>
            <div className="doc-card-icon empty">
              <Plus size={16} />
            </div>
            <div className="doc-card-info">
              <span className="doc-card-name">No active document</span>
              <span className="doc-card-date">Click to upload PDF</span>
            </div>
          </div>
        )}
      </div>

      {/* Search History Section (Real User Data Only) */}
      <div className="sidebar-history-scroll">
        <div className="history-header-row">
          <span className="history-main-label">Search History</span>
          {searchHistory.length > 0 && (
            <button
              className="history-clear-btn"
              onClick={onClearHistory}
              title="Clear all question history"
            >
              Clear
            </button>
          )}
        </div>

        {searchHistory.length === 0 ? (
          <div className="history-empty-box">
            <MessageSquare size={20} className="history-empty-icon" />
            <span className="history-empty-title">No search history yet</span>
            <small className="history-empty-subtitle">
              Questions you ask will appear here
            </small>
          </div>
        ) : filtered.length === 0 ? (
          <div className="history-empty-box">
            <small>No matches found for "{searchTerm}"</small>
          </div>
        ) : (
          <>
            {/* Today */}
            {todayItems.length > 0 && (
              <div className="history-group">
                <div className="history-group-title">Today</div>
                <div className="history-items">
                  {todayItems.map((item) => (
                    <div key={item.id} className="history-item-wrapper">
                      <button
                        className="history-item"
                        onClick={() => onSelectHistory(item.query)}
                        title={item.query}
                      >
                        <MessageSquare size={14} className="history-icon" />
                        <span className="history-text">{item.query}</span>
                      </button>
                      {onDeleteHistoryItem && (
                        <button
                          className="history-del-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteHistoryItem(item.id);
                          }}
                          title="Delete"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Previous 7 Days */}
            {past7DaysItems.length > 0 && (
              <div className="history-group">
                <div className="history-group-title">Previous 7 Days</div>
                <div className="history-items">
                  {past7DaysItems.map((item) => (
                    <div key={item.id} className="history-item-wrapper">
                      <button
                        className="history-item"
                        onClick={() => onSelectHistory(item.query)}
                        title={item.query}
                      >
                        <MessageSquare size={14} className="history-icon" />
                        <span className="history-text">{item.query}</span>
                      </button>
                      {onDeleteHistoryItem && (
                        <button
                          className="history-del-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteHistoryItem(item.id);
                          }}
                          title="Delete"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Previous 30 Days */}
            {past30DaysItems.length > 0 && (
              <div className="history-group">
                <div className="history-group-title">Previous 30 Days</div>
                <div className="history-items">
                  {past30DaysItems.map((item) => (
                    <div key={item.id} className="history-item-wrapper">
                      <button
                        className="history-item"
                        onClick={() => onSelectHistory(item.query)}
                        title={item.query}
                      >
                        <MessageSquare size={14} className="history-icon" />
                        <span className="history-text">{item.query}</span>
                      </button>
                      {onDeleteHistoryItem && (
                        <button
                          className="history-del-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteHistoryItem(item.id);
                          }}
                          title="Delete"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
