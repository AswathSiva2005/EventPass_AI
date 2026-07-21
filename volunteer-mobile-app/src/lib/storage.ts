import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const secureGet = async (key: string) => {
  if (Platform.OS === "web") {
    return await AsyncStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
};

const secureSet = async (key: string, value: string | null) => {
  if (Platform.OS === "web") {
    if (value === null) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, value);
    }
    return;
  }

  if (value === null) {
    await SecureStore.deleteItemAsync(key);
    return;
  }

  await SecureStore.setItemAsync(key, value);
};

export const secureStorage = {
  get: secureGet,
  set: secureSet
};

export const storage = {
  get: async (key: string) => await AsyncStorage.getItem(key),
  set: async (key: string, value: string) => await AsyncStorage.setItem(key, value),
  remove: async (key: string) => await AsyncStorage.removeItem(key)
};

export const readJson = async <T>(key: string, fallback: T): Promise<T> => {
  const value = await storage.get(key);
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};
