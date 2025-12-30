import React, { useEffect, useState } from 'react';

const CustomCursor: React.FC = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [hidden, setHidden] = useState(false);
    const [hovering, setHovering] = useState(false);
    const [clicked, setClicked] = useState(false);

    useEffect(() => {
        const updatePosition = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
        };

        const handleMouseEnter = () => setHidden(false);
        const handleMouseLeave = () => setHidden(true);

        const handleMouseDown = () => setClicked(true);
        const handleMouseUp = () => setClicked(false);

        const handleLinkHoverStart = () => setHovering(true);
        const handleLinkHoverEnd = () => setHovering(false);

        document.addEventListener('mousemove', updatePosition);
        document.addEventListener('mouseenter', handleMouseEnter);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);

        // Add event listeners to all clickable elements
        const addHoverListeners = () => {
            const clickables = document.querySelectorAll('a, button, input, [role="button"]');
            clickables.forEach(el => {
                el.addEventListener('mouseenter', handleLinkHoverStart);
                el.addEventListener('mouseleave', handleLinkHoverEnd);
            });
        };

        addHoverListeners();

        // Re-add listeners on DOM changes (simple observation)
        const observer = new MutationObserver(addHoverListeners);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            document.removeEventListener('mousemove', updatePosition);
            document.removeEventListener('mouseenter', handleMouseEnter);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
            observer.disconnect();
        };
    }, []);

    // const isDark = true; // Unused

    return (
        <>
            {/* Main Cursor (Dot) */}
            <div
                style={{
                    position: 'fixed',
                    top: 0, left: 0,
                    width: '8px', height: '8px',
                    backgroundColor: clicked ? '#EA580C' : '#F59E0B',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 9999,
                    transform: `translate(${position.x - 4}px, ${position.y - 4}px)`,
                    transition: 'width 0.2s, height 0.2s, background-color 0.2s',
                    opacity: hidden ? 0 : 1,
                    mixBlendMode: 'difference'
                }}
            />

            {/* Trailing Ring */}
            <div
                style={{
                    position: 'fixed',
                    top: 0, left: 0,
                    width: hovering ? '40px' : '24px',
                    height: hovering ? '40px' : '24px',
                    border: '1.5px solid #F59E0B',
                    borderRadius: '50%',
                    pointerEvents: 'none',
                    zIndex: 9998,
                    transform: `translate(${position.x - (hovering ? 20 : 12)}px, ${position.y - (hovering ? 20 : 12)}px)`,
                    transition: 'transform 0.1s ease-out, width 0.3s ease, height 0.3s ease',
                    opacity: hidden ? 0 : 0.6,
                    mixBlendMode: 'difference',
                    backgroundColor: hovering ? 'rgba(245, 158, 11, 0.1)' : 'transparent'
                }}
            />

            {/* Global cursor hide */}
            <style>{`
                * {
                    cursor: none !important;
                }
            `}</style>
        </>
    );
};

export default CustomCursor;
