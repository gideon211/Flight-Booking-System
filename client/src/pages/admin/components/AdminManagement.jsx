import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        permissions: []
    });

    const availablePermissions = [
        "manage_flights",
        "manage_bookings", 
        "view_analytics",
        "manage_users",
        "system_settings"
    ];

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const res = await api.get('/admins');
            setAdmins(res.data || []);
        } catch (error) {
            console.error("Error fetching admins:", error);
            alert(error.response?.data?.message || 'Error fetching admins');
            setAdmins([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/admins', formData);
            setAdmins([res.data, ...admins]);
            setShowAddModal(false);
            setFormData({ name: "", email: "", password: "", permissions: [] });
        } catch (error) {
            console.error("Error creating admin:", error);
            alert(error.response?.data?.message || 'Error creating admin');
        }
    };

    const handlePermissionChange = (permission) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter(p => p !== permission)
                : [...prev.permissions, permission]
        }));
    };

    const handleDelete = async (adminId) => {
        if (!window.confirm("Are you sure you want to delete this admin?")) return;
        try {
            await api.delete(`/users/${adminId}`);
            setAdmins(admins.filter(admin => admin.id !== adminId));
        } catch (error) {
            console.error('Error deleting admin:', error);
            alert(error.response?.data?.message || 'Error deleting admin');
        }
    };

    const toggleAdminStatus = async (adminId) => {
        try {
            const res = await api.patch(`/admins/${adminId}/toggle`);
            const updated = res.data;
            setAdmins(admins.map(admin => admin.id === adminId ? updated : admin));
        } catch (error) {
            console.error('Error toggling admin status:', error);
            alert(error.response?.data?.message || 'Error toggling admin');
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading admins...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Admin Management</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                >
                    Add New Admin
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Admin
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Permissions
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Login
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {admins.map((admin) => (
                            <tr key={admin.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{admin.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {admin.permissions.map((permission) => (
                                            <span
                                                key={permission}
                                                className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded"
                                            >
                                                {permission.replace('_', ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {admin.lastLogin}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                                        admin.status === "active" 
                                            ? "bg-green-100 text-green-800" 
                                            : "bg-red-100 text-red-800"
                                    }`}>
                                        {admin.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => toggleAdminStatus(admin.id)}
                                        className={`${
                                            admin.status === "active" 
                                                ? "text-red-600 hover:text-red-900" 
                                                : "text-green-600 hover:text-green-900"
                                        }`}
                                    >
                                        {admin.status === "active" ? "Deactivate" : "Activate"}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(admin.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Admin Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Add New Admin</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Permissions
                                </label>
                                <div className="space-y-2">
                                    {availablePermissions.map((permission) => (
                                        <label key={permission} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={formData.permissions.includes(permission)}
                                                onChange={() => handlePermissionChange(permission)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm">{permission.replace('_', ' ')}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700"
                                >
                                    Create Admin
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setFormData({ name: "", email: "", password: "", permissions: [] });
                                    }}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagement;
