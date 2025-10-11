import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
//import GoogleButton from "../components/GoogleButton";
import { useAuth } from "./../context/AuthContext";

const { width, height } = Dimensions.get("window");

const LogIn = () => {
  const [email, setEmail] = useState("");
  const [motpasse, setMotpasse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login ,registerGoogle } = useAuth();
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ 
    title: '', 
    message: '', 
    onConfirm: null as (() => void) | null 
  });

  // Function to show custom alert
  const showCustomAlertMessage = (title: string, message: string, onConfirm?: () => void) => {
    setAlertConfig({
      title,
      message,
      onConfirm: onConfirm || null
    });
    setShowCustomAlert(true);
  };

  const handleCustomAlertClose = () => {
    setShowCustomAlert(false);
  };

  const handleCustomAlertConfirm = () => {
    if (alertConfig.onConfirm) {
      alertConfig.onConfirm();
    }
    setShowCustomAlert(false);
  };

  // Email validation function
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation function
  const isValidPassword = (password: string) => {
    return password.length >= 6;
  };

  const handleLogin = async () => {
    // Validate email format
    if (!email || !motpasse) {
      showCustomAlertMessage("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    if (!isValidEmail(email)) {
      showCustomAlertMessage("Erreur", "Veuillez entrer une adresse email valide");
      return;
    }

    if (!isValidPassword(motpasse)) {
      showCustomAlertMessage("Erreur", "Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, motpasse);
      showCustomAlertMessage(
        "Succès", 
        "Connexion réussie ✅", 
        () => router.push("../(freezycorp)/Home")
      );
    } catch (error) {
      // Error handling is done in the AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView>
      {/* Custom Alert Modal */}
      <Modal
        visible={showCustomAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCustomAlertClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.customAlert}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            </View>
            <View style={styles.alertBody}>
              <Text style={styles.alertMessage}>
                {alertConfig.message}
              </Text>
            </View>
            <View style={styles.alertFooter}>
              <TouchableOpacity 
                style={styles.alertButton}
                onPress={alertConfig.onConfirm ? handleCustomAlertConfirm : handleCustomAlertClose}
              >
                <Text style={styles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    
      </View>
       {/*<GoogleButton onPress={registerGoogle} />*/} 
      
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
    backgroundColor: "#080808",
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
  // Custom Alert Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  customAlert: {
    width: width * 0.85,
    backgroundColor: '#080808',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10
  },
  alertHeader: {
    backgroundColor: '#04D9E7',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  alertTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#080808',
    textAlign: 'center'
  },
  alertBody: {
    padding: 25,
    alignItems: 'center',
    justifyContent: 'center'
  },
  alertMessage: {
    fontSize: width * 0.045,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500'
  },
  alertFooter: {
    padding: 20,
    paddingTop: 10,
    alignItems: 'center'
  },
  alertButton: {
    backgroundColor: '#04D9E7',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    minWidth: 120
  },
  alertButtonText: {
    color: '#080808',
    fontSize: width * 0.045,
    fontWeight: 'bold',
    textAlign: 'center'
  }
});

export default LogIn;