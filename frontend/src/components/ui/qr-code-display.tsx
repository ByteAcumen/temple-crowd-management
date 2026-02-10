'use client';

// Temple Smart E-Pass - QR Code Display Component
// Generates and displays QR codes for E-Passes

import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
    value: string;
    size?: number;
    includeMargin?: boolean;
    logo?: string;
}

export function QRCodeDisplay({
    value,
    size = 200,
    includeMargin = true,
    logo
}: QRCodeDisplayProps) {
    return (
        <div className="bg-white p-4 rounded-xl inline-block">
            <QRCodeSVG
                value={value}
                size={size}
                level="H" // High error correction for better scanning
                includeMargin={includeMargin}
                bgColor="#ffffff"
                fgColor="#1e293b"
                imageSettings={logo ? {
                    src: logo,
                    height: 40,
                    width: 40,
                    excavate: true,
                } : undefined}
            />
        </div>
    );
}

// Mini QR for cards
export function MiniQRCode({ value }: { value: string }) {
    return (
        <div className="bg-white p-2 rounded-lg inline-block">
            <QRCodeSVG
                value={value}
                size={64}
                level="M"
                includeMargin={false}
                bgColor="#ffffff"
                fgColor="#1e293b"
            />
        </div>
    );
}

export default QRCodeDisplay;
