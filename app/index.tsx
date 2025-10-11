
import { Asset } from "expo-asset";
import { ResizeMode, Video } from "expo-av";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const IntroScreen = () => {
  const router = useRouter();
  const [videoReady, setVideoReady] = useState(false);

  const introVideo = require("../assets/videos/intro.mp4");

  // Preload video
  useEffect(() => {
    (async () => {
      try {
        await Asset.loadAsync(introVideo);
        setVideoReady(true);
      } catch (e) {
        console.warn("Error preloading video:", e);
        router.replace("/CarouselScreen");
      }
    })();
  }, []);

  if (!videoReady) {
    return <View style={{ flex: 1, backgroundColor: "black" }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <Video
        source={introVideo}
        style={{ flex: 1, width: "100%", height: "100%" }}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay
        isLooping={false}
        useNativeControls={false}
      />
      <View style={styles.videoButtonRow}>
        <TouchableOpacity
          style={styles.skipVideoButton}
          onPress={() => router.replace("/CarouselScreen")}
        >
          <Text style={styles.skipVideoText}>Continuer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  videoButtonRow: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  skipVideoButton: {
    backgroundColor: "#080808",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  skipVideoText: {
    color: "#ffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default IntroScreen;
