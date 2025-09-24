import { create } from "zustand";

const useFlightStore = create((set) => ({
    flights: [],
    setFlights: (newFlights) => set({ flights: newFlights }),
    fetchFlights: async () => {
        try {
        const res = await fetch("/flights.json");
        const data = await res.json();
        set({ flights: data });
        } catch (err) {
        console.error("Failed to load flights:", err);
        }
    },
}));

export default useFlightStore;
