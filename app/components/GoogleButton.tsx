/*import { WEB_CLIENT_ID } from "@/config";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import React, { useEffect } from "react";
import { Image, StyleSheet, TouchableOpacity } from "react-native";

const GoogleButton = ({ onPress }: any) => {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID
    });
  }, []);

  const signin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      let user = response.data.user;
      onPress(user);
    } catch (e: any) {
      console.log(e);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={signin} activeOpacity={0.8}>
      <Image
        source={require("@/assets/google.png")} // 👈 your PNG file path
        style={styles.image}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
 
  },
  image: {
    width: 180, // adjust as needed
    height: 40,
  },
});

export default GoogleButton;*/
