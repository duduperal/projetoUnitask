import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text, View, ActivityIndicator } from 'react-native'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import LoginScreen from './src/screens/LoginScreen'
import CadastroScreen from './src/screens/CadastroScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import TarefasScreen from './src/screens/TarefasScreen'
import GruposScreen from './src/screens/GruposScreen'
import NotificacoesScreen from './src/screens/NotificacoesScreen'
import TarefaDetalheScreen from './src/screens/TarefaDetalheScreen'
import GrupoDetalheScreen from './src/screens/GrupoDetalheScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function TabIcon({ label, emoji, focused }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{ fontSize: 10, color: focused ? '#6366F1' : '#9CA3AF', fontWeight: focused ? '700' : '400' }}>{label}</Text>
    </View>
  )
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarShowLabel: false, tabBarStyle: { height: 64, paddingBottom: 8 } }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Início" emoji="🏠" focused={focused} /> }}
      />
      <Tab.Screen
        name="Tarefas"
        component={TarefasScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Tarefas" emoji="✅" focused={focused} /> }}
      />
      <Tab.Screen
        name="Grupos"
        component={GruposScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Grupos" emoji="👥" focused={focused} /> }}
      />
      <Tab.Screen
        name="Notificacoes"
        component={NotificacoesScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon label="Alertas" emoji="🔔" focused={focused} /> }}
      />
    </Tab.Navigator>
  )
}

function Routes() {
  const { usuario, carregando } = useAuth()

  if (carregando) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {usuario ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="TarefaDetalhe" component={TarefaDetalheScreen} />
          <Stack.Screen name="GrupoDetalhe" component={GrupoDetalheScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Cadastro" component={CadastroScreen} />
        </>
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Routes />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
