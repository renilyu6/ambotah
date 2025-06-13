import React from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClass = size === 'lg' ? 'lg' : ''
  
  return (
    <div className={`loading-spinner ${sizeClass} ${className}`}></div>
  )
}

export default LoadingSpinner