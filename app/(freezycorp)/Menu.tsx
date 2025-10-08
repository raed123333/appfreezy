import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Link, router } from "expo-router";
import React from "react";
import {
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from '../context/AuthContext';
import { API } from '@/config';

const { width } = Dimensions.get("window");

const Menu = () => {
  const { user, isLoading, logout } = useAuth();
  const [imageError, setImageError] = React.useState(false);

  // Function to get the user's display name
  const getUserDisplayName = () => {
    if (isLoading) {
      return "Chargement...";
    }
    
    if (!user) {
      return "Nom et Prénom";
    }
    
    // Check if user has the nested structure with utilisateur
    if (user.utilisateur && user.utilisateur.nom && user.utilisateur.prenom) {
      return `${user.utilisateur.nom} ${user.utilisateur.prenom}`;
    } 
    // Check if user has the expected structure at root level
    else if (user.nom !== undefined && user.prenom !== undefined) {
      return `${user.nom} ${user.prenom}`;
    } 
    // Check if user has a different structure
    else if (user.parent && user.parent.nom && user.parent.prenom) {
      return `${user.parent.prenom} ${user.parent.nom}`;
    }
    // Check for other possible structures
    else if (user.name) {
      return user.name;
    } else if (user.email) {
      return user.email;
    } else {
      return "Nom et Prénom";
    }
  };

  // Function to get the user's profile image
  const getUserProfileImage = () => {
    if (isLoading || !user) {
      return require("../../assets/images/profileImg.png");
    }

    // Check different possible structures for the image
    let imagePath = null;

    if (user.utilisateur && user.utilisateur.image) {
      imagePath = user.utilisateur.image;
    } else if (user.image) {
      imagePath = user.image;
    } else if (user.parent && user.parent.image) {
      imagePath = user.parent.image;
    }

    // If we have an image path and it's not a default asset, construct the URL
    if (imagePath && !imagePath.startsWith('http')) {
      // Add cache busting parameter to prevent caching
      const cacheBuster = `?t=${new Date().getTime()}`;
      return { uri: `${API}/uploads/${imagePath}${cacheBuster}` };
    } else if (imagePath && imagePath.startsWith('http')) {
      // Add cache busting parameter for external URLs
      const cacheBuster = `&t=${new Date().getTime()}`;
      const separator = imagePath.includes('?') ? '&' : '?';
      return { uri: `${imagePath}${separator}${cacheBuster}` };
    } else if (imagePath && imagePath.startsWith('data:image')) {
      // Handle base64 images directly
      return { uri: imagePath };
    }

    // Fallback to default image
    return require("../../assets/images/profileImg.png");
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/'); // Navigate to the login screen after logout
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Generate unique key for image to force re-render
  const getImageKey = () => {
    if (!user) return 'default';
    
    let imagePath = null;
    if (user.utilisateur && user.utilisateur.image) {
      imagePath = user.utilisateur.image;
    } else if (user.image) {
      imagePath = user.image;
    } else if (user.parent && user.parent.image) {
      imagePath = user.parent.image;
    }
    
    return imagePath || 'default';
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.container}>
        {/* Top-right CombinedShape */}
        <TouchableOpacity style={styles.CombinedShape1} onPress={() => router.navigate('/(freezycorp)/Home')}>
          <Image
            source={require("../../assets/images/CombinedShape.png")}
            style={styles.CombinedShape}
          />
        </TouchableOpacity>

        {/* Logo at top center */}
        <Image
          source={require("../../assets/images/logoGold.png")}
          style={styles.logo}
        />

        {/* Triangle with profile image inside */}
        <View style={styles.triangleWrapper}>
          <Image
            source={require("../../assets/images/rectangleMenu.png")}
            style={styles.triangle}
          />
          <Image
            source={getUserProfileImage()}
            style={styles.profileImg}
            key={getImageKey()}
            onError={(e) => {
              console.log("Error loading profile image:", e.nativeEvent.error);
              setImageError(true);
            }}
            onLoad={() => setImageError(false)}
          />
          <Text style={styles.nameText}>{getUserDisplayName()}</Text>
        </View>
        <View style={styles.buttonRow}>
          <Image
            source={require("../../assets/images/iconAccueil.png")}
            style={styles.uiRectangle}
          />
          <Link href="../Home" asChild>
            <Text
              style={{
                flex: 1,
                fontSize: width * 0.05,
                fontWeight: "bold",
                color: "#FFFFFF",
              }}
            >
              Accueil
            </Text>
          </Link>
        </View>
        <View style={styles.buttonRow}>
          <Image
            source={require("../../assets/images/iconNosOffres.png")}
            style={styles.uiRectangle}
          />
          <Link href="../OurOffers" asChild>
            <Text
              style={{
                flex: 1,
                fontSize: width * 0.05,
                fontWeight: "bold",
                color: "#FFFFFF",
              }}
            >
              Nos Offres
            </Text>
          </Link>
        </View>
        <View style={styles.buttonRow}>
          <Image
            source={require("../../assets/images/iconProfile.png")}
            style={styles.uiRectangle}
          />
          <Link href="../Profile" asChild>
            <Text
              style={{
                flex: 1,
                fontSize: width * 0.05,
                fontWeight: "bold",
                color: "#FFFFFF",
              }}
            >
              Profile
            </Text>
          </Link>
        </View>
        <View style={styles.buttonRow}>
          <Image
            source={require("../../assets/images/iconAbonnement.png")}
            style={styles.uiRectangle}
          />
          <Link href="../Abonnement" asChild>
            <Text
              style={{
                flex: 1,
                fontSize: width * 0.05,
                fontWeight: "bold",
                color: "#FFFFFF",
              }}
            >
              Abonnement
            </Text>
          </Link>
        </View>
        <View style={styles.buttonRow}>
          <MaterialCommunityIcons 
            name="comment-plus-outline" 
            size={24} 
            color="#FFFFFF" 
            style={styles.iconStyle}
          />
          <Link href="../AddComment" asChild>
            <Text
              style={{
                flex: 1,
                fontSize: width * 0.05,
                fontWeight: "bold",
                color: "#FFFFFF",
              }}
            >
              Ajouter commentaire 
            </Text>
          </Link>
        </View>
        <TouchableOpacity style={styles.buttonRow} onPress={handleLogout}>
          <Image
            source={require("../../assets/images/iconLogaut.png")}
            style={styles.uiRectangle}
          />

          <Text
            style={{
              flex: 1,
              fontSize: width * 0.05,
              fontWeight: "bold",
              color: "#04D9E7",
            }}
          >
            Déconnexion
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#013743",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  CombinedShape1: {
    width: width * 0.1,
    height: width * 0.1,
    position: "absolute",
    top: 90,
    right: 20,
    zIndex:10
  },
  CombinedShape: {
    width: width * 0.06,
    height: width * 0.06,
    resizeMode: "contain",
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    resizeMode: "contain",
  },
  triangleWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  triangle: {
    width: width * 0.9,
    height: width * 0.5,
    resizeMode: "contain",
  },
  profileImg: {
    position: "absolute",
    top: "2.5%", // adjust for correct alignment
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: (width * 0.25) / 2,
    resizeMode: "cover",
  },
  nameText: {
    position: "absolute",
    top: "60%", // appears just below profileImg inside triangle
    color: "#04D9E7",
    fontSize: width * 0.045,
    fontWeight: "bold",
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 30,
    width: "80%",
    paddingHorizontal: 5,
  },
  uiRectangle: {
    color: "#FFFFFF",
    width: 30,
    height: 20,
    resizeMode: "contain",
    marginRight: 8, // 👈 small space between icon and text
  },
  iconStyle: {
    width: 30,
    height: 20,
    marginRight: 8,
  },
});

export default Menu;