import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, Pattern, Polygon, Rect } from 'react-native-svg';

interface PatternRendererProps {
  pattern: string;
  opacity: number;
}

export const PatternRenderer: React.FC<PatternRendererProps> = ({ pattern, opacity }) => {
  const opacityValue = opacity / 100;

  switch (pattern) {
    case 'circles':
      return (
        <>
          <View 
            className="absolute -top-8 -left-8 w-32 h-32 bg-white rounded-full" 
            style={{ opacity: opacityValue }}
          />
          <View 
            className="absolute -bottom-12 -right-12 w-48 h-48 bg-white rounded-full" 
            style={{ opacity: opacityValue }}
          />
          <View 
            className="absolute top-1/2 left-1/3 w-20 h-20 bg-white rounded-full" 
            style={{ opacity: opacityValue }}
          />
        </>
      );

    case 'waves':
      return (
        <View className="absolute inset-0" style={{ opacity: opacityValue }}>
          <Svg width="100%" height="100%" viewBox="0 0 1000 1000">
            <Defs>
              <Pattern
                id="waves"
                x="0"
                y="0"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <Line x1="0" y1="50" x2="25" y2="25" stroke="white" strokeWidth="2" />
                <Line x1="25" y1="25" x2="50" y2="50" stroke="white" strokeWidth="2" />
                <Line x1="50" y1="50" x2="75" y2="25" stroke="white" strokeWidth="2" />
                <Line x1="75" y1="25" x2="100" y2="50" stroke="white" strokeWidth="2" />
                
                <Line x1="0" y1="75" x2="25" y2="50" stroke="white" strokeWidth="2" />
                <Line x1="25" y1="50" x2="50" y2="75" stroke="white" strokeWidth="2" />
                <Line x1="50" y1="75" x2="75" y2="50" stroke="white" strokeWidth="2" />
                <Line x1="75" y1="50" x2="100" y2="75" stroke="white" strokeWidth="2" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#waves)" />
          </Svg>
        </View>
      );

    case 'grid':
      return (
        <View className="absolute inset-0" style={{ opacity: opacityValue }}>
          <Svg width="100%" height="100%" viewBox="0 0 1000 1000">
            <Defs>
              <Pattern
                id="grid"
                x="0"
                y="0"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <Line x1="0" y1="0" x2="0" y2="40" stroke="white" strokeWidth="2" />
                <Line x1="0" y1="0" x2="40" y2="0" stroke="white" strokeWidth="2" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#grid)" />
          </Svg>
        </View>
      );

    case 'dots':
      return (
        <View className="absolute inset-0" style={{ opacity: opacityValue }}>
          <Svg width="100%" height="100%" viewBox="0 0 1000 1000">
            <Defs>
              <Pattern
                id="dots"
                x="0"
                y="0"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <Circle cx="20" cy="20" r="3" fill="white" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#dots)" />
          </Svg>
        </View>
      );

    case 'diagonal':
      return (
        <View className="absolute inset-0" style={{ opacity: opacityValue }}>
          <Svg width="100%" height="100%" viewBox="0 0 1000 1000">
            <Defs>
              <Pattern
                id="diagonal"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <Line x1="0" y1="0" x2="0" y2="20" stroke="white" strokeWidth="2" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#diagonal)" />
          </Svg>
        </View>
      );

    case 'hexagon':
      return (
        <View className="absolute inset-0" style={{ opacity: opacityValue }}>
          <Svg width="100%" height="100%" viewBox="0 0 1000 1000">
            <Defs>
              <Pattern
                id="hexagons"
                x="0"
                y="0"
                width="56"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <Polygon
                  points="28,25 50,37.5 50,62.5 28,75 6,62.5 6,37.5"
                  stroke="white"
                  fill="none"
                  strokeWidth="2"
                />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#hexagons)" />
          </Svg>
        </View>
      );

    case 'triangles':
      return (
        <View className="absolute inset-0" style={{ opacity: opacityValue }}>
          <Svg width="100%" height="100%" viewBox="0 0 1000 1000">
            <Defs>
              <Pattern
                id="triangles"
                x="0"
                y="0"
                width="80"
                height="80"
                patternUnits="userSpaceOnUse"
              >
                <Polygon
                  points="40,10 70,60 10,60"
                  stroke="white"
                  fill="none"
                  strokeWidth="2"
                />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#triangles)" />
          </Svg>
        </View>
      );

    case 'stars':
      return (
        <View className="absolute inset-0" style={{ opacity: opacityValue }}>
          <Svg width="100%" height="100%" viewBox="0 0 1000 1000">
            <Defs>
              <Pattern
                id="stars"
                x="0"
                y="0"
                width="100"
                height="100"
                patternUnits="userSpaceOnUse"
              >
                <Polygon
                  points="50,15 57,40 83,40 62,55 70,80 50,65 30,80 38,55 17,40 43,40"
                  stroke="white"
                  fill="none"
                  strokeWidth="2"
                />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#stars)" />
          </Svg>
        </View>
      );

    case 'none':
      return null;

    default:
      // Default to circles if pattern is unrecognized
      return (
        <>
          <View 
            className="absolute -top-8 -left-8 w-32 h-32 bg-white rounded-full" 
            style={{ opacity: opacityValue }}
          />
          <View 
            className="absolute -bottom-12 -right-12 w-48 h-48 bg-white rounded-full" 
            style={{ opacity: opacityValue }}
          />
          <View 
            className="absolute top-1/2 left-1/3 w-20 h-20 bg-white rounded-full" 
            style={{ opacity: opacityValue }}
          />
        </>
      );
  }
};

