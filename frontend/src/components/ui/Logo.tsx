import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
    className?: string;
    variant?: 'light' | 'dark' | 'color';
    size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', variant = 'color', size = 'md' }: LogoProps) {
    const sizeClasses = {
        sm: { img: 32, text: 'text-lg', subtext: 'text-[10px]' },
        md: { img: 48, text: 'text-xl', subtext: 'text-xs' },
        lg: { img: 64, text: 'text-2xl', subtext: 'text-sm' },
    };

    const textColor = variant === 'light' ? 'text-white' : 'text-slate-900';
    const subtextColor = variant === 'light' ? 'text-white/80' : 'text-orange-600';

    return (
        <Link href="/" className={`inline-flex items-center gap-3 group ${className}`}>
            <div className="relative">
                <Image
                    src="/temple-logo.png"
                    alt="Temple Smart E-Pass Logo"
                    width={sizeClasses[size].img}
                    height={sizeClasses[size].img}
                    className="rounded-xl object-contain transition-transform group-hover:scale-110 shadow-lg shadow-orange-500/20"
                />
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-orange-400 rounded-xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity"></div>
            </div>
            <div className="flex flex-col">
                <span className={`font-bold ${sizeClasses[size].text} ${textColor} tracking-tight leading-none`}>
                    Temple Smart
                </span>
                <span className={`font-medium ${sizeClasses[size].subtext} ${subtextColor} tracking-wide uppercase`}>
                    AI-Powered E-Pass
                </span>
            </div>
        </Link>
    );
}
