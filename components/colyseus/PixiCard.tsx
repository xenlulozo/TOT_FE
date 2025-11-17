"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Application, extend } from "@pixi/react";
import { Container, Graphics, Text } from "pixi.js";

import * as PIXI from "pixi.js";

// Extend PIXI components for React with lowercase tags
extend({
  pixiContainer: Container,
  pixiGraphics: Graphics,
  pixiText: Text,
});

interface PixiCardProps {
  type: 'truth' | 'trick';
  isSelected: boolean;
  promptContent?: string;
  onClick?: () => void;
  isInteractive?: boolean;
}

const PixiCard: React.FC<PixiCardProps> = ({
  type,
  isSelected,
  promptContent,
  onClick,
  isInteractive = true
}) => {
  const [cardRotation, setCardRotation] = useState(0);
  const [cardScale, setCardScale] = useState(1);
  const [cardY, setCardY] = useState(0);
  const [floatingOffset, setFloatingOffset] = useState(0);

  // Smooth animation updates
  useEffect(() => {
    if (isSelected) {
      setCardScale(1.1);
      setCardY(-20);
      setCardRotation(180);
    } else {
      setCardScale(1);
      setCardY(0);
      setCardRotation(0);
    }
  }, [isSelected]);

  // Floating animation for unselected cards
  useEffect(() => {
    if (!isSelected) {
      const interval = setInterval(() => {
        setFloatingOffset(Math.sin(Date.now() * 0.003) * 3);
      }, 16); // 60fps
      return () => clearInterval(interval);
    }
  }, [isSelected]);

  const cardWidth = 256;
  const cardHeight = 320;

  // Draw card background using PIXI.pixiGraphics
  const drawCardBackground = useCallback((g: PIXI.Graphics) => {
    g.clear();

    const colors = type === 'truth'
      ? [0x3b82f6, 0x1e40af, 0x1e3a8a] // Blue gradient
      : [0xef4444, 0xdc2626, 0xb91c1c]; // Red gradient

    // Main card shape with rounded corners
    g.beginFill(colors[0]);
    g.drawRoundedRect(-128, -160, 256, 320, 20);
    g.endFill();

    // Gradient overlay layers
    g.beginFill(colors[1], 0.8);
    g.drawRoundedRect(-128, -160, 256, 160, 20);
    g.endFill();

    g.beginFill(colors[2], 0.6);
    g.drawRoundedRect(-128, 0, 256, 160, 20);
    g.endFill();

    // Decorative circles for visual interest
    g.lineStyle(2, 0xffffff, 0.2);
    g.drawCircle(-80, -100, 16);
    g.drawCircle(80, -100, 12);
    g.drawCircle(0, 0, 20);
    g.drawCircle(-60, 100, 10);
    g.drawCircle(60, 100, 14);
  }, [type]);

  // Draw front content background
  const drawFrontBackground = useCallback((g: PIXI.Graphics) => {
    g.clear();

    const colors = type === 'truth'
      ? [0x10b981, 0x059669, 0x047857] // Green gradient
      : [0xf97316, 0xea580c, 0xc2410c]; // Orange gradient

    g.beginFill(colors[0]);
    g.drawRoundedRect(-128, -160, 256, 320, 20);
    g.endFill();

    g.beginFill(colors[1], 0.8);
    g.drawRoundedRect(-128, -160, 256, 160, 20);
    g.endFill();

    g.beginFill(colors[2], 0.6);
    g.drawRoundedRect(-128, 0, 256, 160, 20);
    g.endFill();
  }, [type]);

  return (
    <div
      className={`relative ${isInteractive ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={isInteractive ? onClick : undefined}
    >
      <Application
        width={cardWidth}
        height={cardHeight}
        backgroundAlpha={0}
        className="rounded-2xl overflow-hidden shadow-xl"
      >
        <pixiContainer
          x={cardWidth / 2}
          y={cardHeight / 2 + cardY + floatingOffset}
          scale={cardScale}
          rotation={cardRotation * Math.PI / 180}
        >
          {/* Card Back Side */}
          <pixiGraphics draw={drawCardBackground} />

          {/* Back Content */}
          <pixiText
            text={type === 'truth' ? '❓' : '🎭'}
            anchor={0.5}
            x={0}
            y={-60}
            style={
              new PIXI.TextStyle({
                fontSize: 48,
                fill: '#ffffff',
              })
            }
          />

          <pixiText
            text={type === 'truth' ? 'TRUTH' : 'TRICK'}
            anchor={0.5}
            x={0}
            y={-20}
            style={
              new PIXI.TextStyle({
                fontSize: 20,
                fontWeight: 'bold',
                fill: '#ffffff',
                dropShadow: true,
                // dropShadowColor: '#000000',
                // dropShadowBlur: 4,
                // dropShadowDistance: 2,
              })
            }
          />

          <pixiText
            text={type === 'truth' ? 'Câu hỏi thật thà' : 'Câu hỏi thử thách'}
            anchor={0.5}
            x={0}
            y={5}
            style={
              new PIXI.TextStyle({
                fontSize: 14,
                fill: type === 'truth' ? '#dbeafe' : '#fecaca',
              })
            }
          />

          <pixiText
            text={type === 'truth' ? '🤔💭' : '😈🎪'}
            anchor={0.5}
            x={0}
            y={35}
            style={
              new PIXI.TextStyle({
                fontSize: 18,
                fill: '#ffffff',
              })
            }
          />

          {/* Card Front Side - Rotated 180 degrees */}
          <pixiContainer rotation={Math.PI}>
            <pixiGraphics draw={drawFrontBackground} />

            {/* Front Content */}
            <pixiText
              text={type === 'truth' ? '❓' : '🎭'}
              anchor={0.5}
              x={0}
              y={-60}
              style={
                new PIXI.TextStyle({
                  fontSize: 40,
                  fill: '#ffffff',
                })
              }
            />

            <pixiText
              text={type === 'truth' ? 'TRUTH' : 'TRICK'}
              anchor={0.5}
              x={0}
              y={-20}
              style={
                new PIXI.TextStyle({
                  fontSize: 18,
                  fontWeight: 'bold',
                  fill: '#ffffff',
                  dropShadow: true,
                //   dropShadowColor: '#000000',
                //   dropShadowBlur: 4,
                //   dropShadowDistance: 2,
                })
              }
            />

            {/* Prompt Content Box */}
            {promptContent && (
              <>
                <pixiGraphics
                  draw={(g: PIXI.Graphics) => {
                    g.clear();
                    g.beginFill(0xffffff, 0.1);
                    g.drawRoundedRect(-90, -40, 180, 80, 12);
                    g.endFill();
                  }}
                />

                <pixiText
                  text={promptContent.length > 50 ? promptContent.substring(0, 50) + '...' : promptContent}
                  anchor={0.5}
                  x={0}
                  y={0}
                  style={
                    new PIXI.TextStyle({
                      fontSize: 12,
                      fill: '#ffffff',
                      align: 'center',
                      wordWrap: true,
                      wordWrapWidth: 160,
                    })
                  }
                />
              </>
            )}

            <pixiText
              text="🎯✨"
              anchor={0.5}
              x={0}
              y={50}
              style={
                new PIXI.TextStyle({
                  fontSize: 16,
                  fill: '#ffffff',
                })
              }
            />
          </pixiContainer>
        </pixiContainer>
      </Application>
    </div>
  );
};

export default PixiCard;
