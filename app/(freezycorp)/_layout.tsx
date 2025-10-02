import { Ionicons } from '@expo/vector-icons';
import { Tabs, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Image, Platform, Text, View } from "react-native";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAuth } from '../context/AuthContext';

// ✅ Import your custom icons
import { API } from '@/config';
import AbonnementIcon from "../../assets/images/iconAbonnement.png";
import HomeIcon from "../../assets/images/iconAccueil.png";
import OffersIcon from "../../assets/images/iconNosOffres.png";
import ProfileIcon from "../../assets/images/iconProfile.png";

// Custom tab with icon and label in the same line
function CustomTabIcon({ icon, label, color, focused, isIonicon = false }: 
  { icon: any; label: string; color: string; focused: boolean; isIonicon?: boolean }) {
  
  // ✅ Custom style for RendezVous Ionicon to match other icons
  const iconStyle = isIonicon
    ? {
        width: 50,
        height: 20,
        justifyContent: "center",
        alignItems: "center",
      }
    : {
        width: 50,
        height: 20,
      };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: focused ? 12 : 0,
        paddingVertical: focused ? 6 : 0,
        borderRadius: focused ? 20 : 0,
        backgroundColor: focused ? "#013743" : "transparent",
      }}
    >
      {isIonicon ? (
        <View style={iconStyle}>
          <Ionicons
            name={icon}
            size={20} // match image height
            color={focused ? "#FFFFFF" : color} // white on focus
            style={{ alignSelf: "center" }}
          />
        </View>
      ) : (
        <Image
          source={icon}
          style={{
            width: 50,
            height: 20,
            tintColor: focused ? "#FFFFFF" : color,
            marginRight: label !== "" ? 6 : 0,
          }}
          resizeMode="contain"
        />
      )}
      {label !== "" && (
        <Text
          style={{
            color: focused ? "#FFFFFF" : color,
            fontSize: 13,
            fontWeight: "600",
            lineHeight: 18,
          }}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

export default function FreezyCorpLayout() {
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [refreshSubscription, setRefreshSubscription] = useState(0);

  // Check if user has an active subscription
  useEffect(() => {
    const checkUserSubscription = async () => {
      try {
        if (!user) {
          setHasActiveSubscription(false);
          return;
        }

        const token = user?.token || null;
        
        if (!token) {
          setHasActiveSubscription(false);
          return;
        }

        // Fetch user's payment history to check for active subscription
        const response = await fetch(`${API}/payment/history`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const payments = await response.json();
          
          // Check if user has any successful payments
          const hasSucceededPayments = payments.some((payment: any) => 
            payment.status === 'succeeded' || payment.status === 'completed'
          );
          
          setHasActiveSubscription(hasSucceededPayments);
        } else {
          setHasActiveSubscription(false);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        setHasActiveSubscription(false);
      }
    };

    checkUserSubscription();
  }, [user, refreshSubscription]);

  // Function to handle RendezVous tab press
  const handleRendezVousPress = (e: any) => {
    if (!hasActiveSubscription) {
      // Prevent default navigation
      e.preventDefault();
      
      // Show alert
      Alert.alert(
        "Abonnement Requis",
        "Acheter un offre pour avant chose un rendez-vous",
        [
          {
            text: "Voir les offres",
            onPress: () => {
              // Navigate to OurOffers page
              router.navigate('/OurOffers');
            }
          },
          {
            text: "Annuler",
            style: "cancel"
          }
        ]
      );
    }
  };

  // Function to refresh subscription status (can be called from other components)
  const refreshSubscriptionStatus = () => {
    setRefreshSubscription(prev => prev + 1);
  };

  return (
    <ProtectedRoute>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#013743",
          tabBarInactiveTintColor: "#B0B3C1",
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopColor: "#FFFFFF",
            height: 80,
            paddingTop: 5,
            paddingBottom: Platform.OS === "android" ? 20 : 10,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            overflow: "hidden",
          },
          tabBarLabelStyle: {
            display: "none",
          },
          tabBarIndicatorStyle: {
            backgroundColor: "transparent",
          },
        }}
      >
        <Tabs.Screen
          name="Home"
          options={{
            title: "",
            tabBarIcon: ({ color, focused }) => (
              <CustomTabIcon icon={HomeIcon} label="" color={color} focused={focused} />
            ),
          }}
        />

        <Tabs.Screen
          name="OurOffers"
          options={{
            title: "",
            tabBarIcon: ({ color, focused }) => (
              <CustomTabIcon icon={OffersIcon} label="" color={color} focused={focused} />
            ),
          }}
          listeners={{
            tabPress: () => {
              // Refresh subscription status when navigating to OurOffers
              refreshSubscriptionStatus();
            },
          }}
        />

        <Tabs.Screen
          name="Profile"
          options={{
            title: "Profil",
            tabBarIcon: ({ color, focused }) => (
              <CustomTabIcon icon={ProfileIcon} label="" color={color} focused={focused} />
            ),
          }}
        />

        {/* ✅ Rendez-vous Tab - Always show but handle click based on subscription status */}
        <Tabs.Screen
          name="RendezVous"
          options={{
            title: "Rendez-vous",
            tabBarIcon: ({ color, focused }) => (
              <CustomTabIcon
                icon="calendar-outline"
                label=""
                color={color}
                focused={focused}
                isIonicon
              />
            ),
          }}
          listeners={{
            tabPress: (e) => handleRendezVousPress(e),
          }}
        />

        <Tabs.Screen
          name="Abonnement"
          options={{
            title: "Abonnement",
            tabBarIcon: ({ color, focused }) => (
              <CustomTabIcon icon={AbonnementIcon} label="" color={color} focused={focused} />
            ),
          }}
          listeners={{
            tabPress: () => {
              // Refresh subscription status when navigating to Abonnement
              refreshSubscriptionStatus();
            },
          }}
        />

        {/* ❌ Hide auto detected screens */}
        <Tabs.Screen name="GeneralConditions" options={{ href: null }} />
        <Tabs.Screen name="Menu" options={{ href: null }} />
        <Tabs.Screen name="NosOffres" options={{ href: null }} />
        <Tabs.Screen name="CeQueDisentClients" options={{ href: null }} />
        <Tabs.Screen name="AddComment" options={{ href: null }} />
      </Tabs>
    </ProtectedRoute>
  );
}