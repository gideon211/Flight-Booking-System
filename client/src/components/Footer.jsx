import React from 'react'

const Footer = () => {
  return (
        <div>
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