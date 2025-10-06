import React, { useState } from "react";
import api from "../../../api/axios";

const SystemSettings = () => {
    const [settings, setSettings] = useState({
        siteName: "Flight Booking System",
        maintenanceMode: false,
        maxBookingsPerUser: 5,
        bookingTimeoutMinutes: 15,
        emailNotifications: true,
        smsNotifications: false,
        currency: "USD",
        timezone: "UTC",
        defaultLanguage: "en"
    });

    const [saving, setSaving] = useState(false);

    const handleChange = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert("Settings saved successfully!");
        } catch (error) {
            alert("Error saving settings");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                    {saving ? "Saving..." : "Save Settings"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Settings */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">General Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Site Name
                            </label>
                            <input
                                type="text"
                                value={settings.siteName}
                                onChange={(e) => handleChange("siteName", e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Currency
                            </label>
                            <select
                                value={settings.currency}
                                onChange={(e) => handleChange("currency", e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="GBP">GBP</option>
                                <option value="CAD">CAD</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Timezone
                            </label>
                            <select
                                value={settings.timezone}
                                onChange={(e) => handleChange("timezone", e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            >
                                <option value="UTC">UTC</option>
                                <option value="EST">Eastern Time</option>
                                <option value="PST">Pacific Time</option>
                                <option value="GMT">Greenwich Mean Time</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Default Language
                            </label>
                            <select
                                value={settings.defaultLanguage}
                                onChange={(e) => handleChange("defaultLanguage", e.target.value)}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Booking Settings */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Booking Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Bookings Per User
                            </label>
                            <input
                                type="number"
                                value={settings.maxBookingsPerUser}
                                onChange={(e) => handleChange("maxBookingsPerUser", parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                min="1"
                                max="20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Booking Timeout (minutes)
                            </label>
                            <input
                                type="number"
                                value={settings.bookingTimeoutMinutes}
                                onChange={(e) => handleChange("bookingTimeoutMinutes", parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                min="5"
                                max="60"
                            />
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Notification Settings</h3>
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={settings.emailNotifications}
                                onChange={(e) => handleChange("emailNotifications", e.target.checked)}
                                className="mr-3"
                            />
                            <label className="text-sm font-medium text-gray-700">
                                Email Notifications
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={settings.smsNotifications}
                                onChange={(e) => handleChange("smsNotifications", e.target.checked)}
                                className="mr-3"
                            />
                            <label className="text-sm font-medium text-gray-700">
                                SMS Notifications
                            </label>
                        </div>
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">System Status</h3>
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={settings.maintenanceMode}
                                onChange={(e) => handleChange("maintenanceMode", e.target.checked)}
                                className="mr-3"
                            />
                            <label className="text-sm font-medium text-gray-700">
                                Maintenance Mode
                            </label>
                        </div>
                        <div className="text-sm text-gray-600">
                            <p><strong>System Version:</strong> 1.0.0</p>
                            <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                            <p><strong>Database Status:</strong> <span className="text-green-600">Connected</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;
