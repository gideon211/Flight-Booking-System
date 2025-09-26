import React from 'react'

const Loading = () => {
    return (
        <div className="flex flex-col justify-center items-center h-[90vh]">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-t-blue-500 border-gray-200"></div>
            <p className='text-sm mt-3 text-gray-500'>please wait <span className='animate-bounce'>...</span></p>
        </div>
    )
}

export default Loading