import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import GoogleButton from "../components/GoogleButton";
import { useAuth } from "./../context/AuthContext";

const { width, height } = Dimensions.get("window");

const LogIn = () => {
  const [email, setEmail] = useState("benfoulen@gmail.com");
  const [motpasse, setMotpasse] = useState("azerty");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login ,registerGoogle } = useAuth();

  const handleLogin = async () => {
    if (!email || !motpasse) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, motpasse);
      Alert.alert("Succès", "Connexion réussie", [
        {
          text: "OK",
          onPress: () => router.push("../(freezycorp)/Home"),
        },
      ]);
    } catch (error) {
      // Error handling is done in the AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.blueOverlay} />
        <ImageBackground
          style={styles.background}
          imageStyle={{ opacity: 0.6 }}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <Image
              source={require("../../assets/images/logoGold.png")}
              style={styles.logo}
            />
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.sectionText}>
              Accédez à votre espace sécurisé et pilotez vos{'\n'}
              interventions en toute simplicité.
            </Text>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#B0B3C1"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de Passe"
          placeholderTextColor="#B0B3C1"
          secureTextEntry
          value={motpasse}
          onChangeText={setMotpasse}
        />

        {/* Updated Forgot Password Link */}
        <Link href="/forgotPassword" asChild>
          <TouchableOpacity>
            <Text style={styles.MotText}>Mot de passe oublié?</Text>
          </TouchableOpacity>
        </Link>

        <TouchableOpacity
          style={[styles.secondeButton, isLoading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <Text style={styles.secondeButtonText}>
            {isLoading ? "Connexion..." : "Se connecter"}
          </Text>
        </TouchableOpacity>

        <View style={styles.TextRow}>
          <Text style={styles.MotText}>Pas encore de compte ? </Text>
          <Link href="../sinUp" asChild>
            <Text style={styles.MotTextTwo}> Inscrivez-vous</Text>
          </Link>
        </View>
        <Image
          source={require("../../assets/images/search.png")}
          style={styles.search}
        />
      </View>
      <GoogleButton onPress={registerGoogle} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: height * 0.3,
  },
  overlay: {
    alignItems: "center",
  },
  blueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#013743",
  },
  logo: {
    marginTop: height * 0.0001,
    width: width * 0.4,
    height: width * 0.4,
    resizeMode: "contain",
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    color: "#04D9E7",
    textAlign: "center",
  },
  sectionText: {
    fontSize: width * 0.035,
    marginBottom: 20,
    textAlign: "center",
    color: "#A5A5A5",
  },
  primaryButton: {
    backgroundColor: "transparent",
    padding: 15,
    borderRadius: 8,
    width: width * 0.45,
    alignItems: "center",
  },
  MotText: {
    color: "#8D8D8D",
    fontSize: width * 0.04,
    fontWeight: "bold",
    marginBottom: 15,
  },
  MotTextTwo: {
    color: "#04D9E7",
    fontSize: width * 0.04,
    fontWeight: "bold",
    marginBottom: 15,
  },
  secondeButton: {
    backgroundColor: "#04D9E7",
    padding: 10,
    borderRadius: 8,
    width: width * 0.80,
    alignItems: "center",
  },
  secondeButtonText: {
    color: "#FFFFFF",
    fontSize: width * 0.05,
    fontWeight: "bold",
    textAlign: "center",
  },
  input: {
    height: 50,
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingLeft: 15,
    color: '#23233C',
    marginBottom: 18,
  },
  inputContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },
  TextRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  search: {
    marginTop: height * 0.0001,
    width: width * 0.1,
    height: width * 0.1,
    resizeMode: "contain",
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default LogIn;