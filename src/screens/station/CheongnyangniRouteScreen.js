import React, { useEffect, useState } from "react";
import { View, ImageBackground, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import Svg, { Circle, Polyline, Text as SvgText } from "react-native-svg";
import { supabase } from "../../api/supabaseClient";

const { width, height } = Dimensions.get("window");

export default function CheongnyangniRouteScreen() {
  const [facilities, setFacilities] = useState([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFacilities() {
      const { data, error } = await supabase
        .from("facilities")
        .select("*")
        .eq("station_name", "청량리");

      if (error) console.error(error);
      else setFacilities(data);

      setLoading(false);
    }
    fetchFacilities();
  }, []);

  if (isLoading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#14CAC9" />
      </View>
    );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../assets/124_cheongnyangni.jpg")}
        style={styles.map}
        resizeMode="contain"
      >
        <Svg height="100%" width="100%">
          {facilities.map((f, i) => {
            const cx = f.x_ratio * width;
            const cy = f.y_ratio * height;

            let color = "#007aff"; // 기본 파랑
            if (f.type === "exit") color = "#ff3b30";
            else if (f.type === "elevator") color = "#34c759";
            else if (f.type === "toilet") color = "#af52de";

            return (
              <React.Fragment key={f.id}>
                <Circle cx={cx} cy={cy} r={5} fill={color} />
                <SvgText x={cx + 8} y={cy + 4} fill="#000" fontSize={9}>
                  {f.name}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  map: { flex: 1, width: width, height: height },
});
