import { Particles } from "@/components/ui/particles";

export const AnimatedBackground = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Gradient background */}
        <Particles
            className="absolute inset-0 z-20"
            quantity={120}
            ease={80}
            color={"#f7e431"}
            size={0.4}
            refresh={true}
        />

        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900" />

    </div>
);
