import React, { useState, useEffect } from "react";
import { X, User, Mail, Shield, Check } from "lucide-react";

export default function ProfileModal({ isOpen, onClose, profile, onSaveProfile }) {
  const [name, setName] = useState(profile?.name || "User");
  const [email, setEmail] = useState(profile?.email || "");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(profile?.name || "User");
      setEmail(profile?.email || "");
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const updated = {
      name: name.trim() || "User",
      email: email.trim(),
    };
    onSaveProfile(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const getInitials = (n) => {
    return (n || "User")
      .trim()
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>User Profile</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="modal-body">
            {/* Avatar Preview */}
            <div className="profile-preview-card">
              <div className="profile-avatar-large">
                <span>{getInitials(name || "User")}</span>
              </div>
              <div className="profile-preview-info">
                <h4>{name || "User"}</h4>
                <p>{email || "No email set"}</p>
              </div>
            </div>

            <div className="modal-field">
              <label className="modal-label">
                <User size={14} /> Full Name
              </label>
              <input
                type="text"
                className="modal-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="modal-field">
              <label className="modal-label">
                <Mail size={14} /> Email Address
              </label>
              <input
                type="email"
                className="modal-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            {savedSuccess && (
              <div className="modal-status success">
                <Check size={16} />
                <span>Profile saved successfully!</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="modal-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-save-btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
