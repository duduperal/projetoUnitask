import { useRef } from 'react'
import { Animated, Pressable, View } from 'react-native'
import * as Haptics from 'expo-haptics'

/**
 * Pressable com escala animada e haptic feedback.
 * Use como wrapper para qualquer card/botão clicável.
 */
export default function PressableScale({
  onPress,
  onLongPress,
  haptic = 'light',
  scale = 0.97,
  style,
  children,
  disabled,
  ...rest
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current

  function pressIn() {
    Animated.spring(scaleAnim, {
      toValue: scale,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0,
    }).start()
  }

  function pressOut() {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start()
  }

  function handlePress() {
    if (disabled) return
    if (haptic && Haptics?.impactAsync) {
      const map = { light: 'Light', medium: 'Medium', heavy: 'Heavy' }
      const style = Haptics.ImpactFeedbackStyle?.[map[haptic]]
      if (style) Haptics.impactAsync(style).catch(() => {})
    }
    onPress?.()
  }

  return (
    <Pressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={handlePress}
      onLongPress={onLongPress}
      disabled={disabled}
      {...rest}
    >
      <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
        {children}
      </Animated.View>
    </Pressable>
  )
}
