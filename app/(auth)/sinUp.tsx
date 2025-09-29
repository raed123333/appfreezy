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
import { useAuth } from "./../context/AuthContext";
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get("window");

const sinUp = () => {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motpasse, setMotpasse] = useState("");
  const [confirmMotpasse, setConfirmMotpasse] = useState("");
  const [image, setImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 4],
        quality: 1,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        setImage(`data:image/jpeg;base64,${selectedImage.base64}`);
      } else {
        console.log("No image selected");
      }
    } catch (err) {
      console.error("Error picking image:", err);
      Alert.alert("Erreur", "Impossible de sélectionner l'image");
    }
  };

  const handleRegister = async () => {
    if (!nom || !prenom || !email || !nomEntreprise || !adresse || !telephone || !motpasse || !confirmMotpasse) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }

    if (motpasse !== confirmMotpasse) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    if (motpasse.length < 6) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsLoading(true);
    try {
      await register({
        nom,
        prenom,
        email,
        nomEntreprise,
        adresse,
        telephone,
        motpasse,
        image,
      });
      
      Alert.alert("Succès", "Compte créé avec succès", [
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
            <Text style={styles.title}>S'inscrire</Text>
            <Text style={styles.sectionText}>
              Lorem ipsum dolor sit amet. Et omnis{'\n'} 
              repellendus nam magnam 
            </Text>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Nom"
          placeholderTextColor="#B0B3C1"
          value={nom}
          onChangeText={setNom}
        />
        <TextInput
          style={styles.input}
          placeholder="Prenom"
          placeholderTextColor="#B0B3C1"
          value={prenom}
          onChangeText={setPrenom}
        />
        <TextInput
          style={styles.input}
          placeholder="mail@mail.com"
          placeholderTextColor="#B0B3C1"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Nom de l'entreprise"
          placeholderTextColor="#B0B3C1"
          value={nomEntreprise}
          onChangeText={setNomEntreprise}
        />
        <TextInput
          style={styles.input}
          placeholder="Adresse"
          placeholderTextColor="#B0B3C1"
          value={adresse}
          onChangeText={setAdresse}
        />
        <TextInput
          style={styles.input}
          placeholder="Téléphone"
          placeholderTextColor="#B0B3C1"
          value={telephone}
          onChangeText={setTelephone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="créér motpasse"
          placeholderTextColor="#B0B3C1"
          secureTextEntry
          value={motpasse}
          onChangeText={setMotpasse}
        />
        <TextInput
          style={styles.input}
          placeholder="confirmer motpasse"
          placeholderTextColor="#B0B3C1"
          secureTextEntry
          value={confirmMotpasse}
          onChangeText={setConfirmMotpasse}
        />

        {/* Image Picker Section */}
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {image ? (
            <Image source={{ uri: image }} style={styles.imagePreview} />
          ) : (
            <Text style={styles.imagePlaceholder}>+ Ajouter une photo</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.secondeButton, isLoading && styles.disabledButton]} 
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.secondeButtonText}>
            {isLoading ? "Création..." : "S'inscrire"}
          </Text>
        </TouchableOpacity>

        <View style={styles.TextRow}>
          <Text style={styles.MotText}>Vous n'avez pas de compte ? </Text>
          <Link href="../LogIn" asChild>
            <Text style={styles.MotTextTwo}> Se connecter</Text>
          </Link>
        </View>
      </View>
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
    marginTop: 20,
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
  imagePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    width: width * 0.85,
    height: 100,
    borderRadius: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#B0B3C1',
    borderStyle: 'dashed',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  imagePlaceholder: {
    color: '#B0B3C1',
    fontSize: width * 0.04,
  },
});

export default sinUp;