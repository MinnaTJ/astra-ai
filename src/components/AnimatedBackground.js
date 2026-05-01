/**
 * AnimatedBackground Component
 * Renders a set of animated floating orbs to create a dynamic aurora effect
 */
const AnimatedBackground = () => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-[#00020a]">
            {/* Primary Orbs */}
            <div
                className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] rounded-full bg-violet-600/15 blur-[150px] animate-float"
            />
            <div
                className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-blue-600/15 blur-[150px] animate-float-reverse"
            />

            {/* Accent Orbs */}
            <div
                className="absolute top-[30%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-fuchsia-600/10 blur-[130px] animate-pulse-slow"
            />
            <div
                className="absolute bottom-[30%] left-[10%] w-[55vw] h-[55vw] rounded-full bg-cyan-600/10 blur-[130px] animate-float"
                style={{ animationDelay: '-5s', animationDuration: '30s' }}
            />

            {/* Fine-grained noise texture (inline to avoid external dependency) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat'
            }} />
        </div>
    );
};

export default AnimatedBackground;
