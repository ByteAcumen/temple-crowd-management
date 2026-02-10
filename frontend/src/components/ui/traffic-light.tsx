'use client';

// Temple Smart E-Pass - Traffic Light Status Component
// Shows crowd status: GREEN (safe), ORANGE (moderate), RED (crowded)

interface TrafficLightProps {
    status: 'GREEN' | 'ORANGE' | 'RED' | 'green' | 'orange' | 'red';
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
    animated?: boolean;
}

const statusConfig = {
    GREEN: {
        color: 'bg-green-500',
        glow: 'shadow-green-500/50',
        label: 'Low Crowd',
        textColor: 'text-green-600',
        bgLight: 'bg-green-100',
    },
    ORANGE: {
        color: 'bg-orange-500',
        glow: 'shadow-orange-500/50',
        label: 'Moderate',
        textColor: 'text-orange-600',
        bgLight: 'bg-orange-100',
    },
    RED: {
        color: 'bg-red-500',
        glow: 'shadow-red-500/50',
        label: 'High Crowd',
        textColor: 'text-red-600',
        bgLight: 'bg-red-100',
    },
};

const sizeConfig = {
    sm: { dot: 'w-3 h-3', text: 'text-xs', padding: 'px-2 py-1' },
    md: { dot: 'w-4 h-4', text: 'text-sm', padding: 'px-3 py-1.5' },
    lg: { dot: 'w-5 h-5', text: 'text-base', padding: 'px-4 py-2' },
};

export function TrafficLight({
    status,
    size = 'md',
    showLabel = true,
    animated = true
}: TrafficLightProps) {
    // Normalize status to uppercase
    const normalizedStatus = status.toUpperCase() as 'GREEN' | 'ORANGE' | 'RED';
    const config = statusConfig[normalizedStatus] || statusConfig.GREEN;
    const sizeStyles = sizeConfig[size];

    return (
        <div
            className={`inline-flex items-center gap-2 rounded-full ${config.bgLight} ${sizeStyles.padding}`}
        >
            {/* Pulsing Dot */}
            <span
                className={`
                    ${sizeStyles.dot} 
                    ${config.color} 
                    rounded-full 
                    ${animated ? 'animate-pulse' : ''} 
                    shadow-lg ${config.glow}
                `}
            />

            {/* Label */}
            {showLabel && (
                <span className={`${sizeStyles.text} font-medium ${config.textColor}`}>
                    {config.label}
                </span>
            )}
        </div>
    );
}

// Compact version for cards
export function TrafficLightBadge({ status }: { status: string }) {
    const normalizedStatus = (status || 'GREEN').toUpperCase() as 'GREEN' | 'ORANGE' | 'RED';
    const config = statusConfig[normalizedStatus] || statusConfig.GREEN;

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgLight}`}>
            <span className={`w-2 h-2 rounded-full ${config.color} animate-pulse`} />
            <span className={`text-xs font-semibold ${config.textColor}`}>
                {config.label}
            </span>
        </span>
    );
}

export default TrafficLight;
