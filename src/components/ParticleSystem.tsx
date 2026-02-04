import React, { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
    size: number;
}

interface Props {
    x: number;
    y: number;
    isPinching: boolean;
    color: string;
    width: number;
    height: number;
}

export const ParticleSystem: React.FC<Props> = ({ x, y, isPinching, color, width, height }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particles = useRef<Particle[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            if (isPinching) {
                // Create new particles
                for (let i = 0; i < 2; i++) {
                    particles.current.push({
                        x,
                        y,
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        life: 1.0,
                        color,
                        size: Math.random() * 3 + 1,
                    });
                }
            }

            // Update and draw particles
            particles.current = particles.current.filter(p => p.life > 0);

            particles.current.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life -= 0.02;

                ctx.globalAlpha = p.life;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, [x, y, isPinching, color, width, height]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
                position: 'fixed',
                inset: 0,
                pointerEvents: 'none',
                zIndex: 45,
                opacity: 0.6,
            }}
        />
    );
};
