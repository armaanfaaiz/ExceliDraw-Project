import { ReactNode } from "react";

export function IconButton({
    icon, onClick, activated
}: {
    icon: ReactNode,
    onClick: () => void,
    activated: boolean
}) {
    return <div 
        className={`w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 ${
            activated 
                ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30" 
                : "bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white"
        }`} 
        onClick={onClick}
    >
        {icon}
    </div>
}

