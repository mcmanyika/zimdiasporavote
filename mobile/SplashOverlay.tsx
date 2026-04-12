import { useEffect, useRef } from 'react'
import {
  View,
  Text,
  Image,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native'

const { width } = Dimensions.get('window')

interface SplashOverlayProps {
  visible: boolean
  onEnter: () => void
}

export default function SplashOverlay({ visible, onEnter }: SplashOverlayProps) {
  const fadeAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!visible) {
      // Fade out over 600ms
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start()
    }
  }, [visible, fadeAnim])

  if (!visible) {
    // After fade out, don't render at all
    return null
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('./assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* App Name */}
      <Text style={styles.title}>Diaspora Vote</Text>

      {/* Tagline */}
      <Text style={styles.tagline}>Our Constitution. Our Future</Text>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Organization Description */}
      <Text style={styles.description}>
        Non partisan inclusive political organization
      </Text>

      {/* Enter Button */}
      <TouchableOpacity style={styles.enterButton} onPress={onEnter} activeOpacity={0.8}>
        <Text style={styles.enterButtonText}>Enter</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: (width * 0.35) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: width * 0.28,
    height: width * 0.28,
    borderRadius: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: '#334155',
    marginBottom: 16,
    borderRadius: 1,
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 40,
  },
  enterButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 10,
  },
  enterButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
})
