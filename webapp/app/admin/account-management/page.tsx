"use client";

import { useState, useEffect } from "react";
import { getAllUsers, addUser, updateUser, deleteUser, User } from "../../../utils/admin-actions";
import AccountDetailsModal from "./components/AccountDetailsModal";
import { ArrowLeft, Search, UserPlus, Users, Filter, Mail, Shield, ChevronDown, Clock, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import AdminNavBar from "../../admin/AdminNavBar";
import ProtectedRoute from "../../../components/ProtectedRoute";
import Image from 'next/image';

export default function AccountManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [sortOption, setSortOption] = useState<string | null>(null);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const loadUsers = async () => {
    setLoading(true);
    const fetchedUsers = await getAllUsers();
    setUsers(fetchedUsers);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filter
  let displayedUsers = users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sorting + Filters
  if (sortOption === "emailAsc") {
    displayedUsers.sort((a, b) => a.email.localeCompare(b.email));
  } else if (sortOption === "emailDesc") {
    displayedUsers.sort((a, b) => b.email.localeCompare(a.email));
  } else if (sortOption === "stewardOnly") {
    displayedUsers = displayedUsers.filter((u) => u.role === "steward");
  } else if (sortOption === "adminOnly") {
    displayedUsers = displayedUsers.filter((u) => u.role === "admin");
  } else if (sortOption === "pending") {
    displayedUsers = displayedUsers.filter((u) => !u.authenticated);
  } else if (sortOption === "approved") {
    displayedUsers = displayedUsers.filter((u) => u.authenticated);
  }

  const handleAddUser = async (data: any) => {
    const result = await addUser(data);
    if (!result.success) return alert(result.error || "Failed to add user");

    setAddModalVisible(false);
    loadUsers();
  };

  const handleUpdateUser = async (data: any) => {
    if (!editUser) return;

    const payload = {
      id: editUser.id,
      email: data.email,
      role: data.role,
      authenticated: data.authenticated ?? editUser.authenticated,
      ...(data.password && { password: data.password }),
    };

    const result = await updateUser(payload);
    if (!result.success) return alert(result.error || "Failed to update user");

    setEditUser(null);
    loadUsers();
  };

  const handleDeleteUser = async (id: string) => {
    const result = await deleteUser(id);
    if (!result.success) return alert(result.error || "Failed to delete user");

    setEditUser(null);
    loadUsers();
  };

  const getSortLabel = () => {
    switch (sortOption) {
      case "emailAsc": return "Email (A-Z)";
      case "emailDesc": return "Email (Z-A)";
      case "stewardOnly": return "Stewards Only";
      case "adminOnly": return "Admins Only";
      case "pending": return "Pending Approvals";
      case "approved": return "Approved Users";
      default: return "All Users";
    }
  };

  return (
    <ProtectedRoute requireAdmin={true}>
    <div className="min-h-screen bg-gradient-to-br from-[#F7F2EA] via-[#E4EBE4] to-[#F7F2EA]">
      <div className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-4 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              {/* Left: icon + title + subtitle */}
              <div className="flex items-center gap-4">
                <Image
                  src="/images/sapaa-icon-white.png"
                  alt="SAPAA"
                  width={140}
                  height={140}
                  priority
                  className="h-16 w-auto flex-shrink-0 opacity-100 mt-1"
                />
              <div>
                <h1 className="text-3xl font-bold mt-3">Account Management</h1>
                <p className="text-[#E4EBE4] text-base mt-0.5">
                  Manage user accounts and permissions
                </p>
              </div>
            </div>

            {/* Right: Add User button + NavBar grouped together */}
            <div className="flex items-center gap-3 mt-2.5">
              <button
                onClick={() => setAddModalVisible(true)}
                className="bg-white text-[#356B43] px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                Add User
              </button>
              <div className="[&>nav]:bg-none [&>nav]:bg-transparent [&>nav]:shadow-none [&>nav]:px-0 [&>nav]:py-0">
                <AdminNavBar />
              </div>
            </div>
          </div>
        </div>
      </div>


        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#356B43] to-[#254431] rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#7A8075] uppercase tracking-wide">Total Users</div>
                  <div className="text-3xl font-bold text-[#254431]">{users.length}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#ff9800] to-[#f57c00] rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#7A8075] uppercase tracking-wide">Pending</div>
                  <div className="text-3xl font-bold text-[#254431]">
                    {users.filter(u => !u.authenticated).length}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#4caf50] to-[#2e7d32] rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#7A8075] uppercase tracking-wide">Approved</div>
                  <div className="text-3xl font-bold text-[#254431]">
                    {users.filter(u => u.authenticated).length}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#2196f3] to-[#1565c0] rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#7A8075] uppercase tracking-wide">Admins</div>
                  <div className="text-3xl font-bold text-[#254431]">
                    {users.filter(u => u.role === 'admin').length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-2xl p-6 border-2 border-[#E4EBE4] shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7A8075]" />
                <input
                  className="w-full pl-12 pr-4 py-3.5 bg-[#F7F2EA] border-2 border-[#86A98A] rounded-xl text-[#1E2520] placeholder:text-[#7A8075] focus:outline-none focus:ring-2 focus:ring-[#356B43] focus:border-[#356B43] transition-all"
                  placeholder="Search by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <button
                onClick={() => setSortModalVisible(true)}
                className="px-6 py-3.5 bg-[#F7F2EA] border-2 border-[#86A98A] rounded-xl text-[#254431] font-semibold hover:bg-[#E4EBE4] transition-all flex items-center gap-2"
              >
                <Filter className="w-5 h-5" />
                {getSortLabel()}
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* User List */}
          <div className="bg-white rounded-2xl border-2 border-[#E4EBE4] shadow-sm overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-[#254431] mb-4 flex items-center gap-2">
                <Users className="w-6 h-6" />
                User Accounts
              </h2>
              
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-[#E4EBE4] border-t-[#356B43] rounded-full animate-spin"></div>
                </div>
              ) : displayedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-[#E4EBE4] mx-auto mb-4" />
                  <p className="text-[#7A8075] text-lg">No users found</p>
                  <p className="text-[#7A8075] text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {displayedUsers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => setEditUser(u)}
                      className="p-5 bg-[#F7F2EA] rounded-xl border-2 border-[#E4EBE4] cursor-pointer hover:border-[#356B43] hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                            u.role === 'admin'
                              ? 'bg-gradient-to-br from-[#356B43] to-[#254431]'
                              : 'bg-gradient-to-br from-[#2196f3] to-[#1565c0]'
                          }`}>
                            {u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-[#254431] text-lg">{u.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                u.role === 'admin'
                                  ? 'bg-[#356B43] text-white'
                                  : 'bg-[#2196f3] text-white'
                              }`}>
                                {u.role === 'admin' ? '👑 Admin' : '📝 Steward'}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                u.authenticated
                                  ? 'bg-[#4caf50] text-white'
                                  : 'bg-[#ff9800] text-white'
                              }`}>
                                {u.authenticated ? '✓ Approved' : '⏳ Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-[#7A8075] group-hover:text-[#356B43] transition-colors">
                          <ChevronDown className="w-5 h-5 rotate-[-90deg]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Add User Modal */}
        {addModalVisible && (
          <AccountDetailsModal
            visible={addModalVisible}
            user={null}
            onClose={() => setAddModalVisible(false)}
            onSave={handleAddUser}
          />
        )}

        {/* Edit User Modal */}
        {editUser && (
          <AccountDetailsModal
            visible
            user={editUser}
            onClose={() => setEditUser(null)}
            onSave={handleUpdateUser}
            onDelete={handleDeleteUser}
          />
        )}

        {/* Sort / Filter Modal */}
        {sortModalVisible && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
            onClick={() => setSortModalVisible(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-[400px] max-w-[90vw] border-2 border-[#E4EBE4] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-[#254431] to-[#356B43] text-white px-6 py-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filter & Sort Options
                </h3>
              </div>

              <div className="p-4 space-y-2">
                <button
                  className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                    sortOption === null
                      ? 'bg-[#356B43] text-white'
                      : 'hover:bg-[#F7F2EA] text-[#254431]'
                  }`}
                  onClick={() => {
                    setSortOption(null);
                    setSortModalVisible(false);
                  }}
                >
                  All Users
                </button>

                <div className="border-t border-[#E4EBE4] pt-2 mt-2">
                  <p className="text-xs font-semibold text-[#7A8075] uppercase px-4 py-1">Approval Status</p>
                  <button
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                      sortOption === 'pending'
                        ? 'bg-[#ff9800] text-white'
                        : 'hover:bg-[#F7F2EA] text-[#254431]'
                    }`}
                    onClick={() => {
                      setSortOption("pending");
                      setSortModalVisible(false);
                    }}
                  >
                    ⏳ Pending Approvals
                  </button>

                  <button
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                      sortOption === 'approved'
                        ? 'bg-[#4caf50] text-white'
                        : 'hover:bg-[#F7F2EA] text-[#254431]'
                    }`}
                    onClick={() => {
                      setSortOption("approved");
                      setSortModalVisible(false);
                    }}
                  >
                    ✓ Approved Users
                  </button>
                </div>

                <div className="border-t border-[#E4EBE4] pt-2 mt-2">
                  <p className="text-xs font-semibold text-[#7A8075] uppercase px-4 py-1">Sorting</p>
                  <button
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                      sortOption === 'emailAsc'
                        ? 'bg-[#356B43] text-white'
                        : 'hover:bg-[#F7F2EA] text-[#254431]'
                    }`}
                    onClick={() => {
                      setSortOption("emailAsc");
                      setSortModalVisible(false);
                    }}
                  >
                    📧 Email (A-Z)
                  </button>

                  <button
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                      sortOption === 'emailDesc'
                        ? 'bg-[#356B43] text-white'
                        : 'hover:bg-[#F7F2EA] text-[#254431]'
                    }`}
                    onClick={() => {
                      setSortOption("emailDesc");
                      setSortModalVisible(false);
                    }}
                  >
                    📧 Email (Z-A)
                  </button>
                </div>

                <div className="border-t border-[#E4EBE4] pt-2 mt-2">
                  <p className="text-xs font-semibold text-[#7A8075] uppercase px-4 py-1">Role</p>
                  <button
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                      sortOption === 'stewardOnly'
                        ? 'bg-[#356B43] text-white'
                        : 'hover:bg-[#F7F2EA] text-[#254431]'
                    }`}
                    onClick={() => {
                      setSortOption("stewardOnly");
                      setSortModalVisible(false);
                    }}
                  >
                    📝 Stewards Only
                  </button>

                  <button
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                      sortOption === 'adminOnly'
                        ? 'bg-[#356B43] text-white'
                        : 'hover:bg-[#F7F2EA] text-[#254431]'
                    }`}
                    onClick={() => {
                      setSortOption("adminOnly");
                      setSortModalVisible(false);
                    }}
                  >
                    👑 Admins Only
                  </button>
                </div>
              </div>

              <div className="px-4 pb-4">
                <button
                  className="w-full px-4 py-3 bg-[#E4EBE4] text-[#254431] rounded-xl font-semibold hover:bg-[#d4d4d4] transition-all"
                  onClick={() => setSortModalVisible(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}