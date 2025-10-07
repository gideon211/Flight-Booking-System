import React, { useState, useEffect } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import api from "../../../api/axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const OverviewDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get("/admin/dashboard/stats");
      setStats(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError("Failed to load dashboard statistics");
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-600">{error}</div>;
  }

  if (!stats) {
    return <div className="p-6 text-center">No data available</div>;
  }


  // Prepare chart data from backend stats
  const bookingsPerRouteData = {
    labels: stats.bookingsPerRoute.map(r => `${r.city_origin} → ${r.city_destination}`),
    datasets: [
      {
        label: "Bookings per Route",
        data: stats.bookingsPerRoute.map(r => r.count),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  const revenueChartData = {
    labels: stats.revenuePerMonth.map(r => r.month),
    datasets: [
      {
        label: "Revenue (GHS)",
        data: stats.revenuePerMonth.map(r => parseFloat(r.revenue)),
        borderColor: "rgba(16, 185, 129,1)",
        backgroundColor: "rgba(16, 185, 129,0.5)",
        fill: true,
      },
    ],
  };

  const flightStatusData = {
    labels: stats.flightStatusDistribution.map(s => s.flight_status),
    datasets: [
      {
        label: "Flight Status",
        data: stats.flightStatusDistribution.map(s => s.count),
        backgroundColor: ["#60a5fa", "#34d399", "#f87171", "#fbbf24"],
      },
    ],
  };

    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-blue-500 text-white p-4 rounded shadow text-center">
                    <p className="text-white text-sm font-medium">Total Flights</p>
                    <p className="text-3xl font-bold">{stats.totalFlights}</p>
                </div>
                <div className="bg-green-500 text-white p-4 rounded shadow text-center">
                    <p className="text-white text-sm font-medium">Total Bookings</p>
                    <p className="text-3xl font-bold">{stats.totalBookings}</p>
                </div>
                <div className="bg-purple-500 text-white p-4 rounded shadow text-center">
                    <p className="text-white text-sm font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold">GHS {stats.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-red-500 text-white p-4 rounded shadow text-center">
                    <p className="text-white text-sm font-medium">Cancelled</p>
                    <p className="text-3xl font-bold">{stats.cancelledBookings}</p>
                </div>
                <div className="bg-yellow-500 text-white p-4 rounded shadow text-center">
                    <p className="text-white text-sm font-medium">Upcoming Flights</p>
                    <p className="text-3xl font-bold">{stats.upcomingFlights}</p>
                </div>
            </div>

    
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semimedium mb-2">Bookings Per Route</h2>
                    <Bar data={bookingsPerRouteData} />
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-semimedium mb-2">Revenue Over Months</h2>
                    <Line data={revenueChartData} />
                </div>
                <div className="bg-white p-4 rounded shadow lg:col-span-2">
                    <h2 className="text-lg font-semimedium mb-2">Flight Status Distribution</h2>
                    <Pie data={flightStatusData} />
                </div>
            </div>
        </div>
    );
};

export default OverviewDashboard;
