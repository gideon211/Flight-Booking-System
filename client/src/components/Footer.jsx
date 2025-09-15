import React from 'react'

const Footer = () => {
  return (
    <div>
        <footer className="bg-gray-100 py-10">
  <div className="max-w-7xl ml-[13rem] px-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-18">
      
      {/* Left Section - Social */}
      <div className='items-center text-center'>
        <h2 className="text-xl font-bold mb-2 ">WE ARE SOCIAL</h2>
        <p className="text-gray-600 mb-4">Join in on the fun and share your experiences</p>
        <ul className="flex space-x-4 ml-[10rem]">
          <li>
            <a
              href="https://www.facebook.com/TravelwingsGH"
              target="_blank"
              rel="nofollow"
            >
              <img
                src="https://cdn.travelwings.com/web-assets/images/facebook.svg"
                alt="Facebook"
                className="w-8 h-8 text-red-500"
              />
            </a>
          </li>
          <li>
            <a
            
              href="https://www.instagram.com/travelwingsghana/"
              target="_blank"
              rel="nofollow"
            >
              <img
                src="https://cdn.travelwings.com/web-assets/images/instagram.svg"
                alt="Instagram"
                className="w-8 h-8"
              />
            </a>
          </li>
          <li>
            <a
              href="https://twitter.com/TravelwingsGH"
              target="_blank"
              rel="nofollow"
            >
              <img
                src="https://cdn.travelwings.com/web-assets/images/twitter%20%281%29.svg"
                alt="Twitter"
                className="w-8 h-8"
              />
            </a>
          </li>
          <li>
            <a
              href="https://www.youtube.com/c/Travelwingsdotcom"
              target="_blank"
              rel="nofollow"
            >
              <img
                src="https://cdn.travelwings.com/web-assets/images/youtube.svg"
                alt="YouTube"
                className="w-8 h-8"
              />
            </a>
          </li>
          <li>
            <a
              href="https://www.linkedin.com/company/travelwings-com/"
              target="_blank"
              rel="nofollow"
            >
              <img
                src="https://cdn.travelwings.com/web-assets/images/linkedin.svg"
                alt="Linkedin"
                className="w-8 h-8"
              />
            </a>
          </li>
        </ul>
      </div>

      {/* Right Section - Why Choose */}
      <div>
        <h2 className="text-xl font-bold mb-6 text-center">Why Choose Travelwings?</h2>
        <div className="flex flex-wrap gap-8">
          <div className="flex flex-col items-center text-center">
            <img
              src="https://cdn.travelwings.com/b2c-production/static/html/staticPages/assets/img/Icons-smile.png"
              alt="Serving With smile"
              className="w-12 h-12 mb-2"
            />
            <p className="text-gray-700">Serving With Smile</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <img
              src="https://cdn.travelwings.com/b2c-production/static/html/staticPages/assets/img/Icons-24.png"
              alt="24/7 Dedicated Experts"
              className="w-12 h-12 mb-2"
            />
            <p className="text-gray-700">24/7 Dedicated Experts</p>
          </div>
          <div className="flex flex-col items-center text-center">
            <img
              src="https://cdn.travelwings.com/b2c-production/static/html/staticPages/assets/img/Icons-card.png"
              alt="Convenient Payments"
              className="w-12 h-12 mb-2"
            />
            <p className="text-gray-700">Convenient Payments</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</footer>

<div>
    <footer className="bg-black text-white py-4">
  <p className="text-center text-sm">
    © Copyright {new Date().getFullYear()} Travelwings. All Rights Reserved.
  </p>
</footer>

</div>

    </div>
  )
}

export default Footer