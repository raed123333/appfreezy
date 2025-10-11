import { Link } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import CeQueDisentClients from "./CeQueDisentClients";
import NosOffres from "./NosOffres";

const { height } = Dimensions.get("window");

const Home: React.FC = () => {
  return (
    <View style={{ flex: 1 }}>
      {/* Fixed NavBar */}
      <View style={styles.NavBarcontainer}>
        <View style={styles.blueOverlay} />
        <ImageBackground
          style={styles.NavBarbackground}
          imageStyle={{ opacity: 0.6 }}
          resizeMode="cover"
        >
          <View style={styles.headerRow}>
            <Text style={styles.titleBonjour}>Bonjour</Text>
            <Link href="./Menu" asChild>
              <TouchableOpacity>
                <Image
                  source={require("../../assets/images/iconHome.png")}
                  style={styles.homeIcon}
                />
              </TouchableOpacity>
            </Link>
          </View>

          <Text style={styles.nomPrenom}>
            Bienvenue dans l’univers FreezyCorp, où chaque solution est pensée pour vous offrir fiabilité,
            rapidité et tranquillité d’esprit.
          </Text>
        </ImageBackground>
      </View>

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={{ paddingTop: height * 0.2 }}>
        {/* container for specific for image  */}
        <View style={styles.container}>
          <View style={styles.blueOverlay} />
          <ImageBackground
            style={styles.background}
            imageStyle={{ opacity: 0.6 }}
            resizeMode="cover"
          ></ImageBackground>
        </View>

        <View style={styles.dividerWrapper}>
          <Image
            source={require("../../assets/images/Intersection.png")}
            style={styles.Intersection}
          />
        </View>

        {/* Section A propos */}
        <View style={styles.secondeContainer}>
          <Text style={{ color: "#080808", fontSize: 24, fontWeight: "bold" }}>
            A propos 
          </Text>
          <Text style={{ color: "#04D9E7", fontSize: 24, fontWeight: "bold" }}>
            FreezyCorp
          </Text>
          <Text
            style={{
              color: "#000000",
              fontSize: 14,
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            Experts en climatisation et maintenance technique{"\n"}
            nous vous accompagnons avec des solutions{"\n"}
            sur-mesure, disponibles à tout moment.{"\n"}
            Notre mission : assurer la continuité de vos activités, sans interruption.{"\n"}
            

          </Text>
        </View>

        {/* Nos Offres Section */}
        <NosOffres />

        {/* Clients Section */}
        <CeQueDisentClients />
      </ScrollView>
    </View>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  NavBarcontainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#080808",
  },
  NavBarbackground: {
    justifyContent: "flex-start",
    alignItems: "flex-start",
    height: height * 0.2,
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  container: { flex: 1, backgroundColor: "#080808" },
  background: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "flex-start",
    height: height * 0.2,
    paddingTop: 40,
    paddingHorizontal: 10,
  },
  blueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#080808",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  titleBonjour: {
    fontSize: width * 0.07,
    fontWeight: "bold",
    color: "#04D9E7",
  },
  homeIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  nomPrenom: {
    fontSize: width * 0.04,
    color: "#FFFFFF",
    lineHeight: 20,
    marginTop: 10,
    width: "95%",
  },
  dividerWrapper: {
    backgroundColor: "#FFFFFF",
    marginTop: -1,
  },
  Intersection: {
    width: "100%",
    resizeMode: "contain",
    marginTop: -120,
    zIndex: 2,
  },
  secondeContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
});

export default Home;
