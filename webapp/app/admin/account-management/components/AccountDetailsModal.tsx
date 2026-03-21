"use client";

import { useState, useEffect } from "react";
import { User } from "../../../../utils/admin-actions";
import { X, Mail, Lock, Shield, Trash2, Save, Eye, EyeOff } from "lucide-react";

export default function AccountDetailsModal({
  visible,
  user,
  onClose,
  onSave,
  onDelete,
}: {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (data: { email: string; password?: string; role: string; authenticated?: boolean }) => void;
  onDelete?: (id: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("steward");
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
      setRole(user.role);
      setAuthenticated(user.authenticated);
    } else {
      setEmail("");
      setRole("steward");
      setAuthenticated(false);
    }
    setPassword("");
    setConfirmPassword("");
  }, [user]);

  const handleSaveClick = () => {
    if (!email.trim()) {
      alert("Email is required.");
      return;
    }

    if (password && password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (password && password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    const payload: any = { email, role, authenticated };
    if (password) payload.password = password;

    onSave(payload);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-[500px] max-w-[95vw] border-2 border-[#E4EBE4] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="w-6 h-6" />
              {user ? "Edit User Account" : "Add New User"}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-[#254431] mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#356B43]" />
              Email Address
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-[#F7F2EA] border-2 border-[#86A98A] rounded-xl text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] transition-all"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-[#254431] mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#356B43]" />
              User Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRole("steward")}
                className={`px-4 py-3 rounded-xl font-semibold transition-all border-2 ${
                  role === "steward"
                    ? "bg-[#2196f3] text-white border-[#2196f3] shadow-md"
                    : "bg-[#F7F2EA] text-[#254431] border-[#86A98A] hover:border-[#2196f3]"
                }`}
              >
                Steward
              </button>
              <button
                onClick={() => setRole("admin")}
                className={`px-4 py-3 rounded-xl font-semibold transition-all border-2 ${
                  role === "admin"
                    ? "bg-[#356B43] text-white border-[#356B43] shadow-md"
                    : "bg-[#F7F2EA] text-[#254431] border-[#86A98A] hover:border-[#356B43]"
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Approval Status */}
          {user && (
            <div>
              <label className="block text-sm font-semibold text-[#254431] mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#356B43]" />
                Approval Status
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setAuthenticated(true)}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all border-2 ${
                    authenticated
                      ? 'bg-[#4caf50] text-white border-[#4caf50] shadow-md'
                      : 'bg-[#F7F2EA] text-[#254431] border-[#86A98A] hover:border-[#4caf50]'
                  }`}
                >
                  ✓ Approved
                </button>
                <button
                  onClick={() => setAuthenticated(false)}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all border-2 ${
                    !authenticated
                      ? 'bg-[#ff9800] text-white border-[#ff9800] shadow-md'
                      : 'bg-[#F7F2EA] text-[#254431] border-[#86A98A] hover:border-[#ff9800]'
                  }`}
                >
                  ⏳ Pending
                </button>
              </div>
            </div>
          )}

          {/* Password Field */}
          <div>
            <label className="block text-sm font-semibold text-[#254431] mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#356B43]" />
              Password {user && <span className="text-[#7A8075] text-xs font-normal">(leave blank to keep existing)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-3 pr-12 bg-[#F7F2EA] border-2 border-[#86A98A] rounded-xl text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] transition-all"
                placeholder={user ? "Leave blank to keep current" : "Enter password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8075] hover:text-[#356B43] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-semibold text-[#254431] mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#356B43]" />
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="w-full px-4 py-3 pr-12 bg-[#F7F2EA] border-2 border-[#86A98A] rounded-xl text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] transition-all"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8075] hover:text-[#356B43] transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <div className="flex gap-3">
            <button
              className="px-6 py-3 bg-[#E4EBE4] text-[#254431] rounded-xl font-semibold hover:bg-[#d4d4d4] transition-all"
              onClick={onClose}
            >
              Cancel
            </button>

            {user && onDelete && (
              <button
                className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all flex items-center gap-2"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${user.email}?`)) {
                    onDelete(user.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>

          <button
            className="px-6 py-3 bg-gradient-to-r from-[#356B43] to-[#254431] text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
            onClick={handleSaveClick}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}