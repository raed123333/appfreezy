import * as ImagePicker from 'expo-image-picker';
import { router } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from "react";
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
import { API } from '@/config';

const { width, height } = Dimensions.get("window");

const Profile = () => {
  const { user, logout } = useAuth();
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

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      // Check different possible user structures
      const userData = user.utilisateur || user.parent || user;
      
      setNom(userData.nom || "");
      setPrenom(userData.prenom || "");
      setEmail(userData.email || "");
      setNomEntreprise(userData.nomEntreprise || "");
      setAdresse(userData.adresse || "");
      setTelephone(userData.telephone ? userData.telephone.toString() : "");
      
      // Load user image
      if (userData.image) {
        if (userData.image.startsWith('http') || userData.image.startsWith('data:image')) {
          setImage(userData.image);
        } else {
          setImage(`${API}/uploads/${userData.image}`);
        }
      }
    }
  }, [user]);

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

  const handleUpdateProfile = async () => {
    if (!nom || !prenom || !email || !nomEntreprise || !adresse || !telephone) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (motpasse && motpasse !== confirmMotpasse) {
      Alert.alert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    if (motpasse && motpasse.length < 6) {
      Alert.alert("Erreur", "Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsLoading(true);
    try {
      const userData = user.utilisateur || user.parent || user;
      const userId = userData.idU || userData.idp || userData.id;

      const updateData = {
        nom,
        prenom,
        email,
        nomEntreprise,
        adresse,
        telephone: parseInt(telephone) || telephone,
        ...(motpasse && { motpasse }),
        image
      };

      const response = await fetch(`${API}/utilisateur/${userId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${await SecureStore.getItemAsync('authToken')}`
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        Alert.alert("Succès", "Profil mis à jour avec succès");
        
        // Update local storage with new user data
        const currentUserData = await SecureStore.getItemAsync('userData');
        if (currentUserData) {
          const parsedData = JSON.parse(currentUserData);
          const updatedData = {
            ...parsedData,
            ...updatedUser.utilisateur,
            image: updatedUser.utilisateur.image
          };
          await SecureStore.setItemAsync('userData', JSON.stringify(updatedData));
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Échec de la mise à jour");
      }
    } catch (error) {
      Alert.alert("Erreur", error.message || "Impossible de mettre à jour le profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        { 
          text: "Se déconnecter", 
          onPress: () => logout(),
          style: "destructive"
        }
      ]
    );
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
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Image
                source={require("../../assets/images/iconBack.png")}              
                style={styles.icon}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(freezycorp)/Home')}>
              <Image
                source={require("../../assets/images/iconHome.png")}
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.overlay}>
          <Text style={styles.title}>
            Votre Profile
          </Text>
          <Text style={styles.sectionText}>
            Lorem ipsum dolor sit amet. Et omnis{'\n'} 
            repellendus nam magnam 
          </Text>
        </View>

        {/* Image Picker */}
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {image ? (
            <Image source={{ uri: image }} style={styles.imagePreview} />
          ) : (
            <Text style={styles.imagePlaceholder}>+ Modifier la photo</Text>
          )}
        </TouchableOpacity>

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
          keyboardType="email-address"
          autoCapitalize="none"
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
          placeholder="Nouveau mot de passe (optionnel)" 
          placeholderTextColor="#B0B3C1" 
          secureTextEntry
          value={motpasse}
          onChangeText={setMotpasse}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Confirmer le mot de passe" 
          placeholderTextColor="#B0B3C1" 
          secureTextEntry
          value={confirmMotpasse}
          onChangeText={setConfirmMotpasse}
        />

        <TouchableOpacity 
          style={[styles.secondeButton, isLoading && styles.disabledButton]} 
          onPress={handleUpdateProfile}
          disabled={isLoading}
        >
          <Text style={styles.secondeButtonText}>
            {isLoading ? "Mise à jour..." : "Sauvegarder"}
          </Text>
        </TouchableOpacity>
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
    height: height * 0.12,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    overflow: "hidden",
  },
  overlay: {
    alignItems: "center",
  },
  blueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#013743",
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    color: "#013743",
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
  icon: {
    marginTop: 25,
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 10,
    width: "100%",
    paddingHorizontal: 20,
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
  disabledButton: {
    opacity: 0.6,
  },
});

export default Profile;