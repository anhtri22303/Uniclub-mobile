import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
    Circle,
    Defs,
    G,
    LinearGradient,
    Path,
    Rect,
    Stop
} from 'react-native-svg';

interface UniClubLogoProps {
  size?: number;
  showText?: boolean;
}

export const UniClubLogo: React.FC<UniClubLogoProps> = ({ 
  size = 120, 
  showText = true 
}) => {
  const logoSize = size;
  const textSize = size * 0.15;
  
  return (
    <View style={[styles.container, { width: logoSize, height: showText ? logoSize * 1.2 : logoSize }]}>
      <Svg width={logoSize} height={logoSize} viewBox="0 0 400 400">
        <Defs>
          {/* Blue gradient for U */}
          <LinearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#1E40AF" />
            <Stop offset="100%" stopColor="#3B82F6" />
          </LinearGradient>
          
          {/* Teal gradient for C */}
          <LinearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#0D9488" />
            <Stop offset="100%" stopColor="#14B8A6" />
          </LinearGradient>
          
          {/* Green gradient for circuit */}
          <LinearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#10B981" />
            <Stop offset="100%" stopColor="#34D399" />
          </LinearGradient>
        </Defs>
        
        {/* Background circle */}
        <Circle cx="200" cy="200" r="190" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
        
        {/* Letter U with circuit pattern */}
        <G>
          {/* Main U shape */}
          <Path
            d="M80 120 L80 240 Q80 280 120 280 L160 280 Q200 280 200 240 L200 120"
            stroke="url(#blueGradient)"
            strokeWidth="20"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Circuit pattern on U */}
          <Circle cx="90" cy="140" r="3" fill="url(#blueGradient)" />
          <Circle cx="110" cy="160" r="2" fill="url(#blueGradient)" />
          <Circle cx="90" cy="200" r="2" fill="url(#blueGradient)" />
          <Path d="M90 140 L110 160 M110 160 L90 200" stroke="url(#blueGradient)" strokeWidth="1" />
          
          <Circle cx="180" cy="150" r="3" fill="url(#blueGradient)" />
          <Circle cx="160" cy="170" r="2" fill="url(#blueGradient)" />
          <Circle cx="180" cy="190" r="2" fill="url(#blueGradient)" />
          <Path d="M180 150 L160 170 M160 170 L180 190" stroke="url(#blueGradient)" strokeWidth="1" />
        </G>
        
        {/* Letter C with circuit pattern */}
        <G>
          {/* Main C shape */}
          <Path
            d="M320 160 Q280 120 240 160 L240 240 Q280 280 320 240"
            stroke="url(#tealGradient)"
            strokeWidth="20"
            fill="none"
            strokeLinecap="round"
          />
          
          {/* Circuit pattern on C */}
          <Circle cx="300" cy="140" r="3" fill="url(#tealGradient)" />
          <Circle cx="280" cy="160" r="2" fill="url(#tealGradient)" />
          <Circle cx="260" cy="180" r="2" fill="url(#tealGradient)" />
          <Path d="M300 140 L280 160 L260 180" stroke="url(#tealGradient)" strokeWidth="1" />
          
          <Circle cx="260" cy="220" r="2" fill="url(#tealGradient)" />
          <Circle cx="280" cy="240" r="2" fill="url(#tealGradient)" />
          <Circle cx="300" cy="260" r="3" fill="url(#tealGradient)" />
          <Path d="M260 220 L280 240 L300 260" stroke="url(#tealGradient)" strokeWidth="1" />
        </G>
        
        {/* Connecting circuit lines */}
        <G>
          <Path 
            d="M200 180 Q220 160 240 180" 
            stroke="url(#greenGradient)" 
            strokeWidth="3" 
            fill="none"
            strokeDasharray="5,3"
          />
          
          <Circle cx="220" cy="170" r="4" fill="url(#greenGradient)" />
          <Circle cx="210" cy="185" r="2" fill="url(#greenGradient)" />
          <Circle cx="230" cy="185" r="2" fill="url(#greenGradient)" />
        </G>
        
        {/* Signal waves */}
        <G opacity="0.6">
          <Path d="M340 100 Q350 110 340 120 Q330 110 340 100" stroke="url(#greenGradient)" strokeWidth="2" fill="none" />
          <Path d="M350 90 Q365 105 350 120 Q335 105 350 90" stroke="url(#greenGradient)" strokeWidth="2" fill="none" />
          <Path d="M360 80 Q380 100 360 120 Q340 100 360 80" stroke="url(#greenGradient)" strokeWidth="2" fill="none" />
        </G>
        
        {/* Additional circuit elements */}
        <G>
          <Rect x="70" y="300" width="8" height="4" fill="url(#blueGradient)" />
          <Rect x="85" y="295" width="4" height="8" fill="url(#tealGradient)" />
          <Rect x="320" y="300" width="8" height="4" fill="url(#greenGradient)" />
          <Rect x="330" y="295" width="4" height="8" fill="url(#tealGradient)" />
        </G>
      </Svg>
      
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.logoText, { fontSize: textSize * 1.5 }]}>
            UniClub
          </Text>
          <Text style={[styles.taglineText, { fontSize: textSize * 0.6 }]}>
            DIGITALIZING COMMUNITIES
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  logoText: {
    fontWeight: 'bold',
    color: '#1E40AF',
    letterSpacing: 1,
  },
  taglineText: {
    color: '#0D9488',
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});