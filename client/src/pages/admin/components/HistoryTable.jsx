import React, { useState, useEffect } from "react";

const HistoryTable = () => {
    const [history, setHistory] = useState([]);
    const [filter, setFilter] = useState("All");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: "timestamp", direction: "desc" });
    const [modalData, setModalData] = useState(null);
    const rowsPerPage = 13;

    useEffect(() => {
        fetch("/bookings.json")
        .then(res => res.json())
        .then(data => setHistory(data))
        .catch(err => console.error(err));
    }, []);

    const filteredHistory = history.filter((item) => {
        const matchFilter = filter === "All" || item.status === filter;
        const matchSearch =
        item.flight.toLowerCase().includes(search.toLowerCase()) ||
        item.user.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const sortedHistory = [...filteredHistory].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
    });

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = sortedHistory.slice(indexOfFirstRow, indexOfLastRow);

    const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(sortedHistory.length / rowsPerPage)));
    const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    const downloadCSV = () => {
        const headers = ["Flight","User","Status","Amount","Timestamp","Origin","Destination","Meals"];
        const rows = sortedHistory.map(item => [
            item.flight,
            item.user,
            item.status,
            item.amount,
            item.timestamp,
            item.origin || "",
            item.destination || "",
            (item.meals || []).join("|")
        ]);
        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", "flight_history.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const requestSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
        setSortConfig({ key, direction });
    };

  return (
    <div className="bg-white rounded shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Flight History</h2>
            <button onClick={downloadCSV} className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600">
            Download CSV
            </button>
        </div>

        <div className="flex mb-3 space-x-4">
            <div>
                <label className="mr-2 font-medium">Filter:</label>
                <select value={filter} onChange={e => { setFilter(e.target.value); setCurrentPage(1); }} className="border-2 p-1 rounded OUTLINE-none border-red-200">
                    <option value="All" >All</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Pending">Pending</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
            </div>
            <div>
                <input
                    type="text"
                    placeholder="Search by flight or user"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="border-2 border-red-200 p-1 rounded outline-none "
                />
            </div>
        </div>

        <table className="w-full border-collapse">
            <thead>
                <tr className="bg-red-400">
                    {["flight","user","status","amount","timestamp"].map(col => (
                    <th key={col} onClick={() => requestSort(col)} className=" px-2 py-1 cursor-pointer text-white">{col.toUpperCase()}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {currentRows.map(item => (
                    <tr key={item.id} className="hover:bg-gray-100 cursor-pointer" onClick={() => setModalData(item)}>
                    <td className="border px-2 py-1 text-center">{item.flight}</td>
                    <td className="border px-2 py-1 text-center">{item.user}</td>
                    <td className="border px-2 py-1 text-center">{item.status}</td>
                    <td className="border px-2 py-1 text-center">{item.amount}</td>
                    <td className="border px-2 py-1 text-center">{item.timestamp}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <div className="flex justify-between items-center mt-4">
            <button onClick={prevPage} className="px-3 py-1 bg-red-500 text-white rounded disabled:opacity-50" disabled={currentPage===1}>Prev</button>
            <span>Page {currentPage} of {Math.ceil(sortedHistory.length/rowsPerPage)}</span>
            <button onClick={nextPage} className="px-3 py-1 bg-red-500 text-white  disabled:opacity-50" disabled={currentPage===Math.ceil(sortedHistory.length/rowsPerPage)}>Next</button>
        </div>

      {modalData && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-md w-96  ">
                <h3 className="text-lg font-semibold mb-2">{modalData.flight}</h3>
                <p className="text-medium"><span className="text-xl">USER:</span> {modalData.user}</p>
                <p><span className="text-xl">STATUS:</span> {modalData.status}</p>
                <p><span className="text-xl">AMOUNT: </span>{modalData.amount}</p>
                <p><span className="text-xl">DATE:</span> {modalData.timestamp}</p>
                <p><span className="text-xl">ORIGIN:</span> {modalData.origin}</p>
                <p><span className="text-xl">DESTINATION:</span> {modalData.destination}</p>
                <p><span className="text-xl">MEALS:</span> {(modalData.meals || []).join(", ")}</p>
                <button className="mt-3 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600" onClick={() => setModalData(null)}>Close</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
