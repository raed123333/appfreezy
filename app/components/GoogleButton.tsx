  import React from 'react';
  import { Text, TouchableOpacity, StyleSheet } from 'react-native';
  import {
      GoogleSignin,
      GoogleSigninButton,
  } from "@react-native-google-signin/google-signin";
  import { useEffect, useState } from "react";
  const GoogleButton = () => {

      useEffect(() => {
          GoogleSignin.configure({
              webClientId: "92623667761-s29dbr7ist4daev7c1jj0k22kur6amtr.apps.googleusercontent.com"
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
          <TouchableOpacity style={styles.button} onPress={signin} >
              <Text style={styles.text}>Connecter avec Google</Text>
          </TouchableOpacity>
      );
  };
  const styles = StyleSheet.create({
      button: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FC3850',  
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 12,
          elevation: 2,  
          shadowColor: '#000', 
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          width: '100%'
      },
      icon: {
          marginRight: 10,
      },
      text: {
          color: 'black',
          fontSize: 15,
          flex: 1,
          textAlign: 'center'
      },
  });
 export default GoogleButton;