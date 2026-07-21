import { Redirect } from "expo-router";
import { LoadingState } from "../src/components/ui";
import { useAuth } from "../src/context/auth-context";

export default function Index() {
  const { account, hydrated } = useAuth();

  if (!hydrated) {
    return <LoadingState label="Warming up the volunteer app..." />;
  }

  return <Redirect href={account ? "/(tabs)/dashboard" : "/(auth)/login"} />;
}
