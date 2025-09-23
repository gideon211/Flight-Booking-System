import React, { useState, useEffect } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
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
  const [flights, setFlights] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("All");

  useEffect(() => {
    fetch("/flightSs.json")
      .then((res) => res.json())
      .then((data) => setFlights(data))
      .catch((err) => console.error(err));

    fetch("/bookings.json")
      .then((res) => res.json())
      .then((data) => setBookings(data))
      .catch((err) => console.error(err));
  }, []);


  const monthFilteredBookings = bookings.filter((b) => {
    if (selectedMonth === "All") return true;
    const month = new Date(b.timestamp).getMonth();
    return month === parseInt(selectedMonth);
  });

  const monthFilteredFlights = flights.filter((f) => {
    if (selectedMonth === "All") return true;
    const month = new Date(f.departureDateTime).getMonth();
    return month === parseInt(selectedMonth);
  });


  const totalFlights = monthFilteredFlights.length;
  const totalBookings = monthFilteredBookings.length;
  const cancelledBookings = monthFilteredBookings.filter((b) => b.status === "Cancelled").length;
  const upcomingFlights = monthFilteredFlights.filter((f) => new Date(f.departureDateTime) > new Date()).length;
  const totalRevenue = monthFilteredBookings.reduce((acc, b) => acc + parseFloat(b.amount), 0);


  const routeCounts = {};
  monthFilteredBookings.forEach((b) => (routeCounts[b.flight] = (routeCounts[b.flight] || 0) + 1));
  const bookingsPerRouteData = {
    labels: Object.keys(routeCounts),
    datasets: [
      {
        label: "Bookings per Route",
        data: Object.values(routeCounts),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  const revenuePerMonth = {};
  monthFilteredBookings.forEach((b) => {
    const month = new Date(b.timestamp).toLocaleString("default", { month: "short", year: "numeric" });
    revenuePerMonth[month] = (revenuePerMonth[month] || 0) + parseFloat(b.amount);
  });
  const revenueChartData = {
    labels: Object.keys(revenuePerMonth),
    datasets: [
      {
        label: "Revenue",
        data: Object.values(revenuePerMonth),
        borderColor: "rgba(16, 185, 129,1)",
        backgroundColor: "rgba(16, 185, 129,0.5)",
        fill: true,
      },
    ],
  };


  const statusCounts = { Scheduled: 0, Completed: 0, Cancelled: 0, Delayed: 0 };
  monthFilteredFlights.forEach((f) => (statusCounts[f.status] = (statusCounts[f.status] || 0) + 1));
  const flightStatusData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        label: "Flight Status",
        data: Object.values(statusCounts),
        backgroundColor: ["#60a5fa", "#34d399", "#f87171", "#fbbf24"],
      },
    ],
  };

  return (
    <div className="p-6 space-y-6">



      <div className="mb-4">
        <label className="mr-2 font-medium">Filter by Month:</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border p-1 rounde border-red-200 rounded outline-none cursor-pointer"
        >
          <option value="All">All</option>
          {[...Array(12)].map((_, i) => (
            <option key={i} value={i} className="bg-red-50 hover:bg-red-100">
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-red-500 text-white p-4 rounded shadow text-center border border-red-200">
          <p className="text-black text-xl">Total Flights</p>
          <p className="text-2xl font-bold">{totalFlights}</p>
        </div>
        <div className="bg-red-500 text-white p-4 rounded shadow text-center border border-red-200">
          <p className="text-black text-xl">Total Bookings</p>
          <p className="text-2xl font-bold">{totalBookings}</p>
        </div>
        <div className="bg-red-500 text-white p-4 rounded shadow text-center border border-red-200">
          <p className="text-black text-xl">Total Revenue</p>
          <p className="text-2xl font-medium">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-red-500 text-white p-4 rounded shadow text-center border border-red-200">
          <p className="text-black text-xl">CANCELLED BOOKINGS</p>
          <p className="text-2xl font-medium">{cancelledBookings}</p>
        </div>
        <div className="bg-red-500 text-white p-4 rounded shadow text-center border border-red-200">
          <p className="text-black text-xl">Upcoming Flights</p>
          <p className="text-2xl font-medium">{upcomingFlights}</p>
        </div>
      </div>

      {/* Charts */}
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
