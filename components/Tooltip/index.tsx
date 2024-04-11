import React, { ReactNode, useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'right' | 'bottom' | 'left';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top' }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [tooltipDims, setTooltipDims] = useState({ width: 0, height: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tooltipRef.current) {
      setTooltipDims({
        width: tooltipRef.current.offsetWidth,
        height: tooltipRef.current.offsetHeight,
      });
    }
  }, [isHovering]);

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  const getCenteringStyle = () => {
    switch (position) {
      case 'top':
      case 'bottom':
        return {
          left: `calc(50% - ${tooltipDims.width / 2}px)`,
          right: 'auto',
        };
      case 'left':
      case 'right':
        return {
          top: `calc(50% - ${tooltipDims.height / 2}px)`,
          bottom: 'auto',
        };
      default:
        return {};
    }
  };

  const baseStyle = 'absolute p-2 bg-gray-500 dark:bg-neutral-800 text-white text-xs rounded-md shadow-sm z-10';

  const positionClass = {
    top: `${baseStyle} bottom-full mb-2`,
    right: `${baseStyle} left-full ml-2`,
    bottom: `${baseStyle} top-full mt-2`,
    left: `${baseStyle} right-full mr-2`,
  }[position];

  const combinedStyle = `${positionClass} ${isHovering ? 'visible' : 'invisible'}`;

  return (
    <div className='relative inline-block' onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div ref={childRef}>
        {children}
      </div>
      <div ref={tooltipRef} className={combinedStyle} style={getCenteringStyle()}>
        {content}
      </div>
    </div>
  );
};

export default Tooltip;