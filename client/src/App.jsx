import React from 'react'
import AppRoutes from "./routes/routes"
// import useFlightStore from "../src/store/useFlightsStore";

const App = () => {
//      const fetchFlights = useFlightStore((state) => state.fetchFlights);

//     useEffect(() => {
//     fetchFlights();
//   }, [fetchFlights]);
  return (
    <div>
        <AppRoutes />

    </div>
  )
}

export default App