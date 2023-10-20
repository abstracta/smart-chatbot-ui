import { FC, ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';


type Props = {
    buttonContent: ReactNode;
    items?: ReactNode[];
    align: 'left' | 'right';
    disabled?: boolean
};

const Dropdown: FC<Props> = ({
    buttonContent,
    items,
    align,
    disabled,
}) => {
    const componentRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [show, setShow] = useState(false);
    const [buttonWidth, setWidth] = useState(0);

    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (componentRef.current && !componentRef.current.contains(e.target as Node)) {
                window.addEventListener('mouseup', handleMouseUp);
            }
        };
        const handleMouseUp = (e: MouseEvent) => {
            window.removeEventListener('mouseup', handleMouseUp);
            setShow(false);
        };
        window.addEventListener('mousedown', handleMouseDown);
        return () => {
            window.removeEventListener('mousedown', handleMouseDown);
        };
    }, [setShow]);

    useLayoutEffect(() => {
        setWidth(buttonRef.current?.offsetWidth || 0);
    }, []);

    return (
        <div ref={componentRef} className='relative'>
            <button ref={buttonRef} className="inline-flex items-center p-2 text-sm font-medium text-center 
                text-gray-900 bg-white rounded hover:bg-gray-100 dark:text-white dark:bg-[#343541] 
                dark:hover:bg-white/10 border dark:border dark:border-white/20
                disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-300
                dark:disabled:bg-gray-500 dark:disabled:text-gray-600 dark:disabled:border-gray-500"
                type="button" onClick={() => setShow(!show)}
                disabled={disabled}>
                {buttonContent}
            </button>

            <div ref={menuRef} className={`${!show && 'hidden'} absolute z-10 bg-white divide-y divide-gray-100 
                rounded-lg shadow w-44 dark:bg-[#343541] border dark:border-white/20 dark:divide-gray-600`}
                style={{ transform: align == 'left' ? `translateX(calc(-100% + ${buttonWidth}px))` : `` }}>
                <ul className="py-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
                    {items && items.map((item, index) =>
                        <div key={index} onClick={() => setShow(false)}>{item}</div>)
                    }
                </ul>
            </div>
        </div>
    );
};

export default Dropdown;
