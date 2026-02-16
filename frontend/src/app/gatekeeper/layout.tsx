export default function GatekeeperLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 antialiased relative selection:bg-orange-100 selection:text-orange-900">
            {/* Background Gradients/Blobs similar to Landing Page */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-200/30 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/30 rounded-full blur-3xl animate-float-reverse"></div>
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-yellow-200/20 rounded-full blur-3xl animate-float delay-1000"></div>
            </div>
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
}
