import "react-native-gesture-handler";
import "react-native-reanimated";
import { enableScreens } from "react-native-screens";
enableScreens(true);

import React from "react";
import CheongnyangniRouteScreen from "./src/screens/station/CheongnyangniRouteScreen";

export default function App() {
  return <CheongnyangniRouteScreen />;
}
