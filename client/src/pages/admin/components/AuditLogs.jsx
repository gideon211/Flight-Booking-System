import React, { useState, useEffect } from "react";
import api from "../../../api/axios";

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        action: "",
        user: "",
        dateFrom: "",
        dateTo: ""
    });

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            // Build query parameters
            const params = new URLSearchParams();
            if (filter.action) params.append('action', filter.action);
            if (filter.user) params.append('user', filter.user);
            if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
            if (filter.dateTo) params.append('dateTo', filter.dateTo);
            
            const response = await api.get(`/admin/audit-logs?${params.toString()}`);
            
            // Transform backend data to match frontend format
            const transformedLogs = response.data.map(log => ({
                id: log.id,
                timestamp: new Date(log.timestamp).toLocaleString(),
                user: log.user_email,
                action: log.action,
                details: log.details,
                ipAddress: log.ip_address,
                status: log.status
            }));
            
            setLogs(transformedLogs);
        } catch (error) {
            console.error("Error fetching logs:", error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        if (filter.action && !log.action.toLowerCase().includes(filter.action.toLowerCase())) {
            return false;
        }
        if (filter.user && !log.user.toLowerCase().includes(filter.user.toLowerCase())) {
            return false;
        }
        if (filter.dateFrom && log.timestamp < filter.dateFrom) {
            return false;
        }
        if (filter.dateTo && log.timestamp > filter.dateTo) {
            return false;
        }
        return true;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case "SUCCESS":
                return "text-green-600 bg-green-100";
            case "FAILED":
                return "text-red-600 bg-red-100";
            default:
                return "text-gray-600 bg-gray-100";
        }
    };

    const getActionColor = (action) => {
        if (action.includes("CREATE")) return "text-blue-600 bg-blue-100";
        if (action.includes("UPDATE")) return "text-yellow-600 bg-yellow-100";
        if (action.includes("DELETE")) return "text-red-600 bg-red-100";
        if (action.includes("LOGIN")) return "text-green-600 bg-green-100";
        return "text-gray-600 bg-gray-100";
    };

    if (loading) {
        return <div className="text-center py-8">Loading audit logs...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Audit Logs</h2>
                <div className="text-sm text-gray-600">
                    Total Logs: {filteredLogs.length}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Action
                        </label>
                        <input
                            type="text"
                            placeholder="Search action..."
                            value={filter.action}
                            onChange={(e) => setFilter({...filter, action: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            User
                        </label>
                        <input
                            type="text"
                            placeholder="Search user..."
                            value={filter.user}
                            onChange={(e) => setFilter({...filter, user: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            From Date
                        </label>
                        <input
                            type="date"
                            value={filter.dateFrom}
                            onChange={(e) => setFilter({...filter, dateFrom: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            To Date
                        </label>
                        <input
                            type="date"
                            value={filter.dateTo}
                            onChange={(e) => setFilter({...filter, dateTo: e.target.value})}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setLoading(true);
                            fetchLogs();
                        }}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
                    >
                        Apply Filters
                    </button>
                    <button
                        onClick={() => {
                            setFilter({ action: "", user: "", dateFrom: "", dateTo: "" });
                            setLoading(true);
                            fetchLogs();
                        }}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Timestamp
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Details
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    IP Address
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {log.timestamp}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {log.user}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                        {log.details}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {log.ipAddress}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(log.status)}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {filteredLogs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No audit logs found matching your filters.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
