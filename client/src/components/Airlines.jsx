import React from "react";

const airlines = [
  {
    name: "Ethiopian Airlines",
    img: "https://www.travelwings.com/downloadPortalFile?url=/fstore/airline/images/ET.jpg",
    link: "https://www.travelwings.com/gh/en/airlines/ethiopian-airlines-flight-booking-et.html",
  },
  {
    name: "British Airways",
    img: "https://www.travelwings.com/downloadPortalFile?url=/fstore/airline/images/BA.jpg",
    link: "https://www.travelwings.com/gh/en/airlines/british-airways-flight-booking-ba.html",
  },
  {
    name: "Emirates",
    img: "https://www.travelwings.com/downloadPortalFile?url=/fstore/airline/images/EK.jpg",
    link: "https://www.travelwings.com/gh/en/airlines/emirates-flight-booking-ek.html",
  },
  {
    name: "Qatar Airways",
    img: "https://www.travelwings.com/downloadPortalFile?url=/fstore/airline/images/QR.jpg",
    link: "https://www.travelwings.com/gh/en/airlines/qatar-airways-flight-booking-qr.html",
  },
  {
    name: "Turkish Airlines",
    img: "https://www.travelwings.com/downloadPortalFile?url=/fstore/airline/images/TK.jpg",
    link: "https://www.travelwings.com/gh/en/airlines/turkish-airlines-flight-booking-tk.html",
  },
  {
    name: "Kenya Airways",
    img: "https://www.travelwings.com/downloadPortalFile?url=/fstore/airline/images/KQ.jpg",
    link: "https://www.travelwings.com/gh/en/airlines/kenya-airways-flight-booking-kq.html",
  },
  {
    name: "Air Peace",
    img: "https://www.travelwings.com/downloadPortalFile?url=/fstore/airline/images/P4.jpg",
    link: "https://www.travelwings.com/gh/en/airlines/air-peace-flight-booking-p4.html",
  },
  {
    name: "United Airlines",
    img: "https://www.travelwings.com/downloadPortalFile?url=/fstore/airline/images/UA.jpg",
    link: "https://www.travelwings.com/gh/en/airlines/united-airlines-flight-booking-ua.html",
  },
  {
    name: "Brussels Airlines",
    img: "https://www.travelwings.com/downloadPortalFile?url=/fstore/airline/images/SN.jpg",
    link: "https://www.travelwings.com/gh/en/airlines/brussels-airlines-flight-booking-sn.html",
  },
  {
    name: "Air France",
    img: "https://www.travelwings.com/downloadPortalFile?url=/fstore/airline/images/AF.jpg",
    link: "https://www.travelwings.com/gh/en/airlines/air-france-flight-booking-af.html",
  },

];

const Airlines = () => {
  return (
    <div className="py-10 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-medium text-center mb-8">
          Popular Airlines
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {airlines.map((airline, index) => (
            <a
              key={index}
              href={airline.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center text-center hover:scale-105 transition"
            >
              <div className="w-24 h-24 flex items-center justify-center  rounded-md shadow-md bg-gray-50">
                <img
                  src={airline.img}
                  alt={airline.name}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="mt-2 font-medium">{airline.name}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Airlines;
