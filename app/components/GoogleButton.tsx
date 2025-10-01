import { AntDesign } from "@expo/vector-icons";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const GoogleButton = () => {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "92623667761-s29dbr7ist4daev7c1jj0k22kur6amtr.apps.googleusercontent.com",
    });
  }, []);

  const signin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const user = await GoogleSignin.signIn();
      console.log(user);
    } catch (e: any) {
      console.log(e);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={signin} activeOpacity={0.8}>
      <View style={styles.content}>
        <AntDesign name="google" size={22} color="white" style={styles.icon} />
        <Text style={styles.text}>Se connecter avec Google</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#DB4437", // Google red
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    elevation: 3, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    width: "100%",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 10,
  },
  text: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});

export default GoogleButton;
