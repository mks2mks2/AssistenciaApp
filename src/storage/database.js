import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'assistencia_';

export const saveReuniao = async (reuniao) => {
  // reuniao: { id, data (ISO string), diaSemana, zoom, presencial, eventoEspecial }
  await AsyncStorage.setItem(PREFIX + reuniao.id, JSON.stringify(reuniao));
};

export const deleteReuniao = async (id) => {
  await AsyncStorage.removeItem(PREFIX + id);
};

export const getReunioesByMonth = async (year, month) => {
  const keys = await AsyncStorage.getAllKeys();
  const filtered = keys.filter(k => k.startsWith(PREFIX));
  const pairs = await AsyncStorage.multiGet(filtered);
  const all = pairs.map(([, v]) => JSON.parse(v));
  return all
    .filter(r => {
      const d = new Date(r.data);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    })
    .sort((a, b) => new Date(a.data) - new Date(b.data));
};

export const getAllMonths = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const filtered = keys.filter(k => k.startsWith(PREFIX));
  const pairs = await AsyncStorage.multiGet(filtered);
  const all = pairs.map(([, v]) => JSON.parse(v));
  const months = new Set(all.map(r => {
    const d = new Date(r.data);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }));
  return Array.from(months).sort().reverse();
};