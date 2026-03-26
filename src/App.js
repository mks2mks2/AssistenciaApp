import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import StatsScreen from './screens/StatsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1a237e' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: '⛪ Assistência' }} />
        <Stack.Screen name="Stats" component={StatsScreen} options={{ title: 'Estatísticas' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
