import { Link, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const data = [
  {
    title: "Bienvenue sur FreezyCorp ",
    description: "",
  },
  {
    title: "",
    description: " Votre partenaire premium en climatisation, maintenance et solutions techniques.",
  },
  {
    title: "",
    description: "Simplifiez la gestion de vos projets et gagnez en sérénité, dès aujourd’hui.",
  },
  
];

const CarouselScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<any>>(null);
  const router = useRouter();

  const handleNext = () => {
    if (currentIndex < data.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.push("../(auth)/LogIn");
    }
  };

  const handleSkip = () => {
    router.push("../(auth)/LogIn");
  };

  return (
    <View style={styles.containerzero}>
      <View style={styles.container}>
        <View style={styles.blueOverlay} />
        <ImageBackground
          source={require("../../assets/images/Intersection3.png")}
          style={styles.background}
          imageStyle={{ opacity: 0.6 }}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <Image
              source={require("../../assets/images/logoFreezyCorp.png")}
              style={styles.logo}
            />
          </View>
        </ImageBackground>
      </View>

      <View style={styles.pagination}>
        {data.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, currentIndex === index && styles.activeDot]}
          />
        ))}
      </View>

      <FlatList
        ref={flatListRef}
        data={data}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={{ width, paddingHorizontal: 20 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.sectionText}>{item.description}</Text>
          </View>
        )}
      />

      <View style={styles.buttonRow}>
        <Link href="../(auth)/LogIn" asChild>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSkip}>
            <Text style={styles.buttonText}>Sauter l'étape</Text>
          </TouchableOpacity>
        </Link>

        <TouchableOpacity style={styles.secondeButton} onPress={handleNext}>
          <Text style={styles.secondeButtonText}>Suivant</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerzero: { flex: 1, flexDirection: "column" },
  container: {},
  background: {
    justifyContent: "center",
    alignItems: "center",
    height: height * 0.6,
  },
  overlay: { alignItems: "center" },
  blueOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#013743" },
  logo: {
    marginTop: height * 0.35,
    width: width * 0.4,
    height: width * 0.4,
    resizeMode: "contain",
    marginBottom: 20,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
    marginBottom: 10,
  },
  dot: {
    height: 8,
    width: 8,
    backgroundColor: "#A5A5A5",
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: { backgroundColor: "#013743", width: 10 },
  title: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    color: "#04D9E7",
    textAlign: "center",
    marginTop: 10,
  },
  sectionText: {
    fontSize: width * 0.035,
    marginBottom: 20,
    textAlign: "center",
    color: "#A5A5A5",
  },
  buttonRow: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "transparent",
    padding: 15,
    borderRadius: 8,
    width: width * 0.45,
    alignItems: "center",
  },
  buttonText: { color: "#8D8D8D", fontSize: width * 0.04, fontWeight: "bold" },
  secondeButton: {
    backgroundColor: "#080808",
    padding: 10,
    borderRadius: 8,
    width: width * 0.3,
    alignItems: "center",
  },
  secondeButtonText: {
    color: "#FFFFFF",
    fontSize: width * 0.04,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default CarouselScreen;
