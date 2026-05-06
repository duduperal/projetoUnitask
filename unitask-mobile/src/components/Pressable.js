import { useRef } from 'react'
import { Animated, Pressable } from 'react-native'
import * as Haptics from 'expo-haptics'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

/**
 * Pressable com escala animada e haptic feedback.
 * Use como wrapper para qualquer card/botão clicável.
 *
 * Aplica animação direto no Pressable (via Animated.createAnimatedComponent),
 * o que evita o problema de layout do Animated.View interno colapsando.
 */
export default function PressableScale({
  onPress,
  onLongPress,
  haptic = 'light',
  scale = 0.97,
  style,
  children,
  disabled,
  hitSlop,
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
      const fbStyle = Haptics.ImpactFeedbackStyle?.[map[haptic]]
      if (fbStyle) Haptics.impactAsync(fbStyle).catch(() => {})
    }
    onPress?.()
  }

  return (
    <AnimatedPressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={handlePress}
      onLongPress={onLongPress}
      disabled={disabled}
      hitSlop={hitSlop}
      style={[style, { transform: [{ scale: scaleAnim }] }]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  )
}
