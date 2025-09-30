//  import React from 'react';
//  import { Text, TouchableOpacity, StyleSheet } from 'react-native';
//  import {
//      GoogleSignin,
//      GoogleSigninButton,
//  } from "@react-native-google-signin/google-signin";
//  import { useEffect, useState } from "react";
//  const GoogleButton = () => {

//      useEffect(() => {
//          GoogleSignin.configure({
//              webClientId: "351193115383-l06lbkti62g5b51ipse0cufb8j35vaae.apps.googleusercontent.com"
//          });
//      }, []);
//      const signin = async () => {
//          try {
//              await GoogleSignin.hasPlayServices();
//              const user = await GoogleSignin.signIn();
            
            
//          } catch (e: any) {
//              console.log(e);
//          }
//      };
//      return (
//          <TouchableOpacity style={styles.button} onPress={signin} >
//              <Text style={styles.text}>Connecter avec Google</Text>
//          </TouchableOpacity>
//      );
//  };
//  const styles = StyleSheet.create({
//      button: {
//          flexDirection: 'row',
//          alignItems: 'center',
//          justifyContent: 'center',
//          backgroundColor: '#FC3850', // Google blue
//          paddingVertical: 12,
//          paddingHorizontal: 20,
//          borderRadius: 12,
//          elevation: 2, // For Android shadow
//          shadowColor: '#000', // For iOS shadow
//          shadowOffset: { width: 0, height: 2 },
//          shadowOpacity: 0.1,
//          shadowRadius: 3,
//          width: '100%'
//      },
//      icon: {
//          marginRight: 10,
//      },
//      text: {
//          color: 'white',
//          fontSize: 15,
//          flex: 1,
//          textAlign: 'center'
//      },
//  });
// export default GoogleButton;