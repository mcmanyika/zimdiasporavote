import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  StyleSheet,
  BackHandler,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import { WebView } from 'react-native-webview'
import SplashOverlay from './SplashOverlay'

const SITE_URL = 'https://diasporavote.org'

export default function App() {
  const [isReady, setIsReady] = useState(false)
  const [showOverlay, setShowOverlay] = useState(true)
  const webViewRef = useRef<WebView>(null)

  // Handle Android back button
  useEffect(() => {
    if (Platform.OS !== 'android') return

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (webViewRef.current) {
          webViewRef.current.goBack()
          return true
        }
        return false
      }
    )

    return () => backHandler.remove()
  }, [])

  // User taps Enter button — dismiss splash
  const handleEnter = useCallback(() => {
    setIsReady(true)
    setTimeout(() => setShowOverlay(false), 700)
  }, [])

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        {/* WebView - loads in background */}
        <WebView
          ref={webViewRef}
          source={{ uri: SITE_URL }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          allowsBackForwardNavigationGestures
          cacheEnabled
          applicationNameForUserAgent="DiasporaVoteMobile/1.0"
          pullToRefreshEnabled
        />

        {/* Custom splash overlay - shows until user taps Enter */}
        {showOverlay && <SplashOverlay visible={!isReady} onEnter={handleEnter} />}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
})
