import { API } from '@/config';
import * as ImagePicker from 'expo-image-picker';
import { Link, router } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from "react";
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
import { useAuth } from "./../context/AuthContext";

const { width, height } = Dimensions.get("window");

const Profile = () => {
  const { user, logout, getAuthToken } = useAuth();
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
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ 
    title: '', 
    message: '', 
    onConfirm: null as (() => void) | null,
    onCancel: null as (() => void) | null 
  });

  // Function to show custom alert
  const showCustomAlertMessage = (title: string, message: string, onConfirm?: () => void, onCancel?: () => void) => {
    setAlertConfig({
      title,
      message,
      onConfirm: onConfirm || null,
      onCancel: onCancel || null
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

  const handleCustomAlertCancel = () => {
    if (alertConfig.onCancel) {
      alertConfig.onCancel();
    }
    setShowCustomAlert(false);
  };

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      // Check different possible user structures
      const userData = user.utilisateur || user.parent || user;
      
      console.log("User data loaded:", userData);
      
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
      showCustomAlertMessage("Erreur", "Impossible de sélectionner l'image");
    }
  };

  const handleUpdateProfile = async () => {
    if (!nom || !prenom || !email || !nomEntreprise || !adresse || !telephone) {
      showCustomAlertMessage("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (motpasse && motpasse !== confirmMotpasse) {
      showCustomAlertMessage("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }

    if (motpasse && motpasse.length < 6) {
      showCustomAlertMessage("Erreur", "Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsLoading(true);
    try {
      const userData = user.utilisateur || user.parent || user;
      const userId = userData.idU || userData.idp || userData.id;

      if (!userId) {
        throw new Error("User ID not found");
      }

      // Get fresh auth token
      const authToken = await getAuthToken();
      if (!authToken) {
        throw new Error("Authentication token not found");
      }

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

      console.log("Updating profile with data:", updateData);
      console.log("Using token:", authToken);

      const response = await fetch(`${API}/utilisateur/${userId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        showCustomAlertMessage("Succès", "Profil mis à jour avec succès");
        
        // Update local storage with new user data
        const currentUserData = await SecureStore.getItemAsync('userData');
        if (currentUserData) {
          const parsedData = JSON.parse(currentUserData);
          const updatedData = {
            ...parsedData,
            utilisateur: {
              ...parsedData.utilisateur,
              ...updatedUser.utilisateur,
              image: updatedUser.utilisateur?.image || parsedData.utilisateur?.image
            }
          };
          await SecureStore.setItemAsync('userData', JSON.stringify(updatedData));
        }
      } else {
        const errorText = await response.text();
        console.error("Update failed with status:", response.status, "Response:", errorText);
        
        let errorMessage = "Échec de la mise à jour";
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("Update profile error:", error);
      showCustomAlertMessage("Erreur", error.message || "Impossible de mettre à jour le profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    showCustomAlertMessage(
      "Déconnexion", 
      "Êtes-vous sûr de vouloir vous déconnecter ?",
      async () => {
        try {
          await logout();
          // Navigation will be handled by the logout function in AuthContext
        } catch (error) {
          console.error('Error during logout:', error);
        }
      },
      () => {
        // Cancel action - do nothing
      }
    );
  };

  return (
    <View style={{ flex: 1 }}>
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
              {alertConfig.onCancel && (
                <TouchableOpacity 
                  style={[styles.alertButton, styles.alertButtonSecondary]}
                  onPress={handleCustomAlertCancel}
                >
                  <Text style={[styles.alertButtonText, styles.alertButtonTextSecondary]}>
                    Annuler
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.alertButton}
                onPress={alertConfig.onConfirm ? handleCustomAlertConfirm : handleCustomAlertClose}
              >
                <Text style={styles.alertButtonText}>
                  {alertConfig.onConfirm ? "Se déconnecter" : "OK"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Fixed top container - Same as Abonnement page */}
      <View style={styles.container}>
        <View style={styles.blueOverlay} />
        <ImageBackground
          style={styles.background}
          imageStyle={{ opacity: 0.6 }}
          resizeMode="cover"
        >
          <View style={styles.specialbuttonRow}>
            <TouchableOpacity onPress={handleLogout}>
              <Image
                source={require("../../assets/images/iconBack.png")}              
                style={styles.icon}
              />
            </TouchableOpacity>
            <Link href="./Menu" asChild>
              <TouchableOpacity>
                <Image
                  source={require("../../assets/images/iconHome.png")}
                  style={styles.icon}
                />
              </TouchableOpacity>
            </Link>
          </View>
        </ImageBackground>
      </View>

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={{ paddingTop: height * 0.1 + 10 }}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: height * 0.1,
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
    overflow: "hidden",
  },
  overlay: { 
    alignItems: "center" 
  },
  blueOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: "#080808" 
  },
  title: { 
    fontSize: width * 0.06, 
    fontWeight: "bold", 
    color: "#080808", 
    textAlign: "center" 
  },
  sectionText: {
    fontSize: width * 0.035,
    marginBottom: 20,
    textAlign: "center",
    color: "#A5A5A5",
  },
  inputContainer: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    marginTop: 20 
  },
  icon: { 
    marginTop: 10, 
    width: 20, 
    height: 30, 
    resizeMode: "contain" 
  },
  specialbuttonRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginTop: 15, 
    width: "100%", 
    paddingHorizontal: 20 
  },
  secondeButton: {
    backgroundColor: "#04D9E7",
    padding: 10,
    borderRadius: 8,
    width: width * 0.80,
    alignItems: "center",
    marginBottom: 30,
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
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10
  },
  alertButton: {
    backgroundColor: '#04D9E7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    minWidth: 120,
    flex: 1
  },
  alertButtonSecondary: {
    backgroundColor: 'transparent',
    borderColor: '#04D9E7'
  },
  alertButtonText: {
    color: '#080808',
    fontSize: width * 0.04,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  alertButtonTextSecondary: {
    color: '#04D9E7'
  }
});

export default Profile;