// src/screens/SubwayRouteScreen.js
import React, { useEffect, useRef } from "react";
import { View, Platform } from "react-native";
import { WebView } from "react-native-webview";
import subwayGraph from "../assets/metro-data/graph/subway_graph.json";

// 🚇 HTML 템플릿: 네이버 지도 JS 삽입 + 그래프 렌더링
function createMapHTML(graph) {
  const encoded = JSON.stringify(graph);
  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="utf-8" />
      <title>Subway Route</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <script src="https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=YOUR_NCP_KEY_ID"></script>
      <style>
        html, body, #map {margin:0; padding:0; width:100%; height:100%; overflow:hidden;}
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const graph = ${encoded};
        const map = new naver.maps.Map('map', {
          center: new naver.maps.LatLng(37.5547, 126.9707),
          zoom: 12,
          mapTypeControl: true
        });

        // 노드 마커
        graph.nodes.forEach(n => {
          new naver.maps.Marker({
            map,
            position: new naver.maps.LatLng(n.lat, n.lon),
            title: n.name
          });
        });

        // 엣지 폴리라인
        graph.edges.forEach(e => {
          const a = graph.nodes.find(n => n.id === e.from);
          const b = graph.nodes.find(n => n.id === e.to);
          if (a && b) {
            new naver.maps.Polyline({
              map,
              path: [
                new naver.maps.LatLng(a.lat, a.lon),
                new naver.maps.LatLng(b.lat, b.lon)
              ],
              strokeColor: '#007aff',
              strokeWeight: 2,
              strokeOpacity: 0.7
            });
          }
        });

        // 중앙 맞춤
        const bounds = graph.nodes.reduce(
          (b, n) => b.extend(new naver.maps.LatLng(n.lat, n.lon)),
          new naver.maps.LatLngBounds(
            new naver.maps.LatLng(37.5547,126.9707),
            new naver.maps.LatLng(37.5547,126.9707)
          )
        );
        map.fitBounds(bounds);
      </script>
    </body>
    </html>
  `;
}

export default function SubwayRouteScreen() {
  const webRef = useRef(null);

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        source={{ html: createMapHTML(subwayGraph) }}
        style={{ flex: 1 }}
        mixedContentMode="always"
      />
    </View>
  );
}
